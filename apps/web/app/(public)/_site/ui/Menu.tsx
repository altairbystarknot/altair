"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { GlassButton } from "./Glass";
import { cx } from "./utils";

export interface MenuLink { label: string; href: string; lang?: string; hrefLang?: string }
export interface MenuGroup { heading: string; links: MenuLink[] }

type MenuState = { open: boolean; setOpen: (v: boolean) => void; toggle: () => void; menuId: string; toggleRef: RefObject<HTMLButtonElement | null>; openedByRef: RefObject<"keyboard" | "pointer"> };
const MenuContext = createContext<MenuState | null>(null);

function useMenu(): MenuState {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("Menu components must sit inside <MenuProvider>.");
  return ctx;
}

/** Shares the open state between the MENU button (in the navbar) and the GlassMenu panel. */
export function MenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const menuId = `lg-menu-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  /** How the menu was last opened: a keyboard user gets focus on the first link, a tap or a click does not. */
  const openedByRef = useRef<"keyboard" | "pointer">("pointer");
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const value = useMemo(() => ({ open, setOpen, toggle, menuId, toggleRef, openedByRef }), [open, toggle, menuId]);
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

/** The MENU trigger: burger + label, turns into a cross while open. */
export function MenuToggle({ menuLabel, closeLabel }: { menuLabel: string; closeLabel: string }) {
  const { open, toggle, menuId, toggleRef, openedByRef } = useMenu();
  return (
    <button
      ref={toggleRef}
      type="button"
      className="lg-nav__menu"
      // A click from Enter / Space has detail 0; a tap or a mouse click has 1 or more.
      onClick={(e) => { openedByRef.current = e.detail === 0 ? "keyboard" : "pointer"; toggle(); }}
      aria-expanded={open}
      aria-controls={menuId}
    >
      <span className="lg-nav__burger" aria-hidden="true"><i /><i /><i /></span>
      <span className="lg-nav__label">{open ? closeLabel : menuLabel}</span>
    </button>
  );
}

export interface GlassMenuProps {
  groups: MenuGroup[];
  label: string;
  ctaLabel: string;
  ctaHref: string;
  /** Extra content under the columns (the language switch). */
  footer?: ReactNode;
  className?: string;
}

const FOCUSABLE = "a[href], button:not([disabled])";

/**
 * The navigation panel that unfolds from the MENU button: a dark liquid-glass card revealed
 * left-to-right, links fading in one after another (the design system's animation, unchanged).
 * Focus is trapped between the MENU button and the panel while open; Escape and an outside click
 * close it, and focus returns to the button. Opened from the keyboard, focus lands on the first link
 * (with its ring); opened by a tap or a click, the panel itself takes focus, so nothing looks preselected.
 */
export function GlassMenu({ groups, label, ctaLabel, ctaHref, footer, className }: GlassMenuProps) {
  const { open, setOpen, menuId, toggleRef, openedByRef } = useMenu();
  const ref = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current && ref.current?.contains(document.activeElement)) toggleRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const panel = ref.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    if (openedByRef.current === "keyboard") first?.focus({ preventScroll: true });
    else panel?.focus({ preventScroll: true });

    const close = (restore: boolean) => {
      setOpen(false);
      if (restore) toggleRef.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const ring = [toggleRef.current, ...Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))].filter(Boolean) as HTMLElement[];
      const idx = ring.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      // From the panel itself (opened by a tap), Tab goes to the first link and Shift+Tab to the last.
      const next = idx === -1 ? (e.shiftKey ? ring.length - 1 : 1) : e.shiftKey ? (idx === 0 ? ring.length - 1 : idx - 1) : idx === ring.length - 1 ? 0 : idx + 1;
      ring[next]?.focus();
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panel && !panel.contains(t) && !toggleRef.current?.contains(t)) close(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, setOpen, toggleRef, openedByRef]);

  let i = 0;
  const delay = () => ({ "--d": `${180 + i++ * 60}ms` }) as CSSProperties;
  return (
    <div
      ref={ref}
      id={menuId}
      className={cx("lg-menu", open && "lg-menu--open", className)}
      role="dialog"
      aria-modal="false"
      aria-label={label}
      aria-hidden={!open}
      inert={!open}
      tabIndex={-1}
    >
      <div className="lg-menu__grid">
        {groups.map((g, gi) => (
          <div className="lg-menu__group" key={g.heading}>
            <p className="lg-menu__heading lg-menu__item" style={delay()}>{g.heading}</p>
            <ul className="lg-menu__list">
              {g.links.map((l) => (
                <li className="lg-menu__item" key={l.href + l.label} style={delay()}>
                  {l.href.startsWith("#")
                    ? <a className="lg-menu__link" href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
                    : <Link className="lg-menu__link" href={l.href} lang={l.lang} hrefLang={l.hrefLang} onClick={() => setOpen(false)}>{l.label}</Link>}
                </li>
              ))}
            </ul>
            {gi === groups.length - 1 && ctaLabel && (
              <div className="lg-menu__item lg-menu__cta" style={delay()}>
                <GlassButton href={ctaHref} tone="gold" shape="soft" size="sm" onClick={() => setOpen(false)}>{ctaLabel}</GlassButton>
              </div>
            )}
          </div>
        ))}
      </div>
      {footer && <div className="lg-menu__footer lg-menu__item" style={delay()}>{footer}</div>}
    </div>
  );
}
