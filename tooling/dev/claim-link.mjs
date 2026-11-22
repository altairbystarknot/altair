#!/usr/bin/env node
// Local stand-in for Starknot's provisioning: asks THIS instance's database for a one-time claim link
// (install_token_issue door, guarded by ALTAIR_GUARD_INSTALL from apps/web/.env.local) and prints it.
// Works only while the instance has no owner. Usage: npm run dev:claim-link
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const env = Object.fromEntries(
  readFileSync(path.join(root, "apps/web/.env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const guard = env.ALTAIR_GUARD_INSTALL;
const site = env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
if (!url || !key || !guard) {
  console.error("apps/web/.env.local needs NEXT_PUBLIC_SUPABASE_URL, the publishable key and ALTAIR_GUARD_INSTALL.");
  process.exit(1);
}
const r = await fetch(`${url}/rest/v1/rpc/install_token_issue`, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ p_guard: guard }),
});
const body = await r.json();
if (!r.ok) {
  console.error(`Could not issue a claim link: ${body.message ?? r.status}`);
  process.exit(1);
}
console.log(`${site}/empezar?t=${body}`);
