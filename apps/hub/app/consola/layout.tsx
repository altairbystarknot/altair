import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { fontClasses } from "../fonts";

// ROOT LAYOUT OF STARKNOT'S CONSOLE (Spanish only, never indexed, not linked from the public site).

export const metadata: Metadata = {
  title: { default: "Consola · Altair", template: "%s · Consola Altair" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f1ece3", width: "device-width", initialScale: 1 };

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={fontClasses}>
      <body className="al h-site h-con">{children}</body>
    </html>
  );
}
