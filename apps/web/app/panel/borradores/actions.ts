"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { catalogDraftSchema, checkDraftReferences, draftKind, draftRowCount, sampleCatalog, SAMPLE_LABEL } from "@altair/config";
import { requireStaff } from "@/lib/auth/staff";
import { applyDraft } from "@/lib/catalog/admin";
import { parseCatalogWorkbook } from "@/lib/catalog/spreadsheet";
import { createServerSupabase } from "@/lib/supabase/server";

// Drafts (change sets): publish, discard, load the sample catalog, import an Excel file.
// Publishing re-validates the payload (it may come from Claude) and applies it with the person's session.

const ADMIN = ["owner", "admin"] as const;

export async function publishDraft(formData: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ADMIN);
  if (!staff) redirect("/login");
  const id = String(formData.get("id") ?? "");
  const back = String(formData.get("back") ?? "") === "configurar" ? "/panel/configurar?paso=datos" : `/panel/borradores/${id}`;
  const { data: cs } = await sb.from("change_sets").select("id, status, payload").eq("id", id).maybeSingle();
  if (!cs || cs.status !== "draft") redirect(`${back}${back.includes("?") ? "&" : "?"}error=estado`);
  const parsed = catalogDraftSchema.safeParse(cs.payload);
  if (!parsed.success) {
    await sb.from("change_sets").update({ status: "failed", error: "El borrador no tiene un formato válido", decided_by: staff.user.id, decided_at: new Date().toISOString() }).eq("id", id);
    redirect(`/panel/borradores/${id}?error=formato`);
  }
  try {
    const result = await applyDraft(sb, parsed.data);
    await sb.from("change_sets").update({ status: "published", result, decided_by: staff.user.id, decided_at: new Date().toISOString() }).eq("id", id);
    await sb.rpc("audit_log", { p_action: "catalog.published", p_target: id, p_detail: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 500) : "Error";
    await sb.from("change_sets").update({ status: "failed", error: msg, decided_by: staff.user.id, decided_at: new Date().toISOString() }).eq("id", id);
    redirect(`/panel/borradores/${id}?error=publicar`);
  }
  revalidatePath("/", "layout");
  redirect(`${back}${back.includes("?") ? "&" : "?"}ok=${back.startsWith("/panel/configurar") ? "publicado_datos" : "publicado"}`);
}

export async function discardDraft(formData: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ADMIN);
  if (!staff) redirect("/login");
  const id = String(formData.get("id") ?? "");
  await sb.from("change_sets").update({ status: "discarded", decided_by: staff.user.id, decided_at: new Date().toISOString() }).eq("id", id).eq("status", "draft");
  revalidatePath("/panel", "layout");
  redirect("/panel/borradores?ok=descartado");
}

export async function loadSampleCatalog(formData: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ADMIN);
  if (!staff) redirect("/login");
  const draft = catalogDraftSchema.parse(sampleCatalog());
  const { data, error } = await sb
    .from("change_sets")
    .insert({ kind: "catalog", title: SAMPLE_LABEL, summary: "Zonas, tarifas, vehículos y actividades de muestra para ver Altair funcionando. Cámbielos por los suyos cuando quiera.", payload: draft, row_count: draftRowCount(draft), source: "sample" })
    .select("id")
    .single();
  if (error || !data) redirect("/panel/borradores?error=crear");
  revalidatePath("/panel", "layout");
  const back = String(formData.get("back") ?? "");
  redirect(back === "configurar" ? `/panel/borradores/${data.id}?desde=configurar` : `/panel/borradores/${data.id}`);
}

export type ImportState = { error: string | null; problems: string[] };

export async function importWorkbook(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ADMIN);
  if (!staff) return { error: "Su sesión venció. Vuelva a entrar.", problems: [] };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Elija un archivo .xlsx.", problems: [] };
  if (file.size > 5 * 1024 * 1024) return { error: "El archivo pesa más de 5 MB.", problems: [] };
  if (!/\.xlsx$/i.test(file.name)) return { error: "Por ahora aceptamos archivos .xlsx (Excel o Google Sheets → Descargar → .xlsx).", problems: [] };
  const parsed = await parseCatalogWorkbook(Buffer.from(await file.arrayBuffer()));
  if (!parsed.draft) return { error: "El archivo tiene datos que hay que corregir antes de importarlo.", problems: parsed.problems };

  const [areas, vehicles, seasons] = await Promise.all([
    sb.from("areas").select("name"),
    sb.from("vehicle_classes").select("name"),
    sb.from("rate_seasons").select("name"),
  ]);
  const refs = checkDraftReferences(parsed.draft, {
    areas: (areas.data ?? []).map((r) => r.name),
    vehicles: (vehicles.data ?? []).map((r) => r.name),
    seasons: (seasons.data ?? []).map((r) => r.name),
  });
  if (refs.length) return { error: "Hay nombres que no coinciden entre hojas.", problems: refs };

  const { data, error } = await sb
    .from("change_sets")
    .insert({
      kind: draftKind(parsed.draft),
      title: `Importación: ${file.name}`.slice(0, 160),
      summary: `Hojas leídas: ${parsed.sheetsRead.join(", ")}`,
      payload: parsed.draft,
      row_count: draftRowCount(parsed.draft),
      source: "import",
    })
    .select("id")
    .single();
  if (error || !data) return { error: "No pudimos guardar el borrador. Intente de nuevo.", problems: [] };
  revalidatePath("/panel", "layout");
  redirect(`/panel/borradores/${data.id}?ok=importado`);
}
