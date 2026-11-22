import { NextResponse } from "next/server";
import { guard } from "@/lib/doors";
import { corsHeaders, s256 } from "@/lib/mcp/oauth";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { createAnonSupabase } from "@/lib/supabase/anon";

// POST /oauth/token: authorization_code (with the PKCE verifier) or refresh_token. The database checks
// everything (single-use codes, verifier, rotation, reuse = revoke) through its guarded doors.

const VERIFIER = /^[A-Za-z0-9\-._~]{43,128}$/;

async function readParams(req: Request): Promise<URLSearchParams> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const j = (await req.json()) as Record<string, unknown>;
    return new URLSearchParams(Object.entries(j).map(([k, v]) => [k, String(v)]));
  }
  return new URLSearchParams(await req.text());
}

export async function POST(req: Request) {
  const headers = { ...corsHeaders(), "Cache-Control": "no-store", Pragma: "no-cache" };
  const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers });
  if (!allowRequest(clientKey(req.headers, "oauth-token"), 60)) return fail("slow_down", 429);
  let p: URLSearchParams;
  try {
    p = await readParams(req);
  } catch {
    return fail("invalid_request");
  }
  // Public clients send client_id in the body; tolerate HTTP Basic carrying it too.
  let clientId = p.get("client_id") ?? "";
  const basic = req.headers.get("authorization");
  if (!clientId && basic?.startsWith("Basic ")) {
    clientId = decodeURIComponent(Buffer.from(basic.slice(6), "base64").toString("utf8").split(":")[0] ?? "");
  }
  const sb = createAnonSupabase();
  const grant = p.get("grant_type");

  if (grant === "authorization_code") {
    const verifier = p.get("code_verifier") ?? "";
    if (!VERIFIER.test(verifier) || !p.get("code") || !clientId || !p.get("redirect_uri")) return fail("invalid_request");
    const { data, error } = await sb.rpc("oauth_code_exchange", {
      p_guard: guard("oauth"),
      p_code: p.get("code"),
      p_client_id: clientId,
      p_redirect_uri: p.get("redirect_uri"),
      p_verifier_s256: s256(verifier),
    });
    if (error) return fail("server_error", 500);
    const out = data as Record<string, unknown>;
    if (out.error) return fail(String(out.error));
    return NextResponse.json(out, { headers });
  }

  if (grant === "refresh_token") {
    if (!p.get("refresh_token") || !clientId) return fail("invalid_request");
    const { data, error } = await sb.rpc("oauth_refresh", { p_guard: guard("oauth"), p_refresh_token: p.get("refresh_token"), p_client_id: clientId });
    if (error) return fail("server_error", 500);
    const out = data as Record<string, unknown>;
    if (out.error) return fail(String(out.error));
    return NextResponse.json(out, { headers });
  }

  return fail("unsupported_grant_type");
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
