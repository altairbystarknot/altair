// Environment access in one place. Missing Supabase settings are a normal state in local development and
// previews (the site shows the demo business and the panel explains what is missing), never a crash.

export type SupabaseEnv = { url: string; key: string };

export function supabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") return null;
  } catch {
    return null;
  }
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return supabaseEnv() !== null;
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("Supabase is not configured for this instance (NEXT_PUBLIC_SUPABASE_URL / key)");
    this.name = "SupabaseNotConfiguredError";
  }
}
