import Link from "next/link";
import { ONBOARDING_STEPS } from "@altair/config";
import { todayISO } from "@altair/core";
import { Icon, Kpi } from "@altair/ui";
import { ROLE_LABELS } from "@/lib/auth/staff";
import { getPublicConfig } from "@/lib/config/business-config";
import { panelSession } from "@/lib/panel/context";
import { LINE_STATUS, dateLabel, dateTimeLabel, money } from "@/lib/panel/format";
import { Flash, PageHeader } from "./page-header";

export const metadata = { title: "Hoy" };

function shift(dateISO: string, n: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + n)).toISOString().slice(0, 10);
}

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ sin_permiso?: string }> }) {
  const sp = await searchParams;
  const { sb, staff } = await panelSession();
  const { config } = await getPublicConfig();
  const tz = config?.timezone ?? "UTC";
  const currency = config?.currency ?? "USD";
  const today = todayISO(tz);
  const monthStart = `${today.slice(0, 7)}-01`;
  const isAdmin = staff.role === "owner" || staff.role === "admin";

  const [todayLines, upcoming, recent, month, drafts, row] = await Promise.all([
    sb.from("booking_lines").select("id, title, kind, service_time, ops_status, pax_adults, pax_children, pax_infants, driver_name, bookings!inner(code, customer_name, status)").eq("service_date", today).neq("bookings.status", "cancelled").order("service_time"),
    sb.from("booking_lines").select("id", { count: "exact", head: true }).eq("ops_status", "pending").gte("service_date", today).lte("service_date", shift(today, 3)),
    sb.from("bookings").select("id, code, customer_name, total_cents, status, source, created_at, needs_quote").order("created_at", { ascending: false }).limit(6),
    sb.from("booking_lines").select("total_cents, bookings!inner(status)").gte("service_date", monthStart).lte("service_date", shift(monthStart, 31)).neq("bookings.status", "cancelled"),
    sb.from("change_sets").select("id", { count: "exact", head: true }).eq("status", "draft"),
    sb.from("business_config").select("onboarding, published").eq("id", 1).maybeSingle(),
  ]);
  const services = (todayLines.data ?? []).filter((l) => l.ops_status !== "cancelled");
  const sold = (month.data ?? []).filter((l) => l.total_cents > 0).reduce((s, l) => s + l.total_cents, 0);
  const onboarding = (row.data?.onboarding ?? {}) as Record<string, boolean>;
  const stepsDone = ONBOARDING_STEPS.filter((s) => onboarding[s]).length;
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(new Date()));
  const hello = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <>
      <PageHeader eyebrow={`${dateLabel(today)} · ${ROLE_LABELS[staff.role]}`} title={`${hello}`} subtitle={config?.name} />
      <Flash error={sp.sin_permiso ? "Su rol no tiene acceso a esa sección." : null} />

      {isAdmin && !row.data?.published ? (
        <Link href="/panel/configurar" className="glass row" style={{ borderRadius: 26, padding: "16px 20px", gap: 14 }}>
          <span className="ico t"><Icon name="sparkle" /></span>
          <span className="col" style={{ gap: 2, flex: 1 }}>
            <b>Termine de configurar su negocio</b>
            <span className="tiny">{stepsDone} de {ONBOARDING_STEPS.length} pasos. Su sitio todavía no está publicado.</span>
          </span>
          <Icon name="arrowRight" />
        </Link>
      ) : null}

      <div className="panel-kpis">
        <Kpi label="Servicios hoy" value={services.length} note={services.length ? `${services.filter((s) => s.ops_status === "pending").length} por asignar` : undefined} />
        <Kpi label="Por asignar (3 días)" value={upcoming.count ?? 0} />
        <Kpi label={`Vendido en ${new Intl.DateTimeFormat("es-CR", { month: "long", timeZone: "UTC" }).format(new Date(`${monthStart}T00:00:00Z`))}`} value={money(sold, currency).replace(/\.00$/, "")} />
        <Kpi label="Borradores por revisar" value={drafts.count ?? 0} note={drafts.count ? "de Claude o Excel" : undefined} />
      </div>

      <div className="g2">
        <section className="card pad col" style={{ gap: 10 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 className="h4">Operación de hoy</h2>
            <Link className="btn line sm" href="/panel/despacho">Despacho</Link>
          </div>
          {services.length === 0 ? <p className="small">No hay servicios hoy.</p> : null}
          {services.map((l) => {
            const bk = l.bookings as unknown as { code: string; customer_name: string };
            const st = LINE_STATUS[l.ops_status] ?? { label: l.ops_status, tone: "mute" };
            return (
              <Link key={l.id} href={`/panel/reservas/${bk.code}`} className="panel" style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto", columnGap: 10, rowGap: 2, alignItems: "center" }}>
                <b className="mono">{String(l.service_time ?? "").slice(0, 5) || "—"}</b>
                <b className="row" style={{ gap: 6, flexWrap: "nowrap", fontSize: 14.5, minWidth: 0 }}>
                  <Icon name={l.kind === "transfer" ? "car" : "mountain"} size={16} style={{ flex: "none" }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</span>
                </b>
                <span className={`st ${st.tone}`}>{st.label}</span>
                <span className="tiny" style={{ gridColumn: "2 / 4" }}>{bk.customer_name} · {l.pax_adults + l.pax_children + l.pax_infants} pax{l.driver_name ? ` · ${l.driver_name}` : ""}</span>
              </Link>
            );
          })}
        </section>
        <section className="card pad col" style={{ gap: 10 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 className="h4">Últimas reservas</h2>
            <Link className="btn line sm" href="/panel/reservas">Ver todas</Link>
          </div>
          {(recent.data ?? []).length === 0 ? <p className="small">Todavía no hay reservas. Cuando publique su sitio, aparecerán aquí.</p> : null}
          {(recent.data ?? []).map((b) => (
            <Link key={b.id} href={`/panel/reservas/${b.code}`} className="panel row" style={{ gap: 10, flexWrap: "nowrap" }}>
              <b className="mono">{b.code}</b>
              {b.source === "claude" ? <Icon name="sparkle" size={14} /> : null}
              <span className="col" style={{ gap: 0, flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 14.5 }}>{b.customer_name}</b>
                <span className="tiny">{dateTimeLabel(b.created_at, tz)}</span>
              </span>
              {b.needs_quote ? <span className="st gold">Cotizar</span> : null}
              <b className="small">{money(b.total_cents, currency)}</b>
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}
