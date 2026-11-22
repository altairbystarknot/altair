import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "./utils";

interface TextBase extends HTMLAttributes<HTMLElement> { as?: ElementType; children?: ReactNode }

export interface DisplayHeadingProps extends TextBase {
  /** `brand` = display caps (the title's voice); `wide` = heavy display (knockout bands). */
  face?: "brand" | "wide";
  level?: "display" | "h1" | "h2";
}
/** Uppercase display heading. */
export function DisplayHeading({ as: Tag = "h1", face = "brand", level = "display", className, children, ...rest }: DisplayHeadingProps) {
  return <Tag className={cx("lg-display", face === "wide" && "lg-display--wide", level === "h1" && "lg-display--h1", level === "h2" && "lg-display--h2", className)} {...rest}>{children}</Tag>;
}

export interface SerifTitleProps extends TextBase { level?: "h1" | "h2" | "h3"; upright?: boolean }
/** Cormorant italic title. Wrap a word in <em> to paint it gold. */
export function SerifTitle({ as: Tag = "h2", level = "h2", upright, className, children, ...rest }: SerifTitleProps) {
  return <Tag className={cx("lg-serif-title", level === "h1" && "lg-serif-title--h1", level === "h3" && "lg-serif-title--h3", upright && "lg-serif-title--upright", className)} {...rest}>{children}</Tag>;
}

export interface EyebrowProps extends TextBase { lined?: boolean; gold?: boolean }
/** Small tracked uppercase label. */
export function Eyebrow({ as: Tag = "p", lined, gold, className, children, ...rest }: EyebrowProps) {
  return <Tag className={cx("lg-eyebrow", lined && "lg-eyebrow--lined", gold && "lg-eyebrow--gold", className)} {...rest}>{children}</Tag>;
}

export interface CapsProps extends TextBase { gold?: boolean; size?: "md" | "lg" }
/** Small brand caps in Cinzel, wide tracked — the "TRAVEL" line of the logo. */
export function Caps({ as: Tag = "p", gold, size = "md", className, children, ...rest }: CapsProps) {
  return <Tag className={cx("lg-caps", gold && "lg-caps--gold", size === "lg" && "lg-caps--lg", className)} {...rest}>{children}</Tag>;
}

export function Lead({ as: Tag = "p", className, children, ...rest }: TextBase) {
  return <Tag className={cx("lg-lead", className)} {...rest}>{children}</Tag>;
}

export interface GlassTitleProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  as?: ElementType;
  /** Plain text (needed twice for the glass rim layers). */
  text: string;
  /** `light` for dark/photo backgrounds; `dark` for shell/cream sections. */
  tone?: "light" | "dark";
  size?: "md" | "sm";
  wrap?: boolean;
}
/** Wide-tracked Cinzel caps with a glass fill and rim — the "OUR FLEET" / "OUR STORY" title. */
export function GlassTitle({ as: Tag = "h2", text, tone = "light", size = "md", wrap, className, ...rest }: GlassTitleProps) {
  return <Tag className={cx("lg-glass-title", tone === "dark" && "lg-glass-title--dark", size === "sm" && "lg-glass-title--sm", wrap && "lg-glass-title--wrap", className)} data-text={text} {...rest}>{text}</Tag>;
}

export interface SectionHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: ReactNode;
  title?: ReactNode;
  /** Render the title as a GlassTitle instead of the serif italic. */
  glassTitle?: string;
  glassTone?: "light" | "dark";
  /** Small Cinzel caps line under the title. */
  caps?: ReactNode;
  lead?: ReactNode;
  align?: "start" | "center" | "end";
  titleLevel?: "h1" | "h2" | "h3";
  /** Heading element id, for `aria-labelledby` on the section. */
  titleId?: string;
  children?: ReactNode;
}
/** Eyebrow + title (+ caps + lead) block used at the top of sections. */
export function SectionHeader({ eyebrow, title, glassTitle, glassTone, caps, lead, align = "start", titleLevel = "h2", titleId, className, children, ...rest }: SectionHeaderProps) {
  return (
    <header className={cx("lg-section-header", align === "center" && "lg-section-header--center", align === "end" && "lg-section-header--end", className)} {...rest}>
      {eyebrow && <Eyebrow lined={align === "center"}>{eyebrow}</Eyebrow>}
      {glassTitle ? <GlassTitle as={titleLevel} text={glassTitle} tone={glassTone} id={titleId} /> : title && <SerifTitle as={titleLevel} level={titleLevel} id={titleId}>{title}</SerifTitle>}
      {caps && <Caps gold>{caps}</Caps>}
      {lead && <Lead>{lead}</Lead>}
      {children}
    </header>
  );
}
