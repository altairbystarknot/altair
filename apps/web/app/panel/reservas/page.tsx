import Link from "next/link";
import { Icon } from "@altair/ui";
import { getPublicConfig } from "@/lib/config/business-config";
import { panelSession } from "@/lib/panel/context";
import { BOOKING_STATUS, dateLabel, dateTimeLabel, money } from "@/lib/panel/format";
import { PageHeader } from "../page-header";

export const metadata = { title: "Reservas" };

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string; desde?: string; hasta?: string }> }) {
  const sp = await searchParams;
  const { sb } = await panelSession();
  const { config } = await getPublicConfig();
  const tz = config?.timezone ?? "UTC";
  const currency = config?.currency ?? "USD";

  let q = sb.from("bookings").select("id, code, status, customer_name, customer_email, total_cents, needs_quote, source, created_at, booking_lines(service_date, kind)").order("created_at", { ascending: false }).limit(200);
  if (sp.estado && BOOKING_STATUS[sp.estado]) q = q.eq("status", sp.estado);
  const term = (sp.q ?? "").trim().replace(/[%,()]/g, "");
  if (term) q = q.or(`code.ilike.%${term}%,customer_name.ilike.%${term}%,customer_email.ilike.%${term}%`);
  const { data } = await q;
  const ids = (data ?? []).map((b) => b.id);
  const { data: balances } = ids.length ? await sb.from("booking_balances").select("booking_id, paid_cents").in("booking_id", ids) : { data: [] };
  const paid = new Map((balances ?? []).map((b) => [b.booking_id, b.paid_cents as number]));
  const rows = (data ?? []).filter((b) => {
    const dates = (b.booking_lines as Array<{ service_date: string }>).map((l) => l.service_date);
    if (sp.desde && !dates.some((d) => d >= sp.desde!)) return false;
    if (sp.hasta && !dates.some((d) => d <= sp.hasta!)) return false;
    return true;
  });

  return (
    <>
      <PageHeader title="Reservas" subtitle="Todo lo que llega por su sitio, por el panel o por Claude." />
      <form className="card pad row" style={{ gap: 10 }} role="search">
        <div className="input" style={{ flex: "1 1 260px", minHeight: 44 }}>
          <Icon name="search" size={18} />
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Código, nombre o correo" />
        </div>
        <select name="estado" defaultValue={sp.estado ?? ""} className="input" style={{ flex: "1 1 190px", width: "auto", minHeight: 44 }} aria-label="Estado">
          <option value="">Todos los estados</option>
          {Object.entries(BOOKING_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="date" name="desde" defaultValue={sp.desde ?? ""} className="input" style={{ flex: "1 1 140px", width: "auto", minHeight: 44 }} aria-label="Servicio desde" title="Servicio desde" />
        <input type="date" name="hasta" defaultValue={sp.hasta ?? ""} className="input" style={{ flex: "1 1 140px", width: "auto", minHeight: 44 }} aria-label="Servicio hasta" title="Servicio hasta" />
        <button className="btn tint sm" type="submit" style={{ flex: "0 0 auto" }}>Filtrar</button>
      </form>
      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead><tr><th>Código</th><th>Cliente</th><th>Servicios</th><th>Estado</th><th className="r">Total</th><th className="r">Pagado</th><th>Recibida</th></tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="small" style={{ padding: 22 }}>No hay reservas con esos filtros.</td></tr>
            ) : (
              rows.map((b) => {
                const lines = b.booking_lines as Array<{ service_date: string; kind: string }>;
                const first = lines.map((l) => l.service_date).sort()[0];
                const p = paid.get(b.id) ?? 0;
                return (
                  <tr key={b.id}>
                    <td><Link href={`/panel/reservas/${b.code}`} className="mono" style={{ fontWeight: 700 }}>{b.code}</Link>{b.source === "claude" ? <Icon name="sparkle" size={13} label="Creada por Claude" style={{ display: "inline", verticalAlign: "-2px", marginLeft: 6 }} /> : null}</td>
                    <td><b>{b.customer_name}</b><div className="tiny">{b.customer_email}</div></td>
                    <td className="tiny">{lines.length} · {first ? dateLabel(first) : ""}</td>
                    <td>
                      <span className={`st ${BOOKING_STATUS[b.status]?.tone ?? "mute"}`}>{BOOKING_STATUS[b.status]?.label ?? b.status}</span>
                      {b.needs_quote ? <span className="st gold" style={{ marginLeft: 6 }}>Cotizar</span> : null}
                    </td>
                    <td className="r">{money(b.total_cents, currency)}</td>
                    <td className="r">{p >= b.total_cents && b.total_cents > 0 ? <span className="st ok">Pagado</span> : p > 0 ? money(p, currency) : <span className="tiny">—</span>}</td>
                    <td className="tiny">{dateTimeLabel(b.created_at, tz)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
