import Link from "next/link";
import { todayISO } from "@altair/core";
import { Icon } from "@altair/ui";
import { getPublicConfig } from "@/lib/config/business-config";
import { CAN, panelSessionFor } from "@/lib/panel/context";
import { dateLabel, waLink } from "@/lib/panel/format";
import { Flash, PageHeader } from "../page-header";
import { LineEditor, type LineRow } from "../reservas/line-editor";

export const metadata = { title: "Despacho" };

function shift(dateISO: string, n: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + n)).toISOString().slice(0, 10);
}

export default async function DispatchPage({ searchParams }: { searchParams: Promise<{ fecha?: string; ok?: string }> }) {
  const sp = await searchParams;
  const { sb } = await panelSessionFor(CAN.ops);
  const { config } = await getPublicConfig();
  const today = todayISO(config?.timezone ?? "UTC");
  const day = sp.fecha && /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha) ? sp.fecha : today;
  const [{ data: lines }, { data: suppliers }] = await Promise.all([
    sb.from("booking_lines").select("*, bookings!inner(code, status, customer_name, customer_phone)").eq("service_date", day).neq("bookings.status", "cancelled").order("service_time", { nullsFirst: false }),
    sb.from("suppliers").select("id, name, whatsapp, phone").eq("active", true).order("name"),
  ]);
  const rows = (lines ?? []).filter((l) => l.ops_status !== "cancelled");
  const pending = rows.filter((l) => l.ops_status === "pending").length;
  const back = `/panel/despacho?fecha=${day}`;

  // One WhatsApp "route sheet" per supplier with that day's services.
  const bySupplier = (suppliers ?? []).map((s) => ({ s, items: rows.filter((l) => l.supplier_id === s.id) })).filter((x) => x.items.length);

  return (
    <>
      <PageHeader
        title="Despacho"
        subtitle="Los servicios del día: asigne proveedor, conductor y vehículo, y envíe a cada proveedor su hoja de ruta por WhatsApp."
        actions={
          <div className="row" style={{ gap: 6 }}>
            <Link className="btn line sm" href={`/panel/despacho?fecha=${shift(day, -1)}`} aria-label="Día anterior"><Icon name="chevronLeft" size={16} /></Link>
            <form className="row" style={{ gap: 6 }}>
              <input type="date" name="fecha" defaultValue={day} className="input" style={{ minHeight: 38, width: 160 }} />
              <button className="btn line sm" type="submit">Ver</button>
            </form>
            <Link className="btn line sm" href={`/panel/despacho?fecha=${shift(day, 1)}`} aria-label="Día siguiente"><Icon name="chevronLeft" size={16} style={{ transform: "rotate(180deg)" }} /></Link>
          </div>
        }
      />
      <Flash ok={sp.ok === "servicio" ? "Servicio actualizado." : null} />
      <div className="row" style={{ gap: 10 }}>
        <b style={{ fontSize: 18 }}>{dateLabel(day)}{day === today ? " · hoy" : ""}</b>
        <span className="st info">{rows.length} servicios</span>
        {pending ? <span className="st warn">{pending} por asignar</span> : rows.length ? <span className="st ok">Todo asignado</span> : null}
      </div>

      {bySupplier.length ? (
        <div className="row" style={{ gap: 8 }}>
          {bySupplier.map(({ s, items }) => {
            const text = `Hola ${s.name}, servicios del ${dateLabel(day)}:\n\n${items
              .map((l) => {
                const d = (l.details ?? {}) as Record<string, string>;
                const bk = l.bookings as unknown as { code: string; customer_name: string; customer_phone: string | null };
                return `• ${String(l.service_time ?? "").slice(0, 5)} ${l.title} · ${l.pax_adults + l.pax_children + l.pax_infants} pax · ${bk.customer_name}${bk.customer_phone ? ` (${bk.customer_phone})` : ""}${d.flight ? ` · vuelo ${d.flight}` : ""}${d.pickup_place ? ` · ${d.pickup_place}` : ""}${l.driver_name ? ` · ${l.driver_name}` : ""} [${bk.code}]`;
              })
              .join("\n")}\n\nGracias.`;
            const link = waLink(s.whatsapp ?? s.phone, text);
            return link ? (
              <a key={s.id} className="btn line sm" href={link} target="_blank" rel="noopener noreferrer"><Icon name="message" size={15} /> {s.name} ({items.length})</a>
            ) : (
              <span key={s.id} className="chip soft">{s.name} ({items.length}) · sin WhatsApp</span>
            );
          })}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="card pad-l small">No hay servicios para este día.</div>
      ) : (
        rows.map((l) => {
          const bk = l.bookings as unknown as { code: string; customer_name: string };
          return (
            <LineEditor
              key={l.id}
              line={l as unknown as LineRow}
              suppliers={suppliers ?? []}
              currency={config?.currency ?? "USD"}
              back={back}
              canEdit
              header={<Link href={`/panel/reservas/${bk.code}`} className="tiny mono">{bk.code} · {bk.customer_name}</Link>}
            />
          );
        })
      )}
    </>
  );
}
