import Link from "next/link";
import { AltairLogo } from "@altair/ui";
import { dict, href, type Locale } from "../_i18n/copy";
import { STARKNOT_URL } from "./links";

/** The site footer: the wordmark, the pages, the language and "Altair by Starknot". No console link. */
export function HubFooter({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const pages = [
    { href: href(locale, "home"), label: t.nav.home },
    { href: href(locale, "how"), label: t.nav.how },
    { href: href(locale, "product"), label: t.nav.product },
    { href: href(locale, "claude"), label: t.nav.claude },
    { href: href(locale, "story"), label: t.nav.story },
  ];
  return (
    <footer className="h-foot">
      <div className="h-wrap">
        <div className="h-foot-top">
          <div className="h-foot-brand">
            <AltairLogo size={40} />
            <p>{t.footer.tagline}</p>
          </div>
          <div className="h-foot-col">
            <h2>{t.footer.site}</h2>
            <ul>
              {pages.map((p) => (
                <li key={p.href}><Link href={p.href}>{p.label}</Link></li>
              ))}
            </ul>
          </div>
          <div className="h-foot-col">
            <h2>{t.footer.start}</h2>
            <ul>
              <li><Link href={href(locale, "request")}>{t.common.request}</Link></li>
              <li><Link href={href(locale, "how", "#preguntas")}>{t.footer.faq}</Link></li>
            </ul>
          </div>
          <div className="h-foot-col">
            <h2>{t.footer.language}</h2>
            <ul>
              <li><Link href="/es" hrefLang="es" lang="es" aria-current={locale === "es" ? "true" : undefined}>Español</Link></li>
              <li><Link href="/en" hrefLang="en" lang="en" aria-current={locale === "en" ? "true" : undefined}>English</Link></li>
            </ul>
          </div>
        </div>
        <div className="h-foot-base">
          <span>© {new Date().getFullYear()} {t.footer.rights}</span>
          <span className="h-by">
            {t.footer.by}
            <a href={STARKNOT_URL} target="_blank" rel="noopener">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/starknot-logo.png" alt="" width={28} height={28} />
              Starknot
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
