"use client";

import { useEffect, useId, type ReactNode, type RefObject, type SVGProps } from "react";

/* ------------------------------------------------------------------ icons (stroke, currentColor) */
type P = SVGProps<SVGSVGElement>;
const svg = (p: P, d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...p}>{d}</svg>
);
export const I = {
  check: (p: P = {}) => svg({ strokeWidth: 2.4, ...p }, <path d="m5 12.5 4.5 4.5L19 7.5" />),
  chevDown: (p: P = {}) => svg(p, <path d="m6 9 6 6 6-6" />),
  chevUp: (p: P = {}) => svg(p, <path d="m6 15 6-6 6 6" />),
  chevLeft: (p: P = {}) => svg(p, <path d="m15 6-6 6 6 6" />),
  chevRight: (p: P = {}) => svg(p, <path d="m9 6 6 6-6 6" />),
  minus: (p: P = {}) => svg({ strokeWidth: 2, ...p }, <path d="M5 12h14" />),
  plus: (p: P = {}) => svg({ strokeWidth: 2, ...p }, <path d="M12 5v14M5 12h14" />),
  search: (p: P = {}) => svg(p, <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></>),
  calendar: (p: P = {}) => svg(p, <><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>),
  clock: (p: P = {}) => svg(p, <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  pin: (p: P = {}) => svg(p, <><path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" /><circle cx="12" cy="10" r="2.2" /></>),
  users: (p: P = {}) => svg(p, <><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><circle cx="17" cy="9.5" r="2.2" /><path d="M15.5 14.2c2.8 0 5 1.8 5 4.3" /></>),
  car: (p: P = {}) => svg(p, <><path d="M4 14 6 8.5A2 2 0 0 1 8 7h8a2 2 0 0 1 2 1.5L20 14v4H4v-4Z" /><circle cx="7.5" cy="17" r="1.4" /><circle cx="16.5" cy="17" r="1.4" /><path d="M5 14h14" /></>),
  plane: (p: P = {}) => svg(p, <><path d="M3 12.5 21 6l-4 14-4.5-5.5L3 12.5Z" /><path d="m12.5 14.5 3-3" /></>),
  timer: (p: P = {}) => svg(p, <><circle cx="12" cy="13" r="7.5" /><path d="M12 9v4l2.5 1.5M9.5 3h5" /></>),
  pencil: (p: P = {}) => svg(p, <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>),
  arrowLeft: (p: P = {}) => svg(p, <path d="M19 12H5M11 6l-6 6 6 6" />),
  arrowRight: (p: P = {}) => svg(p, <path d="M5 12h14M13 6l6 6-6 6" />),
  swap: (p: P = {}) => svg(p, <path d="M7 7h12l-3-3M17 17H5l3 3" />),
  sparkle: (p: P = {}) => svg(p, <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.9L12 18.5l-1.8-5.8L4.5 10.8 10.2 9 12 3.5ZM18.5 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />),
  luggage: (p: P = {}) => svg(p, <><rect x="5" y="7" width="14" height="13" rx="2" /><path d="M9 7V4h6v3M9 20v1M15 20v1" /></>),
  shield: (p: P = {}) => svg(p, <><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>),
  leaf: (p: P = {}) => svg(p, <><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z" /><path d="M5 19c3-4 6-7 10-9" /></>),
  heart: (p: P = {}) => svg(p, <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />),
  info: (p: P = {}) => svg(p, <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>),
  whatsapp: (p: P = {}) => svg(p, <><path d="M4 20l1.3-3.8A8.5 8.5 0 1 1 8.1 19L4 20Z" /><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-.9-.9.9c-1.3-.5-2.4-1.6-2.9-2.9l.9-.9-.9-2H9Z" /></>),
  copy: (p: P = {}) => svg(p, <><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>),
};

/* ------------------------------------------------------------------ outside click + Escape */
/** Closes a pop-over on a pointer press outside `ref` or on Escape. Subscribes only while open. */
export function useDismiss(open: boolean, ref: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [open, ref, onClose]);
}

/** Phones and tablets: a finger, no hover. */
export function isTouch() {
  return typeof window !== "undefined" && window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

/** Brings a freshly opened pop-over fully into view inside its scrolling pane (desktop only).
 *  Phones and tablets never move the page on their own (tapping From or To used to make
 *  the page jump): the list opens where the finger is, and the visitor scrolls if they want more. */
export function revealPopover(el: HTMLElement | null) {
  if (!el || isTouch()) return;
  requestAnimationFrame(() => el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }));
}

/* ------------------------------------------------------------------ field wrapper */
export function Field({ label, htmlFor, required, hint, small, className, children, labelId }: {
  label: ReactNode; htmlFor?: string; required?: boolean; hint?: ReactNode; small?: ReactNode; className?: string; children: ReactNode; labelId?: string;
}) {
  return (
    <div className={`be-field ${className ?? ""}`}>
      {htmlFor
        ? <label className="be-label" htmlFor={htmlFor} id={labelId}>{label}{required && <span className="be-req" aria-hidden="true">*</span>}{small && <small>{small}</small>}</label>
        : <span className="be-label" id={labelId}>{label}{required && <span className="be-req" aria-hidden="true">*</span>}{small && <small>{small}</small>}</span>}
      {children}
      {hint && <p className="be-hint">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ − value + counter */
export function Counter({ label, value, min = 0, max = 99, onChange, small, light, format, lessLabel, moreLabel, required }: {
  label: string; value: number; min?: number; max?: number; onChange: (n: number) => void; small?: ReactNode; light?: boolean;
  format?: (n: number) => string; lessLabel?: string; moreLabel?: string; required?: boolean;
}) {
  const id = useId();
  const body = (
    <div className={`be-counter ${light ? "be-counter--light" : ""}`} role="group" aria-labelledby={`${id}-l`}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={lessLabel ?? `− ${label}`}>{I.minus()}</button>
      <output aria-live="polite" aria-atomic="true">{format ? format(value) : String(value)}</output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={moreLabel ?? `+ ${label}`}>{I.plus()}</button>
    </div>
  );
  if (light) return <div className="be-field"><span id={`${id}-l`} className="sr-only">{label}</span>{body}</div>;
  return <Field label={label} labelId={`${id}-l`} small={small} required={required}>{body}</Field>;
}
