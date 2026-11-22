"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@altair/config";
import { requireStaff } from "@/lib/auth/staff";
import { UploadError, uploadImage } from "@/lib/panel/upload";
import { createServerSupabase } from "@/lib/supabase/server";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const money = (v: string): number | null => {
  if (v === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};
const int = (v: string, d: number) => (/^\d{1,4}$/.test(v) ? Number(v) : d);
const lines = (v: string) => v.split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0, 20);
const UUID = /^[0-9a-f-]{36}$/i;


export async function saveActivity(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  if (!(await requireStaff(sb, ["owner", "admin"]))) redirect("/login");
  const id = s(fd, "id");
  const isNew = !UUID.test(id);
  const title = s(fd, "title");
  if (title.length < 3) redirect(`/panel/actividades/${isNew ? "nueva" : id}?error=titulo`);

  const row: Record<string, unknown> = {
    title,
    title_en: s(fd, "titleEn") || null,
    summary: s(fd, "summary") || null,
    summary_en: s(fd, "summaryEn") || null,
    description: s(fd, "description") || null,
    description_en: s(fd, "descriptionEn") || null,
    category: s(fd, "category") || null,
    area_id: UUID.test(s(fd, "areaId")) ? s(fd, "areaId") : null,
    duration_minutes: s(fd, "duration") ? int(s(fd, "duration"), 60) : null,
    meeting_point: s(fd, "meetingPoint") || null,
    includes: lines(s(fd, "includes")),
    bring: lines(s(fd, "bring")),
    price_adult: money(s(fd, "priceAdult")),
    price_child: money(s(fd, "priceChild")),
    net_cost_adult: money(s(fd, "netCost")),
    child_min_age: int(s(fd, "childMin"), 4),
    child_max_age: int(s(fd, "childMax"), 11),
    min_pax: int(s(fd, "minPax"), 1),
    max_pax: int(s(fd, "maxPax"), 20),
    booking_mode: s(fd, "bookingMode") === "request" ? "request" : "instant",
    pickup_mode: ["none", "included", "by_area"].includes(s(fd, "pickupMode")) ? s(fd, "pickupMode") : "none",
  };
  try {
    const cover = fd.get("cover");
    if (cover instanceof File && cover.size > 0) row.cover_path = await uploadImage(sb, "media", "activity", cover, 8 * 1024 * 1024);
  } catch (e) {
    redirect(`/panel/actividades/${isNew ? "nueva" : id}?error=${encodeURIComponent(e instanceof UploadError ? e.message : "foto")}`);
  }

  let activityId = id;
  if (isNew) {
    const { data, error } = await sb.from("activities").insert({ ...row, slug: `${slugify(title)}-${Date.now().toString(36).slice(-4)}` }).select("id").single();
    if (error || !data) redirect(`/panel/actividades/nueva?error=guardar`);
    activityId = data.id;
  } else {
    const { error } = await sb.from("activities").update(row).eq("id", id);
    if (error) redirect(`/panel/actividades/${id}?error=guardar`);
  }

  // Departures: one line per time, "HH:MM capacity [days]".
  const schedules = lines(s(fd, "schedules"))
    .map((l) => l.match(/^(\d{1,2}):(\d{2})\s+(\d{1,3})(?:\s+([0-6](?:,[0-6])*))?$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => ({
      activity_id: activityId,
      start_time: `${m[1]!.padStart(2, "0")}:${m[2]}`,
      capacity: Math.max(1, Math.min(500, Number(m[3]))),
      weekdays: m[4] ? [...new Set(m[4].split(",").map(Number))] : [0, 1, 2, 3, 4, 5, 6],
    }));
  await sb.from("activity_schedules").delete().eq("activity_id", activityId);
  if (schedules.length) await sb.from("activity_schedules").insert([...new Map(schedules.map((x) => [x.start_time, x])).values()]);

  // Pickup areas with their fee.
  await sb.from("activity_pickup_areas").delete().eq("activity_id", activityId);
  const pickups: Array<{ activity_id: string; area_id: string; fee: number }> = [];
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("pickup|") && v === "on") {
      const areaId = k.split("|")[1] ?? "";
      if (UUID.test(areaId)) pickups.push({ activity_id: activityId, area_id: areaId, fee: money(s(fd, `fee|${areaId}`)) ?? 0 });
    }
  }
  if (pickups.length) await sb.from("activity_pickup_areas").insert(pickups);

  revalidatePath("/", "layout");
  redirect(`/panel/actividades/${activityId}?ok=guardado`);
}

export async function toggleActivity(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  if (!(await requireStaff(sb, ["owner", "admin"]))) redirect("/login");
  const id = s(fd, "id");
  if (!UUID.test(id)) redirect("/panel/actividades");
  const { data } = await sb.from("activities").select("active").eq("id", id).maybeSingle();
  await sb.from("activities").update({ active: !data?.active }).eq("id", id);
  revalidatePath("/", "layout");
  redirect(`/panel/actividades/${id}?ok=estado`);
}

export async function blockDate(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ["owner", "admin"]);
  if (!staff) redirect("/login");
  const id = s(fd, "id");
  const date = s(fd, "date");
  const time = s(fd, "time") || null;
  const capacity = s(fd, "capacity") === "" ? null : int(s(fd, "capacity"), 0);
  if (!UUID.test(id) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect(`/panel/actividades/${id}?error=fecha`);
  await sb.from("activity_blocks").upsert({ activity_id: id, on_date: date, start_time: time, capacity, note: s(fd, "note") || null }, { onConflict: "activity_id,on_date,start_time" });
  revalidatePath("/", "layout");
  redirect(`/panel/actividades/${id}?ok=bloqueo`);
}

export async function unblockDate(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ["owner", "admin"]);
  if (!staff) redirect("/login");
  const id = s(fd, "id");
  const block = s(fd, "block");
  if (UUID.test(block)) await sb.from("activity_blocks").delete().eq("id", block);
  revalidatePath("/", "layout");
  redirect(`/panel/actividades/${id}?ok=desbloqueo`);
}
