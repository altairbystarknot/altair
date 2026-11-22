import { ROLE_LABELS } from "@/lib/auth/staff";
import { getPublicConfig } from "@/lib/config/business-config";
import { CAN, panelSessionFor } from "@/lib/panel/context";
import { dateTimeLabel } from "@/lib/panel/format";
import { Flash, PageHeader } from "../page-header";
import { revokeInvite, setMemberActive } from "./actions";
import { InviteForm } from "./invite-form";

export const metadata = { title: "Equipo" };

const ROLE_HELP: Record<string, string> = {
  owner: "Todo, incluido el equipo.",
  admin: "Todo menos gestionar el equipo.",
  ops: "Reservas, despacho y proveedores.",
  finance: "Reservas y registros de pago.",
  readonly: "Solo consulta.",
};

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { sb, staff } = await panelSessionFor(CAN.team);
  const { config } = await getPublicConfig();
  const [{ data: members }, { data: invites }] = await Promise.all([
    sb.from("staff_profiles").select("user_id, full_name, role, is_active, created_at").order("created_at"),
    sb.from("staff_invites").select("*").is("accepted_at", null).is("revoked_at", null).order("created_at", { ascending: false }),
  ]);
  return (
    <>
      <PageHeader title="Equipo" subtitle="Cada persona entra con su correo, su contraseña y un código en su celular. Su rol decide qué ve y qué puede cambiar, también desde su Claude." />
      <Flash ok={sp.ok ? "Listo." : null} error={sp.error === "dueno" ? "Solo el dueño activa o desactiva personas." : sp.error ? "No se pudo completar." : null} />
      <div className="g2">
        <section className="card" style={{ overflowX: "auto" }}>
          <div style={{ padding: "16px 18px 4px" }}><h2 className="h4">Personas</h2></div>
          <table className="tbl">
            <thead><tr><th>Nombre</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {(members ?? []).map((m) => (
                <tr key={m.user_id} style={{ opacity: m.is_active ? 1 : 0.5 }}>
                  <td><b>{m.full_name || "—"}</b>{m.user_id === staff.user.id ? <span className="tiny"> (usted)</span> : null}</td>
                  <td>{ROLE_LABELS[m.role as keyof typeof ROLE_LABELS]}<div className="tiny">{ROLE_HELP[m.role]}</div></td>
                  <td><span className={`st ${m.is_active ? "ok" : "mute"}`}>{m.is_active ? "Activo" : "Inactivo"}</span></td>
                  <td className="r">
                    {staff.role === "owner" && m.role !== "owner" ? (
                      <form action={setMemberActive}>
                        <input type="hidden" name="userId" value={m.user_id} />
                        <input type="hidden" name="active" value={m.is_active ? "0" : "1"} />
                        <button className="btn line sm" type="submit">{m.is_active ? "Desactivar" : "Activar"}</button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card pad-l col" style={{ gap: 12 }}>
          <h2 className="h4">Invitar a alguien</h2>
          <InviteForm canInviteAdmin={staff.role === "owner"} />
          {(invites ?? []).length ? <h3 className="h4" style={{ marginTop: 8 }}>Invitaciones pendientes</h3> : null}
          {(invites ?? []).map((i) => (
            <form key={i.id} action={revokeInvite} className="panel row" style={{ justifyContent: "space-between", gap: 8 }}>
              <input type="hidden" name="id" value={i.id} />
              <span className="small"><b>{i.email}</b> · {ROLE_LABELS[i.role as keyof typeof ROLE_LABELS]} · vence {dateTimeLabel(i.expires_at, config?.timezone ?? "UTC")}</span>
              <button className="btn ghost sm" type="submit">Revocar</button>
            </form>
          ))}
        </section>
      </div>
    </>
  );
}
