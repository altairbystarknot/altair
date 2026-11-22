import type { Metadata } from "next";
import { pickText } from "@altair/config";
import { formatPrice } from "@altair/core";
import { Icon } from "@altair/ui";
import { getPublicConfig } from "@/lib/config/business-config";
import { guard } from "@/lib/doors";
import { dict, formatDateLong } from "@/lib/public/i18n";
import { getLocale } from "@/lib/public/locale";
import { mediaUrl } from "@/lib/media";
import { BookingBackdrop, EngineLogo } from "../../reservar/_engine/chrome";
import { createAnonSupabase } from "@/lib/supabase/anon";

export const metadata: Metadata = { title: "Tu reserva", robots: { index: false, follow: false } };

type Line = {
  kind: string;
  title: string;
  service_date: string;
  service_time: string | null;
  pax_adults: number;
  pax_children: number;
  pax_infants: number;
  total_cents: number;
  needs_quote: boolean;
  status: string;
};
type Booking = {
  code: string;
  status: string;
  customer_name: string;
  currency: string;
  total_cents: number;
  tax_cents: number;
  paid_cents: number;
  needs_quote: boolean;
  lines: Line[];
};

// The customer's receipt. The code alone proves nothing (codes are sequential): the page needs the token
// that only the receipt link carries, and the database compares its hash.
export default async function BookingPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ t?: string; nuevo?: string }> }) {
  const { code } = await params;
  const { t: token, nuevo } = await searchParams;
  const { config, site, paymentInstructions } = await getPublicConfig();
  if (!config) return null;
  const locale = await getLocale();
  const t = dict(locale);

  let b: Booking | null = null;
  if (token && /^[A-Za-z0-9]{20,80}$/.test(token) && /^[A-Z]{2,4}-[A-Z0-9]{4,8}$/.test(code.toUpperCase())) {
    const { data } = await createAnonSupabase().rpc("booking_lookup", { p_guard: guard("lookup"), p_code: code, p_token: token });
    b = (data as Booking | null) ?? null;
  }
  const en = locale === "en";
  const wa = config.contactWhatsapp ? `https://wa.me/${config.contactWhatsapp.replace(/\D/g, "")}` : null;
  const steps = en ? ["Services", "Your details", "Confirmation"] : ["Servicios", "Sus datos", "Confirmación"];
  const shell = (children: React.ReactNode) => (
    <main id="main-content" className="be-page">
      <BookingBackdrop image={mediaUrl(site.heroPath)} />
      <header className="be-top">
        <a href="/" className="be-top__logo" aria-label={en ? "Home" : "Inicio"}><EngineLogo name={config.name} logoUrl={mediaUrl(site.logoPath)} /></a>
        <ol className="be-progress" aria-label={en ? "Booking steps" : "Pasos de la reserva"}>
          {steps.map((s, i) => (
            <li key={s} className="be-progress__step" data-state={i < 2 ? "done" : "current"} aria-current={i === 2 ? "step" : undefined}>
              <span className="be-progress__btn">
                <span className="be-progress__dot">{i < 2 ? <Icon name="check" size={12} strokeWidth={3} /> : null}</span>
                <span className="be-progress__label"><span className="be-progress__long">{s}</span><span className="be-progress__short">{s}</span></span>
              </span>
            </li>
          ))}
        </ol>
        <div className="be-top__end" aria-hidden="true" />
      </header>
      {children}
    </main>
  );

  if (!b) {
    return shell(
      <div className="be-done" role="status">
        <p className="be-eyebrow">{config.name}</p>
        <h1 className="be-title">{en ? "Booking " : "Reserva "}<em>{en ? "not found." : "no encontrada."}</em></h1>
        <p>{t.notFound}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a className="lg-glass-btn lg-glass-btn--gold" href="/"><span>{en ? "Back to home" : "Volver al inicio"}</span></a>
        </div>
      </div>,
    );
  }

  const money = (c: number) => formatPrice(c / 100, b!.currency);
  const howToPay = pickText(paymentInstructions, locale, "");
  const pending = b.total_cents - b.paid_cents;
  const people = (l: Line) => {
    const a = l.pax_adults, c = l.pax_children;
    const ad = en ? `${a} ${a === 1 ? "adult" : "adults"}` : `${a} ${a === 1 ? "adulto" : "adultos"}`;
    const ch = c > 0 ? (en ? `, ${c} ${c === 1 ? "child" : "children"}` : `, ${c} ${c === 1 ? "niño" : "niños"}`) : "";
    return ad + ch;
  };

  return shell(
    <div className="be-shell be-shell--single">
      <div className="be-done be-done--inline" role="status">
        <span className="be-done__seal"><Icon name="check" size={26} strokeWidth={3} /></span>
        <p className="be-eyebrow">{en ? "Your reference" : "Su referencia"}</p>
        <p className="be-done__code">{b.code}<span className="be-badge be-badge--light">{t.statusLabels[b.status] ?? b.status}</span></p>
        <h1 className="be-title">{nuevo ? (en ? "Booking " : "Reserva ") : en ? "Your " : "Su "}<em>{nuevo ? (en ? "received." : "recibida.") : en ? "booking." : "reserva."}</em></h1>
        <p>{nuevo ? (en ? "Thank you. We have sent the details to your email. Keep your reference for any question." : "Gracias. Le enviamos los detalles por correo. Conserve su referencia para cualquier consulta.") : b.customer_name}</p>
      </div>
      <div className="be-summary be-summary--receipt">
        {b.lines.map((l, i) => (
          <div key={i} className="be-summary__service">
            <div className="be-summary__top">
              <p className="be-summary__eyebrow">{en ? `Service ${i + 1}` : `Servicio ${i + 1}`}</p>
              <span className="be-summary__chips"><span className="be-chip">{l.kind === "transfer" ? (en ? "Private transfer" : "Traslado privado") : en ? "Activity" : "Actividad"}</span></span>
            </div>
            <p className="be-summary__title">{l.title}</p>
            <ul className="be-summary__rows">
              <li><Icon name="calendar" size={15} /><span><strong>{en ? "Date" : "Fecha"}:</strong> {formatDateLong(l.service_date, locale)}</span></li>
              {l.service_time ? <li><Icon name="clock" size={15} /><span><strong>{en ? "Time" : "Hora"}:</strong> {l.service_time.slice(0, 5)}</span></li> : null}
              <li><Icon name="users" size={15} /><span>{people(l)}</span></li>
            </ul>
            <div className="be-summary__lines">
              <div className="be-summary__line"><span>{l.needs_quote ? t.quoteLine : en ? "Price" : "Precio"}</span><strong>{l.needs_quote ? "—" : money(l.total_cents)}</strong></div>
            </div>
          </div>
        ))}
        <div className="be-summary__total"><span>{t.total}</span><strong>{money(b.total_cents)}</strong></div>
        {b.paid_cents > 0 ? <div className="be-summary__line"><span>{t.paid}</span><strong>{money(b.paid_cents)}</strong></div> : null}
        {pending > 0 && b.paid_cents > 0 ? <div className="be-summary__line"><span>{t.pending}</span><strong>{money(pending)}</strong></div> : null}
        <p className="be-summary__fees">{en ? "Taxes included" : "Impuestos incluidos"}</p>
        {config.paymentsMode === "records" && pending > 0 ? (
          <div className="be-notice"><Icon name="card" size={16} /><span><strong>{t.howToPay}</strong><br /><span style={{ whiteSpace: "pre-line" }}>{howToPay || t.payLater}</span></span></div>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-3">
          <a className="lg-glass-btn lg-glass-btn--gold" href="/"><span>{en ? "Back to home" : "Volver al inicio"}</span></a>
          {wa ? <a className="lg-glass-btn lg-glass-btn--white" target="_blank" rel="noopener noreferrer" href={`${wa}?text=${encodeURIComponent(b.code)}`}><span>WhatsApp</span></a> : null}
        </div>
      </div>
    </div>,
  );
}
