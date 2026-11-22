import { Icon } from "@altair/ui";
import { LINE_STATUS, dateLabel, money } from "@/lib/panel/format";
import { updateLine } from "./actions";

export type LineRow = {
  id: string;
  kind: string;
  title: string;
  service_date: string;
  service_time: string | null;
  pax_adults: number;
  pax_children: number;
  pax_infants: number;
  total_cents: number;
  needs_quote: boolean;
  ops_status: string;
  supplier_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_info: string | null;
  ops_notes: string | null;
  details: Record<string, unknown>;
};

/** One service with its operational fields (supplier, driver, vehicle, status). Server-rendered form. */
export function LineEditor({
  line,
  suppliers,
  currency,
  back,
  canEdit,
  header,
}: {
  line: LineRow;
  suppliers: Array<{ id: string; name: string }>;
  currency: string;
  back: string;
  canEdit: boolean;
  header?: React.ReactNode;
}) {
  const d = line.details ?? {};
  const pax = line.pax_adults + line.pax_children + line.pax_infants;
  const info = [
    d.from && d.to ? `${String(d.from)} → ${String(d.to)}` : null,
    d.vehicle ? String(d.vehicle) : null,
    d.flight ? `Vuelo ${String(d.flight)}` : null,
    d.pickup_area ? `Recogida ${String(d.pickup_area)}` : null,
    d.pickup_place ? String(d.pickup_place) : null,
    d.note ? `Nota: ${String(d.note)}` : null,
  ].filter(Boolean);
  const st = LINE_STATUS[line.ops_status] ?? { label: line.ops_status, tone: "mute" as const };
  return (
    <form action={updateLine} className="panel col" style={{ gap: 10 }}>
      <input type="hidden" name="lineId" value={line.id} />
      <input type="hidden" name="back" value={back} />
      <div className="row" style={{ justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div className="row" style={{ gap: 10, alignItems: "flex-start", minWidth: 0, flex: "1 1 260px", flexWrap: "nowrap" }}>
          <span className="ico soft"><Icon name={line.kind === "transfer" ? "car" : "mountain"} /></span>
          <div className="col" style={{ gap: 2, minWidth: 0 }}>
            {header}
            <b>{line.title}</b>
            <span className="tiny">
              {dateLabel(line.service_date)} {line.service_time ? `· ${String(line.service_time).slice(0, 5)}` : ""} · {pax} pax
              {line.pax_children ? ` (${line.pax_children} ${line.pax_children === 1 ? "niño" : "niños"})` : ""}
              {line.pax_infants ? ` (${line.pax_infants} ${line.pax_infants === 1 ? "bebé" : "bebés"})` : ""}
            </span>
            {info.length ? <span className="tiny" style={{ whiteSpace: "normal" }}>{info.join(" · ")}</span> : null}
          </div>
        </div>
        <div className="col" style={{ gap: 4, alignItems: "flex-end", marginLeft: "auto" }}>
          <span className={`st ${st.tone}`}>{st.label}</span>
          <b className="small">{line.needs_quote ? "A cotizar" : money(line.total_cents, currency)}</b>
        </div>
      </div>
      <fieldset disabled={!canEdit} style={{ border: 0, padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, max(180px, calc((100% - 16px) / 3))), 1fr))", gap: 8 }}>
        <select name="supplierId" defaultValue={line.supplier_id ?? ""} className="input" style={{ minHeight: 40 }} aria-label="Proveedor">
          <option value="">Proveedor…</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input name="driverName" defaultValue={line.driver_name ?? ""} placeholder={line.kind === "transfer" ? "Conductor" : "Guía"} className="input" style={{ minHeight: 40 }} />
        <input name="driverPhone" defaultValue={line.driver_phone ?? ""} placeholder="Teléfono" className="input" style={{ minHeight: 40 }} />
        <input name="vehicleInfo" defaultValue={line.vehicle_info ?? ""} placeholder={line.kind === "transfer" ? "Vehículo / placa" : "Grupo"} className="input" style={{ minHeight: 40 }} />
        <select name="opsStatus" defaultValue={line.ops_status} className="input" style={{ minHeight: 40 }} aria-label="Estado">
          {Object.entries(LINE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input name="opsNotes" defaultValue={line.ops_notes ?? ""} placeholder="Nota interna" className="input" style={{ minHeight: 40 }} />
      </fieldset>
      {canEdit ? <button className="btn line sm" type="submit" style={{ alignSelf: "flex-end" }}>Guardar</button> : null}
    </form>
  );
}
