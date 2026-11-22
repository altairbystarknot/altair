import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, todayISO } from "@altair/core";
import { fromPrice } from "@altair/engine";
import { getPublicConfig } from "@/lib/config/business-config";
import { mediaUrl } from "@/lib/media";
import { getActivitiesWithAreas, getActivityBySlug, getMoneyRules, getTransferCatalog } from "@/lib/public/catalog";
import { getLocale } from "@/lib/public/locale";
import { ActivityCard, DIFFICULTY, minutesLabel } from "../../_components/activity-card";
import { AI } from "../_ui/icons";
import { ActivityBooker, type PickupPlace } from "./activity-booker";
import { Gallery, InfoTabs } from "./gallery";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await getActivityBySlug((await params).slug);
  return { title: a?.title ?? "Actividad", description: a?.summary ?? undefined };
}

// One activity: a clean photo hero, then the photos and the description on the left and, on the right, the
// title, the quick facts and the booking panel, which follows the page on a desktop. Phones stack it all.

const paragraphs = (text: string | null) => (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export default async function ActivityPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { slug } = await params;
  const { edit } = await searchParams;
  const { config } = await getPublicConfig();
  if (!config) return null;
  const a = await getActivityBySlug(slug);
  if (!a) notFound();
  const locale = await getLocale();
  const en = locale === "en";
  const money = (await getMoneyRules())!;
  const [catalog, all] = await Promise.all([getTransferCatalog(), getActivitiesWithAreas()]);

  const title = (en ? a.titleEn : null) || a.title;
  const summary = (en ? a.summaryEn : null) || a.summary;
  const description = (en ? a.descriptionEn : null) || a.description;
  const includes = en && a.includesEn.length ? a.includesEn : a.includes;
  const bring = en && a.bringEn.length ? a.bringEn : a.bring;
  const photos = [...new Set([a.coverPath, ...a.photos].map((p) => mediaUrl(p)).filter((x): x is string => Boolean(x)))];
  const cover = photos[0] ?? null;
  const adult = fromPrice(a, money);
  const child = a.priceAdult === null ? null : fromPrice({ priceAdult: a.priceChild ?? a.priceAdult }, money);
  const times = [...new Set(a.schedules.map((s) => s.time))].sort();
  const fee = (n: number) => (n > 0 ? formatPrice(fromPrice({ priceAdult: n }, money) ?? n, money.currency) : null);
  const pickupZones = a.pickupMode === "by_area" ? a.pickupAreas.map((p) => ({ area: p.areaName, fee: fee(p.fee) })) : [];
  const covered = new Set(a.pickupAreas.map((p) => p.areaId));
  const places: PickupPlace[] = a.pickupMode === "none"
    ? []
    : catalog.places.map((p) => ({ id: p.id, name: p.name, kind: p.kind, area: p.areaName, keywords: (p.aliases ?? []).join(" "), covered: !!p.areaId && covered.has(p.areaId) }));
  const childLo = Math.max(a.childMinAge, a.minAge ?? 0);
  const minAgeLabel = a.minAge != null ? (en ? `${a.minAge} years` : `${a.minAge} años`) : null;

  const facts: Array<{ key: string; icon: ReactNode; label: string; value: string }> = [
    ...(a.meetingPoint ? [{ key: "meet", icon: AI.pin(), label: en ? "Meeting point" : "Punto de salida", value: a.meetingPoint }] : []),
    ...(times.length ? [{ key: "time", icon: AI.clock(), label: en ? "Departures" : "Horarios", value: times.join(" · ") }] : []),
    ...(a.durationMinutes ? [{ key: "dur", icon: AI.hourglass(), label: en ? "Duration" : "Duración", value: minutesLabel(a.durationMinutes, en) }] : []),
    ...(a.difficulty ? [{ key: "dif", icon: AI.mountain(), label: en ? "Difficulty" : "Dificultad", value: DIFFICULTY[a.difficulty]?.[en ? "en" : "es"] ?? "" }] : []),
    ...(minAgeLabel ? [{ key: "age", icon: AI.age(), label: en ? "Minimum age" : "Edad mínima", value: minAgeLabel }] : []),
    {
      key: "pickup",
      icon: AI.car(),
      label: en ? "Pickup" : "Recogida",
      value: a.pickupMode === "included" ? (en ? "Included from your hotel" : "Incluida desde su hotel") : a.pickupMode === "by_area" ? (en ? "Optional, by area" : "Opcional, según la zona") : en ? "At the meeting point" : "En el punto de salida",
    },
  ];

  const body = paragraphs(description);
  const text = body.length ? body : summary ? [summary] : [];
  const tabs = [
    ...(text.length
      ? [{
          id: "desc",
          label: en ? "Description" : "Descripción",
          body: (
            <>
              <h2>{en ? "About this experience" : "Sobre la experiencia"}</h2>
              {text.map((p, i) => <p key={i}>{p}</p>)}
              {a.meetingPoint ? <p className="ac-callout">{AI.pin()}<span><b>{en ? "Meeting point" : "Punto de salida"}:</b> {a.meetingPoint}</span></p> : null}
            </>
          ),
        }]
      : []),
    ...(includes.length
      ? [{
          id: "inc",
          label: en ? "Included" : "Incluye",
          body: (
            <>
              <h2>{en ? "What is included" : "Qué incluye"}</h2>
              <ul className="ac-checks">{includes.map((x) => <li key={x}><span className="ac-checks__icon">{AI.checkCircle()}</span>{x}</li>)}</ul>
            </>
          ),
        }]
      : []),
    ...(bring.length
      ? [{
          id: "bring",
          label: en ? "What to bring" : "Qué llevar",
          body: (
            <>
              <h2>{en ? "What to bring" : "Qué llevar"}</h2>
              <ul className="ac-checks ac-checks--muted">{bring.map((x) => <li key={x}><span className="ac-checks__icon">{AI.bag()}</span>{x}</li>)}</ul>
            </>
          ),
        }]
      : []),
  ];

  const related = all
    .filter((x) => x.id !== a.id)
    .sort((x, y) => Number(y.areaId === a.areaId) - Number(x.areaId === a.areaId))
    .slice(0, 3);

  return (
    <main className="ac-page ac-detail">
      <section className="ac-hero ac-hero--detail" aria-label={title}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="ac-hero__img" src={cover} alt="" fetchPriority="high" />
        ) : (
          <div className="ac-hero__img ac-hero__img--plain" aria-hidden="true" />
        )}
        <div className="ac-hero__veil" aria-hidden="true" />
        <div className="ac-wrap ac-hero__bar">
          <Link href="/actividades" className="ac-back">{AI.arrowLeft()}{en ? "All activities" : "Todas las actividades"}</Link>
        </div>
        <svg className="ac-hero__wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 48c120-22 240-34 380-26s250 34 400 32 260-36 400-40 190 10 260 22v64H0Z" />
        </svg>
      </section>

      <section className="ac-overview">
        <div className="ac-wrap ac-overview__grid">
          <div className="ac-col ac-col--main">
            <div className="ac-ov-gallery">
              <Gallery photos={photos} title={title} locale={locale} />
            </div>
            <div className="ac-ov-facts">
              <ul className="ac-facts">
                {facts.map((f) => (
                  <li key={f.key}>
                    <span className="ac-facts__icon">{f.icon}</span>
                    <span><small>{f.label}</small>{f.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            {tabs.length ? <div className="ac-ov-tabs"><InfoTabs tabs={tabs} /></div> : null}
            <div className="ac-ov-rates">
              <div className="ac-rates">
                <h2 className="ac-rates__title">{en ? "Rates" : "Tarifas"}</h2>
                <table>
                  <thead>
                    <tr><th scope="col">{en ? "Guest" : "Persona"}</th><th scope="col">{en ? "Price per person" : "Precio por persona"}</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>{en ? "Adult" : "Adulto"}</td><td><b>{adult !== null ? formatPrice(adult, money.currency) : en ? "On request" : "A consultar"}</b></td></tr>
                    {childLo <= a.childMaxAge ? (
                      <tr><td>{en ? `Child (${childLo}–${a.childMaxAge} years)` : `Niño (${childLo}–${a.childMaxAge} años)`}</td><td><b>{child !== null ? formatPrice(child, money.currency) : en ? "On request" : "A consultar"}</b></td></tr>
                    ) : null}
                  </tbody>
                </table>
                {pickupZones.length ? (
                  <p className="ac-rates__fees">{AI.car()}<span><b>{en ? "Hotel pickup" : "Recogida en hotel"}:</b> {pickupZones.map((z) => `${z.area} ${z.fee ?? (en ? "included" : "incluida")}`).join(" · ")}</span></p>
                ) : null}
                <p className="ac-rates__note">{en ? "Final prices, taxes included." : "Precios finales, impuestos incluidos."}</p>
              </div>
            </div>
          </div>

          <div className="ac-col ac-col--side">
            <header className="ac-ov-head">
              <p className="ac-eyebrow ac-eyebrow--left">
                {a.areaName ? <span>{AI.pin()}{a.areaName}</span> : null}
                {a.category ? <span>{a.category}</span> : null}
              </p>
              <h1 className="ac-ov-head__title">{title}</h1>
              {summary && body.length ? <p className="ac-ov-head__lead">{summary}</p> : null}
            </header>
            <ActivityBooker
              locale={locale}
              currency={money.currency}
              today={todayISO(config.timezone)}
              places={places}
              pickupZones={pickupZones}
              fromLabel={adult !== null ? formatPrice(adult, money.currency) : null}
              editKey={edit && /^[a-z0-9]{4,64}$/i.test(edit) ? edit : null}
              activity={{
                id: a.id,
                title,
                childMinAge: a.childMinAge,
                childMaxAge: a.childMaxAge,
                minAge: a.minAge,
                minPax: a.minPax,
                maxPax: a.maxPax,
                bookingMode: a.bookingMode,
                pickupMode: a.pickupMode,
                meetingPoint: a.meetingPoint,
              }}
            />
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="ac-related">
          <div className="ac-wrap">
            <div className="ac-related__head">
              <p className="ac-eyebrow">{a.areaName && related[0]?.areaId === a.areaId ? (en ? `More in ${a.areaName}` : `Más en ${a.areaName}`) : en ? "More experiences" : "Más experiencias"}</p>
              <h2 className="ac-title ac-title--sm">{en ? <>Keep <em>exploring.</em></> : <>Siga <em>explorando.</em></>}</h2>
            </div>
            <ul className="ac-grid">
              {related.map((r, i) => <li key={r.id}><ActivityCard a={r} money={money} locale={locale} index={i} /></li>)}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
