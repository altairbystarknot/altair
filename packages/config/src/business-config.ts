import { z } from "zod";
import { isValidTimeZone } from "@altair/core";
import { THEME_PRESET_IDS, type ThemePresetId, isHexColor } from "./themes";

// THE BUSINESS CONFIGURATION CONTRACT. One row per instance (public.business_config, id = 1). Everything
// that differs between businesses lives here as data, never as code: name, languages, time zone, currency,
// tax, rounding, reservation prefix, payment mode, theme and which engines are on.
//
// The database enforces the same rules with CHECK constraints (supabase/migrations/*_foundation.sql);
// this schema is the app-side mirror, used to validate edits before they are sent and to read rows safely.

export const SUPPORTED_LOCALES = ["es", "en", "pt", "de", "fr", "it"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const PAYMENTS_MODES = ["stripe", "records"] as const;
export type PaymentsMode = (typeof PAYMENTS_MODES)[number];

const hex = z.string().refine(isHexColor, "Use a color like #002b42");

export const themeSchema = z.object({
  preset: z.enum(THEME_PRESET_IDS as [ThemePresetId, ...ThemePresetId[]]).default("marea"),
  brand: hex.optional(),
  brand2: hex.optional(),
  accent: hex.optional(),
});

export const featuresSchema = z.object({
  transfers: z.boolean().default(true),
  activities: z.boolean().default(true),
  privateDriver: z.boolean().default(false),
});

export const businessConfigSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    legalName: z.string().trim().max(160).nullable().default(null),
    contactEmail: z.email().nullable().default(null),
    contactWhatsapp: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{6,24}$/, "Use a phone number like +506 8000 0000")
      .nullable()
      .default(null),
    locales: z.array(z.enum(SUPPORTED_LOCALES)).min(1).max(SUPPORTED_LOCALES.length),
    defaultLocale: z.enum(SUPPORTED_LOCALES),
    timezone: z.string().refine(isValidTimeZone, "Unknown time zone"),
    currency: z.string().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code"),
    vatRate: z.number().min(0).lt(1),
    rounding: z.enum(["whole_up", "cents"]),
    reservationPrefix: z.string().regex(/^[A-Z]{2,4}$/, "2 to 4 capital letters"),
    paymentsMode: z.enum(PAYMENTS_MODES),
    theme: themeSchema,
    features: featuresSchema,
  })
  .refine((c) => c.locales.includes(c.defaultLocale), {
    message: "The default language must be one of the site languages",
    path: ["defaultLocale"],
  });

export type BusinessConfig = z.infer<typeof businessConfigSchema>;

/** The demo business used when an instance has no database yet (local development, previews). */
export const DEMO_CONFIG: BusinessConfig = {
  name: "Marea Tours & Transfers",
  legalName: null,
  contactEmail: null,
  contactWhatsapp: null,
  locales: ["es", "en"],
  defaultLocale: "es",
  timezone: "America/Costa_Rica",
  currency: "USD",
  vatRate: 0.13,
  rounding: "whole_up",
  reservationPrefix: "MAR",
  paymentsMode: "records",
  theme: { preset: "marea" },
  features: { transfers: true, activities: true, privateDriver: false },
};

/** A database row (snake_case, as PostgREST returns it). Every field optional: rows are untrusted input. */
export type BusinessConfigRow = {
  name?: unknown;
  legal_name?: unknown;
  contact_email?: unknown;
  contact_whatsapp?: unknown;
  locales?: unknown;
  default_locale?: unknown;
  timezone?: unknown;
  currency?: unknown;
  vat_rate?: unknown;
  rounding?: unknown;
  reservation_prefix?: unknown;
  payments_mode?: unknown;
  theme?: unknown;
  features?: unknown;
};

/** Parse a row into the contract. Returns null when the row is unusable, so the caller can fail closed. */
export function parseBusinessConfigRow(row: BusinessConfigRow | null | undefined): BusinessConfig | null {
  if (!row) return null;
  const result = businessConfigSchema.safeParse({
    name: row.name,
    legalName: row.legal_name ?? null,
    contactEmail: row.contact_email ?? null,
    contactWhatsapp: row.contact_whatsapp ?? null,
    locales: row.locales,
    defaultLocale: row.default_locale,
    timezone: row.timezone,
    currency: typeof row.currency === "string" ? row.currency.trim() : row.currency,
    // numeric columns arrive as strings from PostgREST
    vatRate: typeof row.vat_rate === "string" ? Number(row.vat_rate) : row.vat_rate,
    rounding: row.rounding,
    reservationPrefix: row.reservation_prefix,
    paymentsMode: row.payments_mode,
    theme: row.theme ?? {},
    features: row.features ?? {},
  });
  return result.success ? result.data : null;
}

/** The row to write for an edit (snake_case). Validate with businessConfigSchema first. */
export function toBusinessConfigRow(config: BusinessConfig) {
  return {
    name: config.name,
    legal_name: config.legalName,
    contact_email: config.contactEmail,
    contact_whatsapp: config.contactWhatsapp,
    locales: config.locales,
    default_locale: config.defaultLocale,
    timezone: config.timezone,
    currency: config.currency,
    vat_rate: config.vatRate,
    rounding: config.rounding,
    reservation_prefix: config.reservationPrefix,
    payments_mode: config.paymentsMode,
    theme: config.theme,
    features: config.features,
  };
}
