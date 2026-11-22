"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/staff";
import { createServerSupabase } from "@/lib/supabase/server";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const UUID = /^[0-9a-f-]{36}$/i;

export async function saveSupplier(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ["owner", "admin", "ops"]);
  if (!staff) redirect("/login");
  const id = s(fd, "id");
  const row = {
    name: s(fd, "name").slice(0, 120),
    kind: ["transport", "activity", "guide", "other"].includes(s(fd, "kind")) ? s(fd, "kind") : "transport",
    contact_name: s(fd, "contactName").slice(0, 120) || null,
    whatsapp: s(fd, "whatsapp").slice(0, 40) || null,
    email: s(fd, "email").slice(0, 200) || null,
    notes: s(fd, "notes").slice(0, 500) || null,
  };
  if (row.name.length < 2) redirect("/panel/proveedores?error=1");
  const { error } = UUID.test(id) ? await sb.from("suppliers").update(row).eq("id", id) : await sb.from("suppliers").insert(row);
  revalidatePath("/panel", "layout");
  redirect(error ? "/panel/proveedores?error=1" : "/panel/proveedores?ok=1");
}

export async function toggleSupplier(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ["owner", "admin", "ops"]);
  if (!staff) redirect("/login");
  const id = s(fd, "id");
  if (UUID.test(id)) {
    const { data } = await sb.from("suppliers").select("active").eq("id", id).maybeSingle();
    await sb.from("suppliers").update({ active: !data?.active }).eq("id", id);
  }
  revalidatePath("/panel", "layout");
  redirect("/panel/proveedores?ok=1");
}
