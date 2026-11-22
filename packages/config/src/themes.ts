// Theme presets for the public booking site. A business picks a preset and may override the three brand
// colors; nothing else about the design changes per business (tokens and flags, never a per-client
// redesign). The panel always wears the Altair look.

export const THEME_PRESETS = {
  marea: { label: "Marea (Altair)", brand: "#002b42", brand2: "#0b3f4e", accent: "#dcb872", accentInk: "#2b1e06", sand: "#f4efe6", paper: "#e9e1d1" },
  selva: { label: "Selva", brand: "#1e3b2a", brand2: "#3d4a2c", accent: "#c9a961", accentInk: "#2a1f05", sand: "#f5f0e8", paper: "#ece4d3" },
  oceano: { label: "Océano", brand: "#0b3a5c", brand2: "#0f6f86", accent: "#f0a35e", accentInk: "#331a04", sand: "#f1f3ef", paper: "#e1e8e4" },
  caribe: { label: "Caribe", brand: "#005f73", brand2: "#0a9396", accent: "#ee9b00", accentInk: "#2a1a00", sand: "#f4f1e9", paper: "#e7e0cf" },
  volcan: { label: "Volcán", brand: "#1f1d1b", brand2: "#3a2f2a", accent: "#ff7a3d", accentInk: "#2b0f02", sand: "#f4efe8", paper: "#e8ded2" },
  atardecer: { label: "Atardecer", brand: "#3d1f3a", brand2: "#7a2e4b", accent: "#f4a261", accentInk: "#331604", sand: "#f6efe8", paper: "#ecdccf" },
  arena: { label: "Arena", brand: "#3b3127", brand2: "#6b5843", accent: "#e9c46a", accentInk: "#2d2306", sand: "#f6f0e4", paper: "#ebdfc8" },
} as const;

export type ThemePresetId = keyof typeof THEME_PRESETS;
export const THEME_PRESET_IDS = Object.keys(THEME_PRESETS) as ThemePresetId[];

export type ThemeOverrides = { brand?: string; brand2?: string; accent?: string };

const HEX = /^#[0-9a-fA-F]{6}$/;
export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

/**
 * CSS custom properties for a theme, ready for a `style` prop. Overrides that are not valid hex colors are
 * ignored (never injected into CSS), so a bad value in the database cannot break or inject into the page.
 */
export function themeCssVars(preset: ThemePresetId, overrides: ThemeOverrides = {}): Record<string, string> {
  const base = THEME_PRESETS[preset] ?? THEME_PRESETS.marea;
  const accent = isHexColor(overrides.accent) ? overrides.accent : base.accent;
  return {
    "--brand": isHexColor(overrides.brand) ? overrides.brand : base.brand,
    "--brand-2": isHexColor(overrides.brand2) ? overrides.brand2 : base.brand2,
    "--accent": accent,
    "--accent-ink": isHexColor(overrides.accent) ? inkFor(accent) : base.accentInk,
    "--sand": base.sand,
    "--paper": base.paper,
  };
}

/** Relative luminance (WCAG) of a #rrggbb color, 0..1. */
export function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}

/** Text color that reads on top of a given background: near-black on light colors, white on dark ones. */
export function inkFor(hex: string): string {
  return luminance(hex) > 0.36 ? "#1d1a12" : "#ffffff";
}
