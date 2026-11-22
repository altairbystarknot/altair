import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pickText } from "@altair/config";
import { getPublicConfig } from "@/lib/config/business-config";
import { mediaUrl } from "@/lib/media";
import { getActivitiesWithAreas, getMoneyRules, getTransferCatalog } from "@/lib/public/catalog";
import { getLocale } from "@/lib/public/locale";
import { ActivityCard } from "../_components/activity-card";
import { ActivityBrowser } from "./browser";

export const metadata: Metadata = { title: "Actividades" };

// The activity catalog: a clean photo hero, the introduction, then every activity grouped by area, with the
// area pills and a search box. Every word, photo and price comes from the business's own catalog.

export default async function ActivitiesPage() {
  const { config, site } = await getPublicConfig();
  if (!config) return null;
  if (!config.features.activities) redirect(config.features.transfers ? "/traslados" : "/");
  const locale = await getLocale();
  const en = locale === "en";
  const money = (await getMoneyRules())!;
  const [activities, catalog] = await Promise.all([getActivitiesWithAreas(), getTransferCatalog()]);
  const photos = activities.map((a) => mediaUrl(a.coverPath ?? a.photos[0])).filter((x): x is string => Boolean(x));
  const hero = photos[0] ?? mediaUrl(site.heroPath);
  const backdrop = photos[1] ?? mediaUrl(site.heroPath) ?? hero;
  const used = new Set(activities.map((a) => a.areaName).filter((x): x is string => Boolean(x)));
  const ordered = catalog.areas.map((a) => a.name).filter((n) => used.has(n));
  const areas = [...ordered, ...[...used].filter((n) => !ordered.includes(n))];
  const lead =
    pickText(site.subheadline, locale, "") ||
    (en
      ? "Nature, adventure and culture with local guides. Choose an area, pick a date and see the final price before you book."
      : "Naturaleza, aventura y cultura con guías locales. Elija una zona, escoja la fecha y vea el precio final antes de reservar.");

  return (
    <main className="ac-page">
      <section className="ac-hero" aria-label={en ? "Activities" : "Actividades"}>
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="ac-hero__img" src={hero} alt="" fetchPriority="high" />
        ) : (
          <div className="ac-hero__img ac-hero__img--plain" aria-hidden="true" />
        )}
        <div className="ac-hero__veil" aria-hidden="true" />
        <Wave className="ac-hero__wave" />
      </section>

      <section className="ac-intro">
        <div className="ac-wrap ac-intro__inner">
          <p className="ac-eyebrow">{en ? "Activities & tours" : "Actividades y tours"}</p>
          <h1 className="ac-title">{en ? <>Experiences with <em>local guides.</em></> : <>Experiencias con <em>guías locales.</em></>}</h1>
          <p className="ac-lead">{lead}</p>
          <ul className="ac-intro__points">
            <li>{en ? "Final price, taxes included" : "Precio final, impuestos incluidos"}</li>
            <li>{en ? "Real availability by date" : "Disponibilidad real por fecha"}</li>
            <li>{en ? "Hotel pickup where offered" : "Recogida en su hotel donde aplique"}</li>
          </ul>
        </div>
      </section>

      <section className="ac-catalogue" id="catalogo">
        {backdrop ? (
          <div className="ac-catalogue__bg" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={backdrop} alt="" loading="lazy" decoding="async" />
          </div>
        ) : null}
        <Wave className="ac-catalogue__wave ac-catalogue__wave--top" />
        <div className="ac-wrap ac-catalogue__inner">
          {activities.length === 0 ? (
            <div className="ac-group__head">
              <p className="ac-empty">{en ? "Activities will be published here soon." : "Muy pronto publicaremos aquí nuestras actividades."}</p>
            </div>
          ) : (
            <ActivityBrowser
              locale={locale}
              areas={areas}
              items={activities.map((a) => ({
                area: a.areaName,
                text: [a.title, a.titleEn, a.summary, a.summaryEn, a.areaName, a.category].filter(Boolean).join(" "),
              }))}
              cards={activities.map((a, i) => <ActivityCard key={a.id} a={a} money={money} locale={locale} index={i % 6} />)}
            />
          )}
        </div>
      </section>
    </main>
  );
}

/** A soft paper edge between two sections (decoration). */
function Wave({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 48c120-22 240-34 380-26s250 34 400 32 260-36 400-40 190 10 260 22v64H0Z" />
    </svg>
  );
}
