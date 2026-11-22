import { z } from "zod";
import { getDepartures } from "@/lib/public/catalog";
import { json } from "@/lib/public/http";
import { allowRequest, clientKey } from "@/lib/rate-limit";

// GET /api/public/departures?activity=<uuid>&from=YYYY-MM-DD&to=YYYY-MM-DD — seats left per departure.
const q = z.object({
  activity: z.string().uuid(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(req: Request) {
  if (!allowRequest(clientKey(req.headers, "departures"), 120)) return json({ error: "rate_limited" }, 429);
  const url = new URL(req.url);
  const parsed = q.safeParse({ activity: url.searchParams.get("activity"), from: url.searchParams.get("from"), to: url.searchParams.get("to") });
  if (!parsed.success) return json({ error: "invalid_request" }, 400);
  return json({ departures: await getDepartures(parsed.data.activity, parsed.data.from, parsed.data.to) });
}
