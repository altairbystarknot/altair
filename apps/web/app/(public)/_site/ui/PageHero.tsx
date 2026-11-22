import type { CSSProperties, ReactNode } from "react";
import type { ImageRef } from "./types";
import { Picture } from "./Picture";
import { tornPath, tornPoints, type TornShape } from "./torn-geometry";
import { Caps, Eyebrow, GlassTitle } from "./Typography";

export interface PageHeroProps {
  image: ImageRef;
  /** The photograph carries meaning now that nothing covers it. */
  alt: string;
  /** The wave of the photograph's bottom edge, seeded per page. */
  wave: { shape: TornShape; seed: string };
  /** object-position of the photograph (default: centre, slightly low). */
  position?: string;
}

/**
 * The inner-page hero: the page's photograph, clean — no veil, no card, no text over it. The transparent
 * bar sits on top; the title lives in the first section below (PageTitle). The photograph's bottom edge is a
 * paper wave pointing down, used as a mask. It is the page's first, large image.
 */
export function PageHero({ image, alt, wave, position }: PageHeroProps) {
  const edge = tornPath(tornPoints(wave.shape, wave.seed), "down", 100);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 100' preserveAspectRatio='none'><path d='${edge}' fill='#000'/></svg>`;
  const style = { "--hero-wave": `url("data:image/svg+xml,${encodeURIComponent(svg)}")` } as CSSProperties;
  // Phones show a shorter hero (about 76vw tall), so the photograph renders ~76vw x its aspect wide.
  const sizes = `(max-width: 767px) ${Math.ceil(76 * (image.width / image.height))}vw, 100vw`;
  return (
    <div className="site-page-hero" data-sticky-sentinel="" style={style}>
      <Picture image={image} alt={alt} sizes={sizes} priority className="site-page-hero__img" style={position ? { objectPosition: position } : undefined} />
    </div>
  );
}

export interface PageTitleProps {
  title: string;
  id?: string;
  eyebrow?: string;
  /** Small Cinzel line under the title (the vehicle's facts, a service's reach…). */
  caps?: ReactNode;
  children?: ReactNode;
}

/** The page's h1 at the top of the first paper section: eyebrow, the system's glass title (dark), caps. */
export function PageTitle({ title, id, eyebrow, caps, children }: PageTitleProps) {
  return (
    <header className="site-page-title">
      {eyebrow && <Eyebrow lined>{eyebrow}</Eyebrow>}
      <GlassTitle as="h1" id={id} text={title} tone="dark" wrap />
      {caps && <Caps gold className="site-page-title__caps">{caps}</Caps>}
      {children}
    </header>
  );
}
