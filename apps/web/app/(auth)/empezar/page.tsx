import type { Metadata } from "next";
import { Notice, Steps } from "@altair/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { createAnonSupabase } from "@/lib/supabase/anon";
import { ClaimForm } from "../join-forms";

export const metadata: Metadata = { title: "Active su Altair" };

// The link Starknot sends a new business: /empezar?t=<one-time token>. Valid once, for 7 days, and only
// while the instance has no owner.
export default async function ClaimPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const token = typeof t === "string" && /^[a-f0-9]{64}$/.test(t) ? t : "";
  let check: { valid: boolean; business_name?: string } = { valid: false };
  if (token && isSupabaseConfigured()) {
    const { data } = await createAnonSupabase().rpc("install_token_check", { p_token: token });
    check = (data as typeof check) ?? { valid: false };
  }
  return (
    <div className="col" style={{ gap: 18 }}>
      <Steps items={[{ label: "Acceso", state: "current" }, { label: "Código", state: "todo" }, { label: "Configurar", state: "todo" }]} />
      {check.valid ? (
        <>
          <div className="col" style={{ gap: 4 }}>
            <h1 className="h3">Bienvenido a Altair</h1>
            <p className="small">Usted quedará como dueño de <b>{check.business_name}</b>. Cree su acceso; luego le guiamos paso a paso.</p>
          </div>
          <ClaimForm token={token} />
        </>
      ) : (
        <Notice tone="warn">Este enlace no es válido o ya se usó. Si usted es el dueño, entre desde el panel; si no, solicite un enlace nuevo a Starknot.</Notice>
      )}
    </div>
  );
}
