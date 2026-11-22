import type { Metadata } from "next";
import { HeaderArt } from "../../../_components/deco";
import { notFound } from "next/navigation";
import { Icon } from "@altair/ui";
import { Closing } from "../../../_components/closing";
import { STARKNOT_URL } from "../../../_components/links";
import { Layered } from "../../../_components/layered";
import { Rich } from "../../../_components/rich";
import { OriginStory } from "../../../_components/origin";
import { dict, isLocale } from "../../../_i18n/copy";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? dict(locale).meta.pages.story : {};
}

export default async function StoryPage({ params }: Params) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict(locale);
  const s = t.history;
  return (
    <>
      <section className="h-hero compact has-art" aria-labelledby="story-title">
        <HeaderArt />
        <div className="h-wrap">
          <p className="h-kicker h-rise">{s.hero.kicker}</p>
          <h1 id="story-title" className="h-display h-rise" style={{ animationDelay: "60ms" }}>
            <Rich t={s.hero.title} />
          </h1>
          <p className="h-lede h-rise" style={{ animationDelay: "120ms" }}>{s.hero.lede}</p>
        </div>
        <div className="h-wrap h-hero-shot h-rise" style={{ animationDelay: "160ms" }}>
          <Layered
            wide
            back={{ src: "/media/shots/site-home.jpg", url: t.shots.siteHome.url, alt: t.shots.siteHome.alt }}
            front={{ src: "/media/shots/panel-bookings.jpg", url: t.shots.panelBookings.url, alt: t.shots.panelBookings.alt }}
            note={t.common.sampleNote}
          />
        </div>
      </section>

      <section className="h-sec" aria-label={s.hero.kicker}>
        <div className="h-wrap narrow">
          <OriginStory locale={locale} className="h-origin lg" />
        </div>
      </section>

      <section className="h-sec sand" aria-labelledby="story-principles">
        <div className="h-wrap">
          <div className="h-headrow">
            <div>
              <p className="h-kicker">{s.principles.kicker}</p>
              <h2 id="story-principles" className="h-h2"><Rich t={s.principles.title} /></h2>
            </div>
          </div>
          <ol className="h-steps3">
            {s.principles.items.map((p, i) => (
              <li key={p.t}>
                <span className="h-num">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="h-h3">{p.t}</h3>
                <p>{p.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="h-sec" aria-labelledby="story-next">
        <div className="h-wrap h-split">
          <div>
            <p className="h-kicker">{s.next.kicker}</p>
            <h2 id="story-next" className="h-h2"><Rich t={s.next.title} /></h2>
            <p className="h-lede">{s.next.text}</p>
          </div>
          <ul className="h-places">
            {s.next.places.map((p) => (
              <li key={p.t}>
                <b>{p.t}</b>
                <span>{p.d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="h-sec ink" aria-labelledby="story-starknot">
        <div className="h-wrap h-split">
          <div>
            <p className="h-kicker">{s.starknot.kicker}</p>
            <h2 id="story-starknot" className="h-h2"><Rich t={s.starknot.title} /></h2>
          </div>
          <div>
            <p className="h-lede">{s.starknot.text}</p>
            <div className="h-actions">
              <a className="h-arrow" href={STARKNOT_URL} target="_blank" rel="noopener">
                {s.starknot.link} <Icon name="external" size={15} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <Closing locale={locale} />
    </>
  );
}
