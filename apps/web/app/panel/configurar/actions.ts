"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ONBOARDING_STEPS, paymentInstructionsSchema } from "@altair/config";
import { requireStaff } from "@/lib/auth/staff";
import { createServerSupabase, type ServerSupabase } from "@/lib/supabase/server";

// The setup wizard's own steps (business details and brand reuse the Ajustes and Sitio actions).


async function mark(sb: ServerSupabase, step: string, extra: Record<string, unknown> = {}) {
  const { data: row } = await sb.from("business_config").select("onboarding").eq("id", 1).maybeSingle();
  const onboarding = { ...((row?.onboarding as Record<string, boolean>) ?? {}), [step]: true };
  await sb.from("business_config").update({ onboarding, ...extra }).eq("id", 1);
}

function next(step: string): string {
  const i = ONBOARDING_STEPS.indexOf(step as (typeof ONBOARDING_STEPS)[number]);
  return ONBOARDING_STEPS[Math.min(i + 1, ONBOARDING_STEPS.length - 1)] ?? "publicar";
}

export async function completeStep(formData: FormData): Promise<void> {
  const sb = await createServerSupabase();
  if (!(await requireStaff(sb, ["owner", "admin"]))) redirect("/login");
  const step = String(formData.get("step") ?? "");
  if (!(ONBOARDING_STEPS as readonly string[]).includes(step)) redirect("/panel/configurar");
  await mark(sb, step);
  revalidatePath("/panel", "layout");
  redirect(`/panel/configurar?paso=${next(step)}`);
}

export async function saveServices(formData: FormData): Promise<void> {
  const sb = await createServerSupabase();
  if (!(await requireStaff(sb, ["owner", "admin"]))) redirect("/login");
  const { data: row } = await sb.from("business_config").select("features").eq("id", 1).maybeSingle();
  const features = { ...((row?.features as Record<string, boolean>) ?? {}), transfers: formData.get("transfers") === "on", activities: formData.get("activities") === "on" };
  if (!features.transfers && !features.activities) redirect("/panel/configurar?paso=servicios&error=ninguno");
  await mark(sb, "servicios", { features });
  revalidatePath("/", "layout");
  redirect("/panel/configurar?paso=datos");
}

export async function savePayments(formData: FormData): Promise<void> {
  const sb = await createServerSupabase();
  if (!(await requireStaff(sb, ["owner", "admin"]))) redirect("/login");
  const parsed = paymentInstructionsSchema.safeParse({
    es: String(formData.get("pay_es") ?? "").trim() || undefined,
    en: String(formData.get("pay_en") ?? "").trim() || undefined,
  });
  if (!parsed.success) redirect("/panel/configurar?paso=cobros&error=largo");
  await mark(sb, "cobros", { payment_instructions: parsed.data, payments_mode: "records" });
  await sb.rpc("audit_log", { p_action: "payments.instructions", p_target: "business_config", p_detail: {} });
  revalidatePath("/", "layout");
  const back = String(formData.get("back") ?? "");
  redirect(back === "cobros" ? "/panel/cobros?ok=guardado" : "/panel/configurar?paso=claude");
}
