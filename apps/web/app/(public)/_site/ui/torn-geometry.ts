import { hashString, seededRandom } from "./utils";

/**
 * Smooth "torn paper" boundaries. Every personality is a soft, continuous wave — no spikes, no
 * fibers — so section transitions read as calm, minimal and premium. Combine with `seed` for variety.
 */
export type TornShape = "wave" | "soft" | "ripple" | "drift" | "swell" | "tide" | "dune" | "arc" | "mist" | "ridge" | "fold" | "flow";

export interface TornParams {
  /** Vertical amplitude of the wave, 0..1 of the edge height. */
  amplitude: number;
  /** Number of full waves per 1000 units of width. */
  frequency: number;
  /** Amount of organic secondary undulation, 0..1 (still smooth). */
  roughness: number;
  /** Diagonal drift of the line, -1..1. */
  tilt: number;
}

export const tornPresets: Record<TornShape, TornParams> = {
  wave:   { amplitude: 0.55, frequency: 1.2, roughness: 0.15, tilt: 0 },
  soft:   { amplitude: 0.35, frequency: 0.8, roughness: 0.1,  tilt: 0 },
  ripple: { amplitude: 0.3,  frequency: 3,   roughness: 0.2,  tilt: 0 },
  drift:  { amplitude: 0.5,  frequency: 0.6, roughness: 0.1,  tilt: 0.5 },
  swell:  { amplitude: 0.8,  frequency: 1,   roughness: 0.05, tilt: 0 },
  tide:   { amplitude: 0.45, frequency: 1.6, roughness: 0.3,  tilt: 0 },
  dune:   { amplitude: 0.6,  frequency: 0.9, roughness: 0.25, tilt: -0.3 },
  arc:    { amplitude: 0.7,  frequency: 0.5, roughness: 0,    tilt: 0 },
  mist:   { amplitude: 0.2,  frequency: 2.2, roughness: 0.35, tilt: 0 },
  ridge:  { amplitude: 0.65, frequency: 1.4, roughness: 0.2,  tilt: 0.2 },
  fold:   { amplitude: 0.4,  frequency: 0.7, roughness: 0.45, tilt: 0 },
  flow:   { amplitude: 0.5,  frequency: 2,   roughness: 0.1,  tilt: 0 },
};

export const tornShapes = Object.keys(tornPresets) as TornShape[];

export interface TornPoint { x: number; y: number }

const SAMPLES = 64;

/**
 * Smooth boundary across a 1000-wide box: `y` is 0..1 (0 = top of the edge height). A primary sine
 * plus a slow secondary wave (seeded phase/frequency) gives each seed its own calm curve.
 */
export function tornPoints(shape: TornShape | TornParams, seed: number | string = 1, extra: Partial<TornParams> = {}): TornPoint[] {
  const p = { ...(typeof shape === "string" ? tornPresets[shape] : shape), ...extra };
  const rand = seededRandom(typeof seed === "string" ? hashString(seed) : seed);
  const phase1 = rand() * Math.PI * 2, phase2 = rand() * Math.PI * 2, phase3 = rand() * Math.PI * 2;
  const f2 = p.frequency * (1.9 + rand() * 0.9), f3 = p.frequency * (0.35 + rand() * 0.4);
  const pts: TornPoint[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const base = 0.5 + p.tilt * (t - 0.5) * 0.55;
    const w1 = Math.sin(t * Math.PI * 2 * p.frequency + phase1);
    const w2 = Math.sin(t * Math.PI * 2 * f2 + phase2) * p.roughness;
    const w3 = Math.sin(t * Math.PI * 2 * f3 + phase3) * 0.35;
    const y = base + ((w1 + w2 + w3) / (1.35 + p.roughness)) * p.amplitude * 0.5;
    pts.push({ x: t * 1000, y: Math.min(0.96, Math.max(0.04, y)) });
  }
  return pts;
}

/** Open smooth curve (Catmull-Rom -> cubic beziers) through the points, in a 1000 x `height` box. */
export function tornCurve(points: TornPoint[], facing: "up" | "down" = "up", height = 100, offset = 0): string {
  const map = (pt: TornPoint) => ({ x: pt.x, y: (facing === "up" ? pt.y : 1 - pt.y) * height - (facing === "up" ? offset : -offset) });
  const q = points.map(map);
  let d = `M${q[0]!.x.toFixed(1)},${q[0]!.y.toFixed(2)}`;
  for (let i = 0; i < q.length - 1; i++) {
    const p0 = q[Math.max(0, i - 1)]!, p1 = q[i]!, p2 = q[i + 1]!, p3 = q[Math.min(q.length - 1, i + 2)]!;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(2)} ${c2x.toFixed(1)},${c2y.toFixed(2)} ${p2.x.toFixed(1)},${p2.y.toFixed(2)}`;
  }
  return d;
}

/**
 * Closed SVG path for the paper piece in a 1000 x `height` box.
 * `facing: "up"` -> paper fills the bottom (wavy top edge). `facing: "down"` -> paper hangs from the top.
 */
export function tornPath(points: TornPoint[], facing: "up" | "down" = "up", height = 100, offset = 0): string {
  const curve = tornCurve(points, facing, height, offset);
  return facing === "up" ? `M0,${height} L${curve.slice(1)} L1000,${height} Z` : `M0,0 L${curve.slice(1)} L1000,0 Z`;
}

/**
 * CSS clip-path polygon (percent coordinates) for a panel with one smooth wavy side.
 * `depth` is the wave depth in % of the panel along the torn axis; `grow` expands outward (rim layers).
 */
export function tornPolygon(side: "top" | "right" | "bottom" | "left", points: TornPoint[], depth = 8, grow = 0): string {
  const coords: string[] = [];
  const along = (pt: TornPoint) => (pt.x / 1000) * 100;
  const off = (pt: TornPoint) => pt.y * depth - grow;
  if (side === "right") {
    coords.push("0% 0%", `${100 - depth}% 0%`);
    for (const pt of points) coords.push(`${(100 - off(pt)).toFixed(2)}% ${along(pt).toFixed(2)}%`);
    coords.push(`${100 - depth}% 100%`, "0% 100%");
  } else if (side === "left") {
    coords.push("100% 0%", `${depth}% 0%`);
    for (const pt of points) coords.push(`${off(pt).toFixed(2)}% ${along(pt).toFixed(2)}%`);
    coords.push(`${depth}% 100%`, "100% 100%");
  } else if (side === "top") {
    coords.push("0% 100%", `0% ${depth}%`);
    for (const pt of points) coords.push(`${along(pt).toFixed(2)}% ${off(pt).toFixed(2)}%`);
    coords.push(`100% ${depth}%`, "100% 100%");
  } else {
    coords.push("0% 0%", `0% ${100 - depth}%`);
    for (const pt of points) coords.push(`${along(pt).toFixed(2)}% ${(100 - off(pt)).toFixed(2)}%`);
    coords.push(`100% ${100 - depth}%`, "100% 0%");
  }
  return `polygon(${coords.join(", ")})`;
}
