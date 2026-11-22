import type { CSSProperties, ReactNode } from "react";
import type { ImageRef } from "./types";
import { GlassButton } from "./Glass";
import { GlassNavbar, type GlassNavbarProps } from "./GlassNavbar";
import { HeroMotion } from "./HeroMotion";
import { GlassMenu, MenuProvider, type GlassMenuProps } from "./Menu";
import { Picture } from "./Picture";
import { cx } from "./utils";

export interface HeroSectionProps {
  /** The hero photograph, full bleed — the page's LCP image. */
  background: ImageRef;
  /** Phones: a portrait crop of the same photograph (art direction below 768px). */
  mobileBackground?: ImageRef;
  title: ReactNode;
  slogan?: ReactNode;
  lead?: ReactNode;
  ctaLabel: string;
  ctaHref: string;
  /** Accessible name of the hero region. */
  label: string;
  navbar: GlassNavbarProps;
  menu: GlassMenuProps;
  /** Background colour of the section that follows (the bottom blend). */
  nextBackground?: string;
  /** Target of the skip link. */
  contentId?: string;
  className?: string;
}

/**
 * The hero: the photograph, edge to edge, and nothing between it and the visitor. The logo at the top,
 * MENU on the left, the sections on the right, and the title with its promise and BOOK NOW on the
 * left. The right side is the photograph and nothing else. The BOOK NOW link is plain server HTML; the
 * entrance and the layered parallax are progressive enhancement (CSS + a passive scroll listener).
 */
export function HeroSection({ background, mobileBackground, title, slogan, lead, ctaLabel, ctaHref, label, navbar, menu, nextBackground, contentId = "main-content", className }: HeroSectionProps) {
  const cssVars = (nextBackground ? { "--hero-next-bg": nextBackground } : {}) as CSSProperties;
  return (
    <MenuProvider>
      <section id="top" className={cx("lg-hero lg-on-dark lg-hero--intro", className)} style={cssVars} aria-label={label} data-lg-hero-root="" data-sticky-sentinel="">
        <div className="lg-hero__bg" data-lg-hero="bg" aria-hidden="true">
          <Picture
            image={background}
            alt=""
            sizes={`(min-aspect-ratio: ${background.width}/${background.height}) 100vw, ${Math.ceil((background.width / background.height) * 100)}vh`}
            art={mobileBackground ? { media: "(max-width: 767px)", image: mobileBackground, sizes: `${Math.ceil((mobileBackground.width / mobileBackground.height) * 100)}vh` } : undefined}
            priority
          />
        </div>

        {/* The compact glass frame: the bar, the menu and the copy, sized against the
            frame's own width (it is the lg-frame container), centred over the photograph. */}
        <div className="lg-hero__frame" data-lg-hero="frame">
          <div className="site-hero-rim" aria-hidden="true" />
          <header className="lg-hero__nav" data-lg-hero="nav">
            <GlassNavbar {...navbar} />
          </header>
          <GlassMenu {...menu} />

          <div className="lg-hero__content" id={contentId} tabIndex={-1}>
            <div className="lg-hero__copy" data-lg-hero="copy">
              <h1 className={cx("lg-hero__title", typeof title === "string" && title.length > 14 && "is-long")}>{title}</h1>
              {slogan && <p className="lg-hero__slogan">{slogan}</p>}
              {lead && <p className="lg-hero__lead">{lead}</p>}
              <GlassButton href={ctaHref} tone="glass" shape="soft" className="lg-hero__cta">{ctaLabel}</GlassButton>
            </div>
          </div>
        </div>

        <div className="lg-hero__fade" data-lg-hero="fade" aria-hidden="true" />
        <HeroMotion />
      </section>
    </MenuProvider>
  );
}
