import Link from "next/link";
import { locale as rootLocale } from "next/root-params";
import { Icon } from "@altair/ui";
import { Rich } from "../../_components/rich";
import { dict, href, isLocale } from "../../_i18n/copy";

export default async function NotFound() {
  const raw = await rootLocale();
  const locale = isLocale(raw) ? raw : "es";
  const t = dict(locale);
  return (
    <section className="h-sec h-notfound">
      <div className="h-wrap narrow">
        <p className="h-kicker">{t.notFound.kicker}</p>
        <h1 className="h-display sm"><Rich t={t.notFound.title} /></h1>
        <p className="h-lede">{t.notFound.text}</p>
        <div className="h-actions">
          <Link className="btn tint lg" href={href(locale, "home")}>{t.notFound.home}</Link>
          <Link className="h-arrow" href={href(locale, "request")}>{t.common.request} <Icon name="arrowRight" size={16} /></Link>
        </div>
      </div>
    </section>
  );
}
