import type { Metadata } from "next";
import { parseBusinessConfigRow } from "@altair/config";
import { Notice } from "@altair/ui";
import { requireStaff } from "@/lib/auth/staff";
import { createServerSupabase } from "@/lib/supabase/server";
import { PageHeader } from "../page-header";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Ajustes del negocio" };

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const staff = await requireStaff(supabase);
  if (!staff) return null; // the layout already sent the visitor away

  // The full row through the staff session (RLS: staff + aal2), not the public view.
  const { data } = await supabase.from("business_config").select("*").eq("id", 1).maybeSingle();
  const config = parseBusinessConfigRow(data);

  return (
    <>
      <PageHeader title="Ajustes del negocio" subtitle="Nombre, contacto, idiomas, moneda, impuestos y pagos de su negocio." />
      {config ? (
        <SettingsForm config={config} canEdit={staff.role === "owner" || staff.role === "admin"} />
      ) : (
        <Notice tone="bad">No se pudo leer la configuración del negocio.</Notice>
      )}
    </>
  );
}
