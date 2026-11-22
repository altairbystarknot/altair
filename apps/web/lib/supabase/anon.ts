import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SupabaseNotConfiguredError, supabaseEnv } from "@/lib/env";

// A session-less client for PUBLIC reads (the *_public views). It never carries a user's cookies, so a
// public page can never read through a staff member's session by accident.
export function createAnonSupabase() {
  const env = supabaseEnv();
  if (!env) throw new SupabaseNotConfiguredError();
  return createClient(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
