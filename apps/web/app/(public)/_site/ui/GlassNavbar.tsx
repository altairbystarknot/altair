import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import type { ImageRef } from "./types";
import { MenuToggle } from "./Menu";
import { Picture } from "./Picture";
import { cx } from "./utils";

export interface WordmarkProps extends HTMLAttributes<HTMLElement> {
  name?: string;
  sub?: string;
  href?: string;
  serif?: boolean;
}
/** Text wordmark (fallback when the logo image is not wanted): brand caps + tracked sub line. */
export function Wordmark({ name = "", sub = "", href, serif, className, ...rest }: WordmarkProps) {
  const inner = (
    <>
      <span className="lg-wordmark__name">{name}</span>
      {sub && <span className="lg-wordmark__sub">{sub}</span>}
    </>
  );
  const classes = cx("lg-wordmark", serif && "lg-wordmark--serif", className);
  return href ? <Link className={classes} href={href} {...rest}>{inner}</Link> : <div className={classes} {...rest}>{inner}</div>;
}

export interface BrandProps {
  /** The business logo (or, without one, its name in the template's serif). */
  logo: ImageRef | null;
  name?: string;
  alt?: string;
  href?: string;
  /** CSS width of the logo (default: scales with the hero frame). */
  width?: string;
  sizes?: string;
  className?: string;
}
/** The logo image, centred in the navbar. */
export function Brand({ logo, name, alt = "", href, width, sizes = "(max-width: 899px) 176px, 17vw", className }: BrandProps) {
  const style = width ? ({ "--brand-w": width } as CSSProperties) : undefined;
  const img = logo ? <Picture image={logo} alt={alt} sizes={sizes} className="lg-brand__logo" eager blur={false} /> : <span className="lg-wordmark__name lg-brand__text">{name}</span>;
  // An in-page anchor (#top on the home page) is a plain link, so the smooth scroll alone moves the page.
  if (href?.startsWith("#")) return <a className={cx("lg-brand", className)} href={href} style={style}>{img}</a>;
  return href ? <Link className={cx("lg-brand", className)} href={href} style={style}>{img}</Link> : <div className={cx("lg-brand", className)} style={style}>{img}</div>;
}

export interface NavLink { label: string; href: string }

export interface GlassNavbarProps extends HTMLAttributes<HTMLElement> {
  menuLabel: string;
  closeLabel: string;
  /** Accessible name of the navigation landmark. */
  label: string;
  brand: BrandProps;
  links?: NavLink[];
  leftLinks?: NavLink[];
  end?: ReactNode;
  /** `absolute` overlays the hero (default); `fixed` sticks to the viewport; `static` flows in its wrapper. */
  mode?: "absolute" | "fixed" | "static";
  glass?: boolean;
}

const NavItem = ({ link }: { link: NavLink }) => (
  <li>{link.href.startsWith("#") ? <a href={link.href}>{link.label}</a> : <Link href={link.href}>{link.label}</Link>}</li>
);

/** MENU + left links — logo — right links / actions. Sits at the top of the hero, or fixed on inner pages. */
export function GlassNavbar({ menuLabel, closeLabel, label, brand, links, leftLinks, end, mode = "absolute", glass, className, ...rest }: GlassNavbarProps) {
  const hasLinks = !!links && links.length > 0;
  const linkItems = hasLinks ? links.map((l) => <NavItem key={l.href} link={l} />) : null;
  return (
    <nav className={cx("lg-nav", mode === "fixed" && "lg-nav--fixed", mode === "static" && "lg-nav--static", glass && "lg-nav--glass", className)} aria-label={label} {...rest}>
      <div className="lg-nav__start">
        <MenuToggle menuLabel={menuLabel} closeLabel={closeLabel} />
        {leftLinks && leftLinks.length > 0 && (
          <ul className="lg-nav__links lg-nav__links--start">{leftLinks.map((l) => <NavItem key={l.href} link={l} />)}</ul>
        )}
      </div>
      <Brand {...brand} />
      {end ? (
        <div className="lg-nav__end">
          {hasLinks && <ul className="lg-nav__links">{linkItems}</ul>}
          {end}
        </div>
      ) : hasLinks ? (
        <ul className="lg-nav__links lg-nav__links--end">{linkItems}</ul>
      ) : null}
    </nav>
  );
}
