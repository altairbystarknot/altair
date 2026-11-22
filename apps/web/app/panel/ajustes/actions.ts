"use server";

import { revalidatePath } from "next/cache";
import {
  SUPPORTED_LOCALES,
  businessConfigSchema,
  parseBusinessConfigRow,
  toBusinessConfigRow,
  type BusinessConfig,
} from "@altair/config";
import { requireStaff } from "@/lib/auth/staff";
import { createServerSupabase } from "@/lib/supabase/server";

export type SettingsState = { status: "idle" | "saved" | "error"; message: string | null; fieldErrors: Record<string, string> };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const orNull = (v: string) => (v === "" ? null : v);

/**
 * Save the business settings. Owner or admin, at aal2 (requireStaff); the database checks the same
 * thing again (RLS) and validates every field again (CHECK constraints). Every save is written to the
 * audit trail with the list of fields that changed.
 */
export async function saveBusinessSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const supabase = await createServerSupabase();
  const staff = await requireStaff(supabase, ["owner", "admin"]);
  if (!staff) return { status: "error", message: "Solo el dueño o un administrador puede cambiar estos ajustes.", fieldErrors: {} };

  const { data: row, error: readError } = await supabase.from("business_config").select("*").eq("id", 1).maybeSingle();
  const current = parseBusinessConfigRow(row);
  if (readError || !current) return { status: "error", message: "No se pudo leer la configuración actual.", fieldErrors: {} };

  const vatPercent = Number(str(formData, "vatPercent").replace(",", "."));
  const locales = SUPPORTED_LOCALES.filter((l) => formData.get(`locale_${l}`) === "on");
  const candidate: BusinessConfig = {
    ...current,
    name: str(formData, "name"),
    contactEmail: orNull(str(formData, "contactEmail")),
    contactWhatsapp: orNull(str(formData, "contactWhatsapp")),
    locales,
    defaultLocale: str(formData, "defaultLocale") as BusinessConfig["defaultLocale"],
    timezone: str(formData, "timezone"),
    currency: str(formData, "currency").toUpperCase(),
    vatRate: Number.isFinite(vatPercent) ? Math.round(vatPercent * 100) / 10000 : Number.NaN,
    rounding: str(formData, "rounding") as BusinessConfig["rounding"],
    reservationPrefix: str(formData, "reservationPrefix").toUpperCase(),
    paymentsMode: str(formData, "paymentsMode") as BusinessConfig["paymentsMode"],
    theme: { ...current.theme, preset: str(formData, "preset") as BusinessConfig["theme"]["preset"] },
  };

  const parsed = businessConfigSchema.safeParse(candidate);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Revise los campos marcados.", fieldErrors };
  }

  const next = toBusinessConfigRow(parsed.data);
  const before = toBusinessConfigRow(current);
  const changed = (Object.keys(next) as Array<keyof typeof next>).filter((k) => JSON.stringify(next[k]) !== JSON.stringify(before[k]));
  if (changed.length === 0) return { status: "saved", message: "No había cambios.", fieldErrors: {} };

  const { data: updated, error } = await supabase.from("business_config").update(next).eq("id", 1).select("id");
  if (error || !updated || updated.length !== 1) {
    return { status: "error", message: "No se pudo guardar. Si el problema continúa, comuníquese con Starknot.", fieldErrors: {} };
  }
  await supabase.rpc("audit_log", { p_action: "config.update", p_target: "business_config", p_detail: { fields: changed } });

  revalidatePath("/", "layout");
  return { status: "saved", message: "Guardado. El sitio ya muestra los cambios.", fieldErrors: {} };
}
