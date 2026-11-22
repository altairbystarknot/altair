import type { Metadata } from "next";
import { pickText } from "@altair/config";
import { getPublicConfig } from "@/lib/config/business-config";
import { mediaUrl } from "@/lib/media";
import { getActivities, getTransferCatalog } from "@/lib/public/catalog";
import { getLocale } from "@/lib/public/locale";
import { STOCK } from "../_site/nav";
import { BookNowButton, GlassButton } from "../_site/ui/Glass";
import { ClockIcon, ShieldIcon, StarIcon, UsersIcon } from "../_site/ui/icons";
import { FeatureList, StatRow } from "../_site/ui/Layout";
import { PageHero, PageTitle } from "../_site/ui/PageHero";
import { Picture } from "../_site/ui/Picture";
import { TornPanel, TornSection } from "../_site/ui/Torn";
import { Eyebrow, Lead, SerifTitle } from "../_site/ui/Typography";

export const metadata: Metadata = { title: "Nosotros" };

// About the business: its own words (site.about), its promises and what it offers. The owner (or Claude,
// with the owner) writes these texts in the panel; the defaults below are neutral.
export default async function AboutPage() {
  const { config, site } = await getPublicConfig();
  if (!config) return null;
  const locale = await getLocale();
  const en = locale === "en";
  const [catalog, activities] = await Promise.all([config.features.transfers ? getTransferCatalog() : null, config.features.activities ? getActivities() : []]);
  const about = pickText(site.about, locale, en
    ? "We are a local team that organises private transport and experiences. We know the roads, the regions and the details that make a trip run smoothly, and we are with you from the first message to the drop-off."
    : "Somos un equipo local que organiza transporte privado y experiencias. Conocemos las rutas, las regiones y los detalles que hacen que un viaje salga bien, y le acompañamos desde el primer mensaje hasta la llegada.");
  const trust = site.trust.length ? site.trust.map((x) => pickText(x, locale, "")).filter(Boolean)
    : en ? ["Final price, taxes included", "Local bilingual team", "Confirmed by email", "Support on WhatsApp"] : ["Precio final, impuestos incluidos", "Equipo local bilingüe", "Confirmación por correo", "Atención por WhatsApp"];
  const icons = [<StarIcon key="a" />, <UsersIcon key="b" />, <ShieldIcon key="c" />, <ClockIcon key="d" />];
  const facts = [
    ...(catalog ? [{ value: String(catalog.areas.length), label: en ? "zones served" : "zonas atendidas" }, { value: String(catalog.vehicles.length), label: en ? "vehicle types" : "tipos de vehículo" }] : []),
    ...(activities.length ? [{ value: String(activities.length), label: en ? "activities" : "actividades" }] : []),
  ].filter((f) => f.value !== "0");
  const photo = mediaUrl(site.heroPath) || STOCK.hero;

  return (
    <main>
      <PageHero image={{ src: STOCK.about, width: 2400, height: 1600 }} alt="" wave={{ shape: "drift", seed: "about-hero" }} />
      <TornSection id="nosotros" tone="shell" tornBottom={{ tone: "night", shape: "wave", seed: "about-1" }} aria-labelledby="nosotros-title">
        <PageTitle id="nosotros-title" title={en ? "About us" : "Nosotros"} eyebrow={config.name} />
        <div className="lg-split">
          <div className="lg-stack">
            <Eyebrow lined>{en ? "Who we are" : "Quiénes somos"}</Eyebrow>
            <SerifTitle as="h2" level="h2">{en ? "A local team, " : "Un equipo local, "}<em>{en ? "at your side." : "a su lado."}</em></SerifTitle>
            <Lead>{about}</Lead>
            {facts.length > 0 && <StatRow stats={facts} />}
            <div className="lg-cluster">
              <BookNowButton href="/reservar" label={en ? "Book now" : "Reservar"} tone="ocean" />
              <GlassButton tone="white" shape="soft" href="/contacto">{en ? "Contact" : "Contacto"}</GlassButton>
            </div>
          </div>
          <div className="site-about-photo"><Picture image={{ src: photo, width: 2400, height: 1600 }} alt="" /></div>
        </div>
      </TornSection>
      <TornSection tone="night" tornBottom={{ tone: "shell", shape: "soft", seed: "about-2" }} aria-label={en ? "Our promises" : "Nuestras promesas"} className="lg-on-dark">
        <div className="site-trust-panels site-trust-panels--wide">
          <TornPanel tone="ocean" sides={["right"]} depth={12} seed="about-a" shape="swell" style={{ minHeight: 190 }}>
            <FeatureList items={trust.slice(0, 2).map((label, i) => ({ icon: icons[i], label }))} />
          </TornPanel>
          <TornPanel tone="sand" sides={["left"]} depth={12} seed="about-b" shape="flow" style={{ minHeight: 190 }}>
            <FeatureList items={trust.slice(2, 4).map((label, i) => ({ icon: icons[i + 2], label }))} />
          </TornPanel>
        </div>
      </TornSection>
    </main>
  );
}
