import { bookingPayload } from "@altair/engine";
import { priceItems } from "@/lib/booking/price";
import { guard } from "@/lib/doors";
import { submitSchema } from "@/lib/public/cart-types";
import { pricingContext } from "@/lib/public/context";
import { json, readJson, sameOrigin } from "@/lib/public/http";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { createAnonSupabase } from "@/lib/supabase/anon";

// POST /api/public/bookings — the customer sends the cart. The server prices EVERYTHING again from the
// database, refuses if any line changed or is no longer available, and stores the booking through the one
// guarded door (booking_submit), which re-checks totals, dates and seats under a lock.

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);
  if (!allowRequest(clientKey(req.headers, "booking"), 8, 10 * 60_000)) return json({ error: "rate_limited" }, 429);
  let body;
  try {
    body = submitSchema.parse(await readJson(req));
  } catch {
    return json({ error: "invalid_request" }, 400);
  }
  if (body.website) return json({ error: "invalid_request" }, 400);

  const ctx = await pricingContext(body.locale);
  if (!ctx) return json({ error: "unavailable" }, 503);
  const lines = priceItems(body.items, ctx);
  const broken = lines.filter((l) => l.display.error || !l.payload);
  if (broken.length) return json({ error: "items_changed", items: lines.map((l) => l.display) }, 409);

  const payload = bookingPayload(
    lines.map((l) => l.payload!),
    { name: body.customer.name, email: body.customer.email, phone: body.customer.phone, country: body.customer.country },
    { currency: ctx.money.currency, locale: body.locale, notes: body.notes },
  );

  const { data, error } = await createAnonSupabase().rpc("booking_submit", { p_guard: guard("booking"), p_payload: payload });
  if (error) {
    if (error.code === "P0002") return json({ error: "sold_out" }, 409);
    if (error.code === "22023") return json({ error: "invalid_booking" }, 400);
    console.error("[bookings] submit failed:", error.code, error.message);
    return json({ error: "unavailable" }, 503);
  }
  const res = data as { code: string; token: string; needs_quote: boolean };
  return json({ code: res.code, token: res.token, needsQuote: res.needs_quote });
}
