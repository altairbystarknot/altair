import type { Metadata } from "next";
import { HeaderArt } from "../../../_components/deco";
import { notFound } from "next/navigation";
import { Closing } from "../../../_components/closing";
import { Rich } from "../../../_components/rich";
import { Shot } from "../../../_components/shot";
import { dict, isLocale } from "../../../_i18n/copy";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? dict(locale).meta.pages.product : {};
}

export default async function ProductPage({ params }: Params) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict(locale);
  const p = t.product;
  const s = t.shots;
  const note = t.common.sampleNote;
  return (
    <>
      <section className="h-hero compact has-art" aria-labelledby="product-title">
        <HeaderArt />
        <div className="h-wrap">
          <p className="h-kicker h-rise">{p.hero.kicker}</p>
          <h1 id="product-title" className="h-display h-rise" style={{ animationDelay: "60ms" }}>
            <Rich t={p.hero.title} />
          </h1>
          <p className="h-lede h-rise" style={{ animationDelay: "120ms" }}>{p.hero.lede}</p>
        </div>
        <div className="h-wrap h-hero-shot h-rise" style={{ animationDelay: "160ms" }}>
          <Shot src="/media/shots/site-home.jpg" alt={s.siteHome.alt} url={s.siteHome.url} caption={s.siteHome.caption} note={note} priority />
        </div>
      </section>

      <section className="h-sec" aria-labelledby="product-site">
        <div className="h-wrap">
          <div className="h-headrow">
            <div>
              <p className="h-kicker">{p.site.kicker}</p>
              <h2 id="product-site" className="h-h2"><Rich t={p.site.title} /></h2>
            </div>
            <div>
              <p className="h-lede">{p.site.text}</p>
              <ul className="h-ticks">
                {p.site.points.map((x) => <li key={x}>{x}</li>)}
              </ul>
            </div>
          </div>
          <div className="h-shots2">
            <Shot src="/media/shots/transfer.jpg" alt={s.transfer.alt} url={s.transfer.url} caption={s.transfer.caption} note={note} sizes="(max-width: 900px) 100vw, 600px" />
            <Shot src="/media/shots/activity.jpg" alt={s.activity.alt} url={s.activity.url} caption={s.activity.caption} note={note} sizes="(max-width: 900px) 100vw, 600px" />
          </div>
        </div>
      </section>

      <section className="h-sec sand h-bleedsec" aria-labelledby="product-cart">
        <div className="h-wrap h-bleed flip">
          <div className="h-bleed-copy">
            <h2 id="product-cart" className="h-h2"><Rich t={p.cart.title} /></h2>
            <p className="h-lede">{p.cart.text}</p>
          </div>
          <Shot className="h-bleed-shot" src="/media/shots/cart.jpg" alt={s.cart.alt} url={s.cart.url} caption={s.cart.caption} note={note} sizes="(max-width: 900px) 100vw, 900px" />
        </div>
      </section>

      <section className="h-sec" aria-labelledby="product-pricing">
        <div className="h-wrap">
          <div className="h-headrow">
            <div>
              <p className="h-kicker">{p.pricing.kicker}</p>
              <h2 id="product-pricing" className="h-h2"><Rich t={p.pricing.title} /></h2>
            </div>
            <p className="h-lede">{p.pricing.text}</p>
          </div>
          <div className="h-engines">
            {p.pricing.engines.map((e, i) => (
              <div key={e.t}>
                <p className="h-num">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="h-engine-t">{e.t}</h3>
                <ul className="h-ruled">
                  {e.items.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="h-sec sand" aria-labelledby="product-panel">
        <div className="h-wrap">
          <div className="h-headrow">
            <div>
              <p className="h-kicker">{p.panel.kicker}</p>
              <h2 id="product-panel" className="h-h2"><Rich t={p.panel.title} /></h2>
            </div>
            <p className="h-lede">{p.panel.text}</p>
          </div>
          <div className="h-shots2 lead">
            <Shot src="/media/shots/panel-bookings.jpg" alt={s.panelBookings.alt} url={s.panelBookings.url} caption={s.panelBookings.caption} note={note} sizes="(max-width: 900px) 100vw, 760px" />
            <Shot src="/media/shots/panel-catalog.jpg" alt={s.panelCatalog.alt} url={s.panelCatalog.url} caption={s.panelCatalog.caption} note={note} sizes="(max-width: 900px) 100vw, 480px" />
          </div>
          <ul className="h-modules">
            {p.panel.modules.map((m) => (
              <li key={m.t}>
                <b>{m.t}</b>
                <span>{m.d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="h-sec ink" aria-labelledby="product-security">
        <div className="h-wrap">
          <div className="h-headrow">
            <div>
              <p className="h-kicker">{p.security.kicker}</p>
              <h2 id="product-security" className="h-h2"><Rich t={p.security.title} /></h2>
            </div>
          </div>
          <ul className="h-grid4">
            {p.security.items.map((x) => (
              <li key={x.t}>
                <h3 className="h-h3">{x.t}</h3>
                <p>{x.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Closing locale={locale} />
    </>
  );
}
