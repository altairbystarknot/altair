import { NextResponse } from "next/server";
import { SCOPES, corsHeaders } from "@/lib/mcp/oauth";
import { siteOrigin } from "@/lib/site-url";

// RFC 8414: the authorization server's endpoints and capabilities (PKCE S256 only, public clients).
export async function GET() {
  const origin = await siteOrigin();
  return NextResponse.json(
    {
      issuer: origin,
      authorization_endpoint: `${origin}/oauth/authorize`,
      token_endpoint: `${origin}/oauth/token`,
      registration_endpoint: `${origin}/oauth/register`,
      response_types_supported: ["code"],
      response_modes_supported: ["query"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: SCOPES,
    },
    { headers: { ...corsHeaders(), "Cache-Control": "public, max-age=3600" } },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
