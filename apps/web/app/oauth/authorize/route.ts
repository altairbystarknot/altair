import { NextResponse } from "next/server";
import { guard } from "@/lib/doors";
import { OAUTH_COOKIE, parseScopes, sealRequest } from "@/lib/mcp/oauth";
import { siteOrigin } from "@/lib/site-url";
import { createAnonSupabase } from "@/lib/supabase/anon";

// GET /oauth/authorize: validates the request, then hands it to the consent screen inside the panel
// (which requires sign-in + second factor). An unknown client or redirect URI is NEVER redirected to: it
// gets a plain error page, so this endpoint cannot be used as an open redirect.

function errorPage(message: string, status = 400) {
  const html = [
    "<!doctype html><meta charset=utf-8><title>Altair</title>",
    "<body style=\"font-family:system-ui;padding:40px;max-width:560px;margin:auto\">",
    "<h1 style=\"font-size:22px\">No se pudo conectar</h1>",
    `<p>${message}</p></body>`,
  ].join("");
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const p = (k: string) => url.searchParams.get(k);
  const clientId = p("client_id") ?? "";
  const redirectUri = p("redirect_uri") ?? "";
  if (!clientId || !redirectUri) return errorPage("Faltan datos de la aplicación que pidió conectarse.");

  const { data: client } = await createAnonSupabase().rpc("oauth_client_get", { p_guard: guard("oauth"), p_client_id: clientId });
  const c = client as { client_id: string; name: string; redirect_uris: string[] } | null;
  if (!c || !c.redirect_uris.includes(redirectUri)) {
    return errorPage("Esta aplicación no está registrada o la dirección de regreso no coincide.");
  }

  const back = (params: Record<string, string>) => {
    const to = new URL(redirectUri);
    for (const [k, v] of Object.entries(params)) to.searchParams.set(k, v);
    const state = p("state");
    if (state) to.searchParams.set("state", state);
    return NextResponse.redirect(to.toString(), 302);
  };
  if (p("response_type") !== "code") return back({ error: "unsupported_response_type" });
  const challenge = p("code_challenge") ?? "";
  if (p("code_challenge_method") !== "S256" || !/^[A-Za-z0-9_-]{43,128}$/.test(challenge)) {
    return back({ error: "invalid_request", error_description: "PKCE S256 is required" });
  }
  const origin = await siteOrigin();
  const resource = p("resource");
  if (resource && ![`${origin}/mcp`, origin, `${origin}/`].includes(resource)) return back({ error: "invalid_target" });

  const sealed = sealRequest({
    clientId: c.client_id,
    clientName: c.name,
    redirectUri,
    state: p("state"),
    scopes: parseScopes(p("scope")),
    challenge,
    resource: resource ?? `${origin}/mcp`,
    exp: Date.now() + 10 * 60_000,
  });
  const res = NextResponse.redirect(`${origin}/panel/claude/autorizar`, 302);
  res.cookies.set(OAUTH_COOKIE, sealed, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
