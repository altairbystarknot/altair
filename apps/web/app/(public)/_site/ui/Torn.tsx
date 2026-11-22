import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import type { ImageRef } from "./types";
import { Picture } from "./Picture";
import { lgDarkTones, lgTones, lgToneVar, type LgTone } from "./tones";
import { tornCurve, tornPath, tornPoints, tornPolygon, type TornParams, type TornShape } from "./torn-geometry";
import { cx, hashString } from "./utils";

const toneColor = (tone?: LgTone, color?: string) => color ?? (tone ? lgToneVar(tone) : "var(--lg-color-shell)");
const toneFg = (tone?: LgTone) => (tone ? lgTones[tone].fg : undefined);

/* ----------------------------------------------------------------------------- TornEdge */
export interface TornEdgeProps extends HTMLAttributes<HTMLDivElement> {
  /** Personality of the wave (all smooth: wave, soft, ripple, drift, swell, tide, dune, arc, mist, ridge, fold, flow). */
  shape?: TornShape | TornParams;
  /** Any string/number: different seeds = different curves with the same personality. */
  seed?: number | string;
  tone?: LgTone;
  color?: string;
  /** Where the paper hangs from: `down` = paper above the wave, `up` = paper below the wave. */
  facing?: "up" | "down";
  position?: "top" | "bottom" | "static";
  height?: string;
  rim?: boolean;
  shadow?: boolean;
  params?: Partial<TornParams>;
  flip?: boolean;
}

/**
 * A smooth paper edge with a subtle glass contour. It draws the NEIGHBOR's paper over the current
 * section — `<TornEdge position="top" facing="down" tone="shell" />` = the shell section above flows in.
 */
export function TornEdge({ shape = "wave", seed = 1, tone, color, facing = "down", position = "top", height = "72px", rim = true, shadow = true, params, flip, className, style, ...rest }: TornEdgeProps) {
  // Deterministic filter ids (server and client agree); the rule of variety keeps them unique per page.
  const id = `lg-t${hashString(JSON.stringify([shape, seed, tone, color, facing, position, params ?? null])).toString(36)}`;
  const pts = tornPoints(shape, seed, params);
  const paper = tornPath(pts, facing, 100);
  const curve = tornCurve(pts, facing, 100);
  const fill = toneColor(tone, color);
  return (
    <div className={cx("lg-torn", position === "top" && "lg-torn--top", position === "bottom" && "lg-torn--bottom", position === "static" && "lg-torn--static", className)} style={{ "--torn-h": height, ...style } as CSSProperties} aria-hidden="true" {...rest}>
      <svg viewBox="0 0 1000 100" preserveAspectRatio="none" style={flip ? { transform: "scaleX(-1)" } : undefined} focusable="false">
        <defs>
          {shadow && (
            <filter id={`${id}-sh`} x="-5%" y="-60%" width="110%" height="220%">
              <feDropShadow dx="0" dy={facing === "down" ? 6 : -6} stdDeviation="7" floodColor="#04101a" floodOpacity="0.22" />
            </filter>
          )}
          {rim && (
            <filter id={`${id}-glow`} x="-5%" y="-60%" width="110%" height="220%"><feGaussianBlur stdDeviation="3.5" /></filter>
          )}
        </defs>
        <path d={paper} fill={fill} filter={shadow ? `url(#${id}-sh)` : undefined} />
        {rim && (
          <g className="lg-torn__rim" fill="none">
            <path d={curve} stroke="rgba(255,255,255,0.35)" strokeWidth="7" filter={`url(#${id}-glow)`} vectorEffect="non-scaling-stroke" opacity="0.7" />
            <path d={curve} stroke="rgba(255,255,255,0.62)" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
          </g>
        )}
      </svg>
    </div>
  );
}

/* ----------------------------------------------------------------------------- TornSection */
export interface TornSectionProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  tone?: LgTone;
  color?: string;
  background?: ImageRef;
  veil?: "dark" | "light" | "none";
  /** The paper of the PREVIOUS section flowing over the top of this one. */
  tornTop?: Omit<TornEdgeProps, "position" | "facing"> | LgTone;
  /** The paper of the NEXT section flowing over the bottom of this one. */
  tornBottom?: Omit<TornEdgeProps, "position" | "facing"> | LgTone;
  padding?: "default" | "tight" | "flush";
  container?: "default" | "wide" | "narrow" | "full" | false;
  onDark?: boolean;
  children?: ReactNode;
}
/** A section whose top and/or bottom edge is a smooth paper wave (the neighbors' colors). */
export function TornSection({ as: Tag = "section", tone, color, background, veil = "none", tornTop, tornBottom, padding = "default", container = "default", onDark, className, style, children, ...rest }: TornSectionProps) {
  const top = typeof tornTop === "string" ? { tone: tornTop } : tornTop;
  const bottom = typeof tornBottom === "string" ? { tone: tornBottom } : tornBottom;
  const dark = onDark ?? (tone ? lgDarkTones.includes(tone) : !!background && veil !== "light");
  return (
    <Tag className={cx("lg-torn-section lg-section", padding === "tight" && "lg-section--tight", padding === "flush" && "lg-section--flush", dark && "lg-on-dark", className)} style={{ background: background ? undefined : toneColor(tone, color), color: toneFg(tone), ...style }} {...rest}>
      {background && (
        <div className="lg-torn-section__bg" aria-hidden="true">
          <Picture image={background} alt="" sizes="100vw" />
          {veil !== "none" && <div className={cx("lg-veil", veil === "dark" ? "lg-veil--dark" : "lg-veil--light")} />}
        </div>
      )}
      {top && <TornEdge position="top" facing="down" {...top} />}
      <div className={cx("lg-torn-section__inner", container !== false && "lg-container", container === "wide" && "lg-container--wide", container === "narrow" && "lg-container--narrow", container === "full" && "lg-container--full")}>{children}</div>
      {bottom && <TornEdge position="bottom" facing="up" {...bottom} />}
    </Tag>
  );
}

/* ----------------------------------------------------------------------------- TornPanel */
export interface TornPanelProps extends HTMLAttributes<HTMLDivElement> {
  shape?: TornShape | TornParams;
  seed?: number | string;
  tone?: LgTone;
  color?: string;
  /** Which side is wavy (the first entry is used). */
  sides?: Array<"top" | "right" | "bottom" | "left">;
  /** Wave depth in % of the panel. */
  depth?: number;
  rim?: boolean;
  padding?: string;
  children?: ReactNode;
}
/** A paper panel with one smooth wavy side. Clip-path based, holds any content. */
export function TornPanel({ shape = "wave", seed = 7, tone = "ocean", color, sides = ["right"], depth = 8, rim = true, padding, className, style, children, ...rest }: TornPanelProps) {
  const side = sides[0] ?? "right";
  const pts = tornPoints(shape, seed);
  const clips = { paper: tornPolygon(side, pts, depth), rim: tornPolygon(side, pts, depth, 0.9) };
  const vars = { "--panel-bg": toneColor(tone, color), "--panel-fg": toneFg(tone), ...(padding ? { "--panel-pad": padding } : {}), ...style } as CSSProperties;
  const dark = tone ? lgDarkTones.includes(tone) : false;
  return (
    <div className={cx("lg-torn-panel", dark && "lg-on-dark", className)} style={vars} {...rest}>
      {rim && <div className="lg-torn-panel__rim" style={{ clipPath: clips.rim }} aria-hidden="true" />}
      <div className="lg-torn-panel__paper" style={{ clipPath: clips.paper }} aria-hidden="true" />
      <div className="lg-torn-panel__content">{children}</div>
    </div>
  );
}

/* ----------------------------------------------------------------------------- TornDivider */
export interface TornDividerProps extends HTMLAttributes<HTMLDivElement> {
  from: LgTone | string;
  to: LgTone | string;
  shape?: TornShape;
  seed?: number | string;
  height?: string;
  /** A thin third paper strip between the two. */
  accent?: LgTone | string;
}
const asTone = (v: string): { tone?: LgTone; color?: string } => (v in lgTones ? { tone: v as LgTone } : { color: v });
/** A standalone band between two sections: `from` paper on top flowing over `to` paper below. */
export function TornDivider({ from, to, shape = "wave", seed = 3, height = "112px", accent, className, style, ...rest }: TornDividerProps) {
  return (
    <div className={cx("lg-torn-divider", className)} style={{ "--divider-h": height, background: accent ? toneColor(asTone(accent).tone, asTone(accent).color) : toneColor(asTone(to).tone, asTone(to).color), ...style } as CSSProperties} aria-hidden="true" {...rest}>
      {accent && <TornEdge position="bottom" facing="up" shape={shape} seed={`${seed}-b`} height="62%" {...asTone(to)} />}
      <TornEdge position="top" facing="down" shape={shape} seed={seed} height="72%" {...asTone(from)} />
    </div>
  );
}
