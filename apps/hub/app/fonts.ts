import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";

// The hub's three faces, self-hosted by next/font: Inter for reading and UI (the Altair wordmark is drawn
// in it), Instrument Serif for editorial headlines, JetBrains Mono for tool names and links in the console.
// Shared by both root layouts (the bilingual site under (site)/[locale] and the Spanish console).

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", weight: ["400", "600"] });

export const fontClasses = `${inter.variable} ${serif.variable} ${mono.variable}`;
