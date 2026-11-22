import "server-only";
import { cache } from "react";
import type { ActivityInfo, MoneyRules, Place, TransferCatalog } from "@altair/engine";
import { getPublicConfig } from "@/lib/config/business-config";
import { isSupabaseConfigured } from "@/lib/env";
import { createAnonSupabase } from "@/lib/supabase/anon";

// The public catalog, read through the *_public views with the session-less client, once per request.
// The same data feeds the search page, the server's authoritative re-pricing and the booking door.

const num = (v: unknown): number | null => (v === null || v === undefined || v === "" ? null : Number(v));
const hhmm = (v: unknown): string | null => (typeof v === "string" && v.length >= 5 ? v.slice(0, 5) : null);

export const getMoneyRules = cache(async (): Promise<MoneyRules | null> => {
  const { config } = await getPublicConfig();
  if (!config) return null;
  return { vatRate: config.vatRate, rounding: config.rounding, currency: config.currency };
});

export const getTransferCatalog = cache(async (): Promise<TransferCatalog> => {
  const empty: TransferCatalog = { areas: [], places: [], vehicles: [], seasons: [], rates: [], surcharges: [], extras: [] };
  if (!isSupabaseConfigured()) return empty;
  const sb = createAnonSupabase();
  const [areas, places, vehicles, seasons, rates, surcharges, extras] = await Promise.all([
    sb.from("areas_public").select("*").order("sort").order("name"),
    sb.from("places_public").select("*").order("name").limit(5000),
    sb.from("vehicle_classes_public").select("*").order("sort"),
    sb.from("rate_seasons_public").select("*"),
    sb.from("route_rates_public").select("*").limit(20000),
    sb.from("surcharge_rules_public").select("*"),
    sb.from("transfer_extras_public").select("*").order("sort"),
  ]);
  for (const r of [areas, places, vehicles, seasons, rates, surcharges, extras]) {
    if (r.error) {
      console.error("[catalog] read failed:", r.error.message);
      return empty;
    }
  }
  return {
    areas: (areas.data ?? []).map((a) => ({ id: a.id, name: a.name, kind: a.kind, iata: a.iata, lat: num(a.lat), lng: num(a.lng), radiusKm: num(a.radius_km) })),
    places: (places.data ?? []).map(
      (p): Place => ({ id: p.id, name: p.name, kind: p.kind, areaId: p.area_id, areaName: p.area_name, aliases: p.aliases ?? [], lat: num(p.lat), lng: num(p.lng) }),
    ),
    vehicles: (vehicles.data ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      nameEn: v.name_en,
      description: v.description,
      descriptionEn: v.description_en,
      capacityPax: v.capacity_pax,
      capacityBags: v.capacity_bags,
      photoPath: v.photo_path,
      sort: v.sort,
    })),
    seasons: (seasons.data ?? []).map((s) => ({ id: s.id, name: s.name, startsOn: s.starts_on, endsOn: s.ends_on })),
    rates: (rates.data ?? []).map((r) => ({
      fromAreaId: r.from_area_id,
      toAreaId: r.to_area_id,
      vehicleClassId: r.vehicle_class_id,
      seasonId: r.season_id,
      price: num(r.price),
      durationMinutes: r.duration_minutes,
    })),
    surcharges: (surcharges.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      nameEn: s.name_en,
      startTime: hhmm(s.start_time),
      endTime: hhmm(s.end_time),
      dateFrom: s.date_from,
      dateTo: s.date_to,
      weekdays: s.weekdays,
      amount: Number(s.amount),
      amountsByClass: Object.fromEntries(Object.entries(s.amounts_by_class ?? {}).map(([k, v]) => [k, Number(v)])),
    })),
    extras: (extras.data ?? []).map((e) => ({ id: e.id, name: e.name, nameEn: e.name_en, price: Number(e.price), maxQty: e.max_qty })),
  };
});

export type PublicActivity = ActivityInfo & {
  summary: string | null;
  summaryEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  category: string | null;
  areaId: string | null;
  durationMinutes: number | null;
  meetingPoint: string | null;
  includes: string[];
  includesEn: string[];
  bring: string[];
  bringEn: string[];
  coverPath: string | null;
  photos: string[];
  difficulty: "easy" | "moderate" | "hard" | null;
  minAge: number | null;
  areaName: string | null;
  schedules: Array<{ time: string; weekdays: number[]; capacity: number }>;
};

export const getActivities = cache(async (): Promise<PublicActivity[]> => {
  if (!isSupabaseConfigured()) return [];
  const sb = createAnonSupabase();
  const [acts, scheds, pickups] = await Promise.all([
    sb.from("activities_public").select("*").order("sort").order("title"),
    sb.from("activity_schedules_public").select("*"),
    sb.from("activity_pickup_areas_public").select("*"),
  ]);
  if (acts.error || scheds.error || pickups.error) {
    console.error("[catalog] activities read failed:", acts.error?.message ?? scheds.error?.message ?? pickups.error?.message);
    return [];
  }
  return (acts.data ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    titleEn: a.title_en,
    summary: a.summary,
    summaryEn: a.summary_en,
    description: a.description,
    descriptionEn: a.description_en,
    category: a.category,
    areaId: a.area_id,
    durationMinutes: a.duration_minutes,
    meetingPoint: a.meeting_point,
    includes: a.includes ?? [],
    includesEn: a.includes_en ?? [],
    bring: a.bring ?? [],
    bringEn: a.bring_en ?? [],
    coverPath: a.cover_path,
    photos: a.photos ?? [],
    difficulty: a.difficulty ?? null,
    minAge: a.min_age ?? null,
    areaName: null,
    priceAdult: num(a.price_adult),
    priceChild: num(a.price_child),
    childMinAge: a.child_min_age,
    childMaxAge: a.child_max_age,
    minPax: a.min_pax,
    maxPax: a.max_pax,
    bookingMode: a.booking_mode,
    pickupMode: a.pickup_mode,
    pickupAreas: (pickups.data ?? [])
      .filter((p) => p.activity_id === a.id)
      .map((p) => ({ areaId: p.area_id, areaName: p.area_name, fee: Number(p.fee) })),
    schedules: (scheds.data ?? [])
      .filter((s) => s.activity_id === a.id)
      .map((s) => ({ time: String(s.start_time).slice(0, 5), weekdays: s.weekdays, capacity: s.capacity }))
      .sort((x, y) => x.time.localeCompare(y.time)),
  }));
});

export const getActivitiesWithAreas = cache(async (): Promise<PublicActivity[]> => {
  const [acts, catalog] = await Promise.all([getActivities(), getTransferCatalog()]);
  const names = new Map(catalog.areas.map((a) => [a.id, a.name]));
  return acts.map((a) => ({ ...a, areaName: a.areaId ? (names.get(a.areaId) ?? null) : null }));
});

export async function getActivityBySlug(slug: string): Promise<PublicActivity | null> {
  return (await getActivitiesWithAreas()).find((a) => a.slug === slug) ?? null;
}

export async function getDepartures(activityId: string, from: string, to: string) {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await createAnonSupabase().rpc("activity_departures", { p_activity: activityId, p_from: from, p_to: to });
  if (error) {
    console.error("[catalog] departures failed:", error.message);
    return [];
  }
  return (data ?? []).map((d: { on_date: string; start_time: string; capacity: number; booked: number; remaining: number }) => ({
    date: d.on_date,
    time: String(d.start_time).slice(0, 5),
    capacity: d.capacity,
    remaining: d.remaining,
  }));
}
