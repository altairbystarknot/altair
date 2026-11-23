import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../../globals.css";
import { fontClasses } from "../../fonts";
import { HubFooter } from "../../_components/site-footer";
import { HubNav } from "../../_components/nav";
import { LITE_URL } from "../../_components/demo-button";
import { Ambient } from "../../_components/fx/ambient";
import { SmoothScroll } from "../../_components/fx/smooth-scroll";
import { dict, href, isLocale, LOCALES } from "../../_i18n/copy";

// ROOT LAYOUT OF ALTAIR'S PUBLIC SITE, one per language (/es, /en), so <html lang> is right on every page.
// The Starknot console has its own root layout (app/consola/layout.tsx). proxy.ts sends "/" and the old
// unprefixed paths to the visitor's language.

type Params = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = dict(locale);
  return {
    title: { default: t.meta.title, template: "%s · Altair by Starknot" },
    description: t.meta.description,
    openGraph: { siteName: "Altair by Starknot", locale: locale === "es" ? "es_419" : "en_US", type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#fbfaf8", colorScheme: "light", width: "device-width", initialScale: 1 };

export default async function SiteLayout({ children, params }: Params & { children: ReactNode }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict(locale);
  return (
    <html lang={locale} className={fontClasses}>
      <body className="al h-site h-v">
        <a href="#main" className="h-skip">{t.nav.skip}</a>
        <HubNav
          locale={locale}
          homeHref={href(locale, "home")}
          homeText={t.nav.home}
          homeLabel={t.nav.homeLabel}
          mainLabel={t.nav.main}
          menuLabel={t.nav.menu}
          langLabel={t.nav.language}
          links={[
            { href: href(locale, "how"), label: t.nav.how },
            { href: href(locale, "product"), label: t.nav.product },
            { href: href(locale, "claude"), label: t.nav.claude },
            { href: href(locale, "story"), label: t.nav.story },
          ]}
          cta={{ href: href(locale, "request"), label: t.nav.cta }}
          demo={{ href: LITE_URL, label: t.demo.nav, short: t.demo.navShort, full: t.demo.cta, aria: t.demo.label }}
        />
        <main id="main">{children}</main>
        <HubFooter locale={locale} />
        <SmoothScroll />
        <Ambient />
      </body>
    </html>
  );
}
