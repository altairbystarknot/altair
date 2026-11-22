import { parseSite, type ThemePresetId } from "@altair/config";
import { Icon } from "@altair/ui";
import { mediaUrl } from "@/lib/media";
import { CAN, panelSessionFor } from "@/lib/panel/context";
import { Flash, PageHeader } from "../page-header";
import { setPublished } from "./actions";
import { BrandForm } from "./brand-form";

export const metadata = { title: "Sitio y marca" };

export default async function SitePage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { sb } = await panelSessionFor(CAN.site);
  const { ok } = await searchParams;
  const { data: row } = await sb.from("business_config").select("site, theme, published, locales").eq("id", 1).maybeSingle();
  const site = parseSite(row?.site);
  const theme = (row?.theme ?? { preset: "marea" }) as { preset: ThemePresetId; brand?: string; brand2?: string; accent?: string };
  return (
    <>
      <PageHeader
        title="Sitio y marca"
        subtitle="Su logo, sus colores y el diseño de su página de reservas. Los cambios se ven al instante."
        actions={
          <form action={setPublished}>
            <input type="hidden" name="publish" value={row?.published ? "0" : "1"} />
            <button type="submit" className={`btn sm ${row?.published ? "line" : "tint"}`}>
              <Icon name={row?.published ? "eye" : "globe"} size={16} /> {row?.published ? "Ocultar sitio" : "Publicar sitio"}
            </button>
          </form>
        }
      />
      <Flash ok={ok === "publicado" ? "Su sitio está publicado." : ok === "oculto" ? "Su sitio quedó oculto: los visitantes ven «muy pronto»." : null} />
      <div className="row" style={{ gap: 10 }}>
        <span className={`st ${row?.published ? "ok" : "warn"}`}>{row?.published ? "Publicado" : "Sin publicar (solo usted lo ve)"}</span>
      </div>
      <BrandForm
        site={{ ...site, logoUrl: mediaUrl(site.logoPath), heroUrl: mediaUrl(site.heroPath) }}
        theme={theme}
        showEnglish={(row?.locales ?? []).includes("en")}
      />
    </>
  );
}
