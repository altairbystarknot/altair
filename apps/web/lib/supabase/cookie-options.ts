import type { CookieOptionsWithName } from "@supabase/ssr";

// The ONE cookie policy for every Supabase client (server, proxy), so the flags cannot drift between
// them. Pure constant: imported from server and edge contexts. Secure is always on:
// browsers treat http://localhost as a secure context, so local development still works.
export const SUPABASE_COOKIE_OPTIONS: CookieOptionsWithName = {
  secure: true,
  sameSite: "lax",
};
