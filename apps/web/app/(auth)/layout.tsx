import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AltairMark } from "@altair/ui";
import { getPublicConfig } from "@/lib/config/business-config";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Sign-in pages: the Altair look (the panel's), centered glass card over the brand glows.
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const { config } = await getPublicConfig();
  return (
    <main className="al-clip" style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "40px 16px" }}>
      <div className="amb gold" style={{ width: 760, height: 760, left: -300, top: -320 }} aria-hidden="true" />
      <div className="amb cyan" style={{ width: 820, height: 820, right: -340, bottom: -360 }} aria-hidden="true" />
      <div className="glass z" style={{ width: "min(100%, 440px)", borderRadius: 32, padding: "26px 26px 28px" }}>
        <AltairMark subtitle={config?.name ?? "Panel del negocio"} />
        {children}
      </div>
    </main>
  );
}
