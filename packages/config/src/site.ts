import { z } from "zod";

// THE PUBLIC SITE, AS DATA. Each business chooses a layout, a palette (themes.ts), its logo and hero photo,
// and its own words. Stored in business_config.site (jsonb) and read through business_config_public.

export const SITE_LAYOUTS = ["clasico", "inmersivo", "catalogo"] as const;
export type SiteLayout = (typeof SITE_LAYOUTS)[number];

export const SITE_LAYOUT_INFO: Record<SiteLayout, { label: string; description: string }> = {
  clasico: { label: "Enmarcado", description: "Tu foto principal dentro de un marco de vidrio, con el título grande abajo. Elegante y cinematográfico." },
  inmersivo: { label: "Pantalla completa", description: "Su foto de borde a borde, con el título encima. Ideal si tiene una gran foto." },
  catalogo: { label: "Actividades primero", description: "Después de la portada, sus actividades en tarjetas grandes; el transporte en una franja." },
};

export const SITE_FONTS = ["moderna", "elegante"] as const;
export type SiteFont = (typeof SITE_FONTS)[number];

const text = (max: number) => z.string().trim().max(max);
const localized = (max: number) =>
  z
    .object({ es: text(max).optional(), en: text(max).optional() })
    .default({});

// Storage paths only (bucket/name) or app paths starting with "/": never arbitrary URLs.
const mediaPath = z
  .string()
  .trim()
  .max(300)
  .regex(/^(\/[A-Za-z0-9/_.-]+|(brand|media)\/[A-Za-z0-9/_.-]+)$/, "Invalid media path");

export const siteSchema = z.object({
  layout: z.enum(SITE_LAYOUTS).default("clasico"),
  font: z.enum(SITE_FONTS).default("elegante"),
  logoPath: mediaPath.nullable().default(null),
  heroPath: mediaPath.nullable().default(null),
  eyebrow: localized(60),
  headline: localized(90),
  subheadline: localized(240),
  about: localized(900),
  /** Four short promises under the hero ("Bilingual drivers"…). Empty = sensible defaults. */
  trust: z.array(localized(40)).max(4).default([]),
  /** Questions customers ask. Empty = generic booking questions built from the business data. */
  faq: z.array(z.object({ q: localized(160), a: localized(1200) })).max(24).default([]),
  /** Real reviews the owner pastes (name, text, where it was published). The section hides when empty. */
  reviews: z
    .array(z.object({ name: text(60), text: text(600), source: text(40).optional(), date: text(20).optional() }))
    .max(12)
    .default([]),
});

export type SiteSettings = z.infer<typeof siteSchema>;

export const paymentInstructionsSchema = z.object({
  es: text(1200).optional(),
  en: text(1200).optional(),
});
export type PaymentInstructions = z.infer<typeof paymentInstructionsSchema>;

export const ONBOARDING_STEPS = ["negocio", "marca", "servicios", "datos", "cobros", "claude", "publicar"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
export const onboardingSchema = z.record(z.string(), z.boolean()).default({});

export function parseSite(raw: unknown): SiteSettings {
  const r = siteSchema.safeParse(raw ?? {});
  return r.success ? r.data : siteSchema.parse({});
}

export function parsePaymentInstructions(raw: unknown): PaymentInstructions {
  const r = paymentInstructionsSchema.safeParse(raw ?? {});
  return r.success ? r.data : {};
}

/** Pick the text for a locale, falling back to Spanish, then to a default. */
export function pickText(value: { es?: string; en?: string } | undefined, locale: string, fallback = ""): string {
  if (!value) return fallback;
  const v = (locale === "en" ? value.en : value.es) || value.es || value.en;
  return v && v.trim() ? v : fallback;
}
