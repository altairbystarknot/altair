import Link from "next/link";
import { Icon } from "@altair/ui";
import { dict, href, type Locale } from "../_i18n/copy";
import { Rich } from "./rich";
import { Star } from "./star";

/** The closing call to action every page ends with: one calm panel. */
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
      </div>
    </section>
  );
}
