#!/usr/bin/env node
// A tiny MCP client that behaves like Claude's connector, to test an Altair instance end to end:
//   discovery -> dynamic registration -> authorize (you approve in the browser) -> token (PKCE) ->
//   initialize -> tools/list -> a few tool calls -> refresh token rotation.
// Usage: node tooling/dev/mcp-smoke.mjs [base-url]   (default http://localhost:3000)
// It prints the authorization URL; open it signed in to the panel and approve. Tokens are never printed.
import { createHash, randomBytes } from "node:crypto";
import http from "node:http";

const BASE = process.argv[2] ?? "http://localhost:3000";
const PORT = 53682;
const REDIRECT = `http://localhost:${PORT}/callback`;
const log = (...a) => console.log("•", ...a);

async function j(res) {
  const t = await res.text();
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

// 1. The connector starts without a token and must be told where to authenticate.
const first = await fetch(`${BASE}/mcp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }) });
log("POST /mcp without token ->", first.status, first.headers.get("www-authenticate"));
const prm = await j(await fetch(`${BASE}/.well-known/oauth-protected-resource`));
log("protected resource ->", prm.resource, "AS:", prm.authorization_servers?.[0]);
const as = await j(await fetch(`${prm.authorization_servers[0]}/.well-known/oauth-authorization-server`));
log("authorization server ->", as.authorization_endpoint, "| PKCE:", as.code_challenge_methods_supported?.join(","));

// 2. Dynamic client registration.
const reg = await j(await fetch(as.registration_endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_name: "Prueba de conector (Altair)", redirect_uris: [REDIRECT] }) }));
log("registered client ->", reg.client_id ? "ok" : reg);

// 3. Authorization code with PKCE.
const verifier = randomBytes(48).toString("base64url");
const challenge = createHash("sha256").update(verifier).digest("base64url");
const state = randomBytes(12).toString("hex");
const authUrl = new URL(as.authorization_endpoint);
for (const [k, v] of Object.entries({ response_type: "code", client_id: reg.client_id, redirect_uri: REDIRECT, code_challenge: challenge, code_challenge_method: "S256", state, scope: "bookings:read ops:write catalog:draft messages:draft", resource: prm.resource })) authUrl.searchParams.set(k, v);
console.log(`\nAUTHORIZE_URL ${authUrl.toString()}\n`);

const code = await new Promise((resolve, reject) => {
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, REDIRECT);
    if (u.pathname !== "/callback") return res.end();
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<p style='font-family:system-ui'>Listo. Podés cerrar esta pestaña.</p>");
    srv.close();
    if (u.searchParams.get("state") !== state) return reject(new Error("state mismatch"));
    if (u.searchParams.get("error")) return reject(new Error(`denied: ${u.searchParams.get("error")}`));
    resolve(u.searchParams.get("code"));
  });
  srv.listen(PORT, "127.0.0.1");
  setTimeout(() => reject(new Error("timeout waiting for approval")), 10 * 60_000);
});
log("got authorization code");

const tokenRes = await fetch(as.token_endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT, client_id: reg.client_id, code_verifier: verifier }) });
const tok = await j(tokenRes);
log("token ->", tokenRes.status, tok.token_type, "scopes:", tok.scope);

// 4. MCP calls.
let id = 1;
const rpc = async (method, params, token = tok.access_token) => {
  const r = await fetch(`${BASE}/mcp`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", Authorization: `Bearer ${token}`, "MCP-Protocol-Version": "2025-06-18" }, body: JSON.stringify({ jsonrpc: "2.0", id: id++, method, params }) });
  return { status: r.status, body: await j(r) };
};
const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "smoke", version: "1" } });
log("initialize ->", init.status, init.body.result?.serverInfo?.title, init.body.result?.protocolVersion);
const list = await rpc("tools/list", {});
log("tools ->", list.body.result?.tools?.map((t) => t.name).join(", "));
const call = async (name, args) => {
  const r = await rpc("tools/call", { name, arguments: args });
  const text = r.body.result?.content?.[0]?.text ?? JSON.stringify(r.body);
  log(`${name} ->`, r.body.result?.isError ? "ERROR" : "ok", text.replace(/\s+/g, " ").slice(0, 260));
  return r;
};
await call("quien_soy", {});
await call("resumen_del_dia", { fecha: process.env.SMOKE_DATE });
await call("buscar_reservas", { texto: "MAR" });
await call("cotizar_traslado", { desde: "SJO", hacia: "Tamarindo", fecha: "2026-12-20", hora: "23:15", adultos: 4 });
await call("proponer_cambios_catalogo", {
  titulo: "Prueba del conector: nuevo extra y tarifa",
  resumen: "Creado por la prueba automática del conector.",
  borrador: { extras: [{ name: "Hielera con bebidas", nameEn: "Cooler with drinks", price: 15, maxQty: 1 }], rates: [{ from: "San José", to: "Monteverde", vehicle: "Van", price: 190, bothWays: true }] },
});
await call("proponer_cambios_catalogo", { titulo: "Prueba con nombre malo", borrador: { rates: [{ from: "Narnia", to: "La Fortuna", vehicle: "Van", price: 10 }] } });
const booking = await call("ver_reserva", { codigo: "MAR-0001" });
const lineId = JSON.parse(booking.body.result?.content?.[0]?.text ?? "{}")?.lines?.[1]?.line_id;
if (lineId) await call("asignar_servicio", { line_id: lineId, proveedor: "Guías de ejemplo", conductor: "Guía de prueba", estado: "assigned" });
await call("redactar_mensaje", { codigo: "MAR-0001", canal: "whatsapp", texto: "¡Hola! Te confirmamos la recogida a las 07:30 en tu hotel para el snorkel. ¡Nos vemos!" });
await call("reporte_ventas", { desde: "2026-11-01", hasta: "2026-12-31" });

// 5. Refresh rotation and reuse detection.
const ref1 = await j(await fetch(as.token_endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: tok.refresh_token, client_id: reg.client_id }) }));
log("refresh ->", ref1.access_token ? "new pair" : ref1);
const ok2 = await rpc("tools/call", { name: "quien_soy", arguments: {} }, ref1.access_token);
log("new access token works ->", ok2.status, ok2.body.result?.isError === false);
const reuse = await j(await fetch(as.token_endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: tok.refresh_token, client_id: reg.client_id }) }));
log("old refresh token reused ->", reuse.error ?? "ACCEPTED (bad!)");
const after = await rpc("tools/call", { name: "quien_soy", arguments: {} }, ref1.access_token);
log("connection after reuse ->", after.status, after.status === 401 ? "revoked (expected)" : "still alive (bad!)");

// 6. Replaying the authorization code is refused AND kills what it created (OAuth 2.1 code reuse rule).
const replay = await j(await fetch(as.token_endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT, client_id: reg.client_id, code_verifier: verifier }) }));
log("same code again ->", replay.error ?? "ACCEPTED (bad!)");
