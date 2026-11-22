import { NextResponse } from "next/server";
import { z } from "zod";
import { guard } from "@/lib/doors";
import { corsHeaders } from "@/lib/mcp/oauth";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { createAnonSupabase } from "@/lib/supabase/anon";

// RFC 7591 dynamic client registration: Claude registers itself the first time it connects. Public
// clients only (no secret); redirect URIs must be https (or localhost for local tools).
const body = z.object({
  client_name: z.string().trim().max(80).optional(),
  redirect_uris: z.array(z.string().max(500)).min(1).max(5),
});

export async function POST(req: Request) {
  const headers = { ...corsHeaders(), "Cache-Control": "no-store" };
  if (!allowRequest(clientKey(req.headers, "oauth-register"), 20, 60 * 60_000)) {
    return NextResponse.json({ error: "slow_down" }, { status: 429, headers });
  }
  let parsed;
  try {
    parsed = body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400, headers });
  }
  const name = parsed.client_name || "Cliente MCP";
  const { data, error } = await createAnonSupabase().rpc("oauth_client_register", {
    p_guard: guard("oauth"),
    p_name: name,
    p_redirect_uris: parsed.redirect_uris,
  });
  if (error) {
    const bad = error.code === "22023";
    return NextResponse.json({ error: bad ? "invalid_redirect_uri" : "server_error" }, { status: bad ? 400 : 500, headers });
  }
  return NextResponse.json(
    {
      client_id: data,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: name,
      redirect_uris: parsed.redirect_uris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    { status: 201, headers },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
