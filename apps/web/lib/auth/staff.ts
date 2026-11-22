import "server-only";
import type { User } from "@supabase/supabase-js";
import type { ServerSupabase } from "@/lib/supabase/server";

// THE staff gate for the server side (session + second factor + active staff role).
// Every server action and staff route calls requireStaff(); tooling/verify/server-action-gates.mjs
// fails the build check if one does not. The proxy redirect is only the optimistic first gate; RLS in
// the database is the independent last gate.

export const STAFF_ROLES = ["owner", "admin", "ops", "finance", "readonly"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export type StaffSession = { user: User; role: StaffRole };

/** Session presence only (no aal2). Reserved for the /mfa pages, which run before the second factor. */
export async function getSessionUser(supabase: ServerSupabase): Promise<User | null> {
  try {
    return (await supabase.auth.getUser()).data.user;
  } catch {
    return null;
  }
}

/** True when the session has verified its second factor. Fail closed. */
export async function isAal2(supabase: ServerSupabase): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return !error && data?.currentLevel === "aal2";
  } catch {
    return false;
  }
}

/**
 * The authoritative check: a real session, at aal2, belonging to an ACTIVE staff member, optionally with
 * one of `roles`. Returns null otherwise (fail closed on any error).
 */
export async function requireStaff(supabase: ServerSupabase, roles?: ReadonlyArray<StaffRole>): Promise<StaffSession | null> {
  const user = await getSessionUser(supabase);
  if (!user) return null;
  if (!(await isAal2(supabase))) return null;
  try {
    const { data, error } = await supabase.rpc("staff_role");
    if (error || typeof data !== "string") return null;
    const role = STAFF_ROLES.find((r) => r === data);
    if (!role) return null;
    if (roles && !roles.includes(role)) return null;
    return { user, role };
  } catch {
    return null;
  }
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Dueño",
  admin: "Administración",
  ops: "Operaciones",
  finance: "Finanzas",
  readonly: "Solo lectura",
};
