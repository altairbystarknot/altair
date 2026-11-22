import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { customerPrice, todayISO } from "@altair/core";
import { getPublicConfig } from "@/lib/config/business-config";
import { mediaUrl } from "@/lib/media";
import { getMoneyRules, getTransferCatalog } from "@/lib/public/catalog";
import { getLocale } from "@/lib/public/locale";
import { TransferEngine } from "../_engine/TransferEngine";
import type { EngineCatalog } from "../_engine/types";
import type { PlaceValue } from "../_engine/places";
import { BookingBackdrop, EngineLogo } from "../_engine/chrome";

export const metadata: Metadata = { title: "Reservar traslado", robots: { index: false } };

// The private-transfer booking engine: Route → Vehicle → Extras → Your details (the cart). Every price on
// these steps comes from the server's engine; the browser only keeps the customer's choices.

export default async function TransferBookingPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; edit?: string }> }) {
  const { config, site } = await getPublicConfig();
  if (!config) return null;
  if (!config.features.transfers) redirect(config.features.activities ? "/actividades" : "/");
  const locale = await getLocale();
  const en = locale === "en";
  const money = (await getMoneyRules())!;
  const catalog = await getTransferCatalog();
  const sp = await searchParams;

  // Map view: the middle of the business's zones, zoomed to fit them roughly.
  const pts = catalog.areas.filter((a) => a.lat != null && a.lng != null) as Array<{ lat: number; lng: number }>;
  const center = pts.length
    ? (() => {
        const lats = pts.map((p) => p.lat);
        const lngs = pts.map((p) => p.lng);
        const spread = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs));
        return { lat: (Math.max(...lats) + Math.min(...lats)) / 2, lng: (Math.max(...lngs) + Math.min(...lngs)) / 2, zoom: spread > 6 ? 6 : spread > 2.5 ? 7 : spread > 1 ? 8 : 9 };
      })()
    : { lat: 15, lng: -40, zoom: 2 };

  const engineCatalog: EngineCatalog = {
    minDate: todayISO(config.timezone),
    maxParty: Math.max(1, ...catalog.vehicles.map((v) => v.capacityPax)),
    maxLegs: 6,
    timezoneLabel: en ? "local time" : "hora local",
    center,
    locations: catalog.places.map((p) => ({ id: p.id, name: p.name, kind: p.kind, area: p.areaName, lat: p.lat ?? null, lng: p.lng ?? null, keywords: (p.aliases ?? []).join(" ") })),
    vehicles: catalog.vehicles.map((v) => ({
      id: v.id, name: (en ? v.nameEn : null) || v.name, capacityPax: v.capacityPax, capacityBags: v.capacityBags,
      description: (en ? v.descriptionEn : null) || v.description || null, imageUrl: mediaUrl(v.photoPath),
    })),
    extras: catalog.extras.map((e) => ({
      id: e.id, name: (en ? e.nameEn : null) || e.name, description: null,
      price: customerPrice(e.price, money.vatRate, money.rounding), maxQty: e.maxQty, imageUrl: null,
    })),
  };
  const initial = (id: string | undefined): PlaceValue => {
    const p = id ? catalog.places.find((x) => x.id === id) : undefined;
    return p ? { id: p.id, name: p.name, kind: p.kind } : null;
  };
  const wa = config.contactWhatsapp ? `https://wa.me/${config.contactWhatsapp.replace(/\D/g, "")}` : null;

  return (
    <main id="main-content" className="be-page">
      <BookingBackdrop image={mediaUrl(site.heroPath)} />
      <TransferEngine
        locale={locale}
        currency={money.currency}
        catalog={engineCatalog}
        whatsappHref={wa}
        chrome={{ logo: <EngineLogo name={config.name} logoUrl={mediaUrl(site.logoPath)} />, homeHref: "/", homeLabel: en ? "Home" : "Inicio" }}
        editKey={sp.edit && /^[a-z0-9]{4,64}$/i.test(sp.edit) ? sp.edit : null}
        initialFrom={initial(sp.from)}
        initialTo={initial(sp.to)}
      />
    </main>
  );
}
