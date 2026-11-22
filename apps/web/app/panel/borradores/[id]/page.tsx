import Link from "next/link";
import { notFound } from "next/navigation";
import { CATALOG_SECTIONS, catalogDraftSchema, type CatalogDraft } from "@altair/config";
import { Icon, Notice } from "@altair/ui";
import { getPublicConfig } from "@/lib/config/business-config";
import { panelSession } from "@/lib/panel/context";
import { dateTimeLabel } from "@/lib/panel/format";
import { Flash, PageHeader } from "../../page-header";
import { discardDraft, publishDraft } from "../actions";

export const metadata = { title: "Revisar borrador" };

const COLUMNS: Record<string, Array<[string, string]>> = {
  areas: [["name", "Zona"], ["kind", "Tipo"], ["iata", "IATA"]],
  places: [["name", "Lugar"], ["area", "Zona"], ["kind", "Tipo"]],
  vehicles: [["name", "Vehículo"], ["capacityPax", "Pasajeros"], ["capacityBags", "Maletas"]],
  seasons: [["name", "Temporada"], ["startsOn", "Desde"], ["endsOn", "Hasta"]],
  rates: [["from", "Desde"], ["to", "Hacia"], ["vehicle", "Vehículo"], ["season", "Temporada"], ["price", "Precio sin imp."], ["netCost", "Costo"], ["bothWays", "Ida y vuelta"]],
  surcharges: [["name", "Recargo"], ["startTime", "Desde"], ["endTime", "Hasta"], ["amount", "Monto sin imp."]],
  extras: [["name", "Extra"], ["price", "Precio sin imp."], ["maxQty", "Máximo"]],
  activities: [["title", "Actividad"], ["area", "Zona"], ["priceAdult", "Adulto sin imp."], ["priceChild", "Niño sin imp."], ["schedules", "Salidas"], ["bookingMode", "Confirmación"]],
  suppliers: [["name", "Proveedor"], ["kind", "Tipo"], ["whatsapp", "WhatsApp"]],
};

const WORDS: Record<string, string> = {
  airport: "Aeropuerto", zone: "Zona", hotel: "Hotel", town: "Pueblo", port: "Puerto", other: "Otro",
  instant: "Inmediata", request: "Bajo solicitud", transport: "Transporte", activity: "Actividades", guide: "Guía",
};

function fmt(v: unknown): string {
  if (typeof v === "string" && WORDS[v]) return WORDS[v];
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) {
    if (!v.length) return "—";
    if (typeof v[0] === "object") return (v as Array<{ time?: string }>).map((x) => x.time ?? "•").join(", ");
    return v.join(", ");
  }
  if (typeof v === "boolean") return v ? "sí" : "no";
  return String(v);
}

export default async function DraftPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string; desde?: string }>;
}) {
  const { id } = await params;
  const { ok, error, desde } = await searchParams;
  const { sb, staff } = await panelSession();
  const { config } = await getPublicConfig();
  const { data: cs } = await sb.from("change_sets").select("*").eq("id", id).maybeSingle();
  if (!cs) notFound();
  const parsed = catalogDraftSchema.safeParse(cs.payload);
  const draft = (parsed.success ? parsed.data : {}) as CatalogDraft;
  const canDecide = (staff.role === "owner" || staff.role === "admin") && cs.status === "draft";
  const result = (cs.result ?? {}) as Record<string, number>;
  const origin =
    cs.source === "claude" ? "Propuesto por Claude" : cs.source === "import" ? "Importado de Excel" : cs.source === "sample" ? "Datos de ejemplo" : "Creado en el panel";

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/panel/borradores">
            <Icon name="chevronLeft" size={14} /> Borradores
          </Link>
        }
        title={cs.title}
        subtitle={`${origin} · ${dateTimeLabel(cs.created_at, config?.timezone ?? "UTC")} · ${cs.row_count} filas`}
      />
      <Flash
        ok={ok === "importado" ? "Archivo leído. Revise el borrador y publíquelo si está correcto." : ok === "publicado" ? "Publicado: su catálogo ya tiene estos cambios." : null}
        error={error === "publicar" ? `No se pudo publicar: ${cs.error ?? ""}` : error ? "No se pudo completar la acción." : null}
      />
      {cs.summary ? <p className="small">{cs.summary}</p> : null}
      {!parsed.success ? <Notice tone="bad">Este borrador no tiene un formato válido y no se puede publicar.</Notice> : null}
      {cs.status === "published" ? (
        <Notice tone="ok">
          Publicado.{" "}
          {Object.entries(result)
            .map(([k, v]) => `${CATALOG_SECTIONS.find((s) => s.key === k)?.label ?? k}: ${v}`)
            .join(" · ")}
        </Notice>
      ) : null}
      {cs.status === "failed" ? <Notice tone="bad">Falló: {cs.error}</Notice> : null}

      {canDecide ? (
        <div className="glass row" style={{ borderRadius: 26, padding: "12px 14px 12px 20px", justifyContent: "space-between", position: "sticky", top: 12, zIndex: 5 }}>
          <span className="small">
            <b>¿Todo bien?</b> Al publicar, estos datos reemplazan los que tengan el mismo nombre.
          </span>
          <div className="row" style={{ gap: 8 }}>
            <form action={discardDraft}>
              <input type="hidden" name="id" value={cs.id} />
              <button className="btn line sm" type="submit">Descartar</button>
            </form>
            <form action={publishDraft}>
              <input type="hidden" name="id" value={cs.id} />
              {desde === "configurar" ? <input type="hidden" name="back" value="configurar" /> : null}
              <button className="btn tint sm" type="submit">
                <Icon name="check" size={16} /> Publicar
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {CATALOG_SECTIONS.filter((s) => (draft[s.key]?.length ?? 0) > 0).map((s) => {
        const rows = draft[s.key] as unknown as Array<Record<string, unknown>>;
        const cols = COLUMNS[s.key] ?? [];
        return (
          <section key={s.key} className="card" style={{ overflowX: "auto" }}>
            <div className="row" style={{ justifyContent: "space-between", padding: "16px 18px 4px" }}>
              <h2 className="h4">{s.label}</h2>
              <span className="st mute">{rows.length}</span>
            </div>
            <table className="tbl">
              <thead>
                <tr>{cols.map(([, label]) => <th key={label}>{label}</th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(0, 60).map((r, i) => (
                  <tr key={i}>{cols.map(([k]) => <td key={k}>{fmt(r[k])}</td>)}</tr>
                ))}
              </tbody>
            </table>
            {rows.length > 60 ? <p className="tiny" style={{ padding: "8px 18px 14px" }}>… y {rows.length - 60} filas más.</p> : null}
          </section>
        );
      })}
    </>
  );
}
