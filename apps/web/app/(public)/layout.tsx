import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { themeCssVars } from "@altair/config";
import { AltairLogo, Icon } from "@altair/ui";
import { requireStaff } from "@/lib/auth/staff";
import { getPublicConfig } from "@/lib/config/business-config";
import { mediaUrl } from "@/lib/media";
import { getLocale } from "@/lib/public/locale";
import { createServerSupabase } from "@/lib/supabase/server";
import { FloatingActions, SiteFooter, SiteHeader, type ChromeCopy } from "./_site/SiteChrome";
import { HideOnBooking } from "./_components/hide-on-booking";
import { siteNav } from "./_site/nav";

// The business's public site: its colors, logo, photos and words over the Altair site template. Until the
// owner publishes it, visitors see "coming soon" and signed-in staff see a preview.

const STARKNOT_URL = "https://www.starknot.co/en";

function waHref(phone: string | null, text: string): string | null {
  const d = (phone ?? "").replace(/\D/g, "");
  return d.length >= 7 ? `https://wa.me/${d}?text=${encodeURIComponent(text)}` : null;
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const result = await getPublicConfig();
  const locale = await getLocale();
  const en = locale === "en";

  if (result.source === "unavailable") {
    return (
      <main className="site" style={{ display: "grid", placeItems: "center", padding: 16 }}>
        <div className="s-glass-light" style={{ width: "min(100%, 460px)", borderRadius: 32, padding: 28 }}>
          <h1 className="s-title sm" style={{ marginTop: 0 }}>{en ? "Back in a moment" : "Volvemos en un momento"}</h1>
          <p className="s-lead">{en ? "We are doing maintenance. Please contact us through our usual channels." : "Estamos haciendo mantenimiento. Escríbanos por nuestros canales habituales."}</p>
        </div>
      </main>
    );
  }

  const { config, site, published } = result;
  const vars = themeCssVars(config.theme.preset, config.theme) as CSSProperties;
  const logo = mediaUrl(site.logoPath);
  const hero = mediaUrl(site.heroPath);

  let preview = false;
  if (!published) {
    try {
      preview = (await requireStaff(await createServerSupabase())) !== null;
    } catch {
      preview = false;
    }
    if (!preview) {
      return (
        <main className="be-page lg-root" data-font={site.font} style={vars}>
          <div className="be-backdrop" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero || "/stock/hero.jpg"} alt="" />
            <div className="be-backdrop__veil" />
          </div>
          <div className="be-done be-soon" role="status">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="be-soon__logo" />
            ) : null}
            <p className="be-eyebrow">{en ? "Coming soon" : "Muy pronto"}</p>
            <h1 className="be-title">{config.name}</h1>
            <p>{en ? "We are getting our booking site ready. Thank you for your patience." : "Estamos preparando nuestro sitio de reservas. Gracias por su paciencia."}</p>
          </div>
        </main>
      );
    }
  }

  const t: ChromeCopy = en
    ? { nav: "Main", menu: "Menu", close: "Close", menuLabel: "Site menu", explore: "Explore", book: "Book", bookNow: "Book now", language: "Language",
        cart: { heading: "Your booking", empty: "Your booking is empty.", details: "Continue to your details", keep: "Keep browsing", total: "Total", estimated: "Estimated total", open: "Your booking ({n})", loading: "Working out prices…", whatsapp: "Message us on WhatsApp (opens in a new tab)" } }
    : { nav: "Principal", menu: "Menú", close: "Cerrar", menuLabel: "Menú del sitio", explore: "Explorar", book: "Reservar", bookNow: "Reservar", language: "Idioma",
        cart: { heading: "Su reserva", empty: "Su reserva está vacía.", details: "Continuar a sus datos", keep: "Seguir explorando", total: "Total", estimated: "Total estimado", open: "Su reserva ({n})", loading: "Calculando precios…", whatsapp: "Escríbanos por WhatsApp (se abre en otra pestaña)" } };
  const nav = siteNav(config.features, en);
  const L = nav.labels;
  const left = nav.left;
  const right = nav.right;
  const groups = nav.groups;
  const wa = waHref(config.contactWhatsapp, en ? `Hi ${config.name}!` : `¡Hola ${config.name}!`);
  const offered = config.locales.filter((l) => l === "es" || l === "en");

  return (
    <div className="site lg-root" data-font={site.font} style={vars}>
      {preview ? (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 70, background: "#15170f", color: "#fff", textAlign: "center", padding: "9px 16px", fontSize: 13, fontWeight: 600 }}>
          <Icon name="eye" size={14} /> {en ? "Preview: your site is not published yet. Only your team can see it." : "Vista previa: su sitio todavía no está publicado. Solo su equipo lo ve."}{" "}
          <Link href="/panel/sitio" style={{ textDecoration: "underline", color: "var(--accent)" }}>Panel</Link>
        </div>
      ) : null}

      <HideOnBooking>
        <SiteHeader name={config.name} logoUrl={logo} left={left} right={right} groups={groups} locales={offered} locale={locale} t={t} />
      </HideOnBooking>

      {children}

      <HideOnBooking>
        <SiteFooter
          name={config.name}
          logoUrl={logo}
          tagline={en ? "Private transfers and local experiences, booked online with the final price up front." : "Traslados privados y experiencias locales, reservados en línea con el precio final desde el inicio."}
          columns={[
            { heading: t.explore, links: [{ href: "/", label: L.home }, ...right, { href: "/preguntas", label: L.faq }] },
            { heading: L.services, links: [...left, { href: "/reservar", label: t.bookNow }] },
          ]}
          contactHeading={L.contact}
          whatsapp={wa}
          whatsappLabel={config.contactWhatsapp ? `WhatsApp ${config.contactWhatsapp}` : "WhatsApp"}
          email={config.contactEmail}
          region={null}
          bookLabel={t.bookNow}
          copyright={`© ${new Date().getFullYear()} ${config.legalName || config.name}`}
          credit={<>{en ? "Bookings by " : "Reservas con "}<AltairLogo size={15} />{" · by "}<a href={STARKNOT_URL} target="_blank" rel="noopener">Starknot</a></>}
          locales={offered}
          locale={locale}
          languageLabel={t.language}
        />
        <FloatingActions locale={locale} whatsappHref={wa} t={t.cart} />
      </HideOnBooking>
    </div>
  );
}
