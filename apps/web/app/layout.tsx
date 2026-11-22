import type { Metadata, Viewport } from "next";
import { Anton, Cinzel, Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { getPublicConfig } from "@/lib/config/business-config";
import "./globals.css";

// Fonts are self-hosted by next/font at build time: no request leaves for Google at runtime, which is
// what lets the CSP keep font-src 'self'.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const serif = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-serif", display: "swap", weight: ["500", "600"], style: ["normal", "italic"] });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap", weight: ["400", "500", "600"] });
const display = Anton({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: "400" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", weight: ["400", "600"] });

export async function generateMetadata(): Promise<Metadata> {
  const { config } = await getPublicConfig();
  const name = config?.name ?? "Reservas";
  return {
    title: { default: name, template: `%s · ${name}` },
    description: `Transporte privado y actividades con ${name}.`,
    applicationName: name,
  };
}

export const viewport: Viewport = {
  themeColor: "#fdfdfe",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Reading the request makes every route render per request, so the proxy's CSP nonce reaches every
  // inline script Next emits (a prerendered page would carry none and be blocked by the strict policy).
  await headers();
  const { config } = await getPublicConfig();
  const lang = config?.defaultLocale ?? "es";
  return (
    <html lang={lang} className={`${inter.variable} ${serif.variable} ${display.variable} ${cinzel.variable} ${mono.variable}`}>
      <body className="al">{children}</body>
    </html>
  );
}
