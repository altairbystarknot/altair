import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SupabaseNotConfiguredError, supabaseEnv } from "@/lib/env";
import { SUPABASE_COOKIE_OPTIONS } from "./cookie-options";

// The cookie-session client for Server Components, Route Handlers and Server Actions. Publishable key +
// the signed-in user's session: RLS decides what it can see. Never the service role here.
export async function createServerSupabase() {
  const env = supabaseEnv();
  if (!env) throw new SupabaseNotConfiguredError();
  const cookieStore = await cookies();
  return createServerClient(env.url, env.key, {
    cookieOptions: SUPABASE_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: the proxy refreshes sessions, so this is safe to ignore.
        }
      },
    },
  });
}

export type ServerSupabase = Awaited<ReturnType<typeof createServerSupabase>>;
