import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { ArrowRightIcon } from "./icons";
import { GlassIcon, GlassPanel, linkFor, type GlassTone } from "./Glass";
import { cx } from "./utils";

export interface ServicePanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  icon?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  /** Small gold line at the bottom. */
  meta?: ReactNode;
  /** Glass tone of the card. Default `dark`. */
  tone?: GlassTone;
  href?: string;
  as?: ElementType;
  cta?: ReactNode;
  headingLevel?: "h2" | "h3";
  children?: ReactNode;
}

/**
 * The services card: one clean pane of liquid glass — the icon medallion, a serif title, the copy,
 * a gold meta line and the link. Glass alone; the three in a row are identical panes.
 */
export function ServicePanel({ icon, title, body, meta, tone = "dark", href, as, cta, headingLevel = "h3", className, children, ...rest }: ServicePanelProps) {
  const Tag = (href ? linkFor(href, as) : "article") as ElementType;
  const Heading = headingLevel;
  return (
    <GlassPanel as={Tag} tone={tone} radius="xl" interactive={!!href} className={cx("lg-service", className)} {...(href ? { href } : {})} {...rest}>
      <div className="lg-service__body">
        {icon && <GlassIcon className="lg-service__icon">{icon}</GlassIcon>}
        <Heading className="lg-service__title">{title}</Heading>
        {body && <p className="lg-service__text">{body}</p>}
        {children}
        {(meta || cta || href) && (
          <div className="lg-service__foot">
            {meta && <span className="lg-service__meta">{meta}</span>}
            {(cta || href) && <span className="lg-service__cta">{cta ?? "Learn more"}<ArrowRightIcon /></span>}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
