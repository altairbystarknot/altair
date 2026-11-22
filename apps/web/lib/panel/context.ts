import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { requireStaff, type StaffRole, type StaffSession } from "@/lib/auth/staff";
import { createServerSupabase, type ServerSupabase } from "@/lib/supabase/server";

// For panel PAGES (server components): the signed-in staff session, or a redirect. Server ACTIONS call
// requireStaff() themselves (the gate check enforces it).

export const panelSession = cache(async (): Promise<{ sb: ServerSupabase; staff: StaffSession }> => {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb);
  if (!staff) redirect("/login");
  return { sb, staff };
});

export async function panelSessionFor(roles: ReadonlyArray<StaffRole>) {
  const s = await panelSession();
  if (!roles.includes(s.staff.role)) redirect("/panel?sin_permiso=1");
  return s;
}

export const CAN = {
  catalog: ["owner", "admin"] as StaffRole[],
  ops: ["owner", "admin", "ops"] as StaffRole[],
  money: ["owner", "admin", "finance"] as StaffRole[],
  team: ["owner", "admin"] as StaffRole[],
  site: ["owner", "admin"] as StaffRole[],
};
