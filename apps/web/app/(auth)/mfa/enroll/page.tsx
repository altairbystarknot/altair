import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Notice } from "@altair/ui";
import { beginEnroll, mfaStatus } from "@/lib/auth/mfa";
import { safePanelReturn, withReturn } from "@/lib/auth/safe-return";
import { getSessionUser } from "@/lib/auth/staff";
import { getPublicConfig } from "@/lib/config/business-config";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { EnrollForm } from "../../forms";

export const metadata: Metadata = { title: "Activar la verificación en dos pasos" };

export default async function EnrollPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safePanelReturn((await searchParams).next);
  if (!isSupabaseConfigured()) redirect(withReturn("/login", next));
  const supabase = await createServerSupabase();
  if (!(await getSessionUser(supabase))) redirect(withReturn("/login", next));
  const status = await mfaStatus(supabase);
  if (status === "satisfied") redirect(next);
  if (status === "needs_challenge") redirect(withReturn("/mfa", next));

  const { config } = await getPublicConfig();
  const enroll = await beginEnroll(supabase, `${config?.name ?? "Altair"} (Altair)`);

  return (
    <div className="col" style={{ gap: 18 }}>
      <div className="col" style={{ gap: 4 }}>
        <h1 className="h3">Active la verificación en dos pasos</h1>
        <p className="small">Es obligatoria para entrar al panel. Escanee el código con su app de autenticación.</p>
      </div>
      {"error" in enroll ? (
        <Notice tone="bad">{enroll.error}</Notice>
      ) : (
        <>
          <div className="row" style={{ gap: 16, flexWrap: "nowrap", alignItems: "center" }}>
            {/* data: URL from Supabase; allowed by img-src data: in the CSP */}
            <img src={enroll.qrCode} alt="Código QR para su app de autenticación" width={148} height={148} style={{ borderRadius: 16, background: "#fff", padding: 8, boxShadow: "inset 0 0 0 1px var(--line)" }} />
            <div className="col" style={{ gap: 6, minWidth: 0 }}>
              <span className="tiny">¿No puede escanear? Escriba esta clave:</span>
              <code className="mono" style={{ wordBreak: "break-all", fontSize: 12.5 }}>{enroll.secret}</code>
            </div>
          </div>
          <EnrollForm next={next} factorId={enroll.factorId} />
        </>
      )}
    </div>
  );
}
