"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { formatPrice } from "@altair/core";
import { addToCart, getCartItem, newKey, replaceInCart } from "@/lib/public/cart-store";
import type { ActivityItem, End, PricedItem } from "@/lib/public/cart-types";
import { GlassButton } from "../../_site/ui/Glass";
import { Combobox, type ComboOption } from "../../reservar/_engine/Combobox";
import { placeLabel, placeToEnd, type PlaceValue } from "../../reservar/_engine/places";
import type { PlaceHit } from "../../reservar/_engine/types";
import { Counter, Field, I } from "../../reservar/_engine/ui";
import { AI } from "../_ui/icons";
import { DepartureDate } from "./departure-date";

// The booking panel of one activity: date (only days with a departure), departure time with seats left,
// adults and children (each child's age, inside the activity's range), hotel pickup when the activity
// offers it, a note, and the server's live price. Adding puts the CHOICES in the cart (never a price); the
// cart page asks for the customer's details. `?edit=<key>` reopens a cart line and replaces it.

type Departure = { date: string; time: string; capacity: number; remaining: number };
export type PickupPlace = { id: string; name: string; kind: string; area: string | null; keywords: string; covered: boolean };
export type BookerActivity = {
  id: string;
  title: string;
  childMinAge: number;
  childMaxAge: number;
  minAge: number | null;
  minPax: number;
  maxPax: number;
  bookingMode: "instant" | "request";
  pickupMode: "none" | "included" | "by_area";
  meetingPoint: string | null;
};
type Done = { updated: boolean; when: string; people: string; pickup: string | null; total: string | null };

const COPY = {
  es: {
    eyebrow: "Reserve su experiencia",
    from: "Desde",
    perPerson: "por persona",
    onRequest: "Precio a consultar",
    instant: "Confirmación inmediata",
    request: "Sujeto a confirmación",
    editing: "Está editando esta actividad en su reserva.",
    date: "Fecha",
    datePh: "Elija la fecha",
    cal: { prev: "Mes anterior", next: "Mes siguiente", legend: "Días con salida disponible", none: "Sin salidas este mes" },
    time: "Hora de salida",
    timeHint: "Elija la fecha para ver los horarios.",
    left: (n: number) => (n === 1 ? "queda 1 lugar" : `quedan ${n} lugares`),
    who: "Personas",
    adults: "Adultos",
    children: "Niños",
    childRange: (a: number, b: number) => `${a} a ${b} años`,
    adultsOnly: "Esta actividad es solo para adultos.",
    childAge: (n: number) => `Edad del niño ${n}`,
    years: (n: number) => (n === 1 ? "1 año" : `${n} años`),
    pickup: "Recogida",
    wantPickup: "Quiero que me recojan en mi hotel",
    pickupIncluded: "La recogida en su hotel está incluida.",
    zones: "Recogida en",
    included: "incluida",
    outside: "Fuera de estas zonas, le cotizamos la recogida.",
    meet: "Punto de encuentro",
    hotel: "Hotel o dirección",
    hotelPh: "Busque su hotel",
    search: "Escriba el nombre de su hotel",
    typedHint: "Usar este texto",
    selected: "Elegido",
    noMatches: "Sin coincidencias",
    osm: { group: "En el mapa · OpenStreetMap", searching: "Buscando en el mapa…" },
    groups: { covered: "Zonas con recogida", place: "Hoteles y lugares", airport: "Aeropuertos" },
    note: "Notas para el guía",
    addNote: "Agregar una nota para el guía",
    optional: "opcional",
    notePh: "Alergias, celebraciones, preguntas…",
    summary: "Su reserva",
    total: "Total",
    taxes: "Impuestos incluidos",
    quote: "A cotizar",
    pickupLater: "Si agrega la recogida, su costo se suma aquí.",
    status: { instant: "Confirmación inmediata al reservar.", request: "Le confirmamos la disponibilidad por correo.", quote: "Le enviamos el precio final por correo." },
    priceError: "No pudimos calcular el precio en este momento.",
    add: "Agregar a su reserva",
    save: "Guardar cambios",
    reassure: "No se cobra nada ahora. Usted revisa todo en el siguiente paso.",
    missing: "Para continuar, indique ",
    need: { date: "la fecha", time: "la hora", ages: "la edad de cada niño", pickup: "su hotel para la recogida" },
    min: (n: number) => `Esta actividad requiere al menos ${n} personas.`,
    max: (n: number) => `Máximo ${n} personas por reserva.`,
    seats: (n: number) => (n === 1 ? "En esa salida queda 1 lugar." : `En esa salida quedan ${n} lugares.`),
    noDeps: "Por ahora no hay salidas disponibles. Escríbanos y le buscamos una fecha.",
    loading: "Buscando salidas disponibles…",
    people: (a: number, c: number) => `${a} ${a === 1 ? "adulto" : "adultos"}${c ? `, ${c} ${c === 1 ? "niño" : "niños"}` : ""}`,
    done: {
      eyebrow: "Listo",
      title: "Agregado a su ",
      updated: "Su reserva quedó ",
      em: "reserva.",
      emUpdated: "actualizada.",
      lead: "Puede seguir explorando o continuar con sus datos para confirmar.",
      continue: "Continuar a sus datos",
      explore: "Seguir explorando",
      another: "Agregar otra fecha",
    },
  },
  en: {
    eyebrow: "Book this experience",
    from: "From",
    perPerson: "per person",
    onRequest: "Price on request",
    instant: "Instant confirmation",
    request: "Subject to confirmation",
    editing: "You are editing this activity in your booking.",
    date: "Date",
    datePh: "Choose the date",
    cal: { prev: "Previous month", next: "Next month", legend: "Days with a departure", none: "No departures this month" },
    time: "Departure time",
    timeHint: "Choose the date to see the times.",
    left: (n: number) => (n === 1 ? "1 spot left" : `${n} spots left`),
    who: "People",
    adults: "Adults",
    children: "Children",
    childRange: (a: number, b: number) => `${a} to ${b} years`,
    adultsOnly: "This activity is for adults only.",
    childAge: (n: number) => `Age of child ${n}`,
    years: (n: number) => (n === 1 ? "1 year" : `${n} years`),
    pickup: "Pickup",
    wantPickup: "Pick me up at my hotel",
    pickupIncluded: "Pickup at your hotel is included.",
    zones: "Pickup in",
    included: "included",
    outside: "Outside these areas, we quote the pickup.",
    meet: "Meeting point",
    hotel: "Hotel or address",
    hotelPh: "Search your hotel",
    search: "Type your hotel's name",
    typedHint: "Use this text",
    selected: "Selected",
    noMatches: "No matches",
    osm: { group: "On the map · OpenStreetMap", searching: "Searching the map…" },
    groups: { covered: "Pickup areas", place: "Hotels and places", airport: "Airports" },
    note: "Notes for the guide",
    addNote: "Add a note for the guide",
    optional: "optional",
    notePh: "Allergies, celebrations, questions…",
    summary: "Your booking",
    total: "Total",
    taxes: "Taxes included",
    quote: "To be quoted",
    pickupLater: "If you add pickup, its cost is added here.",
    status: { instant: "Instant confirmation when you book.", request: "We confirm availability by email.", quote: "We send you the final price by email." },
    priceError: "We could not work out the price right now.",
    add: "Add to your booking",
    save: "Save changes",
    reassure: "Nothing is charged now. You review everything in the next step.",
    missing: "To continue, add ",
    need: { date: "the date", time: "the time", ages: "each child's age", pickup: "your pickup hotel" },
    min: (n: number) => `This activity needs at least ${n} people.`,
    max: (n: number) => `Up to ${n} people per booking.`,
    seats: (n: number) => (n === 1 ? "That departure has 1 spot left." : `That departure has ${n} spots left.`),
    noDeps: "There are no departures available right now. Message us and we will find a date.",
    loading: "Looking for available departures…",
    people: (a: number, c: number) => `${a} ${a === 1 ? "adult" : "adults"}${c ? `, ${c} ${c === 1 ? "child" : "children"}` : ""}`,
    done: {
      eyebrow: "Done",
      title: "Added to your ",
      updated: "Your booking is ",
      em: "booking.",
      emUpdated: "updated.",
      lead: "Keep exploring, or continue with your details to confirm.",
      continue: "Continue to your details",
      explore: "Keep exploring",
      another: "Add another date",
    },
  },
};

function addDays(dateISO: string, n: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + n)).toISOString().slice(0, 10);
}
const LONG = {
  es: new Intl.DateTimeFormat("es-CR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
};
const longDate = (iso: string, locale: "es" | "en") => {
  const s = LONG[locale].format(new Date(`${iso}T00:00:00Z`));
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** A cart pickup back into the field's value (edit mode). */
function endToPlace(e: End, label: string | undefined, places: PickupPlace[]): PlaceValue {
  if ("placeId" in e) {
    const p = places.find((x) => x.id === e.placeId);
    return p ? { id: p.id, name: p.name, kind: p.kind } : label ? { text: label } : null;
  }
  if ("lat" in e) return { text: e.label, lat: e.lat, lng: e.lng };
  return { text: e.label };
}

export function ActivityBooker({ activity, places, pickupZones, fromLabel, today, locale, currency, editKey }: {
  activity: BookerActivity;
  places: PickupPlace[];
  pickupZones: Array<{ area: string; fee: string | null }>;
  fromLabel: string | null;
  today: string;
  locale: "es" | "en";
  currency: string;
  editKey: string | null;
}) {
  const t = COPY[locale];
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const lastDay = addDays(today, 180);
  const lo = Math.max(activity.childMinAge, activity.minAge ?? 0);
  const hi = activity.childMaxAge;
  const childrenAllowed = lo <= hi;

  const [deps, setDeps] = useState<Departure[] | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [adults, setAdults] = useState(Math.min(activity.maxPax, Math.max(2, activity.minPax)));
  const [children, setChildren] = useState(0);
  const [ages, setAges] = useState<(number | null)[]>([]);
  const [wantPickup, setWantPickup] = useState(activity.pickupMode === "included");
  const [pickup, setPickup] = useState<PlaceValue>(null);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [tried, setTried] = useState(false);
  const [priced, setPriced] = useState<PricedItem | null>(null);
  const [pricing, setPricing] = useState(false);
  const [priceFailed, setPriceFailed] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Departures with seats left, for the next six months.
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/public/departures?activity=${activity.id}&from=${today}&to=${lastDay}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j: { departures?: Departure[] }) => setDeps((j.departures ?? []).filter((d) => d.remaining > 0)))
      .catch((e) => (e as Error).name !== "AbortError" && setDeps([]));
    return () => ctrl.abort();
  }, [activity.id, today, lastDay]);

  // Editing a cart line: put its choices back.
  useEffect(() => {
    if (!editKey) return;
    const it = getCartItem(editKey);
    if (!it || it.kind !== "activity" || it.activityId !== activity.id) return;
    setDate(it.date);
    setTime(it.time);
    setAdults(Math.max(1, it.adults));
    setChildren(childrenAllowed ? it.children : 0);
    setAges(Array.from({ length: childrenAllowed ? it.children : 0 }, (_, k) => it.childAges[k] ?? null));
    if (it.pickup) {
      setWantPickup(true);
      setPickup(endToPlace(it.pickup, it.pickupLabel, places));
    }
    setNote(it.note ?? "");
    setNoteOpen(!!it.note);
    setEditing(it.key);
    // Land on the panel's top (price and the "editing" note), after the browser's own jump to #reservar.
    const timer = setTimeout(() => {
      const el = root.current;
      const wide = window.matchMedia("(min-width: 1041px)").matches;
      (wide ? el?.closest<HTMLElement>(".ac-overview") : el)?.scrollIntoView({ block: "start" });
    }, 80);
    return () => clearTimeout(timer);
  }, [editKey, activity.id, childrenAllowed, places]);

  // Desktop: the panel stays in view while the page scrolls. When it is taller than the window it moves with
  // the scroll inside its limits (down: until its end shows; up: until its top shows), so every part of it can be
  // reached at any point of the page and nothing inside it is clipped.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const wide = window.matchMedia("(min-width: 1041px)");
    let top = Number.NaN;
    let lastY = window.scrollY;
    let frame = 0;
    const bounds = () => {
      const header = document.querySelector("header");
      let head = 24;
      if (header) {
        const cs = getComputedStyle(header);
        if (cs.position === "fixed" || cs.position === "sticky") head = Math.max(24, header.getBoundingClientRect().bottom + 20);
      }
      return { head, low: Math.min(head, window.innerHeight - 20 - el.offsetHeight) };
    };
    const apply = (dy: number) => {
      if (!wide.matches) { el.style.removeProperty("--ac-sticky-top"); return; }
      const { head, low } = bounds();
      top = Math.round(Math.min(head, Math.max(low, (Number.isNaN(top) ? head : top) - dy)));
      el.style.setProperty("--ac-sticky-top", `${top}px`);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        apply(y - lastY);
        lastY = y;
      });
    };
    const refresh = () => apply(0);
    refresh();
    const ro = new ResizeObserver(refresh);
    ro.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", refresh);
    wide.addEventListener("change", refresh);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", refresh);
      wide.removeEventListener("change", refresh);
    };
  }, []);

  // A refused "add": bring the first field that needs an answer into view.
  useEffect(() => {
    if (!attempt) return;
    const bad = root.current?.querySelector<HTMLElement>('[data-invalid="true"]');
    if (!bad) return;
    const r = bad.getBoundingClientRect();
    if (r.top < 110 || r.bottom > window.innerHeight - 20) bad.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [attempt]);

  const available = useMemo(() => new Set((deps ?? []).map((d) => d.date)), [deps]);
  const times = useMemo(() => (deps ?? []).filter((d) => d.date === date).sort((a, b) => a.time.localeCompare(b.time)), [deps, date]);
  const dep = times.find((d) => d.time === time) ?? null;
  const seats = adults + children;
  const needsPickup = activity.pickupMode === "included" || (activity.pickupMode === "by_area" && wantPickup);
  const pickupEnd = needsPickup ? placeToEnd(pickup) : null;
  const chosenAges = ages.slice(0, children).filter((a): a is number => a !== null);

  // ------------------------------------------------------------------ pickup places (catalog, then map, then typed)
  const placeOptions: ComboOption[] = useMemo(() => {
    const byArea = activity.pickupMode === "by_area";
    const covered = byArea ? places.filter((p) => p.covered && p.kind !== "airport") : [];
    const rest = places.filter((p) => !covered.includes(p) && p.kind !== "airport");
    const air = places.filter((p) => p.kind === "airport");
    const opt = (group: string, icon: ReactNode) => (p: PickupPlace): ComboOption => ({ key: p.id, label: p.name, hint: p.area ?? undefined, group, icon, keywords: p.keywords });
    return [
      ...covered.map(opt(t.groups.covered, I.pin())),
      ...rest.map(opt(t.groups.place, I.pin())),
      ...air.map(opt(t.groups.airport, I.plane())),
    ];
  }, [places, activity.pickupMode, t]);
  const toPlace = (key: string, typed?: string, hit?: PlaceHit): PlaceValue => {
    if (hit) return { text: (hit.hint ? `${hit.name}, ${hit.hint}` : hit.name).slice(0, 160), lat: hit.lat, lng: hit.lng };
    if (typed !== undefined) return { text: typed.slice(0, 160) };
    const p = places.find((x) => x.id === key);
    return p ? { id: p.id, name: p.name, kind: p.kind } : null;
  };
  const searchPlaces = useCallback(async (q: string): Promise<PlaceHit[]> => {
    const r = await fetch(`/api/public/geo/search?q=${encodeURIComponent(q)}&lang=${locale}`);
    if (!r.ok) return [];
    const j = (await r.json()) as { results?: Array<{ label: string; sub: string; lat: number; lng: number }> };
    return (j.results ?? []).map((h, i) => ({ key: `osm:${h.lat.toFixed(5)},${h.lng.toFixed(5)}:${i}`, name: h.label, hint: h.sub || null, lat: h.lat, lng: h.lng }));
  }, [locale]);

  // ------------------------------------------------------------------ live price (the server's; display only)
  const first = deps?.[0] ?? null;
  const qDate = date || first?.date || "";
  const qTime = (date && time) || times[0]?.time || first?.time || "";
  const groupOk = seats >= activity.minPax && seats <= activity.maxPax;
  const priceKey = qDate && qTime && groupOk
    ? JSON.stringify({
        kind: "activity", key: "preview", activityId: activity.id, date: qDate, time: qTime, adults, children, infants: 0,
        childAges: chosenAges, pickup: pickupEnd, pickupLabel: pickupEnd ? placeLabel(pickup) : undefined,
      } satisfies ActivityItem)
    : "";
  useEffect(() => {
    if (!priceKey) { setPriced(null); setPricing(false); return; }
    const ctrl = new AbortController();
    setPricing(true);
    const timer = setTimeout(async () => {
      try {
        const r = await fetch("/api/public/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: [JSON.parse(priceKey)], locale }), signal: ctrl.signal });
        if (!r.ok) throw new Error(String(r.status));
        const j = (await r.json()) as { items?: PricedItem[] };
        setPriced(j.items?.[0] ?? null);
        setPriceFailed(false);
      } catch (e) {
        if ((e as Error).name !== "AbortError") { setPriced(null); setPriceFailed(true); }
      } finally {
        if (!ctrl.signal.aborted) setPricing(false);
      }
    }, 260);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [priceKey, locale]);

  // ------------------------------------------------------------------ what is still missing
  const need: (keyof typeof t.need)[] = [];
  if (!date || !available.has(date)) need.push("date");
  else if (!dep) need.push("time");
  if (ages.slice(0, children).some((a) => a === null)) need.push("ages");
  if (needsPickup && !pickupEnd) need.push("pickup");
  const problems: string[] = [];
  if (seats < activity.minPax) problems.push(t.min(activity.minPax));
  if (seats > activity.maxPax) problems.push(t.max(activity.maxPax));
  if (dep && seats > dep.remaining) problems.push(t.seats(dep.remaining));
  const blocked = need.length > 0 || problems.length > 0;
  const flag = (k: keyof typeof t.need) => tried && need.includes(k);
  const money = (n: number) => formatPrice(n, currency);
  const priceOk = priced && !priced.error ? priced : null;
  const status = priceOk?.status ?? (activity.bookingMode === "request" ? "request" : "instant");

  function add() {
    if (blocked || !dep) { setTried(true); setAttempt((n) => n + 1); return; }
    const item: ActivityItem = {
      kind: "activity", key: newKey(), activityId: activity.id, date, time, adults, children, infants: 0, childAges: chosenAges,
      pickup: pickupEnd, pickupLabel: pickupEnd ? placeLabel(pickup) : undefined, note: note.trim() || undefined,
    };
    if (editing) replaceInCart(editing, [item]);
    else addToCart([item]);
    setDone({
      updated: !!editing,
      when: `${longDate(date, locale)} · ${time}`,
      people: t.people(adults, children),
      pickup: pickupEnd ? placeLabel(pickup) : null,
      total: priceOk ? (priceOk.total !== null ? money(priceOk.total) : t.quote) : null,
    });
    setEditing(null);
    setTried(false);
    requestAnimationFrame(() => {
      const r = root.current?.getBoundingClientRect();
      if (r && r.top < 0) root.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }
  function another() {
    setDone(null);
    setDate("");
    setTime("");
    setNote("");
    setNoteOpen(false);
  }

  const pickDate = (d: string) => {
    setDate(d);
    const list = (deps ?? []).filter((x) => x.date === d);
    setTime(list.length === 1 ? list[0]!.time : list.some((x) => x.time === time) ? time : "");
  };
  const setKids = (n: number) => {
    setChildren(n);
    setAges((a) => Array.from({ length: n }, (_, k) => a[k] ?? null));
  };

  // ------------------------------------------------------------------ render
  const head = (
    <div className="ac-book__head">
      <p className="ac-book__eyebrow">{t.eyebrow}</p>
      <div className="ac-book__price">
        {fromLabel ? <><span>{t.from}</span><strong>{fromLabel}</strong><span>{t.perPerson}</span></> : <strong className="ac-book__price--quote">{t.onRequest}</strong>}
      </div>
      <span className={`ac-book__mode${activity.bookingMode === "instant" ? " is-instant" : ""}`}>
        {activity.bookingMode === "instant" ? AI.checkCircle() : AI.info()}
        {activity.bookingMode === "instant" ? t.instant : t.request}
      </span>
    </div>
  );

  if (done) {
    return (
      <div ref={root} id="reservar" className="ac-ov-book ac-book">
        <div className="ac-done" role="status">
          <span className="ac-done__seal" aria-hidden="true">{I.check()}</span>
          <p className="ac-book__eyebrow">{t.done.eyebrow}</p>
          <h2 className="ac-done__title">{done.updated ? t.done.updated : t.done.title}<em>{done.updated ? t.done.emUpdated : t.done.em}</em></h2>
          <div className="ac-done__card">
            <p className="ac-done__name">{activity.title}</p>
            <ul className="ac-rows">
              <li>{I.calendar()}<span>{done.when}</span></li>
              <li>{I.users()}<span>{done.people}</span></li>
              {done.pickup ? <li>{I.pin()}<span>{done.pickup}</span></li> : null}
            </ul>
            {done.total ? <div className="ac-done__total"><span>{t.total}</span><strong>{done.total}</strong></div> : null}
          </div>
          <p className="ac-done__lead">{t.done.lead}</p>
          <div className="ac-done__actions">
            <GlassButton tone="gold" block href="/carrito" icon={I.arrowRight()}>{t.done.continue}</GlassButton>
            <GlassButton tone="white" block href="/actividades">{t.done.explore}</GlassButton>
          </div>
          <button type="button" className="ac-linkbtn" onClick={another}>{I.plus()}{t.done.another}</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={root} id="reservar" className="ac-ov-book ac-book">
      {head}
      {editing ? <p className="ac-book__editing">{I.pencil()}{t.editing}</p> : null}

      {deps === null ? (
        <p className="ac-book__loading"><span className="ac-spin" aria-hidden="true" />{t.loading}</p>
      ) : deps.length === 0 ? (
        <div className="be-notice">{I.info()}<span>{t.noDeps}</span></div>
      ) : (
        <>
          <div className="ac-book__body">
            <section className="ac-book__block">
              <DepartureDate
                label={t.date} value={date} onChange={pickDate} available={available} today={today} last={lastDay} locale={locale}
                placeholder={t.datePh} invalid={flag("date")} labels={t.cal}
              />
              <Field label={t.time} required labelId={`${uid}-time`}>
                {date && times.length ? (
                  <div className="ac-slots" role="radiogroup" aria-labelledby={`${uid}-time`} data-invalid={flag("time") || undefined}>
                    {times.map((d) => (
                      <button key={d.time} type="button" role="radio" aria-checked={d.time === time} className="ac-slot" onClick={() => setTime(d.time)}>
                        <strong>{d.time}</strong>
                        <small className={d.remaining <= 4 ? "is-low" : undefined}>{t.left(d.remaining)}</small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="ac-book__hint">{I.clock()}{t.timeHint}</p>
                )}
              </Field>
            </section>

            <section className="ac-book__block">
              <div className={childrenAllowed ? "ac-book__pair" : undefined}>
                <Counter label={t.adults} required value={adults} min={1} max={Math.max(1, activity.maxPax - children)} onChange={setAdults} />
                {childrenAllowed ? (
                  <Counter label={t.children} small={t.childRange(lo, hi)} value={children} min={0} max={Math.max(0, activity.maxPax - adults)} onChange={setKids} />
                ) : null}
              </div>
              {!childrenAllowed ? <p className="ac-book__hint">{AI.age()}{t.adultsOnly}</p> : null}
              {children > 0 ? (
                <div className="ac-ages be-enter">
                  {ages.slice(0, children).map((age, k) => (
                    <AgeCounter key={k} label={t.childAge(k + 1)} value={age} lo={lo} hi={hi} years={t.years} invalid={tried && age === null}
                      onChange={(v) => setAges((a) => a.map((x, j) => (j === k ? v : x)))} />
                  ))}
                </div>
              ) : null}
            </section>

            {activity.pickupMode !== "none" ? (
              <section className="ac-book__block">
                <p className="ac-book__label">{t.pickup}</p>
                {activity.pickupMode === "by_area" ? (
                  <label className="be-check">
                    <input type="checkbox" checked={wantPickup} onChange={(e) => setWantPickup(e.target.checked)} />
                    <span className="be-check__box">{I.check()}</span>
                    <span>
                      {t.wantPickup}
                      {pickupZones.length ? <small>{t.zones}: {pickupZones.map((z) => `${z.area} (${z.fee ?? t.included})`).join(" · ")}. {t.outside}</small> : null}
                    </span>
                  </label>
                ) : (
                  <p className="ac-book__hint">{I.car()}{t.pickupIncluded}</p>
                )}
                {needsPickup ? (
                  <Combobox
                    label={t.hotel} required value={pickup ? { key: "id" in pickup ? pickup.id : `typed:${pickup.text}`, label: placeLabel(pickup) } : null}
                    valueIsTyped={!!pickup && "text" in pickup} options={placeOptions} placeholder={t.hotelPh} searchPlaceholder={t.search}
                    typed={{ hint: t.typedHint }} remote={{ search: searchPlaces, group: t.osm.group, searching: t.osm.searching, icon: I.pin() }}
                    selectedLabel={t.selected} noMatches={t.noMatches} invalid={flag("pickup")}
                    onSelect={(k, typed, hit) => setPickup(toPlace(k, typed, hit))}
                  />
                ) : null}
              </section>
            ) : activity.meetingPoint ? (
              <section className="ac-book__block">
                <p className="ac-book__hint">{I.pin()}<span><b>{t.meet}:</b> {activity.meetingPoint}</span></p>
              </section>
            ) : null}

            <section className="ac-book__block">
              {noteOpen ? (
                <Field label={t.note} small={t.optional} htmlFor={`${uid}-note`}>
                  <textarea id={`${uid}-note`} className="be-control be-enter" rows={2} maxLength={500} value={note} placeholder={t.notePh} autoFocus onChange={(e) => setNote(e.target.value)} />
                </Field>
              ) : (
                <button type="button" className="ac-linkbtn ac-linkbtn--start" onClick={() => setNoteOpen(true)}>{I.plus()}{t.addNote}</button>
              )}
            </section>
          </div>

          <div className="ac-sum" aria-live="polite">
            <div className="ac-sum__head">
              <p className="ac-sum__title">{t.summary}</p>
              <p className="ac-sum__what">{date ? `${longDate(date, locale)}${time ? ` · ${time}` : ""}` : t.datePh} · {t.people(adults, children)}</p>
            </div>
            {priceOk && priceOk.components.length ? (
              <div className="ac-sum__lines">
                {priceOk.components.map((c, i) => (
                  <div key={i} className="ac-sum__line"><span>{c.label}{c.qty > 1 ? ` × ${c.qty}` : ""}</span><strong>{money(c.total)}</strong></div>
                ))}
              </div>
            ) : null}
            <div className="ac-sum__total">
              <span>{t.total}</span>
              {pricing && !priceOk ? <span className="ac-spin" aria-hidden="true" /> : <strong>{priceOk ? (priceOk.total !== null ? money(priceOk.total) : t.quote) : "—"}</strong>}
            </div>
            <p className="ac-sum__fees">{t.taxes}</p>
            {activity.pickupMode === "by_area" && !wantPickup ? <p className="ac-sum__note">{t.pickupLater}</p> : null}
            <p className={`ac-sum__status${status === "instant" ? " is-instant" : ""}`}>{status === "instant" ? AI.checkCircle() : AI.info()}{t.status[status]}</p>
            {priceFailed || (priced?.error && groupOk) ? <p className="be-error be-error--inline" role="alert">{t.priceError}</p> : null}
          </div>

          <div className="ac-book__cta">
            {(tried || !groupOk) && problems.length ? (
              <div role="alert" className="ac-book__problems">{problems.map((p) => <p key={p}>{p}</p>)}</div>
            ) : null}
            <GlassButton tone="gold" block onClick={add} disabled={pricing && !priceOk} icon={editing ? I.check() : I.arrowRight()} aria-describedby={tried && need.length ? `${uid}-missing` : undefined}>
              {editing ? t.save : t.add}
            </GlassButton>
            {tried && need.length ? (
              <p id={`${uid}-missing`} className="be-missing be-missing--start" data-attempted role="status">{t.missing}{need.map((k) => t.need[k]).join(", ")}.</p>
            ) : (
              <p className="ac-book__reassure">{AI.shield()}{t.reassure}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** A child's age: "—" until chosen, then − / + within the activity's child range. */
function AgeCounter({ label, value, lo, hi, onChange, invalid, years }: {
  label: string; value: number | null; lo: number; hi: number; onChange: (v: number) => void; invalid?: boolean; years: (n: number) => string;
}) {
  const id = useId();
  return (
    <Field label={label} required labelId={`${id}-l`}>
      <div className="be-counter" role="group" aria-labelledby={`${id}-l`} data-invalid={invalid || undefined}>
        <button type="button" onClick={() => onChange(value === null ? lo : Math.max(lo, value - 1))} disabled={value === lo} aria-label={`− ${label}`}>{I.minus()}</button>
        <output aria-live="polite">{value === null ? "—" : years(value)}</output>
        <button type="button" onClick={() => onChange(value === null ? lo : Math.min(hi, value + 1))} disabled={value === hi} aria-label={`+ ${label}`}>{I.plus()}</button>
      </div>
    </Field>
  );
}
