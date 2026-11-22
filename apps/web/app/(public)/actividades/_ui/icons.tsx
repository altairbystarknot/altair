import type { ReactNode, SVGProps } from "react";

// Line icons for the activity pages (stroke, currentColor). Server- and client-safe.

type P = SVGProps<SVGSVGElement>;
const svg = (p: P, d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...p}>
    {d}
  </svg>
);

export const AI = {
  pin: (p: P = {}) => svg(p, <><path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" /><circle cx="12" cy="10" r="2.2" /></>),
  clock: (p: P = {}) => svg(p, <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  hourglass: (p: P = {}) => svg(p, <><path d="M7 3.5h10M7 20.5h10" /><path d="M8 3.5c0 4 4 5.5 4 8.5s-4 4.5-4 8.5M16 3.5c0 4-4 5.5-4 8.5s4 4.5 4 8.5" /></>),
  mountain: (p: P = {}) => svg(p, <><path d="m3 19.5 6.5-11 4 6.5 2.5-3.5 5 8H3Z" /><path d="m8 11 1.5 1.5L11 11" /></>),
  age: (p: P = {}) => svg(p, <><circle cx="12" cy="7.5" r="3.2" /><path d="M5.5 20c0-3.6 2.9-6.2 6.5-6.2s6.5 2.6 6.5 6.2" /></>),
  users: (p: P = {}) => svg(p, <><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><circle cx="17" cy="9.5" r="2.2" /><path d="M15.5 14.2c2.8 0 5 1.8 5 4.3" /></>),
  car: (p: P = {}) => svg(p, <><path d="M4 14 6 8.5A2 2 0 0 1 8 7h8a2 2 0 0 1 2 1.5L20 14v4H4v-4Z" /><circle cx="7.5" cy="17" r="1.4" /><circle cx="16.5" cy="17" r="1.4" /><path d="M5 14h14" /></>),
  shield: (p: P = {}) => svg(p, <><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>),
  check: (p: P = {}) => svg({ strokeWidth: 2.4, ...p }, <path d="m5 12.5 4.5 4.5L19 7.5" />),
  checkCircle: (p: P = {}) => svg(p, <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.2 2.4 2.4 4.6-4.9" /></>),
  bag: (p: P = {}) => svg(p, <><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>),
  calendar: (p: P = {}) => svg(p, <><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>),
  arrowRight: (p: P = {}) => svg(p, <path d="M5 12h14M13 6l6 6-6 6" />),
  arrowLeft: (p: P = {}) => svg(p, <path d="M19 12H5M11 6l-6 6 6 6" />),
  chevLeft: (p: P = {}) => svg(p, <path d="m15 6-6 6 6 6" />),
  chevRight: (p: P = {}) => svg(p, <path d="m9 6 6 6-6 6" />),
  close: (p: P = {}) => svg(p, <path d="M6 6l12 12M18 6 6 18" />),
  search: (p: P = {}) => svg({ strokeWidth: 2.1, ...p }, <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>),
  expand: (p: P = {}) => svg(p, <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />),
  info: (p: P = {}) => svg(p, <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>),
  ticket: (p: P = {}) => svg(p, <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7ZM14 7v10" />),
  compass: (p: P = {}) => svg(p, <><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>),
};
