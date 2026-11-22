import { NextResponse } from "next/server";
import { SCOPES, corsHeaders } from "@/lib/mcp/oauth";
import { siteOrigin } from "@/lib/site-url";

// RFC 9728: tells Claude which authorization server protects /mcp. Served at the root and at the
// path-suffixed form (/.well-known/oauth-protected-resource/mcp) that MCP clients also try.
export async function GET() {
  const origin = await siteOrigin();
  return NextResponse.json(
    {
      resource: `${origin}/mcp`,
      authorization_servers: [origin],
      scopes_supported: SCOPES,
      bearer_methods_supported: ["header"],
      resource_name: "Altair",
    },
    { headers: { ...corsHeaders(), "Cache-Control": "public, max-age=3600" } },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
