"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/staff";
import { UploadError, uploadImage } from "@/lib/panel/upload";
import { createServerSupabase } from "@/lib/supabase/server";

// Direct catalog edits from the panel (owner/admin, aal2; RLS checks the same). Prices are BEFORE tax.

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const money = (v: string): number | null => {
  if (v === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};
const UUID = /^[0-9a-f-]{36}$/i;


function done(tab: string, ok: string | null, error?: string | null): never {
  revalidatePath("/", "layout");
  redirect(`/panel/transporte?tab=${tab}${ok ? `&ok=${ok}` : ""}${error ? `&error=${encodeURIComponent(error)}` : ""}`);
}

export async function saveArea(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  if (!(await requireStaff(sb, ["owner", "admin"]))) redirect("/login");
  const name = s(fd, "name");
  const kind = s(fd, "kind") === "airport" ? "airport" : "zone";
  const iata = s(fd, "iata").toUpperCase() || null;
  if (name.length < 2) done("zonas", null, "Escriba el nombre de la zona.");
  const { error } = await sb.from("areas").insert({ name, kind, iata: kind === "airport" ? iata : null });
  if (error) done("zonas", null, error.code === "23505" ? "Ya existe una zona con ese nombre." : "Revise los datos (el código IATA tiene 3 letras).");
  done("zonas", "zona");
}

export async function savePlace(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  if (!(await requireStaff(sb, ["owner", "admin"]))) redirect("/login");
  const name = s(fd, "name");
  const areaId = s(fd, "areaId");
  const kind = ["airport", "hotel", "town", "port", "other"].includes(s(fd, "kind")) ? s(fd, "kind") : "hotel";
  const aliases = s(fd, "aliases").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 10);
  if (name.length < 2 || !UUID.test(areaId)) done("zonas", null, "Escriba el lugar y elija su zona.");
  const { error } = await sb.from("places").insert({ name, area_id: areaId, kind, aliases });
  if (error) done("zonas", null, error.code === "23505" ? "Ese lugar ya existe en esa zona." : "No se pudo guardar el lugar.");
  done("zonas", "lugar");
}

export async function toggleActive(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  if (!(await requireStaff(sb, ["owner", "admin"]))) redirect("/login");
  const table = s(fd, "table");
  const id = s(fd, "id");
  const tab = s(fd, "tab") || "zonas";
  const allowed = ["areas", "places", "vehicle_classes", "transfer_extras", "surcharge_rules"];
  if (!allowed.includes(table) || !UUID.test(id)) done(tab, null, "Acción no válida.");
  const { data } = await sb.from(table).select("active").eq("id", id).maybeSingle();
  await sb.from(table).update({ active: !data?.active }).eq("id", id);
  done(tab, "estado");
}

export async function saveVehicle(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  if (!(await requireStaff(sb, ["owner", "admin"]))) redirect("/login");
  const id = s(fd, "id");
  const row = {
    name: s(fd, "name"),
    name_en: s(fd, "nameEn") || null,
    description: s(fd, "description") || null,
    capacity_pax: Number(s(fd, "capacityPax")),
    capacity_bags: Number(s(fd, "capacityBags") || "0"),
  };
  if (row.name.length < 2 || !Number.isInteger(row.capacity_pax) || row.capacity_pax < 1) done("vehiculos", null, "Revise el nombre y la capacidad.");
  // The vehicle's photo (optional): shown on the booking engine's vehicle cards and the website.
  let photo: { photo_path: string | null } | Record<string, never> = {};
  const file = fd.get("photo");
  if (file instanceof File && file.size > 0) {
    try {
      photo = { photo_path: await uploadImage(sb, "media", "vehicle", file, 8 * 1024 * 1024) };
    } catch (e) {
      done("vehiculos", null, e instanceof UploadError ? e.message : "No se pudo subir la foto.");
    }
  } else if (fd.get("removePhoto") === "on") photo = { photo_path: null };
  const { error } = UUID.test(id) ? await sb.from("vehicle_classes").update({ ...row, ...photo }).eq("id", id) : await sb.from("vehicle_classes").insert({ ...row, ...photo, sort: 100 });
  if (error) done("vehiculos", null, error.code === "23505" ? "Ya existe un vehículo con ese nombre." : "No se pudo guardar el vehículo.");
  done("vehiculos", "vehiculo");
}

/** Saves every price cell of the rates table at once. Cell names: price|<from>|<to>|<vehicle>|<season|"base"> */
export async function saveRates(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  if (!(await requireStaff(sb, ["owner", "admin"]))) redirect("/login");
  const season = s(fd, "season");
  const rows: Array<Record<string, unknown>> = [];
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string" || !k.startsWith("price|")) continue;
    const [, from, to, vehicle] = k.split("|");
    if (!UUID.test(from ?? "") || !UUID.test(to ?? "") || !UUID.test(vehicle ?? "")) continue;
    const cost = fd.get(`cost|${from}|${to}|${vehicle}`);
    const original = fd.get(`orig|${from}|${to}|${vehicle}`);
    if (String(original ?? "") === `${v}|${String(cost ?? "")}`) continue; // unchanged
    rows.push({ from_area_id: from, to_area_id: to, vehicle_class_id: vehicle, season_id: UUID.test(season) ? season : null, price: money(v), net_cost: money(String(cost ?? "")) });
  }
  if (rows.length) {
    const { error } = await sb.from("route_rates").upsert(rows, { onConflict: "from_area_id,to_area_id,vehicle_class_id,season_id" });
    if (error) done("tarifas", null, "No se pudieron guardar las tarifas.");
    await sb.rpc("audit_log", { p_action: "rates.update", p_target: "route_rates", p_detail: { rows: rows.length } });
  }
  revalidatePath("/", "layout");
  redirect(`/panel/transporte?tab=tarifas&ok=tarifas${UUID.test(season) ? `&temporada=${season}` : ""}`);
}

export async function addRoute(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  if (!(await requireStaff(sb, ["owner", "admin"]))) redirect("/login");
  const from = s(fd, "from");
  const to = s(fd, "to");
  const season = s(fd, "season");
  const both = fd.get("both") === "on";
  if (!UUID.test(from) || !UUID.test(to)) done("tarifas", null, "Elija las dos zonas.");
  const rows: Array<Record<string, unknown>> = [];
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string" || !k.startsWith("newprice|")) continue;
    const vehicle = k.split("|")[1] ?? "";
    if (!UUID.test(vehicle) || v === "") continue;
    const base = { vehicle_class_id: vehicle, season_id: UUID.test(season) ? season : null, price: money(v), net_cost: money(s(fd, `newcost|${vehicle}`)), duration_minutes: Number(s(fd, "minutes")) || null };
    rows.push({ ...base, from_area_id: from, to_area_id: to });
    if (both && from !== to) rows.push({ ...base, from_area_id: to, to_area_id: from });
  }
  if (!rows.length) done("tarifas", null, "Indique al menos un precio.");
  const { error } = await sb.from("route_rates").upsert(rows, { onConflict: "from_area_id,to_area_id,vehicle_class_id,season_id" });
  if (error) done("tarifas", null, "No se pudo guardar la ruta.");
  done("tarifas", "ruta");
}

export async function saveSeason(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  if (!(await requireStaff(sb, ["owner", "admin"]))) redirect("/login");
  const row = { name: s(fd, "name"), starts_on: s(fd, "startsOn"), ends_on: s(fd, "endsOn") };
  const { error } = await sb.from("rate_seasons").insert(row);
  if (error) done("tarifas", null, "Revise la temporada (nombre único y fechas en orden).");
  done("tarifas", "temporada");
}

export async function saveExtra(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  if (!(await requireStaff(sb, ["owner", "admin"]))) redirect("/login");
  const row = { name: s(fd, "name"), name_en: s(fd, "nameEn") || null, price: money(s(fd, "price")) ?? 0, max_qty: Number(s(fd, "maxQty") || "4") };
  const { error } = await sb.from("transfer_extras").insert(row);
  if (error) done("extras", null, "Revise el extra (nombre único, precio y máximo).");
  done("extras", "extra");
}

export async function saveSurcharge(fd: FormData): Promise<void> {
  const sb = await createServerSupabase();
  if (!(await requireStaff(sb, ["owner", "admin"]))) redirect("/login");
  const weekdays = [0, 1, 2, 3, 4, 5, 6].filter((d) => fd.get(`wd${d}`) === "on");
  const row = {
    name: s(fd, "name"),
    name_en: s(fd, "nameEn") || null,
    start_time: s(fd, "startTime") || null,
    end_time: s(fd, "endTime") || null,
    date_from: s(fd, "dateFrom") || null,
    date_to: s(fd, "dateTo") || null,
    weekdays: weekdays.length && weekdays.length < 7 ? weekdays : null,
    amount: money(s(fd, "amount")) ?? 0,
  };
  const { error } = await sb.from("surcharge_rules").insert(row);
  if (error) done("extras", null, "Un recargo necesita nombre, monto y al menos una condición (horario, fechas o días).");
  done("extras", "recargo");
}
