import { NextResponse } from "next/server";
import { getPublicConfig } from "@/lib/config/business-config";
import { isSupabaseConfigured } from "@/lib/env";

// Liveness + configuration state for `altair doctor` and uptime checks. Never returns secrets.
export const dynamic = "force-dynamic";

export async function GET() {
  const { source } = await getPublicConfig();
  const healthy = source !== "unavailable";
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", supabase: isSupabaseConfigured(), config: source },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
