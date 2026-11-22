import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cx } from "./utils";

/* ---------------------------------------------------------------------- GlassPanel */
/** `light` frosted white over photos · `dark` navy glass · `ocean` deep-blue tint · `lighter` frosted white for bright surfaces · `gold` warm brand tint. */
export type GlassTone = "light" | "dark" | "ocean" | "lighter" | "gold";
export type GlassRadius = "sm" | "md" | "lg" | "xl" | "pill";

export interface GlassPanelProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  tone?: GlassTone;
  radius?: GlassRadius;
  strong?: boolean;
  padded?: boolean | "sm";
  interactive?: boolean;
  flat?: boolean;
  href?: string;
  children?: ReactNode;
}

/** iOS liquid-glass surface: translucent fill, blur, hairline border, specular highlight. */
export function GlassPanel({ as: Tag = "div", tone = "light", radius = "lg", strong, padded, interactive, flat, className, children, ...rest }: GlassPanelProps) {
  return (
    <Tag
      className={cx(
        "lg-glass",
        tone === "dark" && "lg-glass--dark",
        tone === "ocean" && "lg-glass--ocean",
        tone === "lighter" && "lg-glass--light",
        tone === "gold" && "lg-glass--gold",
        radius === "sm" && "lg-glass--radius-sm",
        radius === "md" && "lg-glass--radius-md",
        radius === "xl" && "lg-glass--radius-xl",
        radius === "pill" && "lg-glass--pill",
        strong && "lg-glass--strong",
        padded === true && "lg-glass--padded",
        padded === "sm" && "lg-glass--padded-sm",
        interactive && "lg-glass--interactive",
        flat && "lg-glass--flat",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Circular icon medallion for the top of a glass panel (services, contact). Decorative. */
export function GlassIcon({ className, children, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("lg-glass__icon", className)} aria-hidden="true" {...rest}>{children}</span>;
}

/* ---------------------------------------------------------------------- GlassButton */
export type GlassButtonTone = "glass" | "white" | "gold" | "dark" | "ocean";
export type GlassButtonShape = "pill" | "rounded" | "soft";
export type GlassButtonSize = "sm" | "md" | "lg";

interface GlassButtonBase {
  tone?: GlassButtonTone;
  shape?: GlassButtonShape;
  size?: GlassButtonSize;
  block?: boolean;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  children?: ReactNode;
  className?: string;
  /** Link element for internal routes. Defaults to next/link for paths starting with "/". */
  as?: ElementType;
}
export type GlassButtonProps = GlassButtonBase &
  (({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>));

/** Internal paths render next/link; anything else (wa.me, tel:) a plain anchor. */
export const linkFor = (href: string | undefined, as?: ElementType): ElementType => as ?? (href && href.startsWith("/") ? Link : "a");

/** The glass pill button (BOOK NOW). Renders a link when `href` is given, a <button> otherwise. */
export function GlassButton(props: GlassButtonProps) {
  const { tone = "glass", shape = "pill", size = "md", block, icon, iconPosition = "end", children, className, as, ...rest } = props as GlassButtonBase & Record<string, unknown>;
  const classes = cx(
    "lg-glass-btn",
    tone !== "glass" && `lg-glass-btn--${tone}`,
    shape === "rounded" && "lg-glass-btn--rounded",
    shape === "soft" && "lg-glass-btn--soft",
    size === "sm" && "lg-glass-btn--sm",
    size === "lg" && "lg-glass-btn--lg",
    block && "lg-glass-btn--block",
    className,
  );
  const inner = (
    <>
      {icon && iconPosition === "start" && <span className="lg-glass-btn__icon" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === "end" && <span className="lg-glass-btn__icon" aria-hidden="true">{icon}</span>}
    </>
  );
  const href = (rest as { href?: string }).href;
  if (typeof href === "string") {
    if (as) {
      const As = as as ElementType;
      return <As className={classes} {...(rest as object)}>{inner}</As>;
    }
    if (href.startsWith("/")) return <Link className={classes} {...(rest as { href: string })}>{inner}</Link>;
    return <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>{inner}</a>;
  }
  return <button type="button" className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>{inner}</button>;
}

export interface BookNowButtonProps extends Omit<GlassButtonBase, "children"> {
  /** The localized booking route, e.g. "/en/booking". */
  href: string;
  label: string;
  tabIndex?: number;
  style?: CSSProperties;
}
/** The site-wide CTA: always routes to the booking request page. */
export function BookNowButton({ href, label, ...rest }: BookNowButtonProps) {
  return <GlassButton href={href} {...rest}>{label}</GlassButton>;
}

/* ---------------------------------------------------------------------- GlassChip */
export interface GlassChipProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: ReactNode;
  tone?: "dark" | "light";
  children?: ReactNode;
}
export function GlassChip({ icon, tone = "dark", className, children, ...rest }: GlassChipProps) {
  return (
    <span className={cx("lg-glass-chip", tone === "light" && "lg-glass-chip--light", className)} {...rest}>
      {icon && <span className="lg-glass-chip__icon" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------------- GlassIconButton */
export interface GlassIconButtonProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** Accessible name (required). */
  label: string;
  href?: string;
  as?: ElementType;
  size?: "sm" | "md" | "lg";
  tone?: "glass" | "dark" | "gold";
  target?: string;
  rel?: string;
  disabled?: boolean;
  children: ReactNode;
}
/** Circular glass button for icons (socials, controls). */
export function GlassIconButton({ label, href, as, size = "md", tone = "glass", className, children, ...rest }: GlassIconButtonProps) {
  const Tag = (href ? linkFor(href, as) : "button") as ElementType;
  return (
    <Tag
      className={cx("lg-glass-icon", size === "sm" && "lg-glass-icon--sm", size === "lg" && "lg-glass-icon--lg", tone === "dark" && "lg-glass-icon--dark", tone === "gold" && "lg-glass-icon--gold", className)}
      aria-label={label}
      href={href}
      type={href ? undefined : "button"}
      {...rest}
    >
      {children}
    </Tag>
  );
}
