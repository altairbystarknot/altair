import { z } from "zod";
import { roadRoute } from "@/lib/public/geo";
import { json, readJson, sameOrigin } from "@/lib/public/http";
import { allowRequest, clientKey } from "@/lib/rate-limit";

// POST /api/public/geo/route — road route between two points (OpenStreetMap / OSRM): distance, minutes and
// a simplified line to draw. Informational only: prices come from the business's zones, never from km.
const point = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });
const body = z.object({ a: point, b: point });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);
  if (!allowRequest(clientKey(req.headers, "route"), 120, 10 * 60_000)) return json({ error: "rate_limited" }, 429);
  let p;
  try {
    p = body.parse(await readJson(req, 4000));
  } catch {
    return json({ error: "invalid_request" }, 400);
  }
  return json({ route: await roadRoute(p.a, p.b) });
}
