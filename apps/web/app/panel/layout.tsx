import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AltairMark, Button, Icon, Notice } from "@altair/ui";
import { ROLE_LABELS, getSessionUser, isAal2, requireStaff } from "@/lib/auth/staff";
import { getPublicConfig } from "@/lib/config/business-config";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { logout } from "../(auth)/actions";
import { PanelNav } from "./panel-nav";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };

// The panel re-checks the session itself (defense in depth behind the proxy): signed in, second factor
// verified, and an ACTIVE staff member. A verified account that is not staff gets a clear "no access"
// page instead of a redirect loop.
export default async function PanelLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createServerSupabase();
  const staff = await requireStaff(supabase);

  if (!staff) {
    const user = await getSessionUser(supabase);
    if (!user) redirect("/login");
    if (!(await isAal2(supabase))) redirect("/mfa");
    return (
      <main className="al-clip" style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16 }}>
        <div className="glass" style={{ width: "min(100%, 460px)", borderRadius: 32, padding: 26 }}>
          <AltairMark subtitle="Panel del negocio" />
          <div className="col" style={{ gap: 14 }}>
            <h1 className="h3">Su cuenta no tiene acceso a este panel</h1>
            <Notice tone="warn">Solicite acceso al dueño del negocio. Sesión iniciada como {user.email}.</Notice>
            <form action={logout}>
              <Button type="submit" variant="line">Salir</Button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const { config } = await getPublicConfig();
  const [{ data: bc }, { count: drafts }] = await Promise.all([
    supabase.from("business_config").select("published, onboarding").eq("id", 1).maybeSingle(),
    supabase.from("change_sets").select("id", { count: "exact", head: true }).eq("status", "draft"),
  ]);
  const setupDone = Boolean(bc?.published) || Boolean((bc?.onboarding as Record<string, boolean> | null)?.publicar);
  const footer = (
    <div className="col" style={{ gap: 8, padding: "10px 8px 2px", borderTop: "1px solid var(--line)" }}>
      <span className="tiny" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={staff.user.email ?? ""}>
        {staff.user.email}
      </span>
      <span className="st mute" style={{ alignSelf: "flex-start" }}>{ROLE_LABELS[staff.role]}</span>
      <form action={logout}>
        <button type="submit" className="item" style={{ width: "100%" }}>
          <Icon name="logout" />
          Salir
        </button>
      </form>
    </div>
  );

  return (
    <div className="al-clip" style={{ minHeight: "100dvh", background: "#f7f9fa" }}>
      <div className="amb gold" style={{ width: 700, height: 700, left: -280, top: -320, opacity: 0.8 }} aria-hidden="true" />
      <div className="amb cyan" style={{ width: 760, height: 760, right: -300, top: 420, opacity: 0.55 }} aria-hidden="true" />
      <div className="app panel-app">
        <PanelNav businessName={config?.name ?? "Mi negocio"} footer={footer} role={staff.role} drafts={drafts ?? 0} setupDone={setupDone} />
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
