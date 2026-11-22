import type { Metadata } from "next";
import { getPublicConfig } from "@/lib/config/business-config";
import { mediaUrl } from "@/lib/media";
import { getLocale } from "@/lib/public/locale";
import { BookingBackdrop, EngineLogo } from "../reservar/_engine/chrome";
import { Checkout } from "./checkout";

export const metadata: Metadata = { title: "Su reserva", robots: { index: false } };

// The last step of every booking: the customer's details, with every service in the cart summarised on the
// right (priced again by the server). Sending it records the booking through the guarded door.
export default async function CartPage() {
  const { config, site } = await getPublicConfig();
  if (!config) return null;
  const locale = await getLocale();
  const wa = config.contactWhatsapp ? `https://wa.me/${config.contactWhatsapp.replace(/\D/g, "")}` : null;
  return (
    <main id="main-content" className="be-page">
      <BookingBackdrop image={mediaUrl(site.heroPath)} />
      <Checkout
        locale={locale}
        paymentsMode={config.paymentsMode}
        transfers={config.features.transfers}
        activities={config.features.activities}
        logo={<EngineLogo name={config.name} logoUrl={mediaUrl(site.logoPath)} />}
        whatsappHref={wa}
      />
    </main>
  );
}
