import Link from "next/link";
import { Icon, Notice } from "@altair/ui";
import { getPublicConfig } from "@/lib/config/business-config";
import { panelSession } from "@/lib/panel/context";
import { dateTimeLabel } from "@/lib/panel/format";
import { siteOrigin } from "@/lib/site-url";
import { Flash, PageHeader } from "../page-header";
import { revokeGrant } from "./actions";
import { CopyField } from "./copy-field";

export const metadata = { title: "Claude" };

const SCOPE_LABELS: Record<string, string> = {
  "bookings:read": "Ver reservas y operación",
  "ops:write": "Asignar servicios y cambiar estados",
  "catalog:draft": "Proponer tarifas y actividades (borradores)",
  "messages:draft": "Redactar mensajes a clientes",
};

const TOOL_LABELS: Record<string, string> = {
  resumen_del_dia: "Resumen del día",
  buscar_reservas: "Buscó reservas",
  ver_reserva: "Vio una reserva",
  asignar_servicio: "Asignó un servicio",
  ver_catalogo: "Leyó el catálogo",
  proponer_cambios: "Propuso cambios",
  redactar_mensaje: "Redactó un mensaje",
  reporte_ventas: "Reporte de ventas",
};

export default async function ClaudePage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { sb, staff } = await panelSession();
  const { ok } = await searchParams;
  const { config } = await getPublicConfig();
  const tz = config?.timezone ?? "UTC";
  const origin = await siteOrigin();
  const isAdmin = staff.role === "owner" || staff.role === "admin";
  const [grants, actions, drafts] = await Promise.all([
    sb.from("oauth_grants").select("id, client_id, user_id, scopes, created_at, last_used_at, revoked_at, oauth_clients(name)").order("created_at", { ascending: false }).limit(50),
    isAdmin ? sb.from("ai_actions").select("id, at, tool, ok, summary, client_id").order("at", { ascending: false }).limit(30) : Promise.resolve({ data: [] as Array<{ id: number; at: string; tool: string; ok: boolean; summary: string | null }> }),
    sb.from("change_sets").select("id, title, created_at").eq("status", "draft").eq("source", "claude").order("created_at", { ascending: false }).limit(10),
  ]);
  const team = await sb.rpc("team_list");
  const names = new Map<string, string>((team.data ?? []).map((m: { user_id: string; full_name: string }) => [m.user_id, m.full_name] as [string, string]));
  const active = (grants.data ?? []).filter((g) => !g.revoked_at);

  return (
    <>
      <PageHeader
        title="Claude"
        subtitle="Administre su negocio conversando con su propio Claude. Claude lee y propone; las personas publican, y nada toca dinero."
      />
      <Flash ok={ok === "desconectado" ? "Conexión cerrada. Ese Claude ya no puede usar Altair." : null} />

      <div className="g2">
        <section className="card pad-l col" style={{ gap: 14 }}>
          <div className="row" style={{ gap: 12 }}>
            <span className="ico t"><Icon name="sparkle" /></span>
            <h2 className="h4">Conectar</h2>
            <span className={`st ${active.length ? "ok" : "warn"}`} style={{ marginLeft: "auto" }}>{active.length ? `${active.length} conectado${active.length > 1 ? "s" : ""}` : "Sin conectar"}</span>
          </div>
          <CopyField label="Dirección del conector" value={`${origin}/mcp`} />
          <ol className="col small" style={{ gap: 6, paddingLeft: 20, listStyle: "decimal" }}>
            <li>Claude → Configuración → Conectores → <b>Agregar conector personalizado</b>.</li>
            <li>Pegue la dirección y toque <b>Conectar</b>.</li>
            <li>Entre con su usuario y su código, y elija los permisos.</li>
          </ol>
          {origin.startsWith("http://localhost") ? (
            <Notice tone="info">Copia local: pruébelo con Claude Code (<span className="mono">claude mcp add --transport http altair {origin}/mcp</span>). Claude en la web necesita la dirección pública de su sitio.</Notice>
          ) : null}
        </section>

        <section className="card pad-l col" style={{ gap: 10 }}>
          <h2 className="h4">Qué le puede pedir</h2>
          {[
            "«¿Qué servicios tengo mañana y cuáles no tienen conductor?»",
            "«Asigne el traslado de las 10:00 a Transportes Arenal, con el conductor Carlos.»",
            "«Le paso mi Excel de tarifas 2027: cárguelo como borrador.»",
            "«Cree una actividad de canopy a las 8:00 y a las 13:00: $70 adulto, $50 niño.»",
            "«Redacte un WhatsApp para MAR-0042 que confirme la hora de recogida.»",
            "«¿Cuánto vendí este mes en actividades?»",
          ].map((x) => (
            <div key={x} className="panel small">{x}</div>
          ))}
        </section>
      </div>

      {(drafts.data ?? []).length ? (
        <Notice tone="warn">
          Claude dejó borradores para revisar:{" "}
          {(drafts.data ?? []).map((d, i) => (
            <span key={d.id}>{i ? " · " : ""}<Link href={`/panel/borradores/${d.id}`} style={{ textDecoration: "underline" }}>{d.title}</Link></span>
          ))}
        </Notice>
      ) : null}

      <section className="card" style={{ overflowX: "auto" }}>
        <div style={{ padding: "16px 18px 4px" }}><h2 className="h4">Conexiones</h2></div>
        <table className="tbl">
          <thead><tr><th>Cliente</th><th>Persona</th><th>Permisos</th><th>Último uso</th><th></th></tr></thead>
          <tbody>
            {(grants.data ?? []).length === 0 ? (
              <tr><td colSpan={5} className="small" style={{ padding: 20 }}>Todavía nadie conectó su Claude.</td></tr>
            ) : (
              (grants.data ?? []).map((g) => (
                <tr key={g.id} style={{ opacity: g.revoked_at ? 0.5 : 1 }}>
                  <td><b>{(g.oauth_clients as unknown as { name: string } | null)?.name ?? g.client_id}</b></td>
                  <td>{names.get(g.user_id) ?? "—"}</td>
                  <td style={{ whiteSpace: "normal" }} className="tiny">{(g.scopes as string[]).map((s) => SCOPE_LABELS[s] ?? s).join(" · ")}</td>
                  <td className="tiny">{g.revoked_at ? "Desconectado" : g.last_used_at ? dateTimeLabel(g.last_used_at, tz) : "Nunca"}</td>
                  <td className="r">
                    {!g.revoked_at && (isAdmin || g.user_id === staff.user.id) ? (
                      <form action={revokeGrant}><input type="hidden" name="id" value={g.id} /><button className="btn line sm" type="submit">Desconectar</button></form>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {isAdmin ? (
        <section className="card" style={{ overflowX: "auto" }}>
          <div style={{ padding: "16px 18px 4px" }}><h2 className="h4">Lo que hizo Claude</h2></div>
          <table className="tbl">
            <thead><tr><th>Cuándo</th><th>Acción</th><th>Detalle</th><th>Resultado</th></tr></thead>
            <tbody>
              {(actions.data ?? []).length === 0 ? (
                <tr><td colSpan={4} className="small" style={{ padding: 20 }}>Sin actividad todavía.</td></tr>
              ) : (
                (actions.data ?? []).map((a) => (
                  <tr key={a.id}>
                    <td className="tiny">{dateTimeLabel(a.at, tz)}</td>
                    <td>{TOOL_LABELS[a.tool] ?? a.tool}</td>
                    <td className="tiny" style={{ whiteSpace: "normal" }}>{a.summary ?? ""}</td>
                    <td><span className={`st ${a.ok ? "ok" : "bad"}`}>{a.ok ? "Correcto" : "Rechazado"}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      ) : null}
    </>
  );
}
