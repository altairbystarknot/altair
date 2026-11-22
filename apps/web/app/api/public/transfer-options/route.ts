import { z } from "zod";
import { quoteTransfer, TransferRequestError } from "@altair/engine";
import { endSchema } from "@/lib/public/cart-types";
import { pricingContext } from "@/lib/public/context";
import { json, readJson, sameOrigin } from "@/lib/public/http";
import { allowRequest, clientKey } from "@/lib/rate-limit";

// POST /api/public/transfer-options — every vehicle that fits the group, priced by the server from the
// business's zones and rates (display; the same engine re-prices on submit). Also says which zone each
// end fell in, so the customer sees "Tamarindo" for a hotel picked on the map.
const body = z.object({
  from: endSchema,
  to: endSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  adults: z.number().int().min(0).max(50),
  children: z.number().int().min(0).max(50),
  infants: z.number().int().min(0).max(20).default(0),
  bags: z.number().int().min(0).max(100).optional(),
  extras: z.array(z.object({ id: z.string().uuid(), qty: z.number().int().min(1).max(20) })).max(10).default([]),
  locale: z.enum(["es", "en"]).default("es"),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);
  if (!allowRequest(clientKey(req.headers, "transfer-options"), 120)) return json({ error: "rate_limited" }, 429);
  let p;
  try {
    p = body.parse(await readJson(req, 8000));
  } catch {
    return json({ error: "invalid_request" }, 400);
  }
  const ctx = await pricingContext(p.locale);
  if (!ctx) return json({ error: "unavailable" }, 503);
  try {
    const q = quoteTransfer(ctx.catalog, { from: p.from, to: p.to, date: p.date, time: p.time, adults: p.adults, children: p.children, infants: p.infants, bags: p.bags, extras: p.extras }, ctx.money);
    const en = p.locale === "en";
    return json({
      currency: ctx.money.currency,
      from: { label: q.from.label, area: q.from.areaName, airport: q.from.areaKind === "airport" || q.from.kind === "airport" },
      to: { label: q.to.label, area: q.to.areaName, airport: q.to.areaKind === "airport" || q.to.kind === "airport" },
      groupTooLarge: q.groupTooLarge,
      options: q.options.map((o) => ({
        vehicleClassId: o.vehicleClassId,
        name: (en ? o.vehicleNameEn : null) || o.vehicleName,
        capacityPax: o.capacityPax,
        capacityBags: o.capacityBags,
        photoPath: o.photoPath,
        status: o.status,
        total: o.total,
        durationMinutes: o.durationMinutes,
        components: o.components.map((c) => ({ label: (en ? c.labelEn : null) || c.label, qty: c.qty, total: c.total })),
      })),
    });
  } catch (e) {
    return json({ error: e instanceof TransferRequestError ? e.field : "invalid_request" }, 400);
  }
}
