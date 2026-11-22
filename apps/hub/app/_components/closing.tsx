import Link from "next/link";
import { Icon } from "@altair/ui";
import { dict, href, type Locale } from "../_i18n/copy";
import { Rich } from "./rich";
import { Star } from "./star";

/**
 * What Altair is today, said plainly: an experimental product from the hackathon. Serious operations are
 * sent to Starknot's own contact page to book a free discovery session for custom software.
 */
export function ExperimentalNotice({ locale }: { locale: Locale }) {
  const e = dict(locale).experimental;
  return (
    <aside className="h-exp" aria-labelledby="h-exp-title" data-reveal>
      <div className="h-exp-a">
        <p className="h-kicker"><span className="h-exp-dot" aria-hidden="true" />{e.kicker}</p>
        <h2 id="h-exp-title" className="h-h3"><Rich t={e.title} /></h2>
        <p>{e.text}</p>
      </div>
      <div className="h-exp-b">
        <h3 className="h-h3">{e.customTitle}</h3>
        <p>{e.customText}</p>
        <a className="btn tint" href={e.url} target="_blank" rel="noopener noreferrer">
          {e.cta} <Icon name="arrowRight" size={16} />
        </a>
        <small>{e.note}</small>
      </div>
    </aside>
  );
}

/** The closing call to action every page ends with: one calm panel, then the experimental notice. */
export function Closing({ locale }: { locale: Locale }) {
  const t = dict(locale);
  return (
    <section className="h-sec h-closing" aria-labelledby="h-closing-title">
      <div className="h-wrap">
        <div className="h-closing-pane" data-reveal>
          <i className="h-closing-tile a" aria-hidden="true" />
          <i className="h-closing-tile b" aria-hidden="true" />
          <i className="h-closing-orb" aria-hidden="true" />
          <Star size={22} className="h-closing-star" />
          <h2 id="h-closing-title" className="h-h2"><Rich t={t.closing.title} /></h2>
          <p className="h-lede">{t.closing.text}</p>
          <div className="h-actions center">
            <Link className="btn tint lg" href={href(locale, "request")}>
              {t.common.request} <Icon name="arrowRight" size={18} />
            </Link>
          </div>
        </div>
        <ExperimentalNotice locale={locale} />
      </div>
    </section>
  );
}
