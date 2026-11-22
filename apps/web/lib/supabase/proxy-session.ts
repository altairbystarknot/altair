import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/env";
import { withReturn } from "@/lib/auth/safe-return";
import { SUPABASE_COOKIE_OPTIONS } from "./cookie-options";

// Runs in proxy.ts on every HTML request. Two jobs:
//
// 1. A per-request nonce and an ENFORCING Content-Security-Policy. Altair renders every page per
//    request (the root layout reads the request), so EVERY page gets the strict nonce policy:
//    no inline script runs anywhere unless Next stamped our nonce on it. Development relaxes script-src
//    for hot reload only.
// 2. On /panel: refresh the Supabase session and redirect optimistically (no session -> /login; no
//    second factor -> /mfa or /mfa/enroll). The authoritative checks are requireStaff() in the server
//    code and RLS in the database; this gate only spares a round trip.

const PANEL_PREFIX = "/panel";
const isDev = process.env.NODE_ENV === "development";

function supabaseOrigins(): { https: string; wss: string } {
  const env = supabaseEnv();
  if (!env) return { https: "", wss: "" };
  const u = new URL(env.url);
  return { https: u.origin, wss: `wss://${u.host}` };
}

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function buildCsp(nonce: string, dev = isDev): string {
  const sb = supabaseOrigins();
  const scriptSrc = dev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;
  return [
    "default-src 'self'",
    scriptSrc,
    // Style attributes are part of the design system (CSS variables per business); styles cannot run code.
    "style-src 'self' 'unsafe-inline'",
    // OpenStreetMap tiles for the booking map; search and routing go through our own server.
    `img-src 'self' data: blob: https://tile.openstreetmap.org${sb.https ? ` ${sb.https}` : ""}`,
    `connect-src 'self'${sb.https ? ` ${sb.https} ${sb.wss}` : ""}${dev ? " ws:" : ""}`,
    "font-src 'self'",
    `media-src 'self'${sb.https ? ` ${sb.https}` : ""}`,
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

function redirectTo(request: NextRequest, target: string): NextResponse {
  const url = request.nextUrl.clone();
  const q = target.indexOf("?");
  url.pathname = q < 0 ? target : target.slice(0, q);
  url.search = q < 0 ? "" : target.slice(q);
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const nonce = generateNonce();
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const isPanel = pathname === PANEL_PREFIX || pathname.startsWith(`${PANEL_PREFIX}/`);
  if (!isPanel) {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set("Content-Security-Policy", csp);
    return res;
  }

  const env = supabaseEnv();
  if (!env) return redirectTo(request, withReturn("/login", pathname));

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createServerClient(env.url, env.key, {
    cookieOptions: SUPABASE_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() revalidates the token with Supabase Auth (getSession() would trust the cookie).
  let user = null;
  try {
    user = (await supabase.auth.getUser()).data.user;
  } catch {
    user = null;
  }
  if (!user) return redirectTo(request, withReturn("/login", pathname));

  let dest: "/mfa" | "/mfa/enroll" | null = null;
  try {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.currentLevel !== "aal2") dest = data?.nextLevel === "aal2" ? "/mfa" : "/mfa/enroll";
  } catch {
    dest = "/mfa";
  }
  if (dest) return redirectTo(request, withReturn(dest, pathname));

  response.headers.set("Content-Security-Policy", csp);
  return response;
}
