import { cookies } from "next/headers";
import Link from "next/link";
import { Icon, Notice } from "@altair/ui";
import { ROLE_LABELS } from "@/lib/auth/staff";
import { getPublicConfig } from "@/lib/config/business-config";
import { OAUTH_COOKIE, ROLE_SCOPES, SCOPE_INFO, openRequest } from "@/lib/mcp/oauth";
import { panelSession } from "@/lib/panel/context";
import { PageHeader } from "../../page-header";
import { ConsentForm } from "./consent-form";

export const metadata = { title: "Conectar Claude" };

// The consent screen. Reached only through /oauth/authorize (signed cookie) and only after sign-in with
// the second factor (it lives under /panel). The person chooses which permissions their Claude gets; they
// can never exceed what their role allows, and money is not a permission at all.
export default async function AuthorizePage() {
  const { staff } = await panelSession();
  const { config } = await getPublicConfig();
  const req = openRequest((await cookies()).get(OAUTH_COOKIE)?.value);
  if (!req) {
    return (
      <>
        <PageHeader title="Conectar Claude" />
        <Notice tone="warn">No hay ninguna conexión pendiente o la solicitud venció. Toque «Conectar» de nuevo desde Claude.</Notice>
        <Link className="btn line sm" href="/panel/claude">Ir a Claude</Link>
      </>
    );
  }
  const allowed = ROLE_SCOPES[staff.role] ?? [];
  const asked = req.scopes.length ? req.scopes : allowed;
  const redirectHost = new URL(req.redirectUri).host;

  return (
    <>
      <PageHeader eyebrow="Conectar Claude" title={`«${req.clientName}» quiere usar ${config?.name ?? "su negocio"}`} />
      <div className="row" style={{ gap: 20, alignItems: "flex-start" }}>
        <section className="card pad-l col" style={{ gap: 16, flex: "1 1 520px" }}>
          <div className="row" style={{ gap: 12 }}>
            <span className="ico t"><Icon name="sparkle" /></span>
            <div className="col" style={{ gap: 2 }}>
              <b>{req.clientName}</b>
              <span className="tiny">Regresa a {redirectHost}. Actuará en su nombre ({staff.user.email}, {ROLE_LABELS[staff.role]}).</span>
            </div>
          </div>
          <ConsentForm
            options={allowed.map((s) => ({ id: s, label: SCOPE_INFO[s].label, detail: SCOPE_INFO[s].detail, checked: asked.includes(s) }))}
          />
        </section>
        <aside className="card pad col" style={{ gap: 10, flex: "1 1 280px", maxWidth: 380 }}>
          <h2 className="h4">Lo que Claude nunca puede hacer</h2>
          {["Cobrar, devolver ni tocar dinero.", "Publicar tarifas por su cuenta: deja borradores.", "Enviar mensajes: los deja redactados.", "Ver su contraseña o su código."].map((x) => (
            <div key={x} className="row small" style={{ gap: 8 }}><Icon name="shield" size={16} /> {x}</div>
          ))}
          <p className="tiny">Puede desconectarlo cuando quiera desde Panel → Claude. Cada acción queda registrada.</p>
        </aside>
      </div>
    </>
  );
}
