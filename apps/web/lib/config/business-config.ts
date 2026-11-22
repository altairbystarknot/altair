import "server-only";
import { cache } from "react";
import {
  DEMO_CONFIG,
  parseBusinessConfigRow,
  parsePaymentInstructions,
  parseSite,
  type BusinessConfig,
  type PaymentInstructions,
  type SiteSettings,
} from "@altair/config";
import { supabaseEnv } from "@/lib/env";
import { createAnonSupabase } from "@/lib/supabase/anon";

// The business configuration as the PUBLIC site sees it (business_config_public), once per request.
//
//   source "database"     the instance's own row
//   source "demo"         no Supabase configured (local development, previews): the demo business
//   source "unavailable"  Supabase configured but the row could not be read or failed validation.
//                         config is null and the site shows a maintenance notice: a real business must
//                         never be shown under the demo business's name.

export type PublicSiteInfo = {
  site: SiteSettings;
  published: boolean;
  paymentInstructions: PaymentInstructions;
};

export type PublicConfig =
  | ({ source: "database" | "demo"; config: BusinessConfig } & PublicSiteInfo)
  | { source: "unavailable"; config: null; site: SiteSettings; published: false; paymentInstructions: PaymentInstructions };

export const getPublicConfig = cache(async (): Promise<PublicConfig> => {
  const unavailable = { source: "unavailable" as const, config: null, site: parseSite({}), published: false as const, paymentInstructions: {} };
  if (!supabaseEnv()) return { source: "demo", config: DEMO_CONFIG, site: parseSite({}), published: true, paymentInstructions: {} };
  try {
    const { data, error } = await createAnonSupabase().from("business_config_public").select("*").maybeSingle();
    if (error) {
      console.error("[config] business_config_public read failed:", error.message);
      return unavailable;
    }
    const parsed = parseBusinessConfigRow(data);
    if (!parsed) {
      console.error("[config] business_config_public row is missing or invalid");
      return unavailable;
    }
    return {
      source: "database",
      config: parsed,
      site: parseSite(data?.site),
      published: data?.published === true,
      paymentInstructions: parsePaymentInstructions(data?.payment_instructions),
    };
  } catch (e) {
    console.error("[config] business_config_public read threw:", e instanceof Error ? e.message : e);
    return unavailable;
  }
});
