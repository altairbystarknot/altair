import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@altair/ui";
import { getPublicConfig } from "@/lib/config/business-config";
import { panelSession } from "@/lib/panel/context";
import { BOOKING_STATUS, PAYMENT_METHODS, dateTimeLabel, money, waLink } from "@/lib/panel/format";
import { Flash, PageHeader } from "../../page-header";
import { addNote, recordPayment, saveInternalNotes, setBookingStatus } from "../actions";
import { LineEditor, type LineRow } from "../line-editor";

export const metadata = { title: "Reserva" };

const OK: Record<string, string> = { estado: "Estado actualizado.", servicio: "Servicio actualizado.", pago: "Pago registrado.", nota: "Nota guardada." };

export default async function BookingDetailPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { code } = await params;
  const sp = await searchParams;
  const { sb, staff } = await panelSession();
  const { config } = await getPublicConfig();
  const tz = config?.timezone ?? "UTC";
  const currency = config?.currency ?? "USD";
  const { data: b } = await sb.from("bookings").select("*").eq("code", code.toUpperCase()).maybeSingle();
  if (!b) notFound();
  const [lines, events, payments, balance, suppliers] = await Promise.all([
    sb.from("booking_lines").select("*").eq("booking_id", b.id).order("position"),
    sb.from("booking_events").select("*").eq("booking_id", b.id).order("at", { ascending: false }),
    sb.from("manual_payments").select("*").eq("booking_id", b.id).order("recorded_at", { ascending: false }),
    sb.from("booking_balances").select("paid_cents").eq("booking_id", b.id).maybeSingle(),
    sb.from("suppliers").select("id, name").eq("active", true).order("name"),
  ]);
  const ops = ["owner", "admin", "ops"].includes(staff.role);
  const fin = ["owner", "admin", "finance"].includes(staff.role);
  const paid = (balance.data?.paid_cents as number | undefined) ?? 0;
  const due = b.total_cents - paid;
  const back = `/panel/reservas/${b.code}`;
  const drafts = (events.data ?? []).filter((e) => e.kind === "message.draft");
  const history = (events.data ?? []).filter((e) => e.kind !== "message.draft");
  const wa = waLink(b.customer_phone, `Hola ${b.customer_name}, le escribimos de ${config?.name ?? ""} sobre su reserva ${b.code}.`);
  const st = BOOKING_STATUS[b.status] ?? { label: b.status, tone: "mute" as const };

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/panel/reservas"><Icon name="chevronLeft" size={14} /> Reservas</Link>}
        title={<span className="mono" style={{ fontSize: "inherit", letterSpacing: ".02em" }}>{b.code}</span>}
        subtitle={`${b.customer_name} · recibida ${dateTimeLabel(b.created_at, tz)} · ${b.source === "web" ? "desde el sitio" : b.source === "claude" ? "por Claude" : "desde el panel"}`}
        actions={
          ops ? (
            <div className="row" style={{ gap: 6 }}>
              {b.status !== "confirmed" && b.status !== "cancelled" ? (
                <form action={setBookingStatus}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="confirmed" /><input type="hidden" name="back" value={back} /><button className="btn tint sm" type="submit"><Icon name="check" size={15} /> Confirmar</button></form>
              ) : null}
              {b.status !== "completed" && b.status !== "cancelled" ? (
                <form action={setBookingStatus}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="completed" /><input type="hidden" name="back" value={back} /><button className="btn line sm" type="submit">Completar</button></form>
              ) : null}
              {b.status !== "cancelled" ? (
                <form action={setBookingStatus}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="cancelled" /><input type="hidden" name="back" value={back} /><button className="btn ghost sm" type="submit">Cancelar</button></form>
              ) : (
                <form action={setBookingStatus}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="received" /><input type="hidden" name="back" value={back} /><button className="btn line sm" type="submit">Reactivar</button></form>
              )}
            </div>
          ) : null
        }
      />
      <Flash ok={sp.ok ? (OK[sp.ok] ?? "Guardado.") : null} error={sp.error === "pago" ? "Revise el monto y el método de pago." : sp.error ? "No se pudo guardar." : null} />

      <div className="row" style={{ gap: 20, alignItems: "flex-start" }}>
        <div className="col" style={{ gap: 14, flex: "1 1 560px", minWidth: 0 }}>
          <div className="row" style={{ gap: 8 }}>
            <span className={`st ${st.tone}`}>{st.label}</span>
            {b.needs_quote ? <span className="st gold">Tiene servicios por cotizar</span> : null}
          </div>
          {(lines.data ?? []).map((l) => (
            <LineEditor key={l.id} line={l as LineRow} suppliers={suppliers.data ?? []} currency={currency} back={back} canEdit={ops} />
          ))}

          {drafts.length ? (
            <section className="card pad col" style={{ gap: 10 }}>
              <h2 className="h4 row" style={{ gap: 8 }}><Icon name="sparkle" size={18} /> Mensajes que redactó Claude</h2>
              {drafts.map((e) => {
                const d = e.detail as { channel?: string; text?: string };
                const link = d.channel === "whatsapp" ? waLink(b.customer_phone, d.text ?? "") : `mailto:${b.customer_email}?subject=${encodeURIComponent(b.code)}&body=${encodeURIComponent(d.text ?? "")}`;
                return (
                  <div key={e.id} className="panel col" style={{ gap: 8 }}>
                    <span className="tiny">{dateTimeLabel(e.at, tz)} · {d.channel === "whatsapp" ? "WhatsApp" : "Correo"}</span>
                    <p style={{ whiteSpace: "pre-line" }}>{d.text}</p>
                    {link ? <a className="btn line sm" style={{ alignSelf: "flex-start" }} href={link} target="_blank" rel="noopener noreferrer"><Icon name="message" size={15} /> Revisar y enviar</a> : null}
                  </div>
                );
              })}
            </section>
          ) : null}

          <section className="card pad col" style={{ gap: 10 }}>
            <h2 className="h4">Historial</h2>
            <form action={addNote} className="row" style={{ gap: 8 }}>
              <input type="hidden" name="id" value={b.id} /><input type="hidden" name="back" value={back} />
              <input name="text" placeholder="Agregar una nota…" className="input" style={{ flex: 1, minHeight: 42 }} maxLength={1000} />
              <button className="btn line sm" type="submit">Agregar</button>
            </form>
            {history.map((e) => (
              <div key={e.id} className="row tiny" style={{ gap: 8, alignItems: "flex-start", flexWrap: "nowrap" }}>
                <span style={{ flex: "0 0 112px" }}>{dateTimeLabel(e.at, tz)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b>{e.actor_kind === "claude" ? "Claude" : e.actor_kind === "customer" ? "Cliente" : e.actor_kind === "system" ? "Sistema" : "Equipo"}</b>
                  {e.kind === "note.added" ? ": " : " "}
                  {e.kind === "booking.created" ? "creó la reserva" : e.kind === "booking.status" ? `cambió el estado a ${BOOKING_STATUS[(e.detail as { to: string }).to]?.label ?? ""}` : e.kind === "line.ops" ? "actualizó un servicio" : e.kind === "line.claude_update" ? "actualizó un servicio" : e.kind === "note.added" ? ((e.detail as { text?: string }).text ?? "") : e.kind}
                </span>
              </div>
            ))}
          </section>
        </div>

        <aside className="col" style={{ gap: 14, flex: "1 1 300px", maxWidth: 420 }}>
          <section className="card pad col" style={{ gap: 8 }}>
            <h2 className="h4">Cliente</h2>
            <b>{b.customer_name}</b>
            <a className="small" href={`mailto:${b.customer_email}`}>{b.customer_email}</a>
            {b.customer_phone ? <span className="small">{b.customer_phone}</span> : null}
            {b.customer_country ? <span className="tiny">{b.customer_country}</span> : null}
            {b.customer_notes ? <p className="panel small" style={{ whiteSpace: "pre-line" }}>{b.customer_notes}</p> : null}
            {wa ? <a className="btn line sm" href={wa} target="_blank" rel="noopener noreferrer" style={{ alignSelf: "flex-start" }}><Icon name="message" size={15} /> WhatsApp</a> : null}
          </section>

          <section className="card pad col" style={{ gap: 8 }}>
            <h2 className="h4">Cobro</h2>
            <div className="sumline"><span>Total</span><b>{money(b.total_cents, currency)}</b></div>
            <div className="sumline"><span>Impuestos incluidos</span><span>{money(b.tax_cents, currency)}</span></div>
            <div className="sumline"><span>Pagado</span><span>{money(paid, currency)}</span></div>
            <div className="sumline"><span>Saldo</span><b style={{ color: due > 0 ? "var(--warn)" : "var(--ok)" }}>{money(Math.max(due, 0), currency)}</b></div>
            {fin && config?.paymentsMode === "records" ? (
              <form action={recordPayment} className="col" style={{ gap: 8, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                <input type="hidden" name="id" value={b.id} /><input type="hidden" name="back" value={back} />
                <div className="row" style={{ gap: 8 }}>
                  <input name="amount" placeholder="Monto" inputMode="decimal" defaultValue={due > 0 ? (due / 100).toFixed(2) : ""} className="input" style={{ flex: 1, minHeight: 40 }} required />
                  <select name="method" className="input" style={{ flex: 1, minHeight: 40 }}>{Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                </div>
                <input name="reference" placeholder="Referencia o comprobante" className="input" style={{ minHeight: 40 }} />
                <div className="row" style={{ gap: 8 }}>
                  <select name="kind" className="input" style={{ width: 150, minHeight: 40 }}><option value="payment">Pago</option><option value="refund">Devolución</option></select>
                  <button className="btn tint sm" type="submit" style={{ flex: 1 }}>Registrar</button>
                </div>
                <span className="tiny">Altair no mueve dinero: solo anota lo que usted cobró. Los registros no se editan; para corregir, registre una devolución.</span>
              </form>
            ) : null}
            {(payments.data ?? []).map((p) => (
              <div key={p.id} className="row tiny" style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "nowrap" }}>
                <span style={{ minWidth: 0 }}>{dateTimeLabel(p.recorded_at, tz)} · {PAYMENT_METHODS[p.method] ?? p.method}{p.reference ? ` · ${p.reference}` : ""}</span>
                <b style={{ color: p.kind === "refund" ? "var(--bad)" : "inherit", flex: "none" }}>{p.kind === "refund" ? "−" : ""}{money(p.amount_cents, currency)}</b>
              </div>
            ))}
          </section>

          {ops ? (
            <form action={saveInternalNotes} className="card pad col" style={{ gap: 8 }}>
              <h2 className="h4">Notas internas</h2>
              <input type="hidden" name="id" value={b.id} /><input type="hidden" name="back" value={back} />
              <textarea name="notes" rows={4} defaultValue={b.internal_notes ?? ""} className="input area" maxLength={2000} />
              <button className="btn line sm" type="submit" style={{ alignSelf: "flex-start" }}>Guardar notas</button>
            </form>
          ) : null}
        </aside>
      </div>
    </>
  );
}
