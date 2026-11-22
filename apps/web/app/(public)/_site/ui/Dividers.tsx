import type { ReactNode } from "react";
import { cx } from "./utils";

/**
 * Transitions between sections. `Ribbon` is a slightly tilted band in the brand's accent that scrolls a list
 * of words (destinations, promises) across the seam; `Wave` is a soft double wave that hands one section's
 * color to the next. Both are decorative: hidden from assistive technology, and still under reduced motion.
 */

const Spark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 0Q13.3 10.7 24 12Q13.3 13.3 12 24Q10.7 13.3 0 12Q10.7 10.7 12 0Z" fill="currentColor" /></svg>
);

export function Ribbon({ items, tone = "accent", className }: { items: string[]; tone?: "accent" | "deep"; className?: string }) {
  if (!items.length) return null;
  // Repeat until one copy is wide enough, then twice for a seamless loop.
  const one: string[] = [];
  while (one.length < 12) one.push(...items);
  const row = (key: string) => one.map((w, i) => <span className="site-ribbon__item" key={`${key}${i}`}>{w}<Spark /></span>);
  return (
    <div className={cx("site-ribbon", tone === "deep" && "site-ribbon--deep", className)} aria-hidden="true">
      <div className="site-ribbon__track">{row("a")}{row("b")}</div>
    </div>
  );
}

export function Wave({ from, to, flip, className }: { from: string; to: string; flip?: boolean; className?: string }) {
  return (
    <div className={cx("site-wave", flip && "site-wave--flip", className)} style={{ background: from }} aria-hidden="true">
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" focusable="false">
        <path d="M0 70C180 22 360 18 540 52S900 118 1080 92S1320 30 1440 44V120H0Z" fill={to} opacity=".35" />
        <path d="M0 88C200 50 380 46 560 74S920 122 1100 100S1330 58 1440 70V120H0Z" fill={to} />
      </svg>
    </div>
  );
}

/** A labelled item for the promise grid. */
export function PromiseItem({ n, icon, title, sub }: { n: number; icon: ReactNode; title: string; sub: string }) {
  return (
    <li className="site-promise__item">
      <span className="site-promise__icon" aria-hidden="true">{icon}</span>
      <span className="site-promise__num" aria-hidden="true">{String(n).padStart(2, "0")}</span>
      <strong>{title}</strong>
      <small>{sub}</small>
    </li>
  );
}
