"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { addToCart, getCartItem, newKey, replaceInCart } from "@/lib/public/cart-store";
import type { TransferItem } from "@/lib/public/cart-types";
import { GlassButton } from "../../_site/ui/Glass";
import { clearDraft, useOpeningDraft, writeDraft } from "./draft";
import { Combobox, type ComboOption } from "./Combobox";
import { engineCopy } from "./copy";
import { DatePicker } from "./DatePicker";
import { placeLabel, placeToEnd, samePlace, type PlaceValue } from "./places";
import { RouteMap } from "./RouteMap";
import { TimePicker } from "./TimePicker";
import { Counter, Field, I } from "./ui";
import type { EngineCatalog, LegQuote, PlaceHit, RouteMapData } from "./types";

type TripType = "one_way" | "round_trip" | "multi_leg";
/** Fields the customer changed by hand on this leg: they are no longer suggested from the previous leg. */
type Manual = { from?: true; to?: true; pax?: true; luggage?: true; vehicle?: true };
type Leg = {
  key: string; from: PlaceValue; to: PlaceValue; date: string; time: string;
  adults: number; children: number; ages: (number | null)[]; luggage: number; vehicleId: string | null;
  extras: Record<string, number>; note: string; manual: Manual;
};
export type EngineChrome = { logo: ReactNode; homeHref: string; homeLabel: string };

const LONG_DATE_OPTIONS: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" };
const LONG_DATE = { en: new Intl.DateTimeFormat("en-US", LONG_DATE_OPTIONS), es: new Intl.DateTimeFormat("es", LONG_DATE_OPTIONS) };
const money = (n: number, currency: string, locale: "en" | "es") =>
  new Intl.NumberFormat(locale === "es" ? "es-CR" : "en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);
const uuid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : newKey());
const newLeg = (seed?: Partial<Leg>): Leg => ({
  key: uuid(), from: null, to: null, date: "", time: "",
  adults: 2, children: 0, ages: [], luggage: 2, vehicleId: null, extras: {}, note: "", manual: {}, ...seed,
});
const MANUAL_OF: Partial<Record<keyof Leg, keyof Manual>> = { from: "from", to: "to", adults: "pax", children: "pax", ages: "pax", luggage: "luggage", vehicleId: "vehicle" };
const sameAges = (a: (number | null)[], b: (number | null)[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const filledLeg = (l: Leg) => !!(l.manual.from || l.manual.to || l.manual.vehicle || l.date || l.time || l.note.trim() || Object.keys(l.extras).length > 0);
const pax = (l: Leg) => l.adults + l.children;
const coordsOf = (p: PlaceValue, catalog: EngineCatalog): [number, number] | null => {
  if (!p) return null;
  if ("id" in p) {
    const c = catalog.locations.find((x) => x.id === p.id);
    return c && c.lat != null && c.lng != null ? [c.lat, c.lng] : null;
  }
  return p.lat !== undefined && p.lng !== undefined ? [p.lat, p.lng] : null;
};

type EngineProps = {
  locale: "en" | "es"; currency: string; catalog: EngineCatalog; whatsappHref: string | null; chrome: EngineChrome;
  editKey?: string | null; initialFrom?: PlaceValue; initialTo?: PlaceValue;
};
/** Everything needed to put a customer back exactly where they were (kept in the tab, see draft.ts). */
type EngineState = { step: number; tripType: TripType; allLegs: Leg[]; mapLeg: number; attempted: boolean[] };

/**
 * The private-transfer booking engine. The booking being built is kept in this tab: a refresh or a visit to
 * the rest of the website brings the customer back to the same step with everything they chose. Editing a
 * cart line starts from that line instead.
 */
export function TransferEngine(props: EngineProps) {
  const draft = useOpeningDraft<EngineState>();
  const [edit] = useState(() => (props.editKey ? getCartItem(props.editKey) : null));
  const initial = useMemo(() => {
    if (edit && edit.kind === "transfer") return fromCartItem(edit, props.catalog);
    if (props.editKey) return null;
    if (draft) return restore(draft.state, props.catalog);
    if (props.initialFrom || props.initialTo) return { step: 0, tripType: "one_way" as TripType, allLegs: [newLeg({ from: props.initialFrom ?? null, to: props.initialTo ?? null })], mapLeg: 0, attempted: [false, false, false] };
    return null;
  }, [draft, edit, props.catalog, props.editKey, props.initialFrom, props.initialTo]);
  return <Engine key={initial ? "kept" : "new"} {...props} initial={initial} persist={!props.editKey} editing={!!edit} />;
}

function fromCartItem(it: TransferItem, catalog: EngineCatalog): EngineState {
  const end = (e: TransferItem["from"], label: string): PlaceValue => {
    if ("placeId" in e) { const p = catalog.locations.find((x) => x.id === e.placeId); return p ? { id: p.id, name: p.name, kind: p.kind } : { text: label }; }
    if ("lat" in e) return { text: e.label, lat: e.lat, lng: e.lng };
    return { text: e.label };
  };
  const leg = newLeg({
    from: end(it.from, it.fromLabel), to: end(it.to, it.toLabel), date: it.date, time: it.time, adults: Math.max(1, it.adults), children: it.children,
    ages: Array.from({ length: it.children }, (_, k) => it.childAges[k] ?? null), luggage: it.bags ?? 0, vehicleId: it.vehicleClassId,
    extras: Object.fromEntries(it.extras.map((x) => [x.id, x.qty])), note: it.note ?? "",
  });
  return { step: 0, tripType: "one_way", allLegs: [leg], mapLeg: 0, attempted: [false, false, false] };
}

/**
 * A stored booking checked against today's catalogue: places, vehicles and extras that no longer exist are
 * dropped, and dates already in the past are cleared. The customer goes back to the first step that a
 * change touched, so nothing is added that was not shown to them.
 */
function restore(s: EngineState, catalog: EngineCatalog): EngineState | null {
  if (!s || !Array.isArray(s.allLegs) || s.allLegs.length === 0) return null;
  let step = Math.max(0, Math.min(2, Number(s.step) || 0));
  const place = (p: PlaceValue): PlaceValue => {
    if (!p || !("id" in p)) return p;
    const hit = catalog.locations.find((x) => x.id === p.id);
    return hit ? { id: hit.id, name: hit.name, kind: hit.kind } : null;
  };
  const allLegs = s.allLegs.map((raw): Leg => {
    const l: Leg = { ...newLeg(), ...raw, key: raw.key || uuid(), manual: raw.manual ?? {}, extras: raw.extras ?? {} };
    const from = place(l.from), to = place(l.to);
    if ((!from && l.from) || (!to && l.to)) step = 0;
    let date = l.date;
    if (date && date < catalog.minDate) { date = ""; step = 0; }
    const vehicleId = l.vehicleId && catalog.vehicles.some((v) => v.id === l.vehicleId) ? l.vehicleId : null;
    if (l.vehicleId && !vehicleId) step = Math.min(step, 1);
    const extras = Object.fromEntries(Object.entries(l.extras).filter(([id, q]) => catalog.extras.some((x) => x.id === id) && Number(q) > 0));
    return { ...l, from, to, date, vehicleId, extras };
  });
  const tripType: TripType = s.tripType === "round_trip" || s.tripType === "multi_leg" ? s.tripType : "one_way";
  const attempted = Array.isArray(s.attempted) && s.attempted.length === 3 ? s.attempted.map((v, i) => (i < step ? !!v : false)) : [false, false, false];
  return { step, tripType, allLegs, mapLeg: Math.max(0, Number(s.mapLeg) || 0), attempted };
}

function Engine({ locale, currency, catalog, whatsappHref, chrome, editKey, initial, persist = false, editing = false }: EngineProps & {
  initial?: EngineState | null; persist?: boolean; editing?: boolean;
}) {
  const t = engineCopy[locale];
  const router = useRouter();
  const uid = useId();
  const [step, setStep] = useState(initial?.step ?? 0);
  const [tripType, setTripType] = useState<TripType>(initial?.tripType ?? "one_way");
  // Every leg the customer has built. Switching trip type never deletes filled legs: the ones the type does
  // not use are only set aside (shown again when switching back to multi-leg).
  const [allLegs, setAllLegs] = useState<Leg[]>(() => initial?.allLegs ?? [newLeg()]);
  const legs = useMemo(() => (tripType === "one_way" ? allLegs.slice(0, 1) : tripType === "round_trip" ? allLegs.slice(0, 2) : allLegs), [allLegs, tripType]);
  const setAside = allLegs.length - legs.length;
  const [quotes, setQuotes] = useState<Record<string, LegQuote | "loading">>({});
  const [maps, setMaps] = useState<Record<string, RouteMapData | null>>({});
  const [mapLeg, setMapLeg] = useState(Math.min(initial?.mapLeg ?? 0, Math.max(0, legs.length - 1)));
  const [attempted, setAttempted] = useState<boolean[]>(initial?.attempted ?? [false, false, false]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const aside = useRef<HTMLElement>(null);
  const firstPaint = useRef(true);

  // Every step opens at the top of the page, once the new step is on screen. Instant, so nothing animates on phones.
  useEffect(() => {
    if (firstPaint.current) { firstPaint.current = false; return; }
    scroller.current?.scrollTo({ top: 0 });
    aside.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  // ------------------------------------------------------------------ catalogue
  const placeOptions: ComboOption[] = useMemo(() => {
    const air = catalog.locations.filter((p) => p.kind === "airport");
    const rest = catalog.locations.filter((p) => p.kind !== "airport");
    return [
      ...air.map((p) => ({ key: p.id, label: p.name, hint: p.area ?? undefined, group: t.groups.airport, icon: I.plane(), keywords: p.keywords })),
      ...rest.map((p) => ({ key: p.id, label: p.name, hint: p.area ?? undefined, group: t.groups.place, icon: I.pin(), keywords: p.keywords })),
    ];
  }, [catalog.locations, t]);
  const toPlace = (key: string, typed?: string, hit?: PlaceHit): PlaceValue => {
    // A place found on OpenStreetMap: name plus its area (what staff will read), with its coordinates.
    if (hit) return { text: (hit.hint ? `${hit.name}, ${hit.hint}` : hit.name).slice(0, 160), lat: hit.lat, lng: hit.lng };
    if (typed !== undefined) return { text: typed.slice(0, 160) };
    const p = catalog.locations.find((x) => x.id === key);
    return p ? { id: p.id, name: p.name, kind: p.kind } : null;
  };
  const searchPlaces = useCallback(async (q: string): Promise<PlaceHit[]> => {
    const r = await fetch(`/api/public/geo/search?q=${encodeURIComponent(q)}&lang=${locale}`);
    if (!r.ok) return [];
    const j = (await r.json()) as { results?: Array<{ label: string; sub: string; lat: number; lng: number }> };
    return (j.results ?? []).map((h, i) => ({ key: `osm:${h.lat.toFixed(5)},${h.lng.toFixed(5)}:${i}`, name: h.label, hint: h.sub || null, lat: h.lat, lng: h.lng }));
  }, [locale]);

  // ------------------------------------------------------------------ prices (the server's engine)
  // One request per leg whose places are chosen; date and time default to the earliest day at noon until
  // the customer picks them (seasons and surcharges are applied again when they do).
  const quoteBody = (l: Leg) => {
    const from = placeToEnd(l.from), to = placeToEnd(l.to);
    if (!from || !to) return null;
    return JSON.stringify({
      from, to, date: l.date || catalog.minDate, time: l.time || "12:00", adults: l.adults, children: l.children, infants: 0,
      bags: l.luggage, extras: [], locale,
    });
  };
  const bodies = legs.map(quoteBody);
  const bodiesKey = bodies.join("|");
  useEffect(() => {
    const ctrl = new AbortController();
    const todo = bodies.filter((b): b is string => !!b && !quotes[b]);
    if (todo.length === 0) return;
    const timer = setTimeout(() => {
      setQuotes((q) => ({ ...q, ...Object.fromEntries(todo.map((b) => [b, "loading" as const])) }));
      for (const b of todo) {
        void fetch("/api/public/transfer-options", { method: "POST", headers: { "Content-Type": "application/json" }, body: b, signal: ctrl.signal })
          .then(async (r) => {
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error ?? "error");
            const q: LegQuote = {
              options: (j.options ?? []).map((o: { vehicleClassId: string; status: LegQuote["options"][number]["status"]; total: number | null; durationMinutes: number | null }) => ({ vehicleClassId: o.vehicleClassId, status: o.status, total: o.status === "quote" ? null : o.total, durationMinutes: o.durationMinutes })),
              fromArea: j.from?.area ?? null, toArea: j.to?.area ?? null, groupTooLarge: !!j.groupTooLarge,
            };
            setQuotes((x) => ({ ...x, [b]: q }));
          })
          .catch(() => setQuotes((x) => { const n = { ...x }; delete n[b]; return n; }));
      }
    }, 220);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [bodiesKey]); // eslint-disable-line react-hooks/exhaustive-deps -- keyed on the request bodies
  const quoteOf = (l: Leg): LegQuote | "loading" | undefined => { const b = quoteBody(l); return b ? quotes[b] : undefined; };
  const optionOf = (l: Leg, vehicleId: string | null) => { const q = quoteOf(l); return q && q !== "loading" && vehicleId ? q.options.find((o) => o.vehicleClassId === vehicleId) ?? null : null; };
  const legPrice = (l: Leg, vehicleId: string | null): number | null => optionOf(l, vehicleId)?.total ?? null;
  const extraOf = (id: string) => catalog.extras.find((x) => x.id === id);
  const extrasTotal = (l: Leg) => Object.entries(l.extras).reduce((sum, [id, q]) => sum + q * (extraOf(id)?.price ?? 0), 0);
  const total = (() => {
    let sum = 0;
    for (const l of legs) { const p = legPrice(l, l.vehicleId); if (p === null) return null; sum += p + extrasTotal(l); }
    return sum;
  })();
  const fmt = (n: number) => money(n, currency, locale);

  // ------------------------------------------------------------------ map of the leg being edited
  const shown = legs[Math.min(mapLeg, legs.length - 1)]!;
  const a = coordsOf(shown.from, catalog), b = coordsOf(shown.to, catalog);
  const mapKey = a || b ? `${a?.join(",") ?? ""}>${b?.join(",") ?? ""}` : null;
  useEffect(() => {
    if (!mapKey || mapKey in maps) return;
    if (!a || !b) { setMaps((m) => ({ ...m, [mapKey]: { from: a, to: b, points: null, km: null, minutes: null } })); return; }
    const ctrl = new AbortController();
    void fetch("/api/public/geo/route", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ a: { lat: a[0], lng: a[1] }, b: { lat: b[0], lng: b[1] } }), signal: ctrl.signal })
      .then((r) => r.json())
      .then((j: { route?: { km: number; minutes: number; line: [number, number][] } | null }) => {
        setMaps((m) => ({ ...m, [mapKey]: { from: a, to: b, points: j.route?.line ?? null, km: j.route?.km ?? null, minutes: j.route?.minutes ?? null } }));
      })
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [mapKey]); // eslint-disable-line react-hooks/exhaustive-deps -- keyed on the two points

  // ------------------------------------------------------------------ kept in this tab (draft.ts)
  useEffect(() => {
    if (!persist) return;
    if (!legs.some((l) => l.from || l.to || l.date || l.time || l.vehicleId)) return;
    const vehicleName = (id: string | null) => (id ? catalog.vehicles.find((v) => v.id === id)?.name ?? null : null);
    writeDraft<EngineState>({ step, tripType, allLegs, mapLeg, attempted }, {
      legs: legs.map((l) => ({ from: l.from ? placeLabel(l.from) : null, to: l.to ? placeLabel(l.to) : null, date: l.date, time: l.time, vehicle: vehicleName(l.vehicleId) })),
    });
  }, [persist, step, tripType, allLegs, legs, mapLeg, attempted, catalog.vehicles]);

  // ------------------------------------------------------------------ assistance between legs
  // Each later leg follows the one before it until the customer changes that field by hand: pickup =
  // previous drop-off; for a round trip the return goes back to the first pickup; passengers, children's
  // ages and suitcases are copied. Dates, times and vehicles are never copied.
  const capacityOf = (id: string | null) => (id ? catalog.vehicles.find((v) => v.id === id)?.capacityPax ?? 0 : 0);
  const follow = (prev: Leg, l: Leg, i: number, trip: TripType, first: Leg): Leg => {
    let n = l;
    const m = l.manual;
    if (!m.from && !samePlace(n.from, prev.to)) n = { ...n, from: prev.to };
    if (trip === "round_trip" && i === 1 && !m.to && !samePlace(n.to, first.from)) n = { ...n, to: first.from };
    if (!m.pax && (n.adults !== prev.adults || n.children !== prev.children || !sameAges(n.ages, prev.ages))) {
      n = { ...n, adults: prev.adults, children: prev.children, ages: [...prev.ages] };
    }
    if (!m.luggage && n.luggage !== prev.luggage) n = { ...n, luggage: prev.luggage };
    if (n.vehicleId && capacityOf(n.vehicleId) < pax(n)) n = { ...n, vehicleId: null };
    return n;
  };
  const chain = (arr: Leg[], fromIndex: number, trip: TripType): Leg[] => {
    const out = [...arr];
    for (let k = Math.max(1, fromIndex + 1); k < out.length; k++) out[k] = follow(out[k - 1]!, out[k]!, k, trip, out[0]!);
    return out;
  };
  const update = (i: number, patch: Partial<Leg>) => {
    const own: Manual = { ...allLegs[i]!.manual };
    if (i > 0) for (const k of Object.keys(patch) as (keyof Leg)[]) { const f = MANUAL_OF[k]; if (f) own[f] = true; }
    const arr = allLegs.map((l, j) => (j === i ? { ...l, ...patch, manual: own } : l));
    if ("from" in patch || "to" in patch) setMapLeg(i);
    const fixed = arr.map((l) => (l.vehicleId && capacityOf(l.vehicleId) < pax(l) ? { ...l, vehicleId: null } : l));
    setAllLegs(chain(fixed, i, tripType));
  };
  const setType = (tt: TripType) => {
    setTripType(tt);
    const keep = tt === "one_way" ? 1 : tt === "round_trip" ? 2 : allLegs.length;
    let last = allLegs.length - 1;
    while (last >= keep && !filledLeg(allLegs[last]!)) last--;
    let arr = allLegs.slice(0, Math.max(keep, last + 1));
    if (tt !== "one_way" && arr.length < 2) arr = [...arr, newLeg()];
    setAllLegs(chain(arr, 0, tt));
    const count = tt === "one_way" ? 1 : tt === "round_trip" ? 2 : arr.length;
    if (mapLeg >= count) setMapLeg(0);
  };
  const addLeg = () => {
    if (allLegs.length >= catalog.maxLegs) return;
    const arr = [...allLegs, newLeg()];
    setAllLegs(chain(arr, arr.length - 2, tripType));
  };
  const removeLeg = (i: number) => {
    const arr = allLegs.filter((_, j) => j !== i);
    if (arr.length === 1) setTripType("one_way");
    setAllLegs(chain(arr, Math.max(0, i - 1), arr.length === 1 ? "one_way" : tripType));
    if (mapLeg >= arr.length) setMapLeg(0);
  };

  // ------------------------------------------------------------------ order of the legs
  const prevWhen = (i: number) => {
    for (let k = i - 1; k >= 0; k--) { const l = legs[k]!; if (l.date) return { date: l.date, time: l.time || null, leg: k }; }
    return null;
  };
  const minDateFor = (i: number) => { const p = prevWhen(i); return p && p.date > catalog.minDate ? p.date : catalog.minDate; };
  const outOfOrder = (i: number) => {
    const l = legs[i]!;
    const p = i > 0 && l.date ? prevWhen(i) : null;
    if (!p) return null;
    return l.date < p.date || (l.date === p.date && !!l.time && !!p.time && l.time < p.time) ? p : null;
  };

  // ------------------------------------------------------------------ gates (the server decides again)
  const legMissing = (l: Leg, i: number): string[] => {
    const out: string[] = [];
    if (outOfOrder(i)) out.push("order");
    if (!l.from) out.push("origin");
    if (!l.to) out.push("destination");
    if (l.from && l.to && samePlace(l.from, l.to)) out.push("same_ends");
    if (!l.date) out.push("date");
    if (!l.time) out.push("time");
    if (l.children > 0 && l.ages.some((x) => x === null)) out.push("child_ages");
    if (pax(l) > catalog.maxParty) out.push("passengers");
    return out;
  };
  const missingFor = (s: number): string => {
    const join = (keys: string[]) => keys.map((k) => t.missingLabels[k] ?? k).join(", ");
    const perLeg = (fn: (l: Leg, i: number) => string[]) => {
      const parts = legs.map((l, i) => ({ i, keys: fn(l, i) })).filter((x) => x.keys.length > 0);
      if (parts.length === 0) return "";
      return legs.length === 1 ? join(parts[0]!.keys) : parts.map((p) => `${t.legPrefix(p.i + 1)}${join(p.keys)}`).join("; ");
    };
    if (s === 0) return perLeg(legMissing);
    if (s === 1) return perLeg((l) => (l.vehicleId && capacityOf(l.vehicleId) >= pax(l) ? [] : ["vehicle"]));
    return "";
  };
  const missing = missingFor(step);
  const show = attempted[step];

  const goTo = (to: number) => { setError(null); setStep(to); };
  const reachable = (s: number) => { for (let i = 0; i < s; i++) if (missingFor(i)) return false; return true; };
  const next = () => {
    if (missing) { setAttempted((x) => x.map((v, i) => (i === step ? true : v))); return; }
    if (step < 2) goTo(step + 1); else finish();
  };

  /** Each leg becomes one line of the cart (choices only: the server prices it again). */
  const finish = () => {
    setError(null);
    setPending(true);
    try {
      const items: TransferItem[] = legs.map((l) => ({
        kind: "transfer", key: newKey(),
        from: placeToEnd(l.from)!, to: placeToEnd(l.to)!, fromLabel: placeLabel(l.from).slice(0, 160), toLabel: placeLabel(l.to).slice(0, 160),
        date: l.date, time: l.time, adults: l.adults, children: l.children, infants: 0, childAges: l.ages.map((x) => x ?? 0),
        bags: l.luggage, vehicleClassId: l.vehicleId!, extras: Object.entries(l.extras).filter(([, q]) => q > 0).map(([id, qty]) => ({ id, qty })),
        ...(l.note.trim() ? { note: l.note.trim().slice(0, 500) } : {}),
      }));
      if (editing && editKey) replaceInCart(editKey, items);
      else addToCart(items);
      if (persist) clearDraft();
      router.push("/carrito");
    } catch {
      setError(t.errors.generic);
      setPending(false);
    }
  };

  const fmtDate = (s: string) => {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return s;
    return LONG_DATE[locale].format(new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))));
  };

  // ------------------------------------------------------------------ chrome
  const top = (
    <header className="be-top">
      <a href={chrome.homeHref} className="be-top__logo" aria-label={chrome.homeLabel}>{chrome.logo}</a>
      <ol className="be-progress" aria-label={locale === "es" ? "Pasos de la reserva" : "Booking steps"}>
        {t.steps.map((s, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          return (
            <li key={s} className="be-progress__step" data-state={state} aria-current={i === step ? "step" : undefined}>
              <button type="button" className="be-progress__btn" disabled={i >= step} onClick={() => goTo(i)} aria-label={s}>
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

  // ------------------------------------------------------------------ steps
  const head = t.head[step] ?? t.head[0]!;
  const legTitle = (i: number) => (tripType === "round_trip" ? (i === 0 ? t.outbound : t.return) : `${t.leg} ${i + 1}`);
  const flagged = (l: Leg, k: string) => show && legMissing(l, legs.indexOf(l)).includes(k);
  const placeRemote = { search: searchPlaces, group: t.osm.group, searching: t.osm.searching, icon: I.pin() };

  const stepRoute = (
    <>
      <div className="be-row-between">
        <div className="be-segment" role="radiogroup" aria-label={t.tripTypeLabel}>
          {(editing ? (["one_way"] as TripType[]) : (["one_way", "round_trip", "multi_leg"] as TripType[])).map((tt) => (
            <button key={tt} type="button" role="radio" aria-checked={tripType === tt} onClick={() => setType(tt)}>{t.tripType[tt]}</button>
          ))}
        </div>
        {whatsappHref && (
          <a className="be-help" href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <span className="be-help__icon">{I.whatsapp()}</span>
            <span><small>{t.help.small}</small><strong>{t.help.strong}</strong></span>
            {I.arrowRight({ width: 15, height: 15 })}
          </a>
        )}
      </div>
      {legs.map((l, i) => {
        const before = i > 0 ? prevWhen(i) : null;
        const bad = outOfOrder(i);
        return (
          <fieldset key={l.key} className="be-leg m-0 border-0 p-0">
            {legs.length > 1 && (
              <legend className="be-leg__title w-full">
                <span>{legTitle(i)}</span>
                {tripType === "multi_leg" && legs.length > 2 && <button type="button" className="be-link-danger" onClick={() => removeLeg(i)}>{t.removeLeg}</button>}
              </legend>
            )}
            <div className="be-grid-route">
              <Combobox
                label={t.from} required value={l.from ? { key: "id" in l.from ? l.from.id : `typed:${l.from.text}`, label: placeLabel(l.from) } : null}
                valueIsTyped={!!l.from && "text" in l.from} options={placeOptions} placeholder={t.fromPlaceholder} searchPlaceholder={t.search}
                typed={{ hint: t.typedHint }} remote={placeRemote} selectedLabel={t.selected} noMatches={t.noMatches} invalid={flagged(l, "origin")}
                onSelect={(k, typed, hit) => update(i, { from: toPlace(k, typed, hit) })}
              />
              <button type="button" className="be-swap" aria-label={t.swap} disabled={!l.from && !l.to} onClick={() => update(i, { from: l.to, to: l.from })}>{I.swap()}</button>
              <Combobox
                label={t.to} required value={l.to ? { key: "id" in l.to ? l.to.id : `typed:${l.to.text}`, label: placeLabel(l.to) } : null}
                valueIsTyped={!!l.to && "text" in l.to} options={placeOptions} placeholder={t.toPlaceholder} searchPlaceholder={t.search}
                typed={{ hint: t.typedHint }} remote={placeRemote} selectedLabel={t.selected} noMatches={t.noMatches} invalid={flagged(l, "destination") || flagged(l, "same_ends")}
                onSelect={(k, typed, hit) => update(i, { to: toPlace(k, typed, hit) })}
              />
            </div>
            <div className="be-grid-2">
              <DatePicker label={t.date} required value={l.date} min={minDateFor(i)} locale={locale} placeholder={t.selectDate} labels={t.cal}
                invalid={flagged(l, "date") || (!!bad && bad.date > l.date)} onChange={(date) => update(i, { date })} />
              <TimePicker label={t.time} required value={l.time} placeholder={t.selectTime} labels={t.timeUi}
                hint={before?.time && l.date && before.date === l.date ? t.earliestTime(before.time) : t.timeUi.hint(catalog.timezoneLabel)}
                invalid={flagged(l, "time") || (!!bad && bad.date === l.date)} onChange={(time) => update(i, { time })} />
            </div>
            {bad && <p className="be-error be-error--inline" role="alert">{t.orderAlert(`${fmtDate(bad.date)}${bad.time ? ` · ${bad.time}` : ""}`)}</p>}
            <div className="be-grid-3">
              <Counter label={t.adults} required value={l.adults} min={1} max={Math.max(1, catalog.maxParty - l.children)} onChange={(adults) => update(i, { adults })} />
              <Counter label={t.children} small={t.childrenHint} value={l.children} min={0} max={Math.max(0, catalog.maxParty - l.adults)}
                onChange={(c) => update(i, { children: c, ages: Array.from({ length: c }, (_, k) => l.ages[k] ?? null) })} />
              <Counter label={t.luggage} value={l.luggage} min={0} max={60} onChange={(luggage) => update(i, { luggage })} />
            </div>
            {l.children > 0 && (
              <div className="be-grid-3 be-enter">
                {l.ages.map((age, k) => (
                  <AgeCounter key={k} label={t.childAge(k + 1)} value={age} invalid={show && age === null} years={t.years}
                    onChange={(v) => update(i, { ages: l.ages.map((x, j) => (j === k ? v : x)) })} />
                ))}
              </div>
            )}
            <Field label={t.note} small={t.optional} htmlFor={`${uid}-note-${i}`}>
              <textarea id={`${uid}-note-${i}`} className="be-control" rows={2} maxLength={500} value={l.note} placeholder={t.notePlaceholder} onChange={(e) => update(i, { note: e.target.value })} />
            </Field>
          </fieldset>
        );
      })}
      {tripType === "multi_leg" && legs.length < catalog.maxLegs && (
        <button type="button" className="be-btn-add" onClick={addLeg}>{I.plus({ width: 14, height: 14 })}{t.addLeg}</button>
      )}
      {setAside > 0 && <div className="be-notice" role="status">{I.info()}<span>{t.setAside(setAside)}</span></div>}
    </>
  );

  const stepVehicle = (
    <>
      {legs.map((l, i) => {
        const q = quoteOf(l);
        const fits = catalog.vehicles.filter((v) => v.capacityPax >= pax(l));
        return (
          <section key={l.key} className="be-legblock" aria-label={t.vehicleFor(i + 1)}>
            {legs.length > 1 && <h3 className="be-subhead"><span>{t.vehicleFor(i + 1)} · {placeLabel(l.from)} → {placeLabel(l.to)}</span></h3>}
            <p className="be-section-note">{t.vehicleIntro(pax(l))} {show && !l.vehicleId && <strong>{t.pickVehicle}</strong>}</p>
            {fits.length === 0 ? (
              <div className="be-notice">{I.info()}<span>{t.noneFits(pax(l))} {whatsappHref && <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="underline">WhatsApp</a>}</span></div>
            ) : (
              <div className="be-cards">
                {fits.map((v) => {
                  const o = optionOf(l, v.id);
                  const p = o?.total ?? null;
                  const loading = q === undefined || q === "loading";
                  const selected = l.vehicleId === v.id;
                  return (
                    <button key={v.id} type="button" className="be-card" data-selected={selected || undefined} aria-pressed={selected} onClick={() => update(i, { vehicleId: v.id })}>
                      <span className="be-card__media">
                        {v.imageUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={v.imageUrl} alt="" loading="lazy" />
                          : <span className="be-card__media--empty grid h-full w-full">{I.car()}</span>}
                        <span className="be-card__badges">
                          {!loading && p === null && <span className="be-badge">{t.onRequest}</span>}
                          {o?.status === "request" && p !== null && <span className="be-badge be-badge--light">{t.confirmBadge}</span>}
                        </span>
                        {selected && <span className="be-card__check">{I.check()}</span>}
                      </span>
                      <span className="be-card__body">
                        <span className="be-card__name">{v.name}</span>
                        <span className="be-card__meta">{t.seats(v.capacityPax)} · {t.bags(v.capacityBags)}</span>
                        {loading
                          ? <span className="be-card__note">{t.calculating}</span>
                          : p !== null
                            ? <span className="be-card__price"><small>{currency}</small><strong>{fmt(p)}</strong></span>
                            : <span className="be-card__note">{t.priceTbc}</span>}
                      </span>
                      <span className="be-card__foot">
                        <span className="be-card__fees">{p !== null ? t.fees : v.description ?? ""}</span>
                        <span className="be-pill-select" aria-hidden="true" data-on={selected || undefined}>{selected ? <>{I.check()}{t.selectedPill}</> : t.select}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {i === 0 && legs.length > 1 && l.vehicleId && (
              <button type="button" className="be-btn-add" onClick={() => setAllLegs((ls) => ls.map((x) => ({ ...x, vehicleId: capacityOf(l.vehicleId) >= pax(x) ? l.vehicleId : x.vehicleId })))}>
                {I.check({ width: 14, height: 14 })}{t.sameForAll}
              </button>
            )}
          </section>
        );
      })}
    </>
  );

  const stepExtras = catalog.extras.length === 0 ? <p className="be-section-note">{t.noExtras}</p> : (
    <>
      {legs.map((l, i) => (
        <section key={l.key} className="be-legblock">
          {legs.length > 1 && <h3 className="be-subhead"><span>{t.extrasFor(i + 1)} · {placeLabel(l.from)} → {placeLabel(l.to)}</span></h3>}
          <div className="be-cards be-cards--extras">
            {catalog.extras.map((x) => {
              const q = l.extras[x.id] ?? 0;
              const setQ = (n: number) => update(i, { extras: { ...l.extras, [x.id]: n } });
              return (
                <div key={x.id} className="be-cell">
                  <button type="button" className="be-card be-card--extra" data-selected={q > 0 || undefined} aria-pressed={q > 0} onClick={() => setQ(q > 0 ? 0 : 1)}>
                    <span className="be-card__media be-card__media--wide">
                      {x.imageUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={x.imageUrl} alt="" loading="lazy" />
                        : <span className="be-card__media--empty grid h-full w-full">{I.sparkle()}</span>}
                      {q > 0 && <span className="be-card__badges"><span className="be-badge">{t.added}</span></span>}
                      {q > 0 && <span className="be-card__check">{I.check()}</span>}
                    </span>
                    <span className="be-card__body">
                      <span className="be-card__head">
                        <span className="be-card__name be-card__name--sm">{x.name}</span>
                        <span className="be-card__price be-card__price--row">{x.price === 0 ? <strong className="be-card__free">{t.free}</strong> : <><small>{currency}</small><strong>{fmt(x.price)}</strong></>}</span>
                      </span>
                      {x.description && <span className="be-card__desc">{x.description}</span>}
                    </span>
                    <span className="be-card__foot">
                      <small>{t.perItem} · <b>{t.fees}</b></small>
                      {q === 0 && <span className="be-pill-select" aria-hidden="true">{t.select}</span>}
                    </span>
                  </button>
                  {q > 0 && (
                    <div className="be-under be-enter">
                      <Counter light label={`${t.quantity} · ${x.name}`} value={q} min={1} max={x.maxQty} onChange={setQ} lessLabel={t.lessOf(x.name)} moreLabel={t.moreOf(x.name)} />
                      {x.price > 0 && q > 1 && <p className="be-under__total">{t.lineTotal}: {fmt(q * x.price)}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );

  // ------------------------------------------------------------------ right pane
  const summary = (
    <div className="be-summary">
      {legs.map((l, i) => {
        const v = catalog.vehicles.find((x) => x.id === l.vehicleId);
        const o = optionOf(l, l.vehicleId);
        const p = o?.total ?? null;
        const minutes = o?.durationMinutes ?? null;
        const lines = Object.entries(l.extras).filter(([, q]) => q > 0);
        return (
          <div key={l.key} className="be-summary__service">
            <div className="be-summary__top">
              <p className="be-summary__eyebrow">{t.summary.service(i + 1)}</p>
              <span className="be-summary__chips"><span className="be-chip">{t.summary.chip}</span>
                <button type="button" className="be-summary__edit" onClick={() => goTo(0)}>{I.pencil()}{t.summary.edit}</button></span>
            </div>
            <p className="be-summary__title">{l.from && l.to ? `${placeLabel(l.from)} → ${placeLabel(l.to)}` : t.summary.title}</p>
            <ul className="be-summary__rows">
              <li>{I.pin()}<span><strong>{t.summary.pickup}:</strong> {l.from ? placeLabel(l.from) : <span className="be-muted">{t.summary.pending}</span>}</span></li>
              <li>{I.pin()}<span><strong>{t.summary.dropoff}:</strong> {l.to ? placeLabel(l.to) : <span className="be-muted">{t.summary.pending}</span>}</span></li>
              <li>{I.calendar()}<span><strong>{t.summary.date}:</strong> {l.date ? fmtDate(l.date) : <span className="be-muted">{t.summary.pending}</span>}</span></li>
              <li>{I.clock()}<span><strong>{t.summary.time}:</strong> {l.time || <span className="be-muted">{t.summary.pending}</span>}</span></li>
              <li>{I.car()}<span><strong>{t.summary.vehicle}:</strong> {v ? `${v.name} · ${t.seats(v.capacityPax)}` : <span className="be-muted">{t.summary.pending}</span>}</span></li>
              <li>{I.users()}<span><strong>{t.summary.passengers}:</strong> {t.summary.adults(l.adults)}{l.children > 0 ? `, ${t.summary.children(l.children)}` : ""} · {t.bags(l.luggage)}</span></li>
              {minutes ? <li>{I.timer()}<span><strong>{t.summary.travel}:</strong> {t.summary.minutes(minutes)}</span></li> : null}
            </ul>
            {(v || lines.length > 0) && (
              <div className="be-summary__lines">
                {v && <div className="be-summary__line"><span>{t.summary.vehicleLine} · {v.name}</span><strong>{p === null ? t.onRequest : fmt(p)}</strong></div>}
                {lines.map(([id, q]) => { const x = extraOf(id); return x ? <div key={id} className="be-summary__line"><span>{x.name} × {q}</span><strong>{x.price === 0 ? t.free : `+${fmt(q * x.price)}`}</strong></div> : null; })}
              </div>
            )}
          </div>
        );
      })}
      {legs.some((l) => l.vehicleId) ? (
        <>
          <div className="be-summary__total"><span>{total === null ? t.summary.estimated : t.summary.total}</span><strong>{total === null ? "—" : fmt(total)}</strong></div>
          <p className="be-summary__fees">{total === null ? t.summary.tbcTotal : t.fees}</p>
        </>
      ) : (
        <div className="be-summary__lines"><p className="be-summary__title m-0">{t.summary.selectVehicle}</p><p className="be-summary__hint m-0">{t.summary.priceUpdates}</p></div>
      )}
      <div className="be-summary__nav">
        <span>{I.pencil()}{t.summary.editLinks}</span>
        {t.summary.links.map((label, i) => <button key={label} type="button" onClick={() => goTo(i)} disabled={i > step && !reachable(i)}>{label}</button>)}
      </div>
    </div>
  );

  const mapData = mapKey ? maps[mapKey] ?? null : null;
  const shownQuote = quoteOf(shown);
  const zone = shownQuote && shownQuote !== "loading" ? [shownQuote.fromArea, shownQuote.toArea].filter(Boolean).join(" → ") : "";
  const routeCard = (
    <div className="be-routecard">
      <RouteMap data={mapData} center={catalog.center} label={shown.from && shown.to ? `${placeLabel(shown.from)} → ${placeLabel(shown.to)}` : t.route.title} />
      {shown.from && shown.to ? (
        <div className="be-routecard__strip" aria-live="polite">
          <span className="be-routecard__route">{placeLabel(shown.from)} <i>→</i> {placeLabel(shown.to)}</span>
          {mapData?.km || mapData?.minutes
            ? <span className="be-routecard__facts">{mapData.km ? `${Math.round(mapData.km)} km` : ""}{mapData.km && mapData.minutes ? " · " : ""}{mapData.minutes ? t.summary.minutes(mapData.minutes) : ""} {t.route.approx}{zone ? ` · ${t.route.zone(zone)}` : ""}</span>
            : <span className="be-routecard__facts be-routecard__facts--muted">{zone ? t.route.zone(zone) : t.route.manual}</span>}
        </div>
      ) : <p className="be-routecard__tag">{t.route.hint}</p>}
    </div>
  );

  return (
    <>
      {top}
      <div className="be-shell be-frame">
        <section className="be-pane be-pane--main" aria-labelledby={`${uid}-title`}>
          <div ref={scroller} className="be-scroll">
            <div key={step} className="be-enter">
              <div className="be-step-head">
                <p className="be-eyebrow">{head.eyebrow}</p>
                <h1 id={`${uid}-title`} className="be-title">{head.title}<em>{head.em}</em></h1>
                <p className="be-lead">{head.lead}</p>
              </div>
              {step === 0 && stepRoute}
              {step === 1 && stepVehicle}
              {step === 2 && stepExtras}
              {error && <p role="alert" className="be-error">{error}</p>}
            </div>
          </div>
          <div className="be-foot">
            <div className="be-actions">
              {step > 0 ? <button type="button" className="be-btn-secondary" onClick={() => goTo(step - 1)}>{I.arrowLeft()}{t.back}</button> : <span />}
              <div className="be-actions__end">
                <GlassButton tone="gold" onClick={next} disabled={pending} className={missing ? "be-next--blocked" : undefined}
                  aria-describedby={missing ? `${uid}-missing` : undefined} icon={step < 2 ? I.arrowRight() : I.check()}>
                  {step === 2 && editing ? t.nextEdit : t.next[step]}
                </GlassButton>
                {missing && <p id={`${uid}-missing`} className="be-missing" data-attempted={attempted[step] || undefined} role="status" aria-live="polite">{t.missing}{missing}</p>}
              </div>
            </div>
          </div>
        </section>
        <aside ref={aside} className="be-pane be-pane--aside">
          <div className={step === 0 ? "be-aside__map" : "flex flex-col gap-3"}>
            {step === 0 && routeCard}
            {step > 0 && summary}
            {step > 0 && <p className="be-aside__note">{t.summary.priceUpdates}</p>}
          </div>
        </aside>
      </div>
    </>
  );
}

/** Child age: "—" until chosen; − picks 0, + picks 1 from empty, then steps 0–11. */
function AgeCounter({ label, value, onChange, invalid, years }: { label: string; value: number | null; onChange: (v: number) => void; invalid?: boolean; years: (n: number) => string }) {
  const id = useId();
  return (
    <Field label={label} required labelId={`${id}-l`}>
      <div className="be-counter" role="group" aria-labelledby={`${id}-l`} data-invalid={invalid || undefined}>
        <button type="button" onClick={() => onChange(value === null ? 0 : Math.max(0, value - 1))} disabled={value === 0} aria-label={`− ${label}`}>{I.minus()}</button>
        <output aria-live="polite">{value === null ? "—" : years(value)}</output>
        <button type="button" onClick={() => onChange(value === null ? 1 : Math.min(11, value + 1))} disabled={value === 11} aria-label={`+ ${label}`}>{I.plus()}</button>
      </div>
    </Field>
  );
}
