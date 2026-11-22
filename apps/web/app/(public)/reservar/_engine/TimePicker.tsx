"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Field, I, revealPopover, useDismiss } from "./ui";

const pad = (n: number) => String(n).padStart(2, "0");
const STEP = 5;

/**
 * 24-hour pickup time (stepper): hour ±1 (wraps 00–23), minutes ±5 on a
 * 5-minute grid, both boxes typeable; the value is committed only with OK.
 */
export function TimePicker({ label, required, value, onChange, placeholder, invalid, hint, labels, up }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder: string; invalid?: boolean; hint?: string;
  labels: { title: string; hour: string; minute: string; up: string; down: string; cancel: string; ok: string };
  /** Open above the field (used near the bottom of a pane). */
  up?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  // Hour and minute live in ONE state so a minute step that crosses the hour updates both atomically.
  const [hm, setHm] = useState({ h: "12", m: "00" });
  const h = hm.h, m = hm.m;
  const setH = (v: string) => setHm((x) => ({ ...x, h: v }));
  const setM = (v: string) => setHm((x) => ({ ...x, m: v }));
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, wrap, close);

  const openPicker = () => {
    const match = value.match(/^(\d{2}):(\d{2})$/);
    setHm({ h: match ? match[1]! : "12", m: match ? match[2]! : "00" });
    setOpen(true);
    requestAnimationFrame(() => revealPopover(pop.current));
  };
  const clampH = (v: string) => Math.min(23, Math.max(0, Number(v) || 0));
  const clampM = (v: string) => Math.min(59, Math.max(0, Number(v) || 0));
  const hourNum = () => clampH(h);
  const minNum = () => clampM(m);
  // Functional (pure) updates: rapid clicks always step from the latest value, never a stale one.
  const stepHour = (d: number) => setHm((x) => ({ ...x, h: pad((clampH(x.h) + d + 24) % 24) }));
  const stepMin = (d: number) => setHm((x) => {
    const v = clampM(x.m);
    let next = d > 0 ? Math.floor(v / STEP) * STEP + STEP : Math.ceil(v / STEP) * STEP - STEP;
    let hour = clampH(x.h);
    if (next >= 60) { next = 0; hour = (hour + 1) % 24; }
    if (next < 0) { next = 55; hour = (hour + 23) % 24; }
    return { h: pad(hour), m: pad(next) };
  });
  const commit = () => { onChange(`${pad(hourNum())}:${pad(minNum())}`); setOpen(false); trigger.current?.focus({ preventScroll: true }); };

  const box = (val: string, set: (s: string) => void, step: (d: number) => void, name: string) => (
    <div className="be-time__col">
      <button type="button" className="be-time__chev" onClick={() => step(1)} aria-label={`${labels.up} ${name}`}>{I.chevUp()}</button>
      <input
        className="be-time__box" inputMode="numeric" maxLength={2} value={val} aria-label={name}
        onChange={(e) => set(e.target.value.replace(/\D/g, "").slice(0, 2))}
        onBlur={() => set(pad(Math.min(name === labels.hour ? 23 : 59, Number(val) || 0)))}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") { e.preventDefault(); step(1); }
          else if (e.key === "ArrowDown") { e.preventDefault(); step(-1); }
          else if (e.key === "Enter") { e.preventDefault(); commit(); }
        }}
      />
      <button type="button" className="be-time__chev" onClick={() => step(-1)} aria-label={`${labels.down} ${name}`}>{I.chevDown()}</button>
    </div>
  );

  return (
    // The hint ("24 h · local time") sits beside the label: one line less per row.
    <Field label={label} required={required} labelId={`${id}-l`} small={hint}>
      <div ref={wrap} className="relative">
        <button
          ref={trigger} type="button" className="be-control" data-open={open || undefined} aria-haspopup="dialog" aria-expanded={open}
          aria-labelledby={`${id}-l ${id}-v`} data-invalid={invalid || undefined} onClick={() => (open ? setOpen(false) : openPicker())}
        >
          {I.clock({ className: "be-control__icon" })}
          <span id={`${id}-v`} className={`be-control__value ${value ? "" : "be-placeholder"}`}>{value || placeholder}</span>
          {I.chevDown({ className: "be-control__chev" })}
        </button>
        {open && (
          <div ref={pop} className={`be-pop be-time ${up ? "be-pop--up" : ""}`} role="dialog" aria-label={labels.title}>
            <p className="be-time__title">{labels.title}</p>
            <div className="be-time__row">
              {box(h, setH, stepHour, labels.hour)}
              <span className="be-time__colon" aria-hidden="true">:</span>
              {box(m, setM, stepMin, labels.minute)}
            </div>
            <div className="be-time__actions">
              <button type="button" className="be-btn-ghost-sm" onClick={() => { setOpen(false); trigger.current?.focus({ preventScroll: true }); }}>{labels.cancel}</button>
              <button type="button" className="be-btn-gold-sm" onClick={commit}>{labels.ok}</button>
            </div>
          </div>
        )}
      </div>
    </Field>
  );
}
