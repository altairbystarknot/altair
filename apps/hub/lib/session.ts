import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Starknot's approval console: one shared password (HUB_CONSOLE_PASSWORD) and a signed, httpOnly session
// cookie (HUB_SESSION_SECRET). Production should put the console behind Starknot's own SSO.

const COOKIE = "altair_hub_console";
const TTL = 8 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.HUB_SESSION_SECRET ?? "";
  if (s.length < 32) throw new Error("HUB_SESSION_SECRET is not configured");
  return s;
}

function sign(v: string): string {
  return createHmac("sha256", secret()).update(v).digest("base64url");
}

export function passwordOk(given: string): boolean {
  const expected = process.env.HUB_CONSOLE_PASSWORD ?? "";
  if (expected.length < 12) return false;
  const a = Buffer.from(sign(`pw:${given}`));
  const b = Buffer.from(sign(`pw:${expected}`));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function startSession() {
  const exp = String(Date.now() + TTL);
  (await cookies()).set(COOKIE, `${exp}.${sign(`console:${exp}`)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: TTL / 1000 });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isConsole(): Promise<boolean> {
  const v = (await cookies()).get(COOKIE)?.value ?? "";
  const [exp, sig] = v.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(sign(`console:${exp}`));
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
