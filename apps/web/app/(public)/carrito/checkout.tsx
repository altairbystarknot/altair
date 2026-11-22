"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { clearCart, removeFromCart, useCart } from "@/lib/public/cart-store";
import type { PricedItem } from "@/lib/public/cart-types";
import { GlassButton } from "../_site/ui/Glass";
import { Combobox, type ComboOption } from "../reservar/_engine/Combobox";
import { COUNTRY_NOT_LISTED, countryList, countryName } from "../reservar/_engine/countries";
import { Field, I } from "../reservar/_engine/ui";

type Quote = { currency: string; items: PricedItem[]; total: number; hasQuote: boolean };
type Contact = { name: string; email: string; phone: string; nationality: string; country: string; notes: string; accept: boolean };

const COPY = {
  es: {
    steps: ["Servicios", "Sus datos", "Confirmación"], stepsShort: ["Servicios", "Datos", "Listo"],
    eyebrow: "Sus datos", title: "Ya ", em: "casi.",
    lead: { records: "Déjenos sus datos para confirmar la reserva. No se cobra nada ahora: le indicamos cómo pagar en la confirmación.", stripe: "Déjenos sus datos para confirmar la reserva. El pago se hace después, en una página segura." },
    name: "Nombre completo", namePh: "Como en su identificación", email: "Correo electrónico", emailPh: "usted@ejemplo.com", phone: "Teléfono / WhatsApp", phonePh: "+506 8888 0000",
    nationality: "País / Nacionalidad", nationalityPh: "Elija un país", nationalitySearch: "Busque un país", nationalityNone: "Ningún país coincide",
    nationalityNotListed: "Mi país no está en la lista", nationalityOther: "País de ciudadanía", nationalityHint: "País de ciudadanía del viajero principal.",
    notes: "Comentarios", optional: "(opcional)", notesPh: "Cualquier detalle que debamos saber para su reserva.",
    accept: "Acepto las condiciones de reserva y cancelación.", privacy: "Usamos estos datos solo para atender su reserva.",
    selected: "Seleccionado",
    addMore: "Agregar otro servicio", submit: "Confirmar reserva", submitRequest: "Enviar solicitud", sending: "Enviando…",
    missing: "Para continuar, agregue: ",
    missingLabels: { name: "nombre completo", email: "correo válido", phone: "teléfono", nationality: "país / nacionalidad", accept: "aceptar las condiciones", items: "un servicio válido" } as Record<string, string>,
    note: { records: "Su reserva queda registrada al enviar. Recibirá la confirmación y las instrucciones de pago por correo.", stripe: "Su reserva queda registrada al enviar. Después continuará al pago seguro." },
    summary: {
      service: (n: number) => `Servicio ${n}`, transfer: "Traslado privado", activity: "Actividad", edit: "Editar", remove: "Quitar",
      date: "Fecha", time: "Hora", total: "Total", estimated: "Total estimado", fees: "Impuestos incluidos",
      tbcTotal: "Algunos servicios se cotizan aparte: le confirmamos el total por correo.", loading: "Calculando precios…",
      onRequest: "Precio a consultar", instant: "Confirmación inmediata", request: "Se confirma por correo",
    },
    empty: { title: "Su reserva está ", em: "vacía.", lead: "Elija un traslado o una actividad para comenzar.", transfers: "Reservar un traslado", activities: "Ver actividades", home: "Volver al inicio" },
    errors: { generic: "Algo salió mal. Inténtelo de nuevo o escríbanos por WhatsApp.", changed: "Algunos precios o disponibilidades cambiaron. Revise el resumen e inténtelo de nuevo.", soldOut: "Uno de los horarios ya no tiene cupo. Elija otro horario e inténtelo de nuevo." },
  },
  en: {
    steps: ["Services", "Your details", "Confirmation"], stepsShort: ["Services", "Details", "Done"],
    eyebrow: "Your details", title: "Almost ", em: "there.",
    lead: { records: "Leave your details to confirm the booking. Nothing is charged now: we tell you how to pay in the confirmation.", stripe: "Leave your details to confirm the booking. Payment comes next, on a secure page." },
    name: "Full name", namePh: "As on your ID", email: "Email", emailPh: "you@example.com", phone: "Phone / WhatsApp", phonePh: "+1 555 000 0000",
    nationality: "Country / Nationality", nationalityPh: "Choose a country", nationalitySearch: "Search countries", nationalityNone: "No country matches",
    nationalityNotListed: "My country is not listed", nationalityOther: "Country of citizenship", nationalityHint: "The lead traveller's country of citizenship.",
    notes: "Comments", optional: "(optional)", notesPh: "Anything we should know about your booking.",
    accept: "I accept the booking and cancellation terms.", privacy: "We use these details only to handle your booking.",
    selected: "Selected",
    addMore: "Add another service", submit: "Confirm booking", submitRequest: "Send request", sending: "Sending…",
    missing: "To continue, add: ",
    missingLabels: { name: "full name", email: "valid email", phone: "phone number", nationality: "country / nationality", accept: "accept the terms", items: "a valid service" } as Record<string, string>,
    note: { records: "Your booking is recorded when you send it. You will receive the confirmation and payment instructions by email.", stripe: "Your booking is recorded when you send it. Then you continue to secure payment." },
    summary: {
      service: (n: number) => `Service ${n}`, transfer: "Private transfer", activity: "Activity", edit: "Edit", remove: "Remove",
      date: "Date", time: "Time", total: "Total", estimated: "Estimated total", fees: "Taxes included",
      tbcTotal: "Some services are quoted separately: we confirm the total by email.", loading: "Working out prices…",
      onRequest: "Price on request", instant: "Instant confirmation", request: "Confirmed by email",
    },
    empty: { title: "Your booking is ", em: "empty.", lead: "Choose a transfer or an activity to begin.", transfers: "Book a transfer", activities: "See activities", home: "Back to home" },
    errors: { generic: "Something went wrong. Please try again or contact us on WhatsApp.", changed: "Some prices or availability changed. Check the summary and try again.", soldOut: "One of the times is no longer available. Choose another time and try again." },
  },
};

const LONG_DATE = { en: new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }), es: new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) };
const fmtDate = (s: string, locale: "es" | "en") => {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? LONG_DATE[locale].format(new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))) : s;
};

export function Checkout({ locale, paymentsMode, transfers, activities, logo, whatsappHref }: {
  locale: "es" | "en"; paymentsMode: "stripe" | "records"; transfers: boolean; activities: boolean; logo: ReactNode; whatsappHref: string | null;
}) {
  const t = COPY[locale];
  const uid = useId();
  const items = useCart();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [c, setC] = useState<Contact>({ name: "", email: "", phone: "", nationality: "", country: "", notes: "", accept: false });
  const honeypot = useRef<HTMLInputElement>(null);
  const money = (n: number) => new Intl.NumberFormat(locale === "es" ? "es-CR" : "en-US", { style: "currency", currency: quote?.currency ?? "USD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);

  const itemsKey = JSON.stringify(items);
  useEffect(() => {
    if (items.length === 0) { setQuote(null); setLoading(false); return; }
    setLoading(true);
    const ctrl = new AbortController();
    fetch("/api/public/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, locale }), signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((q: Quote) => setQuote(q))
      .catch((e) => { if (e?.name !== "AbortError") setError(t.errors.generic); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [itemsKey, locale]); // eslint-disable-line react-hooks/exhaustive-deps -- keyed on the cart contents

  const nationalityOptions: ComboOption[] = useMemo(() => [
    ...countryList(locale).map((x) => ({ key: x.code, label: x.name, keywords: `${x.code} ${x.english}` })),
    { key: COUNTRY_NOT_LISTED, label: t.nationalityNotListed },
  ], [locale, t]);
  const nationalityOk = c.nationality === COUNTRY_NOT_LISTED ? c.country.trim().length >= 2 : c.nationality !== "";
  const nationalityValue = c.nationality === COUNTRY_NOT_LISTED ? c.country.trim().slice(0, 60) : c.nationality ? countryName(c.nationality, "en") : "";
  const nationalityLabel = c.nationality === COUNTRY_NOT_LISTED ? t.nationalityNotListed : c.nationality ? countryName(c.nationality, locale) : "";

  const bad = {
    name: c.name.trim().length < 2,
    email: !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email.trim()),
    phone: !/^\+?[0-9 ().-]{7,40}$/.test(c.phone.trim()),
    nationality: !nationalityOk,
    accept: !c.accept,
    items: !!quote && quote.items.some((x) => x.error),
  };
  const missing = (Object.keys(bad) as (keyof typeof bad)[]).filter((k) => bad[k]).map((k) => t.missingLabels[k]).join(", ");
  const anyRequest = !!quote && quote.items.some((x) => x.status !== "instant");

  const submit = async () => {
    if (missing) { setAttempted(true); return; }
    setError(null);
    setSending(true);
    try {
      const r = await fetch("/api/public/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items, customer: { name: c.name.trim(), email: c.email.trim(), phone: c.phone.trim(), country: nationalityValue },
          notes: c.notes.trim(), locale, acceptTerms: c.accept, website: honeypot.current?.value ?? "",
        }),
      });
      const j = await r.json();
      if (r.ok && j.code) {
        clearCart();
        router.push(`/reserva/${encodeURIComponent(j.code)}?t=${encodeURIComponent(j.token)}&nuevo=1`);
        return;
      }
      if (j.error === "items_changed") { setQuote((q) => (q ? { ...q, items: j.items } : q)); setError(t.errors.changed); }
      else if (j.error === "sold_out") setError(t.errors.soldOut);
      else setError(t.errors.generic);
    } catch {
      setError(t.errors.generic);
    }
    setSending(false);
  };

  const top = (step: number) => (
    <header className="be-top">
      <a href="/" className="be-top__logo" aria-label={locale === "es" ? "Inicio" : "Home"}>{logo}</a>
      <ol className="be-progress" aria-label={locale === "es" ? "Pasos de la reserva" : "Booking steps"}>
        {t.steps.map((s, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          return (
            <li key={s} className="be-progress__step" data-state={state} aria-current={i === step ? "step" : undefined}>
              <button type="button" className="be-progress__btn" disabled={i >= step} onClick={() => router.push("/reservar")} aria-label={s}>
                <span className="be-progress__dot">{state === "done" && I.check()}</span>
                <span className="be-progress__label"><span className="be-progress__long">{s}</span><span className="be-progress__short">{t.stepsShort[i]}</span></span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="be-top__end" aria-hidden="true" />
    </header>
  );

  if (!loading && items.length === 0) {
    return (
      <>
        {top(0)}
        <div className="be-done" role="status">
          <p className="be-eyebrow">{t.eyebrow}</p>
          <h1 className="be-title">{t.empty.title}<em>{t.empty.em}</em></h1>
          <p>{t.empty.lead}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {transfers && <GlassButton tone="gold" href="/reservar/traslado" icon={I.car()} iconPosition="start">{t.empty.transfers}</GlassButton>}
            {activities && <GlassButton tone="white" href="/actividades" icon={I.sparkle()} iconPosition="start">{t.empty.activities}</GlassButton>}
          </div>
        </div>
      </>
    );
  }

  const inv = (k: keyof typeof bad) => attempted && bad[k];
  const summary = (
    <div className="be-summary">
      {loading && !quote ? <p className="be-summary__hint m-0">{t.summary.loading}</p> : null}
      {(quote?.items ?? []).map((it, i) => {
        const cartItem = items.find((x) => x.key === it.key);
        return (
          <div key={it.key} className="be-summary__service">
            <div className="be-summary__top">
              <p className="be-summary__eyebrow">{t.summary.service(i + 1)}</p>
              <span className="be-summary__chips">
                <span className="be-chip">{it.kind === "transfer" ? t.summary.transfer : t.summary.activity}</span>
                {it.editHref && <a className="be-summary__edit" href={it.editHref}>{I.pencil()}{t.summary.edit}</a>}
                <button type="button" className="be-summary__edit" onClick={() => removeFromCart(it.key)} aria-label={`${t.summary.remove}: ${it.title}`}>{I.minus()}{t.summary.remove}</button>
              </span>
            </div>
            <p className="be-summary__title">{it.title}</p>
            <ul className="be-summary__rows">
              {it.subtitle && <li>{it.kind === "transfer" ? I.car() : I.sparkle()}<span>{it.subtitle}</span></li>}
              <li>{I.calendar()}<span><strong>{t.summary.date}:</strong> {fmtDate(it.date, locale)}</span></li>
              {it.time && <li>{I.clock()}<span><strong>{t.summary.time}:</strong> {it.time}</span></li>}
              {cartItem && <li>{I.users()}<span>{cartItem.adults} {locale === "es" ? (cartItem.adults === 1 ? "adulto" : "adultos") : cartItem.adults === 1 ? "adult" : "adults"}{cartItem.children > 0 ? `, ${cartItem.children} ${locale === "es" ? (cartItem.children === 1 ? "niño" : "niños") : cartItem.children === 1 ? "child" : "children"}` : ""}</span></li>}
            </ul>
            {it.error ? <p className="be-error be-error--inline" role="alert">{it.error}</p> : (
              <div className="be-summary__lines">
                {it.components.map((x, k) => <div key={k} className="be-summary__line"><span>{x.label}{x.qty > 1 ? ` × ${x.qty}` : ""}</span><strong>{money(x.total)}</strong></div>)}
                <div className="be-summary__line"><span>{it.status === "instant" ? t.summary.instant : t.summary.request}</span><strong>{it.total === null ? t.summary.onRequest : money(it.total)}</strong></div>
              </div>
            )}
          </div>
        );
      })}
      {quote && (
        <>
          <div className="be-summary__total"><span>{quote.hasQuote ? t.summary.estimated : t.summary.total}</span><strong>{money(quote.total)}</strong></div>
          <p className="be-summary__fees">{quote.hasQuote ? t.summary.tbcTotal : t.summary.fees}</p>
        </>
      )}
    </div>
  );

  return (
    <>
      {top(1)}
      <div className="be-shell be-frame">
        <section className="be-pane be-pane--main" aria-labelledby={`${uid}-title`}>
          <div className="be-scroll">
            <div className="be-enter">
              <div className="be-step-head">
                <p className="be-eyebrow">{t.eyebrow}</p>
                <h1 id={`${uid}-title`} className="be-title">{t.title}<em>{t.em}</em></h1>
                <p className="be-lead">{t.lead[paymentsMode]}</p>
              </div>
              <div className="flex flex-col gap-5">
                <div className="be-grid-2">
                  {([["name", t.name, "name", "text", t.namePh, 120], ["email", t.email, "email", "email", t.emailPh, 200], ["phone", t.phone, "tel", "tel", t.phonePh, 40]] as const).map(([k, label, ac, type, ph, max]) => (
                    <Field key={k} label={label} required htmlFor={`${uid}-${k}`}>
                      <span className="be-control" data-invalid={inv(k) || undefined}>
                        <input id={`${uid}-${k}`} type={type} autoComplete={ac} maxLength={max} placeholder={ph} value={c[k]} aria-invalid={inv(k) || undefined} onChange={(e) => setC({ ...c, [k]: e.target.value })} />
                      </span>
                    </Field>
                  ))}
                  <div className="flex flex-col gap-2">
                    <Combobox
                      label={t.nationality} required value={c.nationality ? { key: c.nationality, label: nationalityLabel } : null}
                      options={nationalityOptions} maxRows={nationalityOptions.length} placeholder={t.nationalityPh} searchPlaceholder={t.nationalitySearch}
                      selectedLabel={t.selected} noMatches={t.nationalityNone} invalid={inv("nationality")}
                      onSelect={(k) => setC({ ...c, nationality: k, country: k === COUNTRY_NOT_LISTED ? c.country : "" })}
                    />
                    {c.nationality === COUNTRY_NOT_LISTED && (
                      <Field label={t.nationalityOther} required htmlFor={`${uid}-nat`}>
                        <span className="be-control" data-invalid={inv("nationality") || undefined}>
                          <input id={`${uid}-nat`} type="text" autoComplete="country-name" maxLength={60} value={c.country} onChange={(e) => setC({ ...c, country: e.target.value })} />
                        </span>
                      </Field>
                    )}
                    <p className="be-hint">{t.nationalityHint}</p>
                  </div>
                </div>
                <Field label={t.notes} small={t.optional} htmlFor={`${uid}-notes`}>
                  <textarea id={`${uid}-notes`} className="be-control" rows={3} maxLength={1000} value={c.notes} placeholder={t.notesPh} onChange={(e) => setC({ ...c, notes: e.target.value })} />
                </Field>
                <label className="be-check" data-invalid={inv("accept") || undefined}>
                  <input type="checkbox" checked={c.accept} onChange={(e) => setC({ ...c, accept: e.target.checked })} />
                  <span className="be-check__box">{I.check()}</span>
                  <span>{t.accept}</span>
                </label>
                {/* Honeypot: hidden from people; bots fill it. */}
                <div aria-hidden="true" className="absolute left-[-10000px] h-px w-px overflow-hidden"><label>Website<input ref={honeypot} tabIndex={-1} autoComplete="off" name="website" /></label></div>
                <div className="be-notice">{I.shield()}<span>{t.note[paymentsMode]}</span></div>
                <p className="be-privacy">{t.privacy}</p>
                {error && <p role="alert" className="be-error">{error}</p>}
              </div>
            </div>
          </div>
          <div className="be-foot">
            <div className="be-actions">
              <a className="be-btn-secondary" href={transfers || activities ? "/reservar" : "/"}>{I.plus()}{t.addMore}</a>
              <div className="be-actions__end">
                <GlassButton tone="gold" onClick={submit} disabled={sending || loading} icon={I.check()} className={missing ? "be-next--blocked" : undefined} aria-describedby={missing && attempted ? `${uid}-missing` : undefined}>
                  {sending ? t.sending : anyRequest ? t.submitRequest : t.submit}
                </GlassButton>
                {missing && attempted && <p id={`${uid}-missing`} className="be-missing" data-attempted role="status" aria-live="polite">{t.missing}{missing}</p>}
              </div>
            </div>
          </div>
        </section>
        <aside className="be-pane be-pane--aside">
          <div className="flex flex-col gap-3">
            {summary}
            {whatsappHref && <a className="be-help" href={whatsappHref} target="_blank" rel="noopener noreferrer"><span className="be-help__icon">{I.whatsapp()}</span><span><small>{locale === "es" ? "¿Dudas antes de reservar?" : "Questions before booking?"}</small><strong>{locale === "es" ? "Escríbanos por WhatsApp" : "Write to us on WhatsApp"}</strong></span></a>}
          </div>
        </aside>
      </div>
    </>
  );
}
