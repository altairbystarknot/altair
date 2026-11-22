"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/staff";
import { PAYMENT_METHODS } from "@/lib/panel/format";
import { createServerSupabase } from "@/lib/supabase/server";

// Booking operations. Column-level grants in the database only open the operational columns; money is
// recorded as append-only payment rows (records mode), never edited.

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const UUID = /^[0-9a-f-]{36}$/i;
const back = (fd: FormData, fallback: string) => {
  const b = s(fd, "back");
  return /^\/panel(\/[A-Za-z0-9_-]+){0,3}(\?[A-Za-z0-9_=&%-]*)?$/.test(b) ? b : fallback;
};
const withOk = (url: string, ok: string) => `${url}${url.includes("?") ? "&" : "?"}ok=${ok}`;

export async function setBookingStatus(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ["owner", "admin", "ops"]);
  if (!staff) redirect("/login");
  const id = s(fd, "id");
  const status = s(fd, "status");
  if (!UUID.test(id) || !["received", "confirmed", "cancelled", "completed"].includes(status)) redirect("/panel/reservas");
  await sb.from("bookings").update({ status }).eq("id", id);
  revalidatePath("/panel", "layout");
  redirect(withOk(back(fd, "/panel/reservas"), "estado"));
}

export async function saveInternalNotes(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ["owner", "admin", "ops"]);
  if (!staff) redirect("/login");
  const id = s(fd, "id");
  if (UUID.test(id)) await sb.from("bookings").update({ internal_notes: s(fd, "notes").slice(0, 2000) || null }).eq("id", id);
  redirect(withOk(back(fd, "/panel/reservas"), "nota"));
}

export async function updateLine(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ["owner", "admin", "ops"]);
  if (!staff) redirect("/login");
  const id = s(fd, "lineId");
  const status = s(fd, "opsStatus");
  const supplier = s(fd, "supplierId");
  if (!UUID.test(id)) redirect(back(fd, "/panel/despacho"));
  const patch: Record<string, unknown> = {
    supplier_id: UUID.test(supplier) ? supplier : null,
    driver_name: s(fd, "driverName").slice(0, 80) || null,
    driver_phone: s(fd, "driverPhone").slice(0, 40) || null,
    vehicle_info: s(fd, "vehicleInfo").slice(0, 80) || null,
    ops_notes: s(fd, "opsNotes").slice(0, 500) || null,
  };
  if (["pending", "assigned", "confirmed", "done", "no_show", "cancelled"].includes(status)) patch.ops_status = status;
  if (patch.ops_status === "pending" && patch.supplier_id) patch.ops_status = "assigned";
  await sb.from("booking_lines").update(patch).eq("id", id);
  revalidatePath("/panel", "layout");
  redirect(withOk(back(fd, "/panel/despacho"), "servicio"));
}

export async function recordPayment(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ["owner", "admin", "finance"]);
  if (!staff) redirect("/login");
  const id = s(fd, "id");
  const amount = Number(s(fd, "amount").replace(",", "."));
  const method = s(fd, "method");
  const kind = s(fd, "kind") === "refund" ? "refund" : "payment";
  const to = back(fd, "/panel/reservas");
  if (!UUID.test(id) || !Number.isFinite(amount) || amount <= 0 || !["sinpe", "transfer", "cash", "card_terminal", "paypal", "other"].includes(method)) {
    redirect(`${to}${to.includes("?") ? "&" : "?"}error=pago`);
  }
  const { error } = await sb.from("manual_payments").insert({ booking_id: id, kind, amount_cents: Math.round(amount * 100), method, reference: s(fd, "reference").slice(0, 120) || null, note: s(fd, "note").slice(0, 300) || null });
  if (error) redirect(`${to}${to.includes("?") ? "&" : "?"}error=pago`);
  await sb.from("booking_events").insert({ booking_id: id, kind: "note.added", detail: { text: `${kind === "refund" ? "Devolución registrada" : "Pago registrado"}: ${amount.toFixed(2)} · ${PAYMENT_METHODS[method] ?? method}` } });
  revalidatePath("/panel", "layout");
  redirect(withOk(to, "pago"));
}

export async function addNote(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb);
  if (!staff) redirect("/login");
  const id = s(fd, "id");
  const text = s(fd, "text").slice(0, 1000);
  if (UUID.test(id) && text) await sb.from("booking_events").insert({ booking_id: id, kind: "note.added", detail: { text } });
  redirect(withOk(back(fd, "/panel/reservas"), "nota"));
}
