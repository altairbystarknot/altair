"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Elements marked [data-reveal] fade and rise into place (opacity and transform only) as they enter the
 * screen, once. With reduced motion everything is shown at once.
 */
export function Ambient() {
  const path = usePathname();
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [path]);
  return null;
}
