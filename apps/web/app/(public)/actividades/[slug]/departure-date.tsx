"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Field, I, revealPopover, useDismiss } from "../../reservar/_engine/ui";

// The date field of the activity panel: the engine's calendar pop-over, where only the days with a departure
// (and seats left) can be chosen. Days are plain calendar days in the business's zone (YYYY-MM-DD strings).

type Ymd = { y: number; m: number; d: number };
const parse = (s: string): Ymd | null => {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) } : null;
};
const iso = (v: Ymd) => `${v.y}-${String(v.m + 1).padStart(2, "0")}-${String(v.d).padStart(2, "0")}`;
const utc = (v: Ymd) => new Date(Date.UTC(v.y, v.m, v.d));
const fromUtc = (t: Date): Ymd => ({ y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() });
const addDays = (v: Ymd, n: number) => fromUtc(new Date(utc(v).getTime() + n * 86400000));
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const monthKey = (y: number, m: number) => y * 12 + m;

const fmtCache = new Map<string, Intl.DateTimeFormat>();
const fmt = (tag: string, kind: "dow" | "month" | "long" | "short") => {
  const k = `${tag}|${kind}`;
  let f = fmtCache.get(k);
  if (!f) {
    const o: Record<typeof kind, Intl.DateTimeFormatOptions> = {
      dow: { weekday: "short", timeZone: "UTC" },
      month: { month: "long", timeZone: "UTC" },
      long: { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
      short: { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
    };
    f = new Intl.DateTimeFormat(tag, o[kind]);
    fmtCache.set(k, f);
  }
  return f;
};

export function DepartureDate({ label, value, onChange, available, today, last, locale, placeholder, invalid, labels }: {
  label: string; value: string; onChange: (v: string) => void; available: Set<string>; today: string; last: string;
  locale: "es" | "en"; placeholder: string; invalid?: boolean;
  labels: { prev: string; next: string; legend: string; none: string };
}) {
  const id = useId();
  const tag = locale === "es" ? "es-CR" : "en-US";
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ y: number; m: number }>(() => {
    const t = parse(today) ?? { y: 2026, m: 0, d: 1 };
    return { y: t.y, m: t.m };
  });
  const [focus, setFocus] = useState<Ymd | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, wrap, close);

  useEffect(() => {
    if (open && focus) grid.current?.querySelector<HTMLButtonElement>(`[data-iso="${iso(focus)}"]`)?.focus({ preventScroll: true });
  }, [open, focus]);

  const first = [...available].sort()[0] ?? null;
  const minV = parse(today)!;
  const maxV = parse(last)!;
  const ok = (v: Ymd) => available.has(iso(v));

  const openCal = () => {
    const start = parse(value) ?? (first ? parse(first) : null) ?? minV;
    setView({ y: start.y, m: start.m });
    setFocus(ok(start) ? start : null);
    setOpen(true);
    requestAnimationFrame(() => revealPopover(pop.current));
  };
  const pick = (v: Ymd) => {
    if (!ok(v)) return;
    onChange(iso(v));
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };
  /** Keyboard: the next day with a departure in that direction. */
  const move = (from: Ymd, step: number) => {
    let t = from;
    for (let n = 0; n < 400; n++) {
      t = addDays(t, step);
      if (utc(t) < utc(minV) || utc(t) > utc(maxV)) return;
      if (ok(t)) { setFocus(t); setView({ y: t.y, m: t.m }); return; }
    }
  };
  const shiftMonth = (n: number) => {
    const t = new Date(Date.UTC(view.y, view.m + n, 1));
    setView({ y: t.getUTCFullYear(), m: t.getUTCMonth() });
  };

  const sel = parse(value);
  const weekStart = locale === "es" ? 1 : 0;
  const lead = (new Date(Date.UTC(view.y, view.m, 1)).getUTCDay() - weekStart + 7) % 7;
  const total = daysIn(view.y, view.m);
  const dow = open ? Array.from({ length: 7 }, (_, i) => fmt(tag, "dow").format(new Date(Date.UTC(2024, 0, 7 + ((i + weekStart) % 7))))) : [];
  const monthName = open ? fmt(tag, "month").format(new Date(Date.UTC(view.y, view.m, 1))) : "";
  const display = sel ? fmt(tag, "short").format(utc(sel)) : null;
  const prevDisabled = monthKey(view.y, view.m) <= monthKey(minV.y, minV.m);
  const nextDisabled = monthKey(view.y, view.m) >= monthKey(maxV.y, maxV.m);
  const inMonth = Array.from({ length: total }, (_, i) => ({ y: view.y, m: view.m, d: i + 1 }));
  const anyInMonth = inMonth.some(ok);
  const focusInView = !!focus && focus.y === view.y && focus.m === view.m;
  const firstOk = inMonth.findIndex(ok);

  return (
    <Field label={label} required labelId={`${id}-l`}>
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
          <div ref={pop} className="be-pop be-cal ac-cal" role="dialog" aria-modal="false" aria-label={label}>
            <div className="be-cal__head">
              <button type="button" className="be-cal__nav" onClick={() => shiftMonth(-1)} disabled={prevDisabled} aria-label={labels.prev}>{I.chevLeft()}</button>
              <p className="be-cal__month" aria-live="polite">{monthName}<span>{view.y}</span></p>
              <button type="button" className="be-cal__nav" onClick={() => shiftMonth(1)} disabled={nextDisabled} aria-label={labels.next}>{I.chevRight()}</button>
            </div>
            <div ref={grid} className="be-cal__grid" role="grid" aria-label={`${monthName} ${view.y}`}
              onKeyDown={(e) => {
                if (!focus) return;
                const k = e.key;
                const step = k === "ArrowLeft" || k === "ArrowUp" ? -1 : k === "ArrowRight" || k === "ArrowDown" ? 1 : 0;
                if (step) { e.preventDefault(); move(focus, step); }
                else if (k === "Enter" || k === " ") { e.preventDefault(); pick(focus); }
              }}
            >
              {dow.map((d) => <span key={d} className="be-cal__dow" role="columnheader">{d.replace(".", "")}</span>)}
              {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} className="be-cal__day be-cal__day--blank" aria-hidden="true" />)}
              {inMonth.map((v, i) => {
                const s = iso(v);
                const can = ok(v);
                const isFocus = !!focus && iso(focus) === s;
                return (
                  <button
                    key={s} type="button" className="be-cal__day" data-iso={s} role="gridcell" data-avail={can || undefined}
                    aria-selected={sel ? iso(sel) === s : false} data-today={today === s || undefined}
                    disabled={!can} tabIndex={can && (isFocus || (!focusInView && i === firstOk)) ? 0 : -1}
                    aria-label={fmt(tag, "long").format(utc(v))}
                    onClick={() => pick(v)} onFocus={() => { if (!isFocus) setFocus(v); }}
                  >{i + 1}</button>
                );
              })}
            </div>
            <p className="be-cal__foot"><span className="ac-cal__legend"><i aria-hidden="true" />{anyInMonth ? labels.legend : labels.none}</span></p>
          </div>
        )}
      </div>
    </Field>
  );
}
