import "server-only";
import { customerPrice } from "@altair/core";
import type { MoneyRules, TransferCatalog } from "@altair/engine";

// Facts the public pages show, computed from the real catalog (never invented): popular routes with their
// lowest "from" price, and a representative place per zone for links into the booking flow.

export type PopularRoute = { fromArea: string; toArea: string; fromPlaceId: string; toPlaceId: string; from: number | null; minutes: number | null };

export function representativePlace(catalog: TransferCatalog, areaId: string): string | null {
  const ps = catalog.places.filter((p) => p.areaId === areaId);
  return (ps.find((p) => p.kind === "airport") ?? ps.find((p) => p.kind === "town") ?? ps[0])?.id ?? null;
}

export function popularRoutes(catalog: TransferCatalog, money: MoneyRules, limit = 6): PopularRoute[] {
  const areas = new Map(catalog.areas.map((a) => [a.id, a]));
  const best = new Map<string, PopularRoute>();
  for (const r of catalog.rates) {
    if (r.seasonId !== null || r.price === null) continue;
    const fa = areas.get(r.fromAreaId);
    const ta = areas.get(r.toAreaId);
    if (!fa || !ta) continue;
    const fp = representativePlace(catalog, fa.id);
    const tp = representativePlace(catalog, ta.id);
    if (!fp || !tp) continue;
    // One entry per pair of zones, written from the airport side when there is one.
    if (ta.kind === "airport" && fa.kind !== "airport") continue;
    const key = [fa.id, ta.id].sort().join("|");
    const price = customerPrice(r.price, money.vatRate, money.rounding);
    const cur = best.get(key);
    if (!cur || (cur.from ?? Infinity) > price) {
      best.set(key, { fromArea: fa.name, toArea: ta.name, fromPlaceId: fp, toPlaceId: tp, from: price, minutes: r.durationMinutes });
    }
  }
  // Airports first (that is where most private transfers start), then the longest drives.
  return [...best.values()]
    .sort((a, b) => {
      const ai = areas.get(catalog.places.find((p) => p.id === a.fromPlaceId)?.areaId ?? "")?.kind === "airport" ? 0 : 1;
      const bi = areas.get(catalog.places.find((p) => p.id === b.fromPlaceId)?.areaId ?? "")?.kind === "airport" ? 0 : 1;
      return ai - bi || (b.minutes ?? 0) - (a.minutes ?? 0);
    })
    .slice(0, limit);
}
