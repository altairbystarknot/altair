import { z } from "zod";

// THE CATALOG DRAFT CONTRACT. Claude (through the connector), an Excel import and the sample data all
// describe catalog changes in this one shape, by NAME (the way people talk: "La Fortuna", "Van"), never by
// database id. A person reviews the draft and publishes it; publishing upserts by those names.
//
// Prices are BEFORE tax. Empty price = "a cotizar" (never $0).

const name = z.string().trim().min(2).max(120);
const money = z.number().min(0).max(1_000_000);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24 h)");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const weekdays = z.array(z.number().int().min(0).max(6)).min(1).max(7);

export const areaRow = z.object({
  name: name.max(80),
  kind: z.enum(["airport", "zone"]).default("zone"),
  iata: z.string().regex(/^[A-Z]{3}$/).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  radiusKm: z.number().min(0.2).max(300).nullable().optional(),
  active: z.boolean().optional(),
});

export const placeRow = z.object({
  name,
  area: name.max(80),
  kind: z.enum(["airport", "hotel", "town", "port", "other"]).default("hotel"),
  aliases: z.array(z.string().trim().min(1).max(60)).max(10).optional(),
  address: z.string().trim().max(200).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  active: z.boolean().optional(),
});

export const vehicleRow = z.object({
  name: name.max(60),
  nameEn: z.string().trim().max(60).nullable().optional(),
  description: z.string().trim().max(300).nullable().optional(),
  capacityPax: z.number().int().min(1).max(60),
  capacityBags: z.number().int().min(0).max(80).default(0),
  photoPath: z.string().trim().max(300).nullable().optional(),
  active: z.boolean().optional(),
});

export const seasonRow = z
  .object({ name: name.max(60), startsOn: date, endsOn: date })
  .refine((s) => s.endsOn >= s.startsOn, { message: "The season ends before it starts", path: ["endsOn"] });

export const rateRow = z.object({
  from: name.max(80),
  to: name.max(80),
  vehicle: name.max(60),
  season: z.string().trim().max(60).nullable().optional(),
  price: money.nullable(),
  netCost: money.nullable().optional(),
  minutes: z.number().int().min(5).max(1440).nullable().optional(),
  bothWays: z.boolean().default(true),
});

export const surchargeRow = z.object({
  name: name.max(60),
  nameEn: z.string().trim().max(60).nullable().optional(),
  startTime: time.nullable().optional(),
  endTime: time.nullable().optional(),
  dateFrom: date.nullable().optional(),
  dateTo: date.nullable().optional(),
  weekdays: weekdays.nullable().optional(),
  amount: money,
  active: z.boolean().optional(),
});

export const extraRow = z.object({
  name: name.max(60),
  nameEn: z.string().trim().max(60).nullable().optional(),
  price: money,
  maxQty: z.number().int().min(1).max(20).default(4),
  active: z.boolean().optional(),
});

export const activityRow = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(80).optional(),
  title: z.string().trim().min(3).max(120),
  titleEn: z.string().trim().max(120).nullable().optional(),
  summary: z.string().trim().max(300).nullable().optional(),
  summaryEn: z.string().trim().max(300).nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  descriptionEn: z.string().trim().max(4000).nullable().optional(),
  category: z.string().trim().max(40).nullable().optional(),
  area: z.string().trim().max(80).nullable().optional(),
  durationMinutes: z.number().int().min(15).max(4320).nullable().optional(),
  meetingPoint: z.string().trim().max(200).nullable().optional(),
  includes: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  includesEn: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  bring: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  bringEn: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  coverPath: z.string().trim().max(300).nullable().optional(),
  priceAdult: money.nullable(),
  priceChild: money.nullable().optional(),
  netCostAdult: money.nullable().optional(),
  childMinAge: z.number().int().min(0).max(17).optional(),
  childMaxAge: z.number().int().min(0).max(17).optional(),
  minPax: z.number().int().min(1).max(100).optional(),
  maxPax: z.number().int().min(1).max(200).optional(),
  bookingMode: z.enum(["instant", "request"]).optional(),
  difficulty: z.enum(["easy", "moderate", "hard"]).nullable().optional(),
  minAge: z.number().int().min(0).max(99).nullable().optional(),
  photos: z.array(z.string().trim().max(300)).max(12).optional(),
  pickupMode: z.enum(["none", "included", "by_area"]).optional(),
  schedules: z
    .array(z.object({ time, weekdays: weekdays.optional(), capacity: z.number().int().min(1).max(500) }))
    .max(12)
    .optional(),
  pickupAreas: z.array(z.object({ area: name.max(80), fee: money.default(0) })).max(40).optional(),
  active: z.boolean().optional(),
});

export const supplierRow = z.object({
  name,
  kind: z.enum(["transport", "activity", "guide", "other"]).default("transport"),
  contactName: z.string().trim().max(120).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  whatsapp: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().max(200).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  active: z.boolean().optional(),
});

export const catalogDraftSchema = z
  .object({
    areas: z.array(areaRow).max(200).optional(),
    places: z.array(placeRow).max(2000).optional(),
    vehicles: z.array(vehicleRow).max(30).optional(),
    seasons: z.array(seasonRow).max(20).optional(),
    rates: z.array(rateRow).max(5000).optional(),
    surcharges: z.array(surchargeRow).max(30).optional(),
    extras: z.array(extraRow).max(40).optional(),
    activities: z.array(activityRow).max(200).optional(),
    suppliers: z.array(supplierRow).max(300).optional(),
  })
  .refine((d) => Object.values(d).some((v) => Array.isArray(v) && v.length > 0), { message: "The draft is empty" });

export type CatalogDraft = z.infer<typeof catalogDraftSchema>;
export type CatalogSection = keyof CatalogDraft;

export const CATALOG_SECTIONS: Array<{ key: CatalogSection; label: string }> = [
  { key: "areas", label: "Zonas" },
  { key: "places", label: "Lugares" },
  { key: "vehicles", label: "Vehículos" },
  { key: "seasons", label: "Temporadas" },
  { key: "rates", label: "Tarifas" },
  { key: "surcharges", label: "Recargos" },
  { key: "extras", label: "Extras" },
  { key: "activities", label: "Actividades" },
  { key: "suppliers", label: "Proveedores" },
];

export function draftRowCount(d: CatalogDraft): number {
  return CATALOG_SECTIONS.reduce((n, s) => n + (d[s.key]?.length ?? 0), 0);
}

/** The change_sets.kind for a draft: its only section, or "catalog" when it touches several. */
export function draftKind(d: CatalogDraft): string {
  const used = CATALOG_SECTIONS.filter((s) => (d[s.key]?.length ?? 0) > 0).map((s) => s.key);
  return used.length === 1 ? used[0]! : "catalog";
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "actividad";
}

/**
 * Cross-row checks a draft must pass before it can be published: every rate, place and pickup names an
 * area/vehicle/season that exists in the draft OR in the current catalog.
 */
export function checkDraftReferences(
  d: CatalogDraft,
  existing: { areas: string[]; vehicles: string[]; seasons: string[] },
): string[] {
  const norm = (s: string) => s.trim().toLowerCase();
  const areas = new Set([...existing.areas, ...(d.areas ?? []).map((a) => a.name)].map(norm));
  const vehicles = new Set([...existing.vehicles, ...(d.vehicles ?? []).map((v) => v.name)].map(norm));
  const seasons = new Set([...existing.seasons, ...(d.seasons ?? []).map((s) => s.name)].map(norm));
  const problems: string[] = [];
  for (const p of d.places ?? []) if (!areas.has(norm(p.area))) problems.push(`Lugar "${p.name}": la zona "${p.area}" no existe`);
  for (const r of d.rates ?? []) {
    if (!areas.has(norm(r.from))) problems.push(`Tarifa ${r.from} → ${r.to}: la zona "${r.from}" no existe`);
    if (!areas.has(norm(r.to))) problems.push(`Tarifa ${r.from} → ${r.to}: la zona "${r.to}" no existe`);
    if (!vehicles.has(norm(r.vehicle))) problems.push(`Tarifa ${r.from} → ${r.to}: el vehículo "${r.vehicle}" no existe`);
    if (r.season && !seasons.has(norm(r.season))) problems.push(`Tarifa ${r.from} → ${r.to}: la temporada "${r.season}" no existe`);
  }
  for (const a of d.activities ?? []) {
    if (a.area && !areas.has(norm(a.area))) problems.push(`Actividad "${a.title}": la zona "${a.area}" no existe`);
    for (const p of a.pickupAreas ?? []) if (!areas.has(norm(p.area))) problems.push(`Actividad "${a.title}": la zona de recogida "${p.area}" no existe`);
  }
  return problems.slice(0, 50);
}
