import { z } from "zod";
import { priceItems } from "@/lib/booking/price";
import { cartItemSchema } from "@/lib/public/cart-types";
import { pricingContext } from "@/lib/public/context";
import { json, readJson, sameOrigin } from "@/lib/public/http";
import { allowRequest, clientKey } from "@/lib/rate-limit";

// POST /api/public/quote — prices a cart for DISPLAY. The same function prices it again on submit.
const bodySchema = z.object({ items: z.array(cartItemSchema).max(12), locale: z.enum(["es", "en"]).default("es") });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);
  if (!allowRequest(clientKey(req.headers, "quote"), 120)) return json({ error: "rate_limited" }, 429);
  let body;
  try {
    body = bodySchema.parse(await readJson(req));
  } catch {
    return json({ error: "invalid_request" }, 400);
  }
  const ctx = await pricingContext(body.locale);
  if (!ctx) return json({ error: "unavailable" }, 503);
  const lines = priceItems(body.items, ctx);
  const ok = lines.filter((l) => !l.display.error);
  const total = ok.reduce((s, l) => s + (l.display.total ?? 0), 0);
  return json({
    currency: ctx.money.currency,
    items: lines.map((l) => l.display),
    total,
    hasQuote: ok.some((l) => l.display.status === "quote"),
  });
}
