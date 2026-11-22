/** What the transfer engine reads from the business's catalogue (server props, display only). */
export type EngineCatalog = {
  minDate: string;
  maxParty: number;
  maxLegs: number;
  timezoneLabel: string;
  center: { lat: number; lng: number; zoom: number };
  locations: { id: string; name: string; kind: string; area: string | null; lat: number | null; lng: number | null; keywords: string }[];
  vehicles: { id: string; name: string; capacityPax: number; capacityBags: number; description: string | null; imageUrl: string | null }[];
  extras: { id: string; name: string; description: string | null; price: number; maxQty: number; imageUrl: string | null }[];
};

/** One vehicle's price for one leg, from the server's engine (VAT included, rounded). */
export type LegOption = { vehicleClassId: string; status: "instant" | "request" | "quote"; total: number | null; durationMinutes: number | null };
export type LegQuote = { options: LegOption[]; fromArea: string | null; toArea: string | null; groupTooLarge: boolean };

export type RouteMapData = { from: [number, number] | null; to: [number, number] | null; points: [number, number][] | null; km: number | null; minutes: number | null };

/** A place found on OpenStreetMap while the customer types (server-side search, limited to the service area). */
export type PlaceHit = { key: string; name: string; hint: string | null; lat: number; lng: number };
