import type { ElementType, HTMLAttributes, ReactNode } from "react";
import type { ImageRef } from "./types";
import { Picture } from "./Picture";
import { lgDarkTones, type LgTone } from "./tones";
import { cx } from "./utils";

export interface ContainerProps extends HTMLAttributes<HTMLElement> { as?: ElementType; size?: "default" | "wide" | "narrow" | "full"; children?: ReactNode }
/** Centered max-width wrapper (default 1280, wide 1440, narrow 760, full). */
export function Container({ as: Tag = "div", size = "default", className, children, ...rest }: ContainerProps) {
  return <Tag className={cx("lg-container", size === "wide" && "lg-container--wide", size === "narrow" && "lg-container--narrow", size === "full" && "lg-container--full", className)} {...rest}>{children}</Tag>;
}

export interface SectionBackgroundProps {
  /** Processed photograph (cover). Decorative: the section's text carries the meaning. */
  image?: ImageRef;
  /** `sizes` for the photograph. Default full width. */
  sizes?: string;
  /** The page's LCP image (page heroes). */
  priority?: boolean;
  fixed?: boolean;
  /** Keep veils gentle: legibility comes from glass panes, not from dimming the photo. */
  veil?: "dark" | "darker" | "light" | "sunset" | "none";
  fogTop?: boolean;
  fogBottom?: boolean;
  fogSoft?: boolean;
  children?: ReactNode;
}
/** Absolute photo background with optional veil and fog overlays; place as first child of a Section. */
export function SectionBackground({ image, sizes = "100vw", priority, fixed, veil = "none", fogTop, fogBottom, fogSoft, children }: SectionBackgroundProps) {
  return (
    <div className={cx("lg-section__bg", fixed && "lg-section__bg--fixed")} aria-hidden="true">
      {image && <Picture image={image} alt="" sizes={sizes} priority={priority} />}
      {veil !== "none" && <div className={cx("lg-veil", `lg-veil--${veil}`)} />}
      {fogTop && <div className={cx("lg-fog lg-fog--top", fogSoft && "lg-fog--soft")} />}
      {fogBottom && <div className={cx("lg-fog lg-fog--bottom", fogSoft && "lg-fog--soft")} />}
      {children}
    </div>
  );
}

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  tone?: LgTone;
  padding?: "default" | "tight" | "flush";
  /** Marks text tokens for dark backgrounds. Auto for dark tones. */
  onDark?: boolean;
  background?: SectionBackgroundProps;
  container?: ContainerProps["size"] | false;
  children?: ReactNode;
}
/** Page section with tone, optional photo background (+fog/veil) and an inner container. */
export function Section({ as: Tag = "section", tone, padding = "default", onDark, background, container = "default", className, children, ...rest }: SectionProps) {
  const dark = onDark ?? (tone ? lgDarkTones.includes(tone) : !!background && background.veil !== "light" && background.veil !== "none");
  return (
    <Tag className={cx("lg-section", tone && `lg-section--tone-${tone}`, padding === "tight" && "lg-section--tight", padding === "flush" && "lg-section--flush", dark && "lg-on-dark", className)} {...rest}>
      {background && <SectionBackground {...background} />}
      {container === false ? children : <Container size={container}>{children}</Container>}
    </Tag>
  );
}

export interface FeatureItem { icon?: ReactNode; label: ReactNode; sub?: ReactNode }
export interface FeatureListProps extends HTMLAttributes<HTMLUListElement> {
  items: FeatureItem[];
  direction?: "column" | "row";
  divided?: boolean;
  glassIcons?: boolean;
}
/** Circle-icon + tracked-label list (trust signals, differentiators). */
export function FeatureList({ items, direction = "column", divided, glassIcons, className, ...rest }: FeatureListProps) {
  return (
    <ul className={cx("lg-feature-list", direction === "row" && "lg-feature-list--row", divided && "lg-feature-list--divided", className)} {...rest}>
      {items.map((it, i) => (
        <li key={i} className="lg-feature">
          {it.icon && <span className={cx("lg-feature__icon", glassIcons && "lg-feature__icon--glass")}>{it.icon}</span>}
          <span className="lg-feature__label">{it.label}{it.sub && <span className="lg-feature__sub">{it.sub}</span>}</span>
        </li>
      ))}
    </ul>
  );
}

export interface StatProps { value: ReactNode; label: ReactNode }
/** Row of big Cinzel figures with tracked labels. */
export function StatRow({ stats, className }: { stats: StatProps[]; className?: string }) {
  return (
    <div className={cx("lg-stat-row", className)}>
      {stats.map((s, i) => (<div key={i} className="lg-stat"><span className="lg-stat__value">{s.value}</span><span className="lg-stat__label">{s.label}</span></div>))}
    </div>
  );
}
