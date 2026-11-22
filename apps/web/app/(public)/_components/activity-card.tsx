import type { CSSProperties } from "react";
import Link from "next/link";
import { formatPrice } from "@altair/core";
import { fromPrice, type MoneyRules } from "@altair/engine";
import { mediaUrl } from "@/lib/media";
import type { PublicActivity } from "@/lib/public/catalog";
import { AI } from "../actividades/_ui/icons";

export const DIFFICULTY: Record<string, { es: string; en: string }> = {
  easy: { es: "Fácil", en: "Easy" },
  moderate: { es: "Moderada", en: "Moderate" },
  hard: { es: "Exigente", en: "Challenging" },
};

export function minutesLabel(m: number, en: boolean): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return en ? `${h} h${r ? ` ${r} min` : ""}` : `${h} h${r ? ` ${r} min` : ""}`;
}

/** One activity as a white card: photo with its badge, title, up to three facts, the "from" price and the link. */
export function ActivityCard({ a, money, locale, index = 0 }: { a: PublicActivity; money: MoneyRules; locale: string; index?: number }) {
  const en = locale === "en";
  const img = mediaUrl(a.coverPath ?? a.photos[0]);
  const price = fromPrice(a, money);
  const title = (en ? a.titleEn : null) || a.title;
  const times = [...new Set(a.schedules.map((s) => s.time))].sort();
  const facts = [
    a.areaName ? { key: "area", icon: AI.pin(), label: en ? "Area" : "Zona", value: a.areaName } : null,
    a.durationMinutes ? { key: "dur", icon: AI.hourglass(), label: en ? "Duration" : "Duración", value: minutesLabel(a.durationMinutes, en) } : null,
    a.difficulty ? { key: "dif", icon: AI.mountain(), label: en ? "Difficulty" : "Dificultad", value: DIFFICULTY[a.difficulty]?.[en ? "en" : "es"] ?? "" } : null,
    times.length ? { key: "time", icon: AI.clock(), label: en ? "Departures" : "Salidas", value: times.join(" · ") } : null,
  ]
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .slice(0, 3);
  const badge = a.category || (a.bookingMode === "request" ? (en ? "On request" : "Bajo solicitud") : null);

  return (
    <article className="ac-card" style={{ "--i": index } as CSSProperties}>
      <div className="ac-card__media">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="ac-card__noimg" aria-hidden="true">{AI.compass()}</span>
        )}
        {badge ? <span className="ac-card__badge">{badge}</span> : null}
      </div>
      <div className="ac-card__body">
        <h3 className="ac-card__title">{title}</h3>
        {facts.length ? (
          <ul className="ac-card__facts">
            {facts.map((f) => (
              <li key={f.key}>
                <span className="ac-card__icon">{f.icon}</span>
                <span>{f.label}: {f.value}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="ac-card__foot">
          <p className="ac-card__price">
            {price !== null ? (
              <>
                <span className="ac-card__figure">{en ? "From" : "Desde"} {formatPrice(price, money.currency)}</span>
                <span className="ac-card__unit">/ {en ? "per person" : "por persona"}</span>
              </>
            ) : (
              <span className="ac-card__figure">{en ? "Price on request" : "Precio a consultar"}</span>
            )}
          </p>
          <Link href={`/actividades/${a.slug}`} className="ac-card__cta">
            {en ? "See details" : "Ver detalles"}
            <span className="sr-only"> · {title}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
