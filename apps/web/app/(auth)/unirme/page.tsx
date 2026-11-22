import type { Metadata } from "next";
import { ROLE_LABELS } from "@/lib/auth/staff";
import { Notice } from "@altair/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { createAnonSupabase } from "@/lib/supabase/anon";
import { InviteForm } from "../join-forms";

export const metadata: Metadata = { title: "Unirme al equipo" };

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const token = typeof t === "string" && /^[A-Za-z0-9_-]{32,100}$/.test(t) ? t : "";
  let check: { valid: boolean; email?: string; role?: string; full_name?: string; business_name?: string } = { valid: false };
  if (token && isSupabaseConfigured()) {
    const { data } = await createAnonSupabase().rpc("staff_invite_check", { p_token: token });
    check = (data as typeof check) ?? { valid: false };
  }
  return (
    <div className="col" style={{ gap: 18 }}>
      {check.valid && check.email ? (
        <>
          <div className="col" style={{ gap: 4 }}>
            <h1 className="h3">Invitación al equipo de {check.business_name}</h1>
            <p className="small">Rol: <b>{ROLE_LABELS[check.role as keyof typeof ROLE_LABELS] ?? check.role}</b>. Cree su acceso y active el código de su celular.</p>
          </div>
          <InviteForm token={token} email={check.email} fullName={check.full_name ?? ""} />
        </>
      ) : (
        <Notice tone="warn">Esta invitación no es válida o ya se usó. Solicite una nueva al dueño del negocio.</Notice>
      )}
    </div>
  );
}
