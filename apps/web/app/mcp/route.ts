import { NextResponse } from "next/server";
import { guard } from "@/lib/doors";
import { corsHeaders } from "@/lib/mcp/oauth";
import { ToolAuthError, callTool, toolList } from "@/lib/mcp/tools";
import { allowRequest } from "@/lib/rate-limit";
import { siteOrigin } from "@/lib/site-url";
import { createAnonSupabase } from "@/lib/supabase/anon";

// THE CLAUDE CONNECTOR (MCP, Streamable HTTP, stateless). Claude (claude.ai, Desktop, mobile, Claude
// Code) POSTs JSON-RPC here with a Bearer token this instance issued through OAuth. No Anthropic API is
// called and no Claude credential is ever seen: Claude does the thinking on the owner's subscription and
// calls these tools. Every tool goes through a guarded database door that checks token, scope and role.

const SUPPORTED = ["2025-11-25", "2025-06-18", "2025-03-26"];
const LATEST = "2025-06-18";

type RpcMsg = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

async function unauthorized() {
  const origin = await siteOrigin();
  return new NextResponse(JSON.stringify({ error: "invalid_token" }), {
    status: 401,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer realm="altair", resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
    },
  });
}

const reply = (id: RpcMsg["id"], result: unknown) => ({ jsonrpc: "2.0", id: id ?? null, result });
const failure = (id: RpcMsg["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

async function whoami(token: string): Promise<{ scopes: string[]; business?: { name?: string } } | null> {
  const { data, error } = await createAnonSupabase().rpc("mcp_whoami", { p_guard: guard("mcp"), p_token: token });
  if (error) return null;
  return data as { scopes: string[]; business?: { name?: string } };
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!/^[a-f0-9]{64}$/.test(token)) return unauthorized();
  if (!allowRequest(`mcp:${token.slice(0, 16)}`, 120)) {
    return NextResponse.json(failure(null, -32000, "Demasiadas solicitudes; espere un minuto."), { status: 429, headers: corsHeaders() });
  }
  const pv = req.headers.get("mcp-protocol-version");
  if (pv && !SUPPORTED.includes(pv) && pv !== "2024-11-05") {
    return NextResponse.json(failure(null, -32600, `Unsupported MCP-Protocol-Version: ${pv}`), { status: 400, headers: corsHeaders() });
  }

  let body: RpcMsg | RpcMsg[];
  try {
    body = (await req.json()) as RpcMsg | RpcMsg[];
  } catch {
    return NextResponse.json(failure(null, -32700, "Parse error"), { status: 400, headers: corsHeaders() });
  }
  const messages = Array.isArray(body) ? body : [body];
  const origin = await siteOrigin();
  const out: unknown[] = [];

  // Read-ish methods need the token's scopes; tool calls are checked by their own door.
  let me: Awaited<ReturnType<typeof whoami>> | undefined;
  const ensureMe = async () => (me === undefined ? (me = await whoami(token)) : me);

  for (const m of messages) {
    const isRequest = m.id !== undefined && m.id !== null;
    try {
      switch (m.method) {
        case "initialize": {
          const who = await ensureMe();
          if (!who) return unauthorized();
          const asked = String((m.params?.protocolVersion as string) ?? "");
          out.push(
            reply(m.id, {
              protocolVersion: SUPPORTED.includes(asked) ? asked : LATEST,
              capabilities: { tools: { listChanged: false } },
              serverInfo: { name: "altair", title: `Altair · ${who.business?.name ?? "negocio"}`, version: "0.2.0" },
              instructions:
                `Está conectado al sistema de reservas Altair de «${who.business?.name ?? "el negocio"}» (traslados privados y actividades). ` +
                "Use quien_soy para ver el negocio y sus permisos, resumen_del_dia para la operación, ver_reserva/asignar_servicio para operar, " +
                "y ver_catalogo + proponer_cambios_catalogo para tarifas y actividades (siempre quedan como BORRADOR que una persona publica). " +
                "Nunca puede cobrar ni devolver dinero. Los precios del catálogo van sin impuestos. Responda en el idioma de la persona.",
            }),
          );
          break;
        }
        case "notifications/initialized":
        case "notifications/cancelled":
          break;
        case "ping":
          out.push(reply(m.id, {}));
          break;
        case "tools/list": {
          const who = await ensureMe();
          if (!who) return unauthorized();
          out.push(reply(m.id, { tools: toolList(who.scopes ?? []) }));
          break;
        }
        case "tools/call": {
          const name = String(m.params?.name ?? "");
          const result = await callTool(name, m.params?.arguments, { token, origin });
          out.push(reply(m.id, result));
          break;
        }
        case "resources/list":
          out.push(reply(m.id, { resources: [] }));
          break;
        case "prompts/list":
          out.push(reply(m.id, { prompts: [] }));
          break;
        default:
          if (isRequest) out.push(failure(m.id, -32601, `Method not found: ${m.method}`));
      }
    } catch (e) {
      if (e instanceof ToolAuthError) return unauthorized();
      if (isRequest) out.push(failure(m.id, -32603, "Internal error"));
    }
  }

  if (out.length === 0) return new NextResponse(null, { status: 202, headers: corsHeaders() });
  return NextResponse.json(Array.isArray(body) ? out : out[0], { headers: { ...corsHeaders(), "Cache-Control": "no-store" } });
}

// Stateless server: no server-initiated stream, no sessions to delete.
export function GET() {
  return new NextResponse(null, { status: 405, headers: { ...corsHeaders(), Allow: "POST, OPTIONS" } });
}

export function DELETE() {
  return new NextResponse(null, { status: 405, headers: { ...corsHeaders(), Allow: "POST, OPTIONS" } });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
