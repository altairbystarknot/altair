import { pickText } from "@altair/config";
import { getPublicConfig } from "@/lib/config/business-config";
import { mediaUrl } from "@/lib/media";
import { getActivitiesWithAreas, getMoneyRules, getTransferCatalog } from "@/lib/public/catalog";
import { siteFaq } from "@/lib/public/faq";
import { popularRoutes } from "@/lib/public/home-data";
import { getLocale } from "@/lib/public/locale";
import { LanguageSwitch } from "./_site/SiteChrome";
import { STOCK, siteNav, stockVehicle } from "./_site/nav";
import { FleetCard } from "./_site/ui/Cards";
import { BookNowButton, GlassButton } from "./_site/ui/Glass";
import { HeroSection } from "./_site/ui/HeroSection";
import { ArrowRightIcon, CarIcon, ClockIcon, PinIcon, PlaneIcon, ShieldIcon, StarIcon, UsersIcon, WhatsAppIcon } from "./_site/ui/icons";
import { FeatureList, Section } from "./_site/ui/Layout";
import { Picture } from "./_site/ui/Picture";
import { ServicePanel } from "./_site/ui/ServicePanel";
import { TornPanel, TornSection } from "./_site/ui/Torn";
import { Eyebrow, GlassTitle, Lead, SectionHeader, SerifTitle } from "./_site/ui/Typography";
import type { ImageRef } from "./_site/ui/types";

// The business's home page, in the liquid-glass template: the framed hero, its services on a photograph,
// the fleet, the activities, why book here, the team, frequent questions and contact. Every call to action
// leads to the booking pages; everything shown comes from the business's own data or the app's stock photos.

const img = (src: string | null | undefined, fallback: string, w = 2400, h = 1600): ImageRef => ({ src: src || fallback, width: w, height: h });

export default async function HomePage() {
  const { config, site, paymentInstructions } = await getPublicConfig();
  if (!config) return null;
  const locale = await getLocale();
  const en = locale === "en";
  const money = (await getMoneyRules())!;
  const [catalog, activities] = await Promise.all([getTransferCatalog(), getActivitiesWithAreas()]);
  const nav = siteNav(config.features, en);
  const logo = mediaUrl(site.logoPath);
  const hero = img(mediaUrl(site.heroPath), STOCK.hero);
  const routes = config.features.transfers ? popularRoutes(catalog, money, 6) : [];
  const showActivities = config.features.activities && activities.length > 0;
  const vehicles = config.features.transfers ? catalog.vehicles : [];
  const wa = config.contactWhatsapp ? `https://wa.me/${config.contactWhatsapp.replace(/\D/g, "")}` : null;
  const fmt = (n: number) => new Intl.NumberFormat(en ? "en-US" : "es-CR", { style: "currency", currency: money.currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);

  const headline = pickText(site.headline, locale, en ? "Private transfers & local experiences" : "Traslados privados y experiencias locales");
  const sub = pickText(site.subheadline, locale, en ? "Door-to-door private transport and tours with local guides. The final price up front, taxes included." : "Transporte privado puerta a puerta y tours con guías locales. El precio final desde el inicio, con impuestos incluidos.");
  const about = pickText(site.about, locale, en ? "A local team that knows every route and every detail that makes a trip run smoothly. We help you choose the right transport and experiences, from the first message to the drop-off." : "Un equipo local que conoce cada ruta y cada detalle que hace que un viaje salga bien. Le ayudamos a elegir el transporte y las experiencias adecuadas, desde el primer mensaje hasta la llegada.");
  const trust = site.trust.length
    ? site.trust.map((x) => pickText(x, locale, "")).filter(Boolean)
    : en
      ? ["Final price, taxes included", "Local bilingual drivers and guides", "Confirmed by email", "Support on WhatsApp"]
      : ["Precio final, impuestos incluidos", "Choferes y guías locales bilingües", "Confirmación por correo", "Atención por WhatsApp"];
  const trustSub = en
    ? ["What you see is what you pay.", "People who know every road.", "Your booking in writing, right away.", "Real people, quick answers."]
    : ["Lo que ve es lo que paga.", "Gente que conoce cada camino.", "Su reserva por escrito, al instante.", "Personas reales, respuestas rápidas."];
  const trustIcons = [<StarIcon key="s" />, <UsersIcon key="u" />, <ShieldIcon key="h" />, <ClockIcon key="c" />];
  const faq = siteFaq(config, site, locale, pickText(paymentInstructions, locale, "")).slice(0, 4);

  const services = [
    ...(config.features.transfers
      ? [
          { key: "transfers", icon: <CarIcon />, title: en ? "Private transfers" : "Traslados privados", body: en ? "Hotels, towns and beaches, in a private vehicle for your group only." : "Hoteles, pueblos y playas, en un vehículo privado solo para su grupo.", meta: en ? "Price per vehicle" : "Precio por vehículo", href: "/traslados" },
          { key: "airport", icon: <PlaneIcon />, title: en ? "Airport pick-ups" : "Traslados al aeropuerto", body: en ? "We wait for you at arrivals and take you straight to your hotel." : "Le esperamos en la salida y le llevamos directo a su hotel.", meta: en ? "Door to door" : "Puerta a puerta", href: "/reservar/traslado" },
        ]
      : []),
    ...(showActivities
      ? [{ key: "activities", icon: <PinIcon />, title: en ? "Activities & tours" : "Actividades y tours", body: en ? "Nature, adventure and culture with local guides, with hotel pick-up." : "Naturaleza, aventura y cultura con guías locales, con recogida en su hotel.", meta: en ? "Book by date and time" : "Por fecha y horario", href: "/actividades" }]
      : []),
  ];

  return (
    <main>
      <HeroSection
        background={hero}
        title={config.name}
        slogan={headline}
        lead={sub}
        ctaLabel={nav.labels.bookNow}
        ctaHref="/reservar"
        label={config.name}
        nextBackground="var(--lg-color-night)"
        navbar={{
          label: nav.labels.nav, menuLabel: nav.labels.menu, closeLabel: nav.labels.close,
          brand: { logo: logo ? { src: logo, width: 400, height: 160 } : null, name: config.name, href: "#top", alt: config.name, sizes: "200px" },
          links: [...nav.left, ...nav.right],
        }}
        menu={{
          groups: nav.groups, label: nav.labels.menuLabel, ctaLabel: nav.labels.bookNow, ctaHref: "/reservar",
          footer: config.locales.length > 1 ? <LanguageSwitch locale={locale} label={nav.labels.language} variant="group" /> : undefined,
        }}
      />

      {services.length > 0 && (
        <Section id="servicios" padding="default" background={{ image: img(STOCK.road, STOCK.road), veil: "dark" }} onDark container="wide" aria-labelledby="servicios-title" className="site-cv">
          <SectionHeader align="center" eyebrow={en ? "Services" : "Servicios"} glassTitle={en ? "Your trip" : "Su viaje"} titleId="servicios-title" caps={en ? "starts here" : "empieza aquí"} lead={en ? "Private transport and experiences with a local team that knows the routes and the details." : "Transporte privado y experiencias con un equipo local que conoce las rutas y los detalles."} />
          <div className="site-grid-3">
            {services.map((s) => <ServicePanel key={s.key} icon={s.icon} title={s.title} body={s.body} meta={s.meta} href={s.href} cta={en ? "Learn more" : "Ver más"} />)}
          </div>
          <div className="lg-cluster lg-cluster--center site-actions">
            <BookNowButton href="/reservar" label={nav.labels.bookNow} tone="gold" size="lg" />
            {wa && <GlassButton tone="glass" shape="soft" href={wa} target="_blank" rel="noopener noreferrer" icon={<WhatsAppIcon />} iconPosition="start">WhatsApp</GlassButton>}
          </div>
        </Section>
      )}

      {vehicles.length > 0 && (
        <section id="vehiculos" className="lg-hscroll lg-on-dark site-fleet site-cv" aria-labelledby="vehiculos-title">
          <div className="lg-hscroll__bg" aria-hidden="true">
            <Picture image={img(STOCK.transfer, STOCK.transfer)} alt="" />
            <div className="lg-hscroll__bg-veil" />
          </div>
          <div className="site-fleet__inner">
            <header className="lg-hscroll__header">
              <p className="lg-eyebrow lg-eyebrow--lined">{en ? "Our fleet" : "Nuestra flota"}</p>
              <GlassTitle text={en ? "Vehicles" : "Vehículos"} id="vehiculos-title" />
            </header>
            <div className="site-fleet-row">
              {vehicles.map((v) => (
                <FleetCard
                  key={v.id}
                  image={img(mediaUrl(v.photoPath), stockVehicle(v.capacityPax), 1600, 1100)}
                  name={(en ? v.nameEn : null) || v.name}
                  body={((en ? v.descriptionEn : null) || v.description) ?? undefined}
                  passengers={v.capacityPax}
                  luggage={v.capacityBags}
                  units={{ passengers: en ? "passengers" : "pasajeros", luggage: en ? "suitcases" : "maletas" }}
                  href="/reservar/traslado"
                  cta={en ? "Book this vehicle" : "Reservar"}
                  aspect="short"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {routes.length > 0 && (
        <TornSection id="rutas" tone="shell" tornTop={{ tone: "night", shape: "soft", seed: "home-routes" }} tornBottom={{ tone: "night", shape: "wave", seed: "home-routes-b" }} aria-labelledby="rutas-title" className="site-cv">
          <div className="lg-split">
            <div className="lg-stack">
              <Eyebrow lined>{en ? "Popular routes" : "Rutas frecuentes"}</Eyebrow>
              <SerifTitle as="h2" level="h1" id="rutas-title">{en ? "Where we " : "A dónde le "}<em>{en ? "take you." : "llevamos."}</em></SerifTitle>
              <Lead>{en ? "Prices per private vehicle, taxes included. Choose your exact hotel in the booking." : "Precios por vehículo privado, con impuestos incluidos. Elija su hotel exacto al reservar."}</Lead>
              <div className="lg-cluster">
                <BookNowButton href="/reservar/traslado" label={en ? "Book a transfer" : "Reservar traslado"} tone="ocean" />
                <GlassButton tone="white" shape="soft" href="/traslados">{en ? "All routes" : "Todas las rutas"}</GlassButton>
              </div>
            </div>
            <ul className="site-routes">
              {routes.map((r) => (
                <li key={`${r.fromPlaceId}-${r.toPlaceId}`}>
                  <a href={`/reservar/traslado?from=${r.fromPlaceId}&to=${r.toPlaceId}`} className="site-route">
                    <span className="site-route__ends">{r.fromArea} <i aria-hidden="true">→</i> {r.toArea}</span>
                    <span className="site-route__meta">{r.minutes ? `${Math.floor(r.minutes / 60) ? `${Math.floor(r.minutes / 60)} h ` : ""}${r.minutes % 60 ? `${r.minutes % 60} min` : ""}` : ""}</span>
                    <span className="site-route__price">{r.from !== null ? <>{en ? "from" : "desde"} <strong>{fmt(r.from)}</strong></> : null}</span>
                    <ArrowRightIcon />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </TornSection>
      )}

      {showActivities && (
        <Section id="actividades" padding="default" tone="night" onDark container="wide" aria-labelledby="actividades-title" className="site-cv">
          <SectionHeader align="center" eyebrow={en ? "Experiences" : "Experiencias"} glassTitle={en ? "Activities" : "Actividades"} titleId="actividades-title" lead={en ? "Tours with local guides. Choose the date and time, and we pick you up at your hotel." : "Tours con guías locales. Elija la fecha y el horario, y le recogemos en su hotel."} />
          <div className="lg-card-grid site-activities">
            {activities.slice(0, 6).map((a) => (
              <FleetCard
                key={a.id}
                image={img(mediaUrl(a.coverPath ?? a.photos[0]), STOCK.sunset, 1600, 1100)}
                name={(en ? a.titleEn : null) || a.title}
                tag={a.areaName ?? undefined}
                body={((en ? a.summaryEn : null) || a.summary) ?? undefined}
                href={`/actividades/${a.slug}`}
                cta={en ? "See details and book" : "Ver y reservar"}
                aspect="short"
              />
            ))}
          </div>
          <div className="lg-cluster lg-cluster--center site-actions">
            <GlassButton tone="gold" href="/actividades">{en ? "All activities" : "Ver todas las actividades"}</GlassButton>
          </div>
        </Section>
      )}

      <TornSection id="confianza" tone="shell" tornTop={{ tone: "night", shape: "soft", seed: "home-trust" }} tornBottom={{ tone: "night", shape: "wave", seed: "home-trust-b" }} aria-labelledby="confianza-title" className="site-cv">
        <div className="lg-split">
          <div className="lg-stack">
            <Eyebrow lined>{en ? `Why ${config.name}` : `Por qué ${config.name}`}</Eyebrow>
            <SerifTitle as="h2" level="h1" id="confianza-title">{en ? "Travel " : "Viaje "}<em>{en ? "with peace of mind." : "con tranquilidad."}</em></SerifTitle>
            <Lead>{about}</Lead>
            <div className="lg-cluster">
              <BookNowButton href="/reservar" label={nav.labels.bookNow} tone="ocean" />
              <GlassButton tone="white" shape="soft" href="/nosotros">{nav.labels.about}</GlassButton>
            </div>
          </div>
          <div className="site-trust-panels">
            <TornPanel tone="ocean" sides={["right"]} depth={12} seed="trust-a" shape="swell" style={{ minHeight: 210 }}>
              <FeatureList items={trust.slice(0, 2).map((label, i) => ({ icon: trustIcons[i], label, sub: trustSub[i] }))} />
            </TornPanel>
            <TornPanel tone="sand" sides={["left"]} depth={12} seed="trust-b" shape="flow" style={{ minHeight: 210 }}>
              <FeatureList items={trust.slice(2, 4).map((label, i) => ({ icon: trustIcons[i + 2], label, sub: trustSub[i + 2] }))} />
            </TornPanel>
          </div>
        </div>
      </TornSection>

      {faq.length > 0 && (
        <Section id="preguntas" padding="default" tone="night" onDark container="default" aria-labelledby="preguntas-title" className="site-cv">
          <SectionHeader align="center" eyebrow={en ? "Before you book" : "Antes de reservar"} glassTitle={en ? "Questions" : "Preguntas"} titleId="preguntas-title" />
          <div className="site-faq">
            {faq.map((f, i) => (
              <details key={i} className="site-faq__item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <div className="lg-cluster lg-cluster--center site-actions">
            <GlassButton tone="glass" shape="soft" href="/preguntas">{en ? "All questions" : "Todas las preguntas"}</GlassButton>
          </div>
        </Section>
      )}

      <Section id="contacto" padding="default" background={{ image: img(STOCK.sunset, STOCK.sunset), veil: "dark" }} onDark container="wide" aria-labelledby="contacto-title" className="site-cv site-contact">
        <SectionHeader align="center" eyebrow={en ? "Contact" : "Contacto"} glassTitle={en ? "Let's talk" : "Hablemos"} titleId="contacto-title" lead={en ? "A question about a route, a large group or a special date? Write to us and a person answers." : "¿Una ruta especial, un grupo grande o una fecha particular? Escríbanos y le responde una persona."} />
        <div className="lg-cluster lg-cluster--center site-contact__actions">
          {wa && <GlassButton tone="gold" size="lg" href={wa} target="_blank" rel="noopener noreferrer" icon={<WhatsAppIcon />} iconPosition="start">WhatsApp</GlassButton>}
          {config.contactEmail && <GlassButton tone="glass" shape="soft" href={`mailto:${config.contactEmail}`}>{config.contactEmail}</GlassButton>}
          <GlassButton tone="glass" shape="soft" href="/reservar">{nav.labels.bookNow}</GlassButton>
        </div>
      </Section>
    </main>
  );
}
