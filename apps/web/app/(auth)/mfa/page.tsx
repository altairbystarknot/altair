import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { mfaStatus } from "@/lib/auth/mfa";
import { safePanelReturn, withReturn } from "@/lib/auth/safe-return";
import { getSessionUser } from "@/lib/auth/staff";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { ChallengeForm } from "../forms";

export const metadata: Metadata = { title: "Verificación en dos pasos" };

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safePanelReturn((await searchParams).next);
  if (!isSupabaseConfigured()) redirect(withReturn("/login", next));
  const supabase = await createServerSupabase();
  if (!(await getSessionUser(supabase))) redirect(withReturn("/login", next));
  const status = await mfaStatus(supabase);
  if (status === "satisfied") redirect(next);
  if (status === "needs_enrollment") redirect(withReturn("/mfa/enroll", next));

  return (
    <div className="col" style={{ gap: 18 }}>
      <div className="col" style={{ gap: 4 }}>
        <h1 className="h3">Verificación en dos pasos</h1>
        <p className="small">Escriba el código que muestra su app de autenticación.</p>
      </div>
      <ChallengeForm next={next} />
    </div>
  );
}
