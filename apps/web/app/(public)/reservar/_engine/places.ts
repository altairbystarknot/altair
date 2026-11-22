/**
 * A catalogue place, or a place outside the catalogue: either one found on OpenStreetMap (with its
 * coordinates, so the route can be drawn and the zone that covers it priced) or exactly what the customer
 * typed (staff see that text verbatim and confirm the price).
 */
export type PlaceValue = { id: string; name: string; kind: string } | { text: string; lat?: number; lng?: number } | null;

export const placeLabel = (v: PlaceValue) => (v ? ("id" in v ? v.name : v.text) : "");
export const isAirport = (p: PlaceValue) => !!p && "id" in p && p.kind === "airport";
export const placeKey = (v: PlaceValue) => (!v ? null : "id" in v ? v.id : `typed:${v.text}${v.lat !== undefined ? `@${v.lat},${v.lng}` : ""}`);
export const samePlace = (a: PlaceValue, b: PlaceValue) => placeKey(a) === placeKey(b);

/** The cart / API form of one end of a leg. */
export function placeToEnd(p: PlaceValue): { placeId: string } | { lat: number; lng: number; label: string } | { label: string } | null {
  if (!p) return null;
  if ("id" in p) return { placeId: p.id };
  const label = p.text.trim().slice(0, 160);
  if (label.length < 2) return null;
  return p.lat !== undefined && p.lng !== undefined ? { lat: p.lat, lng: p.lng, label } : { label };
}
