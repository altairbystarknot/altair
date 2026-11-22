import { z } from "zod";

// What the browser keeps in its cart: only the CHOICES (places, dates, people, vehicle), never prices.
// Every time the cart is shown or sent, the server prices it again from the database.

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const id = z.string().uuid();
const count = (max: number) => z.number().int().min(0).max(max);

/** A catalog place, or any point found on the map (OpenStreetMap) with the label the customer saw. */
export const endSchema = z.union([
  z.object({ placeId: id }),
  z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), label: z.string().trim().min(2).max(160) }),
  z.object({ label: z.string().trim().min(2).max(160) }),
]);
export type End = z.infer<typeof endSchema>;

export const transferItemSchema = z.object({
  kind: z.literal("transfer"),
  key: z.string().min(1).max(64),
  from: endSchema,
  to: endSchema,
  fromLabel: z.string().max(160),
  toLabel: z.string().max(160),
  date,
  time,
  adults: count(50),
  children: count(50),
  infants: count(20),
  childAges: z.array(z.number().int().min(0).max(17)).max(50).default([]),
  bags: count(100).optional(),
  vehicleClassId: id,
  extras: z.array(z.object({ id, qty: z.number().int().min(1).max(20) })).max(10).default([]),
  flight: z.string().trim().max(20).optional(),
  note: z.string().trim().max(500).optional(),
});

export const activityItemSchema = z.object({
  kind: z.literal("activity"),
  key: z.string().min(1).max(64),
  activityId: id,
  date,
  time,
  adults: count(200),
  children: count(200),
  infants: count(50),
  childAges: z.array(z.number().int().min(0).max(17)).max(200).default([]),
  pickup: endSchema.nullable().optional(),
  pickupLabel: z.string().max(160).optional(),
  note: z.string().trim().max(500).optional(),
});

export const cartItemSchema = z.discriminatedUnion("kind", [transferItemSchema, activityItemSchema]);
export const cartSchema = z.array(cartItemSchema).min(1).max(12);

export type TransferItem = z.infer<typeof transferItemSchema>;
export type ActivityItem = z.infer<typeof activityItemSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;

export const customerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z.string().trim().max(40).optional().default(""),
  country: z.string().trim().max(60).optional().default(""),
});

export const submitSchema = z.object({
  items: cartSchema,
  customer: customerSchema,
  notes: z.string().trim().max(1000).optional().default(""),
  locale: z.enum(["es", "en"]).default("es"),
  acceptTerms: z.literal(true),
  website: z.string().max(0).optional().default(""), // honeypot: humans leave it empty
});

/** A priced cart line as the browser shows it (display only; the server re-prices on submit). */
export type PricedItem = {
  key: string;
  kind: "transfer" | "activity";
  title: string;
  subtitle: string;
  date: string;
  time: string;
  status: "instant" | "request" | "quote";
  components: Array<{ label: string; qty: number; unit: number; total: number }>;
  total: number | null;
  error: string | null;
  editHref: string | null;
};
