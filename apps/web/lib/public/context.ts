import "server-only";
import { getPublicConfig } from "@/lib/config/business-config";
import { getActivities, getMoneyRules, getTransferCatalog } from "@/lib/public/catalog";

/** Everything the server needs to price a cart, or null when the instance is not readable. */
export async function pricingContext(locale: string) {
  const { config } = await getPublicConfig();
  const money = await getMoneyRules();
  if (!config || !money) return null;
  const [catalog, activities] = await Promise.all([getTransferCatalog(), getActivities()]);
  return { config, money, catalog, activities, timezone: config.timezone, locale };
}
