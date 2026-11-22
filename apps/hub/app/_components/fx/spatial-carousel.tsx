"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

export type SpatialItem = { src: string; alt: string; title: string; caption: string; url: string };

/**
 * The product's real screens floating on a curved arc, like windows in a spatial interface: the one in
 * front is large and sharp, its neighbours turn away into depth. Arrows, the dots, a swipe, the keyboard or
 * a click on a side window brings another one forward; it also advances on its own until touched.
 */
export function SpatialCarousel({ items, labels }: { items: SpatialItem[]; labels: { prev: string; next: string; of: string; region: string; sample: string } }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const n = items.length;
  const go = useCallback((d: number) => setIndex((i) => (i + d + n) % n), [n]);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => go(1), 5200);
    return () => clearInterval(t);
  }, [paused, go]);

  const offsetOf = (i: number) => {
    let o = i - index;
    if (o > n / 2) o -= n;
    if (o < -n / 2) o += n;
    return o;
  };
  const current = items[index]!;

  return (
    <div
      className="h-spatial"
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "ArrowRight") { setPaused(true); go(1); } if (e.key === "ArrowLeft") { setPaused(true); go(-1); } }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onPointerDown={(e) => { drag.current = { x: e.clientX, moved: false }; }}
      onPointerMove={(e) => { if (drag.current && Math.abs(e.clientX - drag.current.x) > 8) drag.current.moved = true; }}
      onPointerUp={(e) => {
        const d = drag.current;
        drag.current = null;
        if (d && d.moved) { const dx = e.clientX - d.x; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); }
      }}
    >
      <div className="h-spatial-stage">
        {items.map((it, i) => {
          const o = offsetOf(i);
          const a = Math.abs(o);
          const style = { "--o": o, "--a": a, zIndex: 10 - a } as CSSProperties;
          return (
            <button
              key={it.src}
              type="button"
              className={`h-spatial-card${o === 0 ? " is-front" : ""}`}
              style={style}
              aria-hidden={a > 2}
              tabIndex={o === 0 ? -1 : a > 2 ? -1 : 0}
              aria-label={o === 0 ? undefined : it.title}
              onClick={() => { if (!drag.current?.moved && o !== 0) { setPaused(true); setIndex(i); } }}
            >
              <span className="h-spatial-chrome" aria-hidden="true">
                <i /><i /><i />
                <span>{it.url}</span>
              </span>
              <span className="h-spatial-view">
                <Image src={it.src} alt={o === 0 ? it.alt : ""} fill sizes="(max-width: 900px) 86vw, 920px" draggable={false} priority={i === 0} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="h-spatial-dock" aria-live="polite">
        <button type="button" className="h-dockbtn" onClick={() => { setPaused(true); go(-1); }} aria-label={labels.prev}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div className="h-spatial-now">
          <b>{current.title}</b>
          <span>{current.caption}</span>
        </div>
        <span className="h-spatial-count">{index + 1} {labels.of} {n}</span>
        <button type="button" className="h-dockbtn" onClick={() => { setPaused(true); go(1); }} aria-label={labels.next}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
      <div className="h-spatial-dots" aria-hidden="true">
        {items.map((it, i) => <i key={it.src} className={i === index ? "on" : undefined} />)}
      </div>
      <p className="h-spatial-note">{labels.sample}</p>
    </div>
  );
}
