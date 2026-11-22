import type { ElementType, HTMLAttributes, ReactNode } from "react";
import type { ImageRef } from "./types";
import { ArrowRightIcon, LuggageIcon, UsersIcon } from "./icons";
import { linkFor } from "./Glass";
import { Picture } from "./Picture";
import { cx } from "./utils";

export type CardAspect = "tall" | "short" | "square";

export interface FleetCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Vehicle photograph (full-bleed). */
  image: ImageRef;
  imageAlt?: string;
  /** `sizes` for the photograph. */
  imageSizes?: string;
  /** The vehicle's title: its tree name, or model and colour. */
  name: ReactNode;
  /** Set the name in Cinzel, the design system's display face (tree names). */
  displayName?: boolean;
  /** Small line above the name (the design system's model slot). */
  model?: ReactNode;
  /** Small line directly under the name. */
  tag?: ReactNode;
  passengers?: number;
  luggage?: number;
  /** Localized units for the meta line. */
  units?: { passengers: string; luggage: string };
  body?: ReactNode;
  href?: string;
  as?: ElementType;
  cta?: ReactNode;
  /** `tall` 380:470 (default) · `short` 4:3 (grids). */
  aspect?: CardAspect;
  fluid?: boolean;
  glow?: boolean;
  headingLevel?: "h2" | "h3";
  children?: ReactNode;
}

/**
 * The single approved vehicle card: full-bleed photo, dark veil, the name, model and passengers/luggage
 * meta, "View vehicle" link. One design for every vehicle: only the photo and the data change.
 */
export function FleetCard({ image, imageAlt = "", imageSizes = "(max-width: 767px) 84vw, 560px", name, displayName, model, tag, passengers, luggage, units = { passengers: "pax", luggage: "bags" }, body, href, as, cta, aspect = "tall", fluid, glow, headingLevel = "h3", className, children, ...rest }: FleetCardProps) {
  const Tag = (href ? linkFor(href, as) : "article") as ElementType;
  const Heading = headingLevel;
  const meta: Array<{ icon: ReactNode; label: string }> = [];
  if (passengers) meta.push({ icon: <UsersIcon />, label: `${passengers} ${units.passengers}` });
  if (luggage) meta.push({ icon: <LuggageIcon />, label: `${luggage} ${units.luggage}` });
  return (
    <Tag className={cx("lg-card lg-card--fleet lg-card--full", glow && "lg-card--glow", aspect === "short" && "lg-card--aspect-short", aspect === "square" && "lg-card--aspect-square", fluid && "lg-card--fluid", className)} href={href} {...rest}>
      <div className="lg-card__media"><Picture image={image} alt={imageAlt} sizes={imageSizes} draggable={false} /></div>
      <div className="lg-card__veil" aria-hidden="true" />
      <div className="lg-card__body-wrap">
        {model && <p className="lg-card__model">{model}</p>}
        <Heading className={cx("lg-card__title", displayName && "lg-card__title--display")}>{name}</Heading>
        {tag && <p className="lg-card__eyebrow">{tag}</p>}
        {body && <p className="lg-card__body">{body}</p>}
        {meta.length > 0 && <ul className="lg-card__meta">{meta.map((m, i) => (<li key={i}>{m.icon}{m.label}</li>))}</ul>}
        {(cta || href) && (<span className="lg-card__cta">{cta ?? "View vehicle"}<ArrowRightIcon /></span>)}
        {children}
      </div>
    </Tag>
  );
}

/** Static responsive grid of cards (detail/index pages). */
export function CardGrid({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("lg-card-grid", className)} {...rest}>{children}</div>;
}
