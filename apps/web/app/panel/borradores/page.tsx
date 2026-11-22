import Link from "next/link";
import { Icon, type IconName } from "@altair/ui";
import { getPublicConfig } from "@/lib/config/business-config";
import { panelSession } from "@/lib/panel/context";
import { dateTimeLabel } from "@/lib/panel/format";
import { Flash, PageHeader } from "../page-header";

export const metadata = { title: "Borradores" };

const SOURCE: Record<string, { label: string; icon: IconName }> = {
  claude: { label: "Claude", icon: "sparkle" },
  import: { label: "Excel", icon: "sheet" },
  panel: { label: "Panel", icon: "edit" },
  sample: { label: "Datos de ejemplo", icon: "check" },
};
const STATUS: Record<string, { label: string; tone: string }> = {
  draft: { label: "Por revisar", tone: "warn" },
  published: { label: "Publicado", tone: "ok" },
  discarded: { label: "Descartado", tone: "mute" },
  failed: { label: "Falló", tone: "bad" },
};

export default async function DraftsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { sb } = await panelSession();
  const { ok, error } = await searchParams;
  const { config } = await getPublicConfig();
  const { data } = await sb
    .from("change_sets")
    .select("id, kind, title, summary, row_count, status, source, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = data ?? [];
  return (
    <>
      <PageHeader
        title="Borradores"
        subtitle="Todo cambio de catálogo que propone Claude, una importación de Excel o los datos de ejemplo llega aquí. Nada se publica hasta que una persona lo aprueba."
        actions={
          <Link href="/panel/importar" className="btn line sm">
            <Icon name="sheet" size={16} /> Importar Excel
          </Link>
        }
      />
      <Flash ok={ok === "descartado" ? "Borrador descartado." : null} error={error ? "No se pudo completar la acción." : null} />
      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Borrador</th>
              <th>Origen</th>
              <th className="r">Filas</th>
              <th>Estado</th>
              <th>Creado</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="small" style={{ padding: 24, whiteSpace: "normal" }}>
                  Todavía no hay borradores. Pídale a su Claude que prepare las tarifas o importe un Excel.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "normal" }}>
                    <Link href={`/panel/borradores/${r.id}`} style={{ fontWeight: 620 }}>
                      {r.title}
                    </Link>
                    {r.summary ? <div className="tiny" style={{ maxWidth: 520 }}>{r.summary}</div> : null}
                  </td>
                  <td>
                    <span className="row" style={{ gap: 6 }}>
                      <Icon name={SOURCE[r.source]?.icon ?? "edit"} size={15} /> {SOURCE[r.source]?.label ?? r.source}
                    </span>
                  </td>
                  <td className="r">{r.row_count}</td>
                  <td>
                    <span className={`st ${STATUS[r.status]?.tone ?? "mute"}`}>{STATUS[r.status]?.label ?? r.status}</span>
                  </td>
                  <td className="tiny">{dateTimeLabel(r.created_at, config?.timezone ?? "UTC")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
