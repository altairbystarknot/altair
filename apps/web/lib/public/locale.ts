import "server-only";
import { cookies } from "next/headers";
import { getPublicConfig } from "@/lib/config/business-config";
import type { SiteLocale } from "./i18n";

export const LANG_COOKIE = "altair_lang";

/** The visitor's language: their choice (cookie) if the business offers it, else the business default. */
export async function getLocale(): Promise<SiteLocale> {
  const { config } = await getPublicConfig();
  const offered = (config?.locales ?? ["es"]).filter((l): l is SiteLocale => l === "es" || l === "en");
  const chosen = (await cookies()).get(LANG_COOKIE)?.value;
  if (chosen === "es" || chosen === "en") {
    if (offered.includes(chosen)) return chosen;
  }
  const def = config?.defaultLocale;
  return def === "en" ? "en" : "es";
}
