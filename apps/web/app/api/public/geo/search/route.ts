import { getTransferCatalog } from "@/lib/public/catalog";
import { searchMap, serviceBox } from "@/lib/public/geo";
import { json } from "@/lib/public/http";
import { allowRequest, clientKey } from "@/lib/rate-limit";

// GET /api/public/geo/search?q=…&lang=es — hotels, beaches, towns and addresses on OpenStreetMap, limited
// to the business's service region. The catalog's own places are matched in the browser.
export async function GET(req: Request) {
  if (!allowRequest(clientKey(req.headers, "geo"), 240, 10 * 60_000)) return json({ error: "rate_limited" }, 429);
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 120);
  const lang = url.searchParams.get("lang") === "en" ? "en" : "es";
  const catalog = await getTransferCatalog();
  return json({ results: await searchMap(q, lang, serviceBox(catalog.areas)) });
}
