"use client";

import dynamic from "next/dynamic";

// The WebGL scene loads after the page (it never blocks the first paint); until then the hero shows the
// same soft shapes in CSS. Only the home hero uses it.
const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false, loading: () => null });

export function Hero3D() {
  return (
    <div className="h-hero3d" aria-hidden="true">
      <div className="h-hero3d-fallback" />
      <HeroScene />
    </div>
  );
}
