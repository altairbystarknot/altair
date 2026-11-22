"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

declare global {
  interface Window { __lenis?: Lenis }
}

/**
 * Lenis smooth scrolling on desktop (a mouse or trackpad and no reduced-motion preference). Phones and
 * tablets keep their native scrolling. In-page anchors glide; a new page starts at the top.
 */
export function SmoothScroll() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || calm) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: { offset: -96 } });
    window.__lenis = lenis;
    let id = 0;
    const raf = (t: number) => { lenis.raf(t); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis.destroy(); window.__lenis = undefined; };
  }, []);
  // A new page starts at the top (Next.js does the same for native scroll); a link to a section keeps its
  // target, and the first render keeps whatever position the browser restored.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (window.location.hash) return;
    window.__lenis?.scrollTo(0, { immediate: true });
  }, [path]);
  return null;
}
