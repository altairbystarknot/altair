import type { Metadata } from "next";
import { HeaderArt } from "../../../_components/deco";
import { notFound } from "next/navigation";
import { Closing } from "../../../_components/closing";
import { Rich } from "../../../_components/rich";
import { dict, isLocale } from "../../../_i18n/copy";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? dict(locale).meta.pages.how : {};
}

export default async function HowItWorks({ params }: Params) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict(locale);
  const h = t.how;
  return (
    <>
      <section className="h-hero compact has-art" aria-labelledby="how-title">
        <HeaderArt />
        <div className="h-wrap">
          <p className="h-kicker h-rise">{h.hero.kicker}</p>
          <h1 id="how-title" className="h-display h-rise" style={{ animationDelay: "60ms" }}>
            <Rich t={h.hero.title} />
          </h1>
          <p className="h-lede h-rise" style={{ animationDelay: "120ms" }}>{h.hero.lede}</p>
        </div>
      </section>

      <section className="h-sec flush-top" aria-label={h.hero.kicker}>
        <div className="h-wrap">
          <ol className="h-timeline">
            {h.steps.map((s, i) => (
              <li key={s.t}>
                <span className="h-timeline-n">{String(i + 1).padStart(2, "0")}</span>
                <div className="h-timeline-body">
                  <h2 className="h-h3 lg">{s.t}</h2>
                  <p>{s.d}</p>
                  <p className="h-meta">{s.meta}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="h-sec sand" aria-labelledby="how-need">
        <div className="h-wrap h-split">
          <div>
            <p className="h-kicker">{h.need.kicker}</p>
            <h2 id="how-need" className="h-h2"><Rich t={h.need.title} /></h2>
          </div>
          <ul className="h-grid2">
            {h.need.items.map((n) => (
              <li key={n.t}>
                <h3 className="h-h3">{n.t}</h3>
                <p>{n.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="preguntas" className="h-sec h-anchor" aria-labelledby="how-faq">
        <div className="h-wrap h-split">
          <div>
            <p className="h-kicker">{h.faq.kicker}</p>
            <h2 id="how-faq" className="h-h2"><Rich t={h.faq.title} /></h2>
          </div>
          <div className="h-faq">
            {h.faq.items.map((f, i) => (
              <details key={f.t} open={i === 0}>
                <summary>{f.t}</summary>
                <p>{f.d}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Closing locale={locale} />
    </>
  );
}
