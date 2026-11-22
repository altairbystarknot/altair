import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPublicConfig } from "@/lib/config/business-config";
import { mediaUrl } from "@/lib/media";
import { getMoneyRules, getTransferCatalog } from "@/lib/public/catalog";
import { popularRoutes } from "@/lib/public/home-data";
import { getLocale } from "@/lib/public/locale";
import { STOCK, stockVehicle } from "../_site/nav";
import { FleetCard } from "../_site/ui/Cards";
import { BookNowButton, GlassButton } from "../_site/ui/Glass";
import { ArrowRightIcon, CarIcon, PinIcon, ShieldIcon, UsersIcon } from "../_site/ui/icons";
import { FeatureList, Section } from "../_site/ui/Layout";
import { PageHero, PageTitle } from "../_site/ui/PageHero";
import { TornSection } from "../_site/ui/Torn";
import { Eyebrow, Lead, SectionHeader, SerifTitle } from "../_site/ui/Typography";

export const metadata: Metadata = { title: "Traslados privados" };

// The private-transfer page: how it works, every published route with its "from" price, the vehicles.
// All figures come from the business's own rates; the booking itself happens in /reservar/traslado.
export default async function TransfersPage() {
  const { config } = await getPublicConfig();
  if (!config) return null;
  if (!config.features.transfers) redirect("/");
  const locale = await getLocale();
  const en = locale === "en";
  const money = (await getMoneyRules())!;
  const catalog = await getTransferCatalog();
  const routes = popularRoutes(catalog, money, 40);
  const fmt = (n: number) => new Intl.NumberFormat(en ? "en-US" : "es-CR", { style: "currency", currency: money.currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);
  const dur = (m: number | null) => (m ? `${Math.floor(m / 60) ? `${Math.floor(m / 60)} h ` : ""}${m % 60 ? `${m % 60} min` : ""}`.trim() : "");
  const steps = en
    ? [
        { icon: <PinIcon />, label: "Your route", sub: "An airport, a hotel or any address on the map." },
        { icon: <UsersIcon />, label: "Your group", sub: "Date, pickup time, passengers and suitcases." },
        { icon: <CarIcon />, label: "Your vehicle", sub: "Every vehicle that fits your group, with its final price." },
        { icon: <ShieldIcon />, label: "Your confirmation", sub: config.paymentsMode === "stripe" ? "Pay by card on a secure page." : "Nothing is charged when you book." },
      ]
    : [
        { icon: <PinIcon />, label: "Su ruta", sub: "Un aeropuerto, un hotel o cualquier dirección en el mapa." },
        { icon: <UsersIcon />, label: "Su grupo", sub: "Fecha, hora de recogida, pasajeros y maletas." },
        { icon: <CarIcon />, label: "Su vehículo", sub: "Todos los vehículos para su grupo, con su precio final." },
        { icon: <ShieldIcon />, label: "Su confirmación", sub: config.paymentsMode === "stripe" ? "Pago con tarjeta en una página segura." : "No se cobra nada al reservar." },
      ];

  return (
    <main>
      <PageHero image={{ src: STOCK.road, width: 2400, height: 1600 }} alt="" wave={{ shape: "drift", seed: "transfers-hero" }} />
      <TornSection id="como-funciona" tone="shell" tornBottom={{ tone: "night", shape: "wave", seed: "transfers-1" }} aria-labelledby="traslados-title">
        <PageTitle id="traslados-title" title={en ? "Private transfers" : "Traslados privados"} eyebrow={config.name} caps={en ? "Door to door · your group only" : "Puerta a puerta · solo su grupo"} />
        <div className="lg-split">
          <div className="lg-stack">
            <Eyebrow lined>{en ? "How it works" : "Cómo funciona"}</Eyebrow>
            <SerifTitle as="h2" level="h2">{en ? "Book in " : "Reserve en "}<em>{en ? "four steps." : "cuatro pasos."}</em></SerifTitle>
            <Lead>{en ? "A private vehicle and a local driver for your group only. The price you see is per vehicle, taxes included." : "Un vehículo privado y un chofer local solo para su grupo. El precio que ve es por vehículo, con impuestos incluidos."}</Lead>
            <div className="lg-cluster">
              <BookNowButton href="/reservar/traslado" label={en ? "Book a transfer" : "Reservar traslado"} tone="ocean" />
            </div>
          </div>
          <FeatureList items={steps} />
        </div>
      </TornSection>

      {routes.length > 0 && (
        <Section id="rutas" padding="default" tone="night" onDark container="default" aria-labelledby="rutas-title">
          <SectionHeader align="center" eyebrow={en ? "Routes and prices" : "Rutas y precios"} glassTitle={en ? "Routes" : "Rutas"} titleId="rutas-title" lead={en ? "From price per private vehicle, taxes included. Choose your exact hotel when you book." : "Precio desde, por vehículo privado e impuestos incluidos. Elija su hotel exacto al reservar."} />
          <ul className="site-routes site-routes--dark">
            {routes.map((r) => (
              <li key={`${r.fromPlaceId}-${r.toPlaceId}`}>
                <a href={`/reservar/traslado?from=${r.fromPlaceId}&to=${r.toPlaceId}`} className="site-route">
                  <span className="site-route__ends">{r.fromArea} <i aria-hidden="true">→</i> {r.toArea}</span>
                  <span className="site-route__meta">{dur(r.minutes)}</span>
                  <span className="site-route__price">{r.from !== null ? <>{en ? "from" : "desde"} <strong>{fmt(r.from)}</strong></> : null}</span>
                  <ArrowRightIcon />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {catalog.vehicles.length > 0 && (
        <TornSection id="vehiculos" tone="shell" tornTop={{ tone: "night", shape: "soft", seed: "transfers-2" }} aria-labelledby="vehiculos-title">
          <SectionHeader align="center" eyebrow={en ? "Our fleet" : "Nuestra flota"} title={en ? "Vehicles" : "Vehículos"} titleId="vehiculos-title" />
          <div className="site-fleet-row">
            {catalog.vehicles.map((v) => (
              <FleetCard key={v.id} image={{ src: mediaUrl(v.photoPath) || stockVehicle(v.capacityPax), width: 1600, height: 1100 }} name={(en ? v.nameEn : null) || v.name}
                body={((en ? v.descriptionEn : null) || v.description) ?? undefined} passengers={v.capacityPax} luggage={v.capacityBags}
                units={{ passengers: en ? "passengers" : "pasajeros", luggage: en ? "suitcases" : "maletas" }} href="/reservar/traslado" cta={en ? "Book" : "Reservar"} aspect="short" />
            ))}
          </div>
          <div className="lg-cluster lg-cluster--center site-actions">
            <BookNowButton href="/reservar/traslado" label={en ? "Book a transfer" : "Reservar traslado"} tone="ocean" size="lg" />
            <GlassButton tone="white" shape="soft" href="/contacto">{en ? "Ask for a quote" : "Pedir una cotización"}</GlassButton>
          </div>
        </TornSection>
      )}
    </main>
  );
}
