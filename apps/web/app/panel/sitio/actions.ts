"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SITE_FONTS, SITE_LAYOUTS, THEME_PRESET_IDS, isHexColor, parseSite, siteSchema } from "@altair/config";
import { requireStaff } from "@/lib/auth/staff";
import { UploadError, uploadImage } from "@/lib/panel/upload";
import { createServerSupabase } from "@/lib/supabase/server";

// The public site's look: palette, layout, font, logo, hero photo and texts (business_config.site/theme).

export type BrandState = { status: "idle" | "saved" | "error"; message: string | null };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function saveBrand(_prev: BrandState, formData: FormData): Promise<BrandState> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ["owner", "admin"]);
  if (!staff) return { status: "error", message: "Solo el dueño o un administrador puede cambiar el sitio." };

  const { data: row } = await sb.from("business_config").select("site, theme, onboarding").eq("id", 1).maybeSingle();
  const site = parseSite(row?.site);
  const theme = { ...((row?.theme as Record<string, unknown>) ?? {}) } as Record<string, unknown>;

  try {
    const logo = formData.get("logo");
    if (logo instanceof File && logo.size > 0) site.logoPath = await uploadImage(sb, "brand", "logo", logo);
    const hero = formData.get("hero");
    if (hero instanceof File && hero.size > 0) site.heroPath = await uploadImage(sb, "brand", "hero", hero, 8 * 1024 * 1024);
  } catch (e) {
    return { status: "error", message: e instanceof UploadError ? e.message : "No se pudo subir la imagen." };
  }
  if (formData.get("removeLogo") === "on") site.logoPath = null;
  if (formData.get("removeHero") === "on") site.heroPath = null;

  const layout = str(formData, "layout");
  if ((SITE_LAYOUTS as readonly string[]).includes(layout)) site.layout = layout as typeof site.layout;
  const font = str(formData, "font");
  if ((SITE_FONTS as readonly string[]).includes(font)) site.font = font as typeof site.font;
  for (const k of ["eyebrow", "headline", "subheadline", "about"] as const) {
    site[k] = { es: str(formData, `${k}_es`) || undefined, en: str(formData, `${k}_en`) || undefined };
  }
  const preset = str(formData, "preset");
  if ((THEME_PRESET_IDS as readonly string[]).includes(preset)) theme.preset = preset;
  for (const k of ["brand", "brand2", "accent"] as const) {
    const v = str(formData, k);
    if (formData.get("customColors") === "on" && isHexColor(v)) theme[k] = v;
    else delete theme[k];
  }

  const parsed = siteSchema.safeParse(site);
  if (!parsed.success) return { status: "error", message: "Algún texto es demasiado largo." };
  const onboarding = { ...((row?.onboarding as Record<string, boolean>) ?? {}), marca: true };
  const { error } = await sb.from("business_config").update({ site: parsed.data, theme, onboarding }).eq("id", 1);
  if (error) return { status: "error", message: "No se pudo guardar." };
  await sb.rpc("audit_log", { p_action: "site.update", p_target: "business_config", p_detail: { layout: parsed.data.layout, preset: theme.preset } });
  revalidatePath("/", "layout");
  return { status: "saved", message: "Guardado. Abra su sitio para ver cómo quedó." };
}

export async function setPublished(formData: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ["owner", "admin"]);
  if (!staff) redirect("/login");
  const publish = str(formData, "publish") === "1";
  const { data: row } = await sb.from("business_config").select("onboarding").eq("id", 1).maybeSingle();
  const onboarding = { ...((row?.onboarding as Record<string, boolean>) ?? {}), ...(publish ? { publicar: true } : {}) };
  await sb.from("business_config").update({ published: publish, onboarding }).eq("id", 1);
  await sb.rpc("audit_log", { p_action: publish ? "site.published" : "site.unpublished", p_target: "business_config", p_detail: {} });
  revalidatePath("/", "layout");
  const back = str(formData, "back");
  redirect(back === "configurar" ? "/panel/configurar?paso=publicar&ok=publicado" : `/panel/sitio?ok=${publish ? "publicado" : "oculto"}`);
}
