"use server";

import { randomBytes, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/staff";
import { siteOrigin } from "@/lib/site-url";
import { createServerSupabase } from "@/lib/supabase/server";

// Team: invite by email with a one-time link (only its SHA-256 is stored), revoke invites, (de)activate
// members. The owner manages people; admins can invite non-admin roles (RLS enforces the same).

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const UUID = /^[0-9a-f-]{36}$/i;

export type InviteState = { error: string | null; link: string | null; email: string | null };

export async function inviteMember(_prev: InviteState, fd: FormData): Promise<InviteState> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ["owner", "admin"]);
  if (!staff) return { error: "Su sesión venció.", link: null, email: null };
  const email = s(fd, "email").toLowerCase();
  const role = s(fd, "role");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Escriba un correo válido.", link: null, email: null };
  if (!["admin", "ops", "finance", "readonly"].includes(role)) return { error: "Elija un rol.", link: null, email: null };
  const token = randomBytes(32).toString("base64url");
  const { error } = await sb.from("staff_invites").insert({ email, full_name: s(fd, "fullName").slice(0, 120), role, token_hash: createHash("sha256").update(token).digest("hex") });
  if (error) return { error: role === "admin" && staff.role !== "owner" ? "Solo el dueño puede invitar administradores." : "No se pudo crear la invitación.", link: null, email: null };
  await sb.rpc("audit_log", { p_action: "staff.invited", p_target: email, p_detail: { role } });
  revalidatePath("/panel/equipo");
  return { error: null, link: `${await siteOrigin()}/unirme?t=${token}`, email };
}

export async function revokeInvite(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ["owner", "admin"]);
  if (!staff) redirect("/login");
  const id = s(fd, "id");
  if (UUID.test(id)) await sb.from("staff_invites").update({ revoked_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/panel/equipo");
  redirect("/panel/equipo?ok=revocada");
}

export async function setMemberActive(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ["owner"]);
  if (!staff) redirect("/panel/equipo?error=dueno");
  const id = s(fd, "userId");
  if (!UUID.test(id) || id === staff.user.id) redirect("/panel/equipo?error=propio");
  const active = s(fd, "active") === "1";
  await sb.from("staff_profiles").update({ is_active: active }).eq("user_id", id).neq("role", "owner");
  await sb.rpc("audit_log", { p_action: active ? "staff.activated" : "staff.deactivated", p_target: id, p_detail: {} });
  revalidatePath("/panel/equipo");
  redirect("/panel/equipo?ok=1");
}
