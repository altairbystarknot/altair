import "server-only";
import type { Area } from "@altair/engine";

// OPENSTREETMAP SERVICES, called from the server only (the browser never talks to them directly):
//   * Photon (komoot) to find any hotel, beach, town or address as the customer types;
//   * OSRM to draw the road route and estimate distance and drive time.
// Both public servers ask for gentle use: we cache answers, pace calls, send a clear User-Agent and time
// out fast. An instance can point at its own servers with PHOTON_URL / OSRM_URL.

const PHOTON = process.env.PHOTON_URL || "https://photon.komoot.io";
const OSRM = process.env.OSRM_URL || "https://router.project-osrm.org";
const UA = `AltairBooking/0.3 (+${process.env.NEXT_PUBLIC_SITE_URL || "https://altair.local"})`;

type Entry<T> = { at: number; ttl: number; value: T };
const cache = new Map<string, Entry<unknown>>();
function fromCache<T>(key: string): T | undefined {
  const e = cache.get(key);
  if (!e) return undefined;
  if (Date.now() - e.at > e.ttl) {
    cache.delete(key);
    return undefined;
  }
  return e.value as T;
}
function toCache<T>(key: string, value: T, ttl: number) {
  if (cache.size > 5000) cache.clear();
  cache.set(key, { at: Date.now(), ttl, value });
}

let lastPhoton = 0;
async function pace(minGapMs: number) {
  const wait = lastPhoton + minGapMs - Date.now();
  lastPhoton = Math.max(Date.now(), lastPhoton + minGapMs);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

async function getJson(url: string, timeoutMs: number): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: ctrl.signal, cache: "no-store" });
    if (!r.ok) throw new Error(`status ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

/** The service region: every zone circle, padded. [minLng, minLat, maxLng, maxLat] or null. */
export function serviceBox(areas: Area[]): [number, number, number, number] | null {
  const pts = areas.filter((a) => a.lat != null && a.lng != null);
  if (!pts.length) return null;
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (const a of pts) {
    const pad = (a.radiusKm ?? 10) / 111 + 0.35;
    minLat = Math.min(minLat, a.lat! - pad);
    maxLat = Math.max(maxLat, a.lat! + pad);
    minLng = Math.min(minLng, a.lng! - pad);
    maxLng = Math.max(maxLng, a.lng! + pad);
  }
  return [minLng, minLat, maxLng, maxLat];
}

export type GeoHit = { label: string; sub: string; lat: number; lng: number; kind: string };

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: { name?: string; street?: string; housenumber?: string; city?: string; town?: string; village?: string; district?: string; county?: string; state?: string; country?: string; osm_value?: string; type?: string };
};

export async function searchMap(q: string, lang: "es" | "en", box: [number, number, number, number] | null): Promise<GeoHit[]> {
  const query = q.trim().slice(0, 120);
  if (query.length < 3) return [];
  const key = `p:${lang}:${box?.join(",") ?? ""}:${query.toLowerCase()}`;
  const hit = fromCache<GeoHit[]>(key);
  if (hit) return hit;
  const params = new URLSearchParams({ q: query, limit: "8" });
  if (lang === "en") params.set("lang", "en");
  if (box) params.set("bbox", box.map((n) => n.toFixed(3)).join(","));
  try {
    await pace(220);
    const data = (await getJson(`${PHOTON}/api/?${params.toString()}`, 3500)) as { features?: PhotonFeature[] };
    const seen = new Set<string>();
    const out: GeoHit[] = [];
    for (const f of data.features ?? []) {
      const c = f.geometry?.coordinates;
      const p = f.properties ?? {};
      if (!c || typeof c[0] !== "number" || typeof c[1] !== "number") continue;
      const [lng, lat] = c;
      if (box && (lng < box[0] || lng > box[2] || lat < box[1] || lat > box[3])) continue;
      const name = p.name || [p.street, p.housenumber].filter(Boolean).join(" ");
      if (!name) continue;
      const sub = [p.city || p.town || p.village || p.district, p.state, p.country].filter(Boolean).join(", ");
      const dedupe = `${name}|${sub}`.toLowerCase();
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      out.push({ label: name, sub, lat, lng, kind: p.osm_value || p.type || "place" });
      if (out.length >= 6) break;
    }
    toCache(key, out, out.length ? 24 * 3600_000 : 30 * 60_000);
    return out;
  } catch {
    return []; // provider failures are never cached
  }
}

export type RouteInfo = { km: number; minutes: number; line: Array<[number, number]> };

export async function roadRoute(a: { lat: number; lng: number }, b: { lat: number; lng: number }): Promise<RouteInfo | null> {
  const key = `r:${a.lat.toFixed(4)},${a.lng.toFixed(4)};${b.lat.toFixed(4)},${b.lng.toFixed(4)}`;
  const hit = fromCache<RouteInfo | null>(key);
  if (hit !== undefined) return hit;
  const url = `${OSRM}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = (await getJson(url, 5000)) as { routes?: Array<{ distance: number; duration: number; geometry?: { coordinates?: Array<[number, number]> } }> };
      const r = data.routes?.[0];
      if (!r) break;
      const coords = r.geometry?.coordinates ?? [];
      const step = Math.max(1, Math.ceil(coords.length / 400));
      const line = coords.filter((_, i) => i % step === 0 || i === coords.length - 1).map(([lng, lat]) => [lat, lng] as [number, number]);
      const info = { km: Math.round(r.distance / 100) / 10, minutes: Math.round(r.duration / 60), line };
      toCache(key, info, 7 * 24 * 3600_000);
      return info;
    } catch {
      if (attempt === 0) await new Promise((res) => setTimeout(res, 400));
    }
  }
  return null;
}
