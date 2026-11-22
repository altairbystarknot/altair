"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./utils";

/**
 * The hero's layered scroll (photo slow, copy fast), without GSAP: a passive scroll listener writes one
 * eased progress value (`--hp`, 0 → 1 across the hero's height) and CSS turns it into transforms and
 * opacity. Desktop (≥ 900px) only, off under reduced motion — as in the design system.
 */
export function HeroMotion() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const hero = marker.current?.closest<HTMLElement>("[data-lg-hero-root]");
    if (!hero) return;
    const mq = window.matchMedia("(min-width: 900px)");
    let raf = 0;
    let current = 0;
    let target = 0;
    let active = false;

    const read = () => {
      const h = hero.offsetHeight || 1;
      target = Math.min(1, Math.max(0, window.scrollY / h));
    };
    const frame = () => {
      // Light smoothing, the equivalent of the design system's `scrub: 0.8`.
      current += (target - current) * 0.18;
      if (Math.abs(target - current) < 0.0005) current = target;
      hero.style.setProperty("--hp", current.toFixed(4));
      raf = current === target ? 0 : requestAnimationFrame(frame);
    };
    const onScroll = () => {
      read();
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const enable = () => {
      const on = mq.matches && !prefersReducedMotion();
      if (on === active) return;
      active = on;
      if (on) {
        hero.setAttribute("data-motion", "");
        read();
        current = target;
        hero.style.setProperty("--hp", current.toFixed(4));
        window.addEventListener("scroll", onScroll, { passive: true });
      } else {
        hero.removeAttribute("data-motion");
        hero.style.removeProperty("--hp");
        window.removeEventListener("scroll", onScroll);
      }
    };
    enable();
    mq.addEventListener("change", enable);
    return () => {
      mq.removeEventListener("change", enable);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <span ref={marker} hidden />;
}
