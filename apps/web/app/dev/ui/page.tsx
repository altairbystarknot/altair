import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gallery } from "./gallery";

export const metadata: Metadata = { title: "Sistema de diseño", robots: { index: false, follow: false } };

// Development-only component gallery. Production builds answer 404.
export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="al-clip" style={{ minHeight: "100dvh", background: "#f7f9fa" }}>
      <div className="amb gold" style={{ width: 700, height: 700, left: -280, top: -320 }} aria-hidden="true" />
      <div className="wrap" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <p className="eyebrow">@altair/ui</p>
        <h1 className="h1" style={{ marginBottom: 24 }}>
          Sistema de diseño <span className="gtext">Altair</span>
        </h1>
        <Gallery />
      </div>
    </main>
  );
}
