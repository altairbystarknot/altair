import Link from "next/link";
import { parsePaymentInstructions } from "@altair/config";
import { Icon } from "@altair/ui";
import { getPublicConfig } from "@/lib/config/business-config";
import { CAN, panelSessionFor } from "@/lib/panel/context";
import { PAYMENT_METHODS, dateTimeLabel, money } from "@/lib/panel/format";
import { savePayments } from "../configurar/actions";
import { Flash, PageHeader } from "../page-header";

export const metadata = { title: "Cobros" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const sp = await searchParams;
  const { sb, staff } = await panelSessionFor(CAN.money);
  const { config } = await getPublicConfig();
  const tz = config?.timezone ?? "UTC";
  const currency = config?.currency ?? "USD";
  const [{ data: row }, { data: payments }, { data: open }] = await Promise.all([
    sb.from("business_config").select("payment_instructions, payments_mode, locales").eq("id", 1).maybeSingle(),
    sb.from("manual_payments").select("*, bookings(code, customer_name)").order("recorded_at", { ascending: false }).limit(50),
    sb.from("bookings").select("id, code, customer_name, total_cents, status").in("status", ["received", "confirmed"]).order("created_at", { ascending: false }).limit(200),
  ]);
  const ids = (open ?? []).map((b) => b.id);
  const { data: bal } = ids.length ? await sb.from("booking_balances").select("booking_id, paid_cents").in("booking_id", ids) : { data: [] };
  const paid = new Map((bal ?? []).map((b) => [b.booking_id, b.paid_cents as number]));
  const pending = (open ?? []).filter((b) => b.total_cents > (paid.get(b.id) ?? 0));
  const pendingTotal = pending.reduce((s, b) => s + b.total_cents - (paid.get(b.id) ?? 0), 0);
  const pay = parsePaymentInstructions(row?.payment_instructions);
  const canEdit = staff.role === "owner" || staff.role === "admin";

  return (
    <>
      <PageHeader title="Cobros" subtitle="Modo «solo registros»: sus clientes pagan como siempre (SINPE, transferencia, efectivo) y usted lo anota aquí. Altair nunca mueve dinero." />
      <Flash ok={sp.ok ? "Instrucciones guardadas." : null} />
      <div className="panel-kpis">
        <div className="kpi glass flat"><span>Por cobrar</span><b>{money(pendingTotal, currency)}</b><em>{pending.length} {pending.length === 1 ? "reserva" : "reservas"}</em></div>
        <div className="kpi glass flat"><span>Registrado (últimos 50)</span><b>{money((payments ?? []).reduce((s, p) => s + (p.kind === "refund" ? -p.amount_cents : p.amount_cents), 0), currency)}</b></div>
        <div className="kpi glass flat"><span>Modo</span><b style={{ fontSize: 22 }}>Solo registros</b><em>Stripe: pronto</em></div>
      </div>

      {canEdit ? (
        <form action={savePayments} className="card pad-l col" style={{ gap: 10 }}>
          <input type="hidden" name="back" value="cobros" />
          <h2 className="h4">Instrucciones de pago para sus clientes</h2>
          <p className="tiny">Aparecen en la confirmación de cada reserva y en su correo.</p>
          <label className="field">
            <span className="lbl">Español</span>
            <textarea name="pay_es" rows={4} maxLength={1200} defaultValue={pay.es ?? ""} className="input area" placeholder="SINPE Móvil 8888-8888 a nombre de …" />
          </label>
          {(row?.locales ?? []).includes("en") ? (
            <label className="field">
              <span className="lbl">Inglés</span>
              <textarea name="pay_en" rows={4} maxLength={1200} defaultValue={pay.en ?? ""} className="input area" placeholder="In English" />
            </label>
          ) : null}
          <button className="btn tint sm" type="submit" style={{ alignSelf: "flex-start" }}>Guardar</button>
        </form>
      ) : null}

      <div className="g2">
        <section className="card" style={{ overflowX: "auto" }}>
          <div style={{ padding: "16px 18px 4px" }}><h2 className="h4">Reservas con saldo</h2></div>
          <table className="tbl">
            <thead><tr><th>Reserva</th><th className="r">Saldo</th></tr></thead>
            <tbody>
              {pending.slice(0, 30).map((b) => (
                <tr key={b.id}>
                  <td><Link href={`/panel/reservas/${b.code}`} className="mono" style={{ fontWeight: 700 }}>{b.code}</Link> <span className="tiny">{b.customer_name}</span></td>
                  <td className="r">{money(b.total_cents - (paid.get(b.id) ?? 0), currency)}</td>
                </tr>
              ))}
              {pending.length === 0 ? <tr><td colSpan={2} className="small" style={{ padding: 18 }}>Nada pendiente.</td></tr> : null}
            </tbody>
          </table>
        </section>
        <section className="card" style={{ overflowX: "auto" }}>
          <div style={{ padding: "16px 18px 4px" }}><h2 className="h4">Últimos registros</h2></div>
          <table className="tbl">
            <thead><tr><th>Cuándo</th><th>Reserva</th><th>Método</th><th className="r">Monto</th></tr></thead>
            <tbody>
              {(payments ?? []).map((p) => {
                const bk = p.bookings as unknown as { code: string } | null;
                return (
                  <tr key={p.id}>
                    <td className="tiny">{dateTimeLabel(p.recorded_at, tz)}</td>
                    <td>{bk ? <Link href={`/panel/reservas/${bk.code}`} className="mono">{bk.code}</Link> : "—"}</td>
                    <td className="tiny">{PAYMENT_METHODS[p.method] ?? p.method}</td>
                    <td className="r" style={{ color: p.kind === "refund" ? "var(--bad)" : undefined }}>{p.kind === "refund" ? "−" : ""}{money(p.amount_cents, currency)}</td>
                  </tr>
                );
              })}
              {(payments ?? []).length === 0 ? <tr><td colSpan={4} className="small" style={{ padding: 18 }}>Todavía no hay pagos registrados. Se registran desde cada reserva.</td></tr> : null}
            </tbody>
          </table>
        </section>
      </div>
      <div className="card pad row" style={{ gap: 12, flexWrap: "nowrap", alignItems: "flex-start" }}>
        <span className="ico soft"><Icon name="card" /></span>
        <span className="small" style={{ minWidth: 0, alignSelf: "center" }}><b>Cobro con tarjeta (Stripe).</b> Cuando se active, sus clientes pagarán en la página segura de Stripe, con su propia cuenta; Altair nunca ve las tarjetas. Ya está previsto y se activa para cada negocio.</span>
      </div>
    </>
  );
}
