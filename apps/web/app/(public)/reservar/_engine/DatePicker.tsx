"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Field, I, revealPopover, useDismiss } from "./ui";

type Ymd = { y: number; m: number; d: number }; // m: 0-11
const parse = (s: string): Ymd | null => {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) } : null;
};
const iso = (v: Ymd) => `${v.y}-${String(v.m + 1).padStart(2, "0")}-${String(v.d).padStart(2, "0")}`;
const utc = (v: Ymd) => new Date(Date.UTC(v.y, v.m, v.d));
const fromUtc = (t: Date): Ymd => ({ y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() });
const addDays = (v: Ymd, n: number) => fromUtc(new Date(utc(v).getTime() + n * 86400000));
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

// Date formatters are built once per language and kind: creating one is slow on phones, and the picker
// renders with every change in the engine.
type FmtKind = "dow" | "month" | "long" | "short" | "foot";
const FMT_OPTIONS: Record<FmtKind, Intl.DateTimeFormatOptions> = {
  dow: { weekday: "short", timeZone: "UTC" },
  month: { month: "long", timeZone: "UTC" },
  long: { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
  // Short form so it never gets cut off in the field ("Fri, Nov 20, 2026" / "vie, 20 nov 2026").
  short: { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
  foot: { day: "numeric", month: "short", timeZone: "UTC" },
};
const fmtCache = new Map<string, Intl.DateTimeFormat>();
const fmt = (tag: string, kind: FmtKind) => {
  const k = `${tag}|${kind}`;
  let f = fmtCache.get(k);
  if (!f) { f = new Intl.DateTimeFormat(tag, FMT_OPTIONS[kind]); fmtCache.set(k, f); }
  return f;
};

/** Calendar pop-over (liquid glass). Dates are plain calendar days in the business's time zone. */
export function DatePicker({ label, required, value, onChange, min, locale, placeholder, invalid, labels }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; min?: string; locale: "en" | "es";
  placeholder: string; invalid?: boolean; labels: { prev: string; next: string; earliest: (d: string) => string };
}) {
  const id = useId();
  const tag = locale === "es" ? "es-CR" : "en-US";
  const minV = min ? parse(min) : null;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ y: number; m: number }>({ y: 2026, m: 0 });
  const [focus, setFocus] = useState<Ymd | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, wrap, close);

  // Keyboard focus follows the roving day (DOM focus only; no state is set here).
  useEffect(() => {
    if (open && focus) grid.current?.querySelector<HTMLButtonElement>(`[data-iso="${iso(focus)}"]`)?.focus({ preventScroll: true });
  }, [open, focus]);

  const before = (a: Ymd, b: Ymd | null) => !!b && utc(a) < utc(b);
  const openCal = () => {
    const start = parse(value) ?? minV ?? fromUtc(new Date());
    setView({ y: start.y, m: start.m });
    setFocus(start);
    setOpen(true);
    requestAnimationFrame(() => revealPopover(pop.current));
  };
  const pick = (v: Ymd) => {
    if (before(v, minV)) return;
    onChange(iso(v));
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };
  const move = (v: Ymd) => { const t = before(v, minV) ? (minV as Ymd) : v; setFocus(t); setView({ y: t.y, m: t.m }); };
  const shiftMonth = (n: number) => {
    const t = new Date(Date.UTC(view.y, view.m + n, 1));
    setView({ y: t.getUTCFullYear(), m: t.getUTCMonth() });
  };

  const sel = parse(value);
  const today = fromUtc(new Date());
  const weekStart = locale === "es" ? 1 : 0;
  const first = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
  const lead = (first - weekStart + 7) % 7;
  const total = daysIn(view.y, view.m);
  // The calendar itself is only worked out while it is open.
  const dow = open ? Array.from({ length: 7 }, (_, i) => fmt(tag, "dow").format(new Date(Date.UTC(2024, 0, 7 + ((i + weekStart) % 7))))) : [];
  const monthName = open ? fmt(tag, "month").format(new Date(Date.UTC(view.y, view.m, 1))) : "";
  const longFmt = fmt(tag, "long");
  const display = sel ? fmt(tag, "short").format(utc(sel)) : null;
  const prevDisabled = !!minV && (view.y < minV.y || (view.y === minV.y && view.m <= minV.m));
  // One day is always reachable with Tab, even after paging months with the arrows.
  const focusInView = !!focus && focus.y === view.y && focus.m === view.m;
  const firstEnabled = Array.from({ length: total }, (_, i) => i).find((i) => !before({ y: view.y, m: view.m, d: i + 1 }, minV)) ?? 0;

  return (
    <Field label={label} required={required} labelId={`${id}-l`}>
      <div ref={wrap} className="relative">
        <button
          ref={trigger} type="button" className="be-control" data-open={open || undefined} aria-haspopup="dialog" aria-expanded={open}
          aria-labelledby={`${id}-l ${id}-v`} data-invalid={invalid || undefined} onClick={() => (open ? setOpen(false) : openCal())}
        >
          {I.calendar({ className: "be-control__icon" })}
          <span id={`${id}-v`} className={`be-control__value ${display ? "" : "be-placeholder"}`}>{display ?? placeholder}</span>
          {I.chevDown({ className: "be-control__chev" })}
        </button>
        {open && (
          <div ref={pop} className="be-pop be-cal" role="dialog" aria-modal="false" aria-label={label}>
            <div className="be-cal__head">
              <button type="button" className="be-cal__nav" onClick={() => shiftMonth(-1)} disabled={prevDisabled} aria-label={labels.prev}>{I.chevLeft()}</button>
              <p className="be-cal__month" aria-live="polite">{monthName}<span>{view.y}</span></p>
              <button type="button" className="be-cal__nav" onClick={() => shiftMonth(1)} aria-label={labels.next}>{I.chevRight()}</button>
            </div>
            <div ref={grid} className="be-cal__grid" role="grid" aria-label={`${monthName} ${view.y}`}
              onKeyDown={(e) => {
                if (!focus) return;
                const k = e.key;
                const delta = k === "ArrowLeft" ? -1 : k === "ArrowRight" ? 1 : k === "ArrowUp" ? -7 : k === "ArrowDown" ? 7 : 0;
                if (delta) { e.preventDefault(); move(addDays(focus, delta)); }
                else if (k === "PageUp" || k === "PageDown") {
                  e.preventDefault();
                  const t = new Date(Date.UTC(focus.y, focus.m + (k === "PageUp" ? -1 : 1), 1));
                  move({ y: t.getUTCFullYear(), m: t.getUTCMonth(), d: Math.min(focus.d, daysIn(t.getUTCFullYear(), t.getUTCMonth())) });
                } else if (k === "Enter" || k === " ") { e.preventDefault(); pick(focus); }
              }}
            >
              {dow.map((d) => <span key={d} className="be-cal__dow" role="columnheader">{d.replace(".", "")}</span>)}
              {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} className="be-cal__day be-cal__day--blank" aria-hidden="true" />)}
              {Array.from({ length: total }, (_, i) => {
                const v = { y: view.y, m: view.m, d: i + 1 };
                const s = iso(v);
                const isFocus = !!focus && iso(focus) === s;
                return (
                  <button
                    key={s} type="button" className="be-cal__day" data-iso={s} role="gridcell"
                    aria-selected={sel ? iso(sel) === s : false} data-today={iso(today) === s || undefined}
                    disabled={before(v, minV)} tabIndex={isFocus || (!focusInView && i === firstEnabled) ? 0 : -1} aria-label={longFmt.format(utc(v))}
                    onClick={() => pick(v)}
                  >{i + 1}</button>
                );
              })}
            </div>
            {minV && <p className="be-cal__foot">{labels.earliest(fmt(tag, "foot").format(utc(minV)))}</p>}
          </div>
        )}
      </div>
    </Field>
  );
}
