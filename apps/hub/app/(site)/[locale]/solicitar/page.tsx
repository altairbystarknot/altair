import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@altair/ui";
import { Rich } from "../../../_components/rich";
import { Star } from "../../../_components/star";
import { dict, href, isLocale } from "../../../_i18n/copy";
import { RequestForm } from "./request-form";

type Params = { params: Promise<{ locale: string }>; searchParams: Promise<{ enviada?: string }> };

export async function generateMetadata({ params }: Pick<Params, "params">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? dict(locale).meta.pages.request : {};
}

export default async function RequestPage({ params, searchParams }: Params) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { enviada } = await searchParams;
  const t = dict(locale);
  const r = t.request;
  return (
    <section className="h-sec h-reqsec" aria-labelledby="request-title">
      <div className="h-wrap h-reqgrid">
        <div className="h-reqintro h-rise">
          <p className="h-kicker">{r.kicker}</p>
          <h1 id="request-title" className="h-display sm"><Rich t={r.title} /></h1>
          <p className="h-lede">{r.lede}</p>
          <h2 className="h-reqnext-title">{r.nextTitle}</h2>
          <ol className="h-reqnext">
            {r.next.map((n, i) => (
              <li key={n.t}>
                <span className="h-num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <b>{n.t}</b>
                  <span>{n.d}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="h-formcard h-rise" style={{ animationDelay: "100ms" }}>
          {enviada ? (
            <div className="h-done" role="status">
              <Star size={26} className="h-closing-star" />
              <p className="h-kicker">{r.done.kicker}</p>
              <h2 className="h-h2"><Rich t={r.done.title} /></h2>
              <p className="h-lede">{r.done.text}</p>
              <div className="h-actions">
                <Link className="btn tint" href={href(locale, "how")}>
                  {r.done.next} <Icon name="arrowRight" size={16} />
                </Link>
                <Link className="h-arrow" href={href(locale, "home")}>{r.done.home}</Link>
              </div>
            </div>
          ) : (
            <RequestForm locale={locale} copy={r.form} optional={t.common.optional} />
          )}
        </div>
      </div>
    </section>
  );
}
