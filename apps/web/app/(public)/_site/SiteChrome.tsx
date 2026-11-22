"use client";

/* eslint-disable @next/next/no-img-element -- the business's logo comes from its own storage, already sized */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useCart } from "@/lib/public/cart-store";
import type { PricedItem } from "@/lib/public/cart-types";
import { GlassButton } from "./ui/Glass";
import { GlassMenu, MenuProvider, MenuToggle, type MenuGroup } from "./ui/Menu";
import { MailIcon, PinIcon, WhatsAppIcon } from "./ui/icons";
import { cx } from "./ui/utils";

export type NavLink = { label: string; href: string };
export type ChromeCopy = {
  nav: string; menu: string; close: string; menuLabel: string; explore: string; book: string; bookNow: string; language: string;
  cart: { heading: string; empty: string; details: string; keep: string; total: string; estimated: string; open: string; loading: string; whatsapp: string };
};

/** The business's logo in the bar (or its name, set in the template's serif, when it has no logo). */
function Brand({ name, logoUrl, href }: { name: string; logoUrl: string | null; href: string }) {
  return (
    <Link className="lg-brand" href={href} aria-label={name}>
      {logoUrl ? <img className="lg-brand__logo" src={logoUrl} alt="" /> : <span className="lg-wordmark__name lg-brand__text">{name}</span>}
    </Link>
  );
}

/**
 * The bar: MENU + left links — the logo home — right links, the booking bag and the gold Book button. It is
 * transparent over a page's opening photograph and turns to glass once that photograph has scrolled away.
 */
export function SiteHeader({ name, logoUrl, left, right, groups, locales, locale, t }: {
  name: string; logoUrl: string | null; left: NavLink[]; right: NavLink[]; groups: MenuGroup[]; locales: string[]; locale: "es" | "en"; t: ChromeCopy;
}) {
  const marker = useRef<HTMLElement>(null);
  const path = usePathname();
  useEffect(() => {
    const header = marker.current;
    const nav = header?.querySelector<HTMLElement>(".lg-nav");
    if (!header || !nav) return;
    const set = (solid: boolean) => { nav.classList.toggle("lg-nav--glass", solid); header.classList.toggle("is-solid", solid); };
    const hero = document.querySelector<HTMLElement>("[data-sticky-sentinel]");
    if (!hero) { set(true); return; }
    set(false);
    const io = new IntersectionObserver(([entry]) => set(!entry?.isIntersecting), { rootMargin: `-${Math.round(nav.offsetHeight)}px 0px 0px 0px` });
    io.observe(hero);
    return () => io.disconnect();
  }, [path]);
  const item = (l: NavLink) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>;
  return (
    <MenuProvider>
      <header ref={marker} className={path === "/" ? "site-header site-header--home" : "site-header"}>
        <nav className="lg-nav lg-nav--static" aria-label={t.nav}>
          <div className="lg-nav__start">
            <MenuToggle menuLabel={t.menu} closeLabel={t.close} />
            <ul className="lg-nav__links lg-nav__links--start">{left.map(item)}</ul>
          </div>
          <Brand name={name} logoUrl={logoUrl} href="/" />
          <div className="lg-nav__end">
            <ul className="lg-nav__links">{right.map(item)}</ul>
            <NavCart label={t.cart.open} />
            <GlassButton href="/reservar" tone="gold" size="sm">{t.bookNow}</GlassButton>
          </div>
        </nav>
        <GlassMenu groups={groups} label={t.menuLabel} ctaLabel={t.bookNow} ctaHref="/reservar" className="lg-menu--bar"
          footer={locales.length > 1 ? <LanguageSwitch locale={locale} label={t.language} variant="group" /> : undefined} />
      </header>
    </MenuProvider>
  );
}

/** The two languages as one pill (Español | English): the current one filled, the other a switch. */
export function LanguageSwitch({ locale, label, variant = "nav", className }: { locale: "es" | "en"; label: string; variant?: "nav" | "group"; className?: string }) {
  const router = useRouter();
  const set = (l: "es" | "en") => { document.cookie = `altair_lang=${l}; path=/; max-age=31536000; samesite=lax`; router.refresh(); };
  const opt = (l: "es" | "en", text: string) => (
    <li key={l}>
      {l === locale
        ? <span className="site-lang__opt is-current" aria-current="true" lang={l}>{text}</span>
        : <button type="button" className="site-lang__opt" lang={l} onClick={() => set(l)}>{text}</button>}
    </li>
  );
  const list = <ul className="site-lang__list">{[opt("es", "Español"), opt("en", "English")]}</ul>;
  return variant === "nav" ? <nav className={cx("site-lang", className)} aria-label={label}>{list}</nav> : <div className={cx("site-lang", className)} role="group" aria-label={label}>{list}</div>;
}

function BagGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 4h2l2.4 10.4a1.5 1.5 0 0 0 1.5 1.1h7.6a1.5 1.5 0 0 0 1.5-1.2L20 7H6" />
      <circle cx="9.5" cy="19" r="1.4" />
      <circle cx="17" cy="19" r="1.4" />
    </svg>
  );
}

/** The bag in the bar (wide screens): opens the same summary as the floating button. */
function NavCart({ label }: { label: string }) {
  const items = useCart();
  if (items.length === 0) return null;
  return (
    <button type="button" className="lg-navcart" aria-label={label.replace("{n}", String(items.length))} onClick={() => window.dispatchEvent(new Event("altair-cart-open"))}>
      <BagGlyph />
      <span className="lg-navcart__count" aria-hidden="true">{items.length}</span>
    </button>
  );
}

type Quote = { currency: string; items: PricedItem[]; total: number; hasQuote: boolean };

/**
 * Bottom-right corner: WhatsApp, and above it, once the visitor has added something, the booking bag. A tap
 * opens a summary of everything in the booking (priced again by the server) with "Continue to your details".
 */
export function FloatingActions({ locale, whatsappHref, t }: { locale: "es" | "en"; whatsappHref: string | null; t: ChromeCopy["cart"] }) {
  const items = useCart();
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener("altair-cart-open", on);
    return () => window.removeEventListener("altair-cart-open", on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node) && !(e.target as Element).closest?.(".lg-navcart")) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [open]);
  const key = JSON.stringify(items);
  useEffect(() => {
    if (!open || items.length === 0) return;
    const ctrl = new AbortController();
    fetch("/api/public/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, locale }), signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null)).then((q: Quote | null) => q && setQuote(q)).catch(() => undefined);
    return () => ctrl.abort();
  }, [open, key, locale]); // eslint-disable-line react-hooks/exhaustive-deps -- keyed on the cart contents
  const money = (n: number) => new Intl.NumberFormat(locale === "es" ? "es-CR" : "en-US", { style: "currency", currency: quote?.currency ?? "USD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);
  const shortDate = (s: string) => {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? new Intl.DateTimeFormat(locale === "es" ? "es" : "en-US", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!))) : s;
  };
  return (
    <>
      {items.length > 0 && (
        <div ref={root} className="lg-cart">
          {open && (
            <div id={panelId} className="lg-cart__panel" role="dialog" aria-label={t.heading}>
              <p className="lg-cart__heading">{t.heading}</p>
              {!quote ? <p className="lg-cart__meta">{t.loading}</p> : (
                <ul className="lg-cart__list">
                  {quote.items.map((it) => (
                    <li key={it.key} className="lg-cart__leg">
                      <span className="lg-cart__route">{it.title}</span>
                      <span className="lg-cart__meta">{[shortDate(it.date), it.time, it.total === null ? null : money(it.total)].filter(Boolean).join(" · ")}</span>
                    </li>
                  ))}
                </ul>
              )}
              {quote && <p className="lg-cart__total"><span>{quote.hasQuote ? t.estimated : t.total}</span><strong>{money(quote.total)}</strong></p>}
              <Link href="/carrito" className="lg-cart__resume" onClick={() => setOpen(false)}>{t.details}</Link>
              <button type="button" className="lg-cart__home" onClick={() => setOpen(false)}>{t.keep}</button>
            </div>
          )}
          <button type="button" className="lg-cart__button" aria-expanded={open} aria-controls={panelId} aria-label={t.open.replace("{n}", String(items.length))} onClick={() => setOpen((o) => !o)}>
            <BagGlyph />
            <span className="lg-cart__count" aria-hidden="true">{items.length}</span>
          </button>
        </div>
      )}
      {whatsappHref && (
        <a className="lg-wa-float" href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label={t.whatsapp}>
          <WhatsAppIcon />
        </a>
      )}
    </>
  );
}

export type FooterColumn = { heading: string; links: NavLink[] };

/** The footer: light panel (logo, line, Book, link columns, contact, credit) and a dark legal bar. */
export function SiteFooter({ name, logoUrl, tagline, columns, contactHeading, whatsapp, whatsappLabel, email, region, bookLabel, copyright, credit, locales, locale, languageLabel }: {
  name: string; logoUrl: string | null; tagline: string; columns: FooterColumn[]; contactHeading: string; whatsapp: string | null; whatsappLabel: string;
  email: string | null; region: string | null; bookLabel: string; copyright: string; credit: ReactNode; locales: string[]; locale: "es" | "en"; languageLabel: string;
}) {
  return (
    <footer className="lg-footer site-footer--plain">
      <div className="lg-footer__top">
        <div className="lg-container">
          <div className="lg-footer__grid">
            <div className="lg-footer__brand">
              {logoUrl ? <img className="lg-footer__logo" src={logoUrl} alt={name} /> : <p className="lg-footer__name">{name}</p>}
              <p className="lg-footer__tagline">{tagline}</p>
              <div><GlassButton href="/reservar" tone="ocean" size="sm">{bookLabel}</GlassButton></div>
            </div>
            {columns.map((col) => (
              <nav className="lg-footer__col" key={col.heading} aria-label={col.heading}>
                <h2 className="lg-footer__heading">{col.heading}</h2>
                <ul className="lg-footer__links">{col.links.map((l) => <li key={l.href + l.label}><Link href={l.href}>{l.label}</Link></li>)}</ul>
              </nav>
            ))}
            <div className="lg-footer__col">
              <h2 className="lg-footer__heading">{contactHeading}</h2>
              <div className="lg-footer__contact">
                {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer"><WhatsAppIcon />{whatsappLabel}</a>}
                {email && <a href={`mailto:${email}`}><MailIcon />{email}</a>}
                {region && <span><PinIcon />{region}</span>}
              </div>
            </div>
          </div>
          {locales.length > 1 && <LanguageSwitch locale={locale} label={languageLabel} className="site-lang--footer" />}
        </div>
      </div>
      <div className="lg-footer__bar site-footer__bar--solid">
        <div className="lg-container">
          <div className="lg-footer__bar-inner">
            <span>{copyright}</span>
            <span className="site-footer__credit">{credit}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
