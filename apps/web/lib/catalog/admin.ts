import "server-only";
import { slugify, type CatalogDraft } from "@altair/config";
import type { ServerSupabase } from "@/lib/supabase/server";

// Catalog administration with the STAFF SESSION (RLS: owner/admin write, aal2). Publishing a draft is a
// sequence of upserts by natural key (names, slugs); the order matters (areas before places and rates).

const key = (s: string) => s.trim().toLowerCase();
const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));

async function nameMap(sb: ServerSupabase, table: string): Promise<Map<string, string>> {
  const { data, error } = await sb.from(table).select("id, name");
  if (error) throw new Error(`${table}: ${error.message}`);
  return new Map((data ?? []).map((r: { id: string; name: string }) => [key(r.name), r.id]));
}

function must<T>(r: { error: { message: string } | null; data?: T }, what: string): T | undefined {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r.data;
}

export type ApplyResult = Record<string, number>;

export async function applyDraft(sb: ServerSupabase, d: CatalogDraft): Promise<ApplyResult> {
  const done: ApplyResult = {};

  if (d.areas?.length) {
    must(
      await sb.from("areas").upsert(
        d.areas.map((a) => ({
          name: a.name,
          kind: a.kind,
          iata: a.iata ?? null,
          ...(a.lat != null && a.lng != null ? { lat: a.lat, lng: a.lng } : {}),
          ...(a.radiusKm != null ? { radius_km: a.radiusKm } : {}),
          ...(a.active === undefined ? {} : { active: a.active }),
        })),
        { onConflict: "name" },
      ),
      "Zonas",
    );
    done.areas = d.areas.length;
  }
  const areas = await nameMap(sb, "areas");
  const areaId = (name: string, what: string) => {
    const id = areas.get(key(name));
    if (!id) throw new Error(`${what}: la zona "${name}" no existe`);
    return id;
  };

  if (d.places?.length) {
    must(
      await sb.from("places").upsert(
        d.places.map((p) => ({
          name: p.name,
          area_id: areaId(p.area, `Lugar "${p.name}"`),
          kind: p.kind,
          aliases: p.aliases ?? [],
          address: p.address ?? null,
          ...(p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : {}),
          ...(p.active === undefined ? {} : { active: p.active }),
        })),
        { onConflict: "name,area_id" },
      ),
      "Lugares",
    );
    done.places = d.places.length;
  }

  if (d.vehicles?.length) {
    must(
      await sb.from("vehicle_classes").upsert(
        d.vehicles.map((v, i) => ({
          name: v.name,
          name_en: v.nameEn ?? null,
          description: v.description ?? null,
          capacity_pax: v.capacityPax,
          capacity_bags: v.capacityBags,
          ...(v.photoPath ? { photo_path: v.photoPath } : {}),
          sort: (i + 1) * 10,
          ...(v.active === undefined ? {} : { active: v.active }),
        })),
        { onConflict: "name" },
      ),
      "Vehículos",
    );
    done.vehicles = d.vehicles.length;
  }

  if (d.seasons?.length) {
    must(await sb.from("rate_seasons").upsert(d.seasons.map((s) => ({ name: s.name, starts_on: s.startsOn, ends_on: s.endsOn })), { onConflict: "name" }), "Temporadas");
    done.seasons = d.seasons.length;
  }

  if (d.rates?.length) {
    const vehicles = await nameMap(sb, "vehicle_classes");
    const seasons = await nameMap(sb, "rate_seasons");
    const rows = new Map<string, Record<string, unknown>>();
    for (const r of d.rates) {
      const vid = vehicles.get(key(r.vehicle));
      if (!vid) throw new Error(`Tarifa ${r.from} → ${r.to}: el vehículo "${r.vehicle}" no existe`);
      const sid = r.season ? seasons.get(key(r.season)) : null;
      if (r.season && !sid) throw new Error(`Tarifa ${r.from} → ${r.to}: la temporada "${r.season}" no existe`);
      const from = areaId(r.from, `Tarifa ${r.from} → ${r.to}`);
      const to = areaId(r.to, `Tarifa ${r.from} → ${r.to}`);
      const legs = r.bothWays && from !== to ? [[from, to], [to, from]] : [[from, to]];
      for (const [a, b] of legs) {
        rows.set(`${a}|${b}|${vid}|${sid ?? ""}`, {
          from_area_id: a,
          to_area_id: b,
          vehicle_class_id: vid,
          season_id: sid ?? null,
          price: r.price,
          net_cost: r.netCost ?? null,
          duration_minutes: r.minutes ?? null,
        });
      }
    }
    const all = [...rows.values()];
    for (let i = 0; i < all.length; i += 500) {
      must(await sb.from("route_rates").upsert(all.slice(i, i + 500), { onConflict: "from_area_id,to_area_id,vehicle_class_id,season_id" }), "Tarifas");
    }
    done.rates = all.length;
  }

  if (d.surcharges?.length) {
    const existing = await nameMap(sb, "surcharge_rules");
    for (const s of d.surcharges) {
      const row = {
        name: s.name,
        name_en: s.nameEn ?? null,
        start_time: s.startTime ?? null,
        end_time: s.endTime ?? null,
        date_from: s.dateFrom ?? null,
        date_to: s.dateTo ?? null,
        weekdays: s.weekdays ?? null,
        amount: s.amount,
        ...(s.active === undefined ? {} : { active: s.active }),
      };
      const id = existing.get(key(s.name));
      must(id ? await sb.from("surcharge_rules").update(row).eq("id", id) : await sb.from("surcharge_rules").insert(row), `Recargo "${s.name}"`);
    }
    done.surcharges = d.surcharges.length;
  }

  if (d.extras?.length) {
    must(
      await sb.from("transfer_extras").upsert(
        d.extras.map((e, i) => ({ name: e.name, name_en: e.nameEn ?? null, price: e.price, max_qty: e.maxQty, sort: (i + 1) * 10, ...(e.active === undefined ? {} : { active: e.active }) })),
        { onConflict: "name" },
      ),
      "Extras",
    );
    done.extras = d.extras.length;
  }

  if (d.activities?.length) {
    for (const [i, a] of d.activities.entries()) {
      const slug = a.slug ?? slugify(a.title);
      const row: Record<string, unknown> = {
        slug,
        title: a.title,
        title_en: a.titleEn ?? null,
        summary: a.summary ?? null,
        summary_en: a.summaryEn ?? null,
        description: a.description ?? null,
        description_en: a.descriptionEn ?? null,
        category: a.category ?? null,
        area_id: a.area ? areaId(a.area, `Actividad "${a.title}"`) : null,
        duration_minutes: a.durationMinutes ?? null,
        meeting_point: a.meetingPoint ?? null,
        includes: a.includes ?? [],
        includes_en: a.includesEn ?? [],
        bring: a.bring ?? [],
        bring_en: a.bringEn ?? [],
        price_adult: a.priceAdult,
        price_child: a.priceChild ?? null,
        net_cost_adult: a.netCostAdult ?? null,
        sort: (i + 1) * 10,
      };
      if (a.coverPath) row.cover_path = a.coverPath;
      if (a.childMinAge !== undefined) row.child_min_age = a.childMinAge;
      if (a.childMaxAge !== undefined) row.child_max_age = a.childMaxAge;
      if (a.minPax !== undefined) row.min_pax = a.minPax;
      if (a.maxPax !== undefined) row.max_pax = a.maxPax;
      if (a.bookingMode) row.booking_mode = a.bookingMode;
      if (a.pickupMode) row.pickup_mode = a.pickupMode;
      if (a.difficulty !== undefined) row.difficulty = a.difficulty;
      if (a.minAge !== undefined) row.min_age = a.minAge;
      if (a.photos) row.photos = a.photos;
      if (a.active !== undefined) row.active = a.active;
      const saved = must(await sb.from("activities").upsert(row, { onConflict: "slug" }).select("id").single(), `Actividad "${a.title}"`) as { id: string };
      if (a.schedules) {
        must(await sb.from("activity_schedules").delete().eq("activity_id", saved.id), "Horarios");
        if (a.schedules.length) {
          const uniq = new Map(a.schedules.map((s) => [s.time, s]));
          must(
            await sb.from("activity_schedules").insert([...uniq.values()].map((s) => ({ activity_id: saved.id, start_time: s.time, capacity: s.capacity, weekdays: s.weekdays ?? [0, 1, 2, 3, 4, 5, 6] }))),
            `Horarios de "${a.title}"`,
          );
        }
      }
      if (a.pickupAreas) {
        must(await sb.from("activity_pickup_areas").delete().eq("activity_id", saved.id), "Recogida");
        if (a.pickupAreas.length) {
          must(
            await sb.from("activity_pickup_areas").insert(a.pickupAreas.map((p) => ({ activity_id: saved.id, area_id: areaId(p.area, `Recogida de "${a.title}"`), fee: p.fee }))),
            `Recogida de "${a.title}"`,
          );
        }
      }
    }
    done.activities = d.activities.length;
  }

  if (d.suppliers?.length) {
    must(
      await sb.from("suppliers").upsert(
        d.suppliers.map((s) => ({ name: s.name, kind: s.kind, contact_name: s.contactName ?? null, phone: s.phone ?? null, whatsapp: s.whatsapp ?? null, email: s.email ?? null, notes: s.notes ?? null, ...(s.active === undefined ? {} : { active: s.active }) })),
        { onConflict: "name" },
      ),
      "Proveedores",
    );
    done.suppliers = d.suppliers.length;
  }

  return done;
}

/** The current catalog in draft shape (by names): the Excel template and Claude both read it this way. */
export async function readCatalogAsDraft(sb: ServerSupabase): Promise<CatalogDraft> {
  const [areas, places, vehicles, seasons, rates, surcharges, extras, activities, schedules, pickups, suppliers] = await Promise.all([
    sb.from("areas").select("*").order("sort").order("name"),
    sb.from("places").select("*, areas(name)").order("name"),
    sb.from("vehicle_classes").select("*").order("sort"),
    sb.from("rate_seasons").select("*").order("starts_on"),
    sb.from("route_rates").select("*, f:areas!route_rates_from_area_id_fkey(name), t:areas!route_rates_to_area_id_fkey(name), v:vehicle_classes(name), s:rate_seasons(name)").limit(10000),
    sb.from("surcharge_rules").select("*"),
    sb.from("transfer_extras").select("*").order("sort"),
    sb.from("activities").select("*, areas!activities_area_id_fkey(name)").order("sort"),
    sb.from("activity_schedules").select("*"),
    sb.from("activity_pickup_areas").select("*, areas(name)"),
    sb.from("suppliers").select("*").order("name"),
  ]);
  for (const r of [areas, places, vehicles, seasons, rates, surcharges, extras, activities, schedules, pickups, suppliers]) {
    if (r.error) throw new Error(r.error.message);
  }
  const t = (v: unknown) => (typeof v === "string" ? v.slice(0, 5) : null);
  return {
    areas: (areas.data ?? []).map((a) => ({ name: a.name, kind: a.kind, iata: a.iata, lat: n(a.lat), lng: n(a.lng), radiusKm: n(a.radius_km), active: a.active })),
    places: (places.data ?? []).map((p) => ({ name: p.name, area: p.areas?.name ?? "", kind: p.kind, aliases: p.aliases ?? [], address: p.address, lat: n(p.lat), lng: n(p.lng), active: p.active })),
    vehicles: (vehicles.data ?? []).map((v) => ({ name: v.name, nameEn: v.name_en, description: v.description, capacityPax: v.capacity_pax, capacityBags: v.capacity_bags, photoPath: v.photo_path, active: v.active })),
    seasons: (seasons.data ?? []).map((s) => ({ name: s.name, startsOn: s.starts_on, endsOn: s.ends_on })),
    rates: (rates.data ?? []).map((r) => ({ from: r.f?.name ?? "", to: r.t?.name ?? "", vehicle: r.v?.name ?? "", season: r.s?.name ?? null, price: n(r.price), netCost: n(r.net_cost), minutes: r.duration_minutes, bothWays: false })),
    surcharges: (surcharges.data ?? []).map((s) => ({ name: s.name, nameEn: s.name_en, startTime: t(s.start_time), endTime: t(s.end_time), dateFrom: s.date_from, dateTo: s.date_to, weekdays: s.weekdays, amount: Number(s.amount), active: s.active })),
    extras: (extras.data ?? []).map((e) => ({ name: e.name, nameEn: e.name_en, price: Number(e.price), maxQty: e.max_qty, active: e.active })),
    activities: (activities.data ?? []).map((a) => ({
      slug: a.slug,
      title: a.title,
      titleEn: a.title_en,
      summary: a.summary,
      summaryEn: a.summary_en,
      description: a.description,
      descriptionEn: a.description_en,
      category: a.category,
      area: a.areas?.name ?? null,
      durationMinutes: a.duration_minutes,
      meetingPoint: a.meeting_point,
      includes: a.includes ?? [],
      includesEn: a.includes_en ?? [],
      bring: a.bring ?? [],
      bringEn: a.bring_en ?? [],
      coverPath: a.cover_path,
      priceAdult: n(a.price_adult),
      priceChild: n(a.price_child),
      netCostAdult: n(a.net_cost_adult),
      childMinAge: a.child_min_age,
      childMaxAge: a.child_max_age,
      minPax: a.min_pax,
      maxPax: a.max_pax,
      bookingMode: a.booking_mode,
      difficulty: a.difficulty,
      minAge: a.min_age,
      photos: a.photos ?? [],
      pickupMode: a.pickup_mode,
      schedules: (schedules.data ?? []).filter((s) => s.activity_id === a.id).map((s) => ({ time: t(s.start_time)!, weekdays: s.weekdays, capacity: s.capacity })),
      pickupAreas: (pickups.data ?? []).filter((p) => p.activity_id === a.id).map((p) => ({ area: p.areas?.name ?? "", fee: Number(p.fee) })),
      active: a.active,
    })),
    suppliers: (suppliers.data ?? []).map((s) => ({ name: s.name, kind: s.kind, contactName: s.contact_name, phone: s.phone, whatsapp: s.whatsapp, email: s.email, notes: s.notes, active: s.active })),
  } as CatalogDraft;
}
