"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { AltairLogo, Icon } from "@altair/ui";

type NavLink = { href: string; label: string };

export type NavProps = {
  locale: "es" | "en";
  homeHref: string;
  homeText: string;
  homeLabel: string;
  mainLabel: string;
  menuLabel: string;
  langLabel: string;
  links: NavLink[];
  cta: NavLink;
  /** The free demo (Altair Lite), always visible beside the request button. */
  demo: NavLink & { short: string; full: string; aria: string };
};

const LANGS = [
  { code: "es", short: "ES", name: "Español" },
  { code: "en", short: "EN", name: "English" },
] as const;

/** The language switch: the same page in the other language. */
function LangSwitch({ locale, path, label }: { locale: string; path: string; label: string }) {
  const swap = (code: string) => (/^\/(es|en)(?=\/|$)/.test(path) ? path.replace(/^\/(es|en)(?=\/|$)/, `/${code}`) : `/${code}`);
  return (
    <div className="h-lang" role="group" aria-label={label}>
      {LANGS.map((l) => (
        <Link
          key={l.code}
          href={swap(l.code)}
          hrefLang={l.code}
          lang={l.code}
          aria-label={l.name}
          aria-current={l.code === locale ? "true" : undefined}
          scroll={false}
        >
          {l.short}
        </Link>
      ))}
    </div>
  );
}

/** Floating Liquid Glass navigation: links on desktop, a menu on phones, language switch on both. */
export function HubNav({ locale, homeHref, homeText, homeLabel, mainLabel, menuLabel, langLabel, links, cta, demo }: NavProps) {
  const path = usePathname() ?? homeHref;
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [path]);
  const on = (href: string) => path === href || path.startsWith(`${href}/`);
  return (
    <header className="h-navwrap">
      <nav className="h-nav glass" aria-label={mainLabel}>
        <Link href={homeHref} className="h-brand" aria-label={homeLabel}>
          <AltairLogo size={28} />
        </Link>
        <div className="h-links">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={on(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="h-navend">
          <LangSwitch locale={locale} path={path} label={langLabel} />
          <a className="h-demopill" href={demo.href} target="_blank" rel="noopener noreferrer" aria-label={demo.aria}>
            <span className="h-demodot" aria-hidden="true" />
            <span className="h-demopill-long">{demo.label}</span>
            <span className="h-demopill-short" aria-hidden="true">{demo.short}</span>
          </a>
          <Link className="btn tint sm h-navcta" href={cta.href} aria-current={on(cta.href) ? "page" : undefined}>
            {cta.label}
          </Link>
          <details className="h-menu" ref={menu}>
            <summary aria-label={menuLabel}>
              <Icon name="menu" size={20} />
            </summary>
            <div className="h-menupanel glass">
              <Link href={homeHref} aria-current={path === homeHref ? "page" : undefined}>
                {homeText}
              </Link>
              {links.map((l) => (
                <Link key={l.href} href={l.href} aria-current={on(l.href) ? "page" : undefined}>
                  {l.label}
                </Link>
              ))}
              <Link className="btn tint" href={cta.href}>
                {cta.label}
              </Link>
              <a className="h-demobtn h-menudemo" href={demo.href} target="_blank" rel="noopener noreferrer" aria-label={demo.aria}>
                <span className="h-demodot" aria-hidden="true" />
                <span className="h-demobtn-txt"><b>{demo.full}</b></span>
                <Icon name="arrowRight" size={16} />
              </a>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
