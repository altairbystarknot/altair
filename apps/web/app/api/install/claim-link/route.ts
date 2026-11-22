import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { guard, hasGuard } from "@/lib/doors";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { siteOrigin } from "@/lib/site-url";
import { createAnonSupabase } from "@/lib/supabase/anon";

// POST /api/install/claim-link — Starknot's provisioning (the hub) asks this NEW instance for the one-time
// link its owner will use. Requires the install guard in a header; the database door checks it again and
// refuses once the instance has an owner.
export async function POST(req: Request) {
  if (!hasGuard("install")) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (!allowRequest(clientKey(req.headers, "install"), 10)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const given = Buffer.from(req.headers.get("x-altair-install-guard") ?? "");
  const expected = Buffer.from(guard("install"));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { data, error } = await createAnonSupabase().rpc("install_token_issue", { p_guard: guard("install") });
  if (error) {
    return NextResponse.json({ error: error.code === "P0001" ? "already_claimed" : "failed" }, { status: error.code === "P0001" ? 409 : 500 });
  }
  return NextResponse.json({ link: `${await siteOrigin()}/empezar?t=${data}` }, { headers: { "Cache-Control": "no-store" } });
}
