/**
 * JS mirror of the CSS tokens the components need at render time (wave fills, panel colours).
 * Values stay in sync with src/styles/tokens.css.
 */
export const lgColors = {
  ink: "#0c1117",
  shell: "#f7f1e6",
  cream: "#fcf9f3",
  sand: "#ebdcc1",
  dune: "#cfae7d",
  seaMist: "#d2e1e4",
  ocean800: "#17395a",
  oceanDeep: "#0d2236",
  night: "#0f1a26",
  abyss: "#0a131c",
  teal: "#1f5a6c",
  lagoon: "#3c8d9c",
  bark: "#3a2a1e",
  earth: "#5b422e",
  amber: "#f2a63b",
  gold: "#d6a54a",
  ember: "#c9662b",
} as const;

/** Named tones used by sections, paper waves and panels: a background + foreground pair each. */
export const lgTones = {
  night: { bg: lgColors.night, fg: lgColors.shell },
  oceanDeep: { bg: lgColors.oceanDeep, fg: lgColors.shell },
  ocean: { bg: lgColors.ocean800, fg: lgColors.shell },
  teal: { bg: lgColors.teal, fg: lgColors.shell },
  lagoon: { bg: lgColors.lagoon, fg: lgColors.shell },
  bark: { bg: lgColors.bark, fg: lgColors.shell },
  earth: { bg: lgColors.earth, fg: lgColors.shell },
  ember: { bg: lgColors.ember, fg: lgColors.shell },
  amber: { bg: lgColors.amber, fg: lgColors.night },
  gold: { bg: lgColors.gold, fg: lgColors.night },
  dune: { bg: lgColors.dune, fg: lgColors.night },
  sand: { bg: lgColors.sand, fg: lgColors.oceanDeep },
  seaMist: { bg: lgColors.seaMist, fg: lgColors.oceanDeep },
  shell: { bg: lgColors.shell, fg: lgColors.ink },
  cream: { bg: lgColors.cream, fg: lgColors.ink },
} as const;

export type LgTone = keyof typeof lgTones;

/** Tones whose surface is dark (text flips to the on-dark tokens). */
export const lgDarkTones: readonly LgTone[] = ["night", "oceanDeep", "ocean", "teal", "lagoon", "bark", "earth", "ember"];

/** `oceanDeep` -> `var(--lg-color-ocean-deep)`. */
export const lgToneVar = (tone: LgTone): string => `var(--lg-color-${tone.replace(/([A-Z])/g, "-$1").toLowerCase()})`;
