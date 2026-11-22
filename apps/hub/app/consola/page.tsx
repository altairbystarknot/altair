import Link from "next/link";
import { redirect } from "next/navigation";
import { AltairLogo, Icon } from "@altair/ui";
import { CLOUD_STEPS, provisionMode } from "@/lib/provision";
import { isConsole } from "@/lib/session";
import { listRequests, type SignupRequest } from "@/lib/store";
import { addNote, approveRequest, consoleLogout, markSent, regenerateLink, rejectRequest } from "../actions";
import { CopyButton } from "./copy";

export const metadata = { title: "Solicitudes" };

// Starknot's console: review requests, approve (creates the business's instance and its claim link),
// send the link BY HAND (copy it, or open email / WhatsApp prefilled) and keep a record of what was sent.

const STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Pendiente", tone: "warn" },
  approved: { label: "Aprobada", tone: "ok" },
  rejected: { label: "Rechazada", tone: "mute" },
};
const TABS = [
  { k: "pendientes", label: "Pendientes", f: (r: SignupRequest) => r.status === "pending" },
  { k: "por-enviar", label: "Enlace por enviar", f: (r: SignupRequest) => r.status === "approved" && Boolean(r.claimLink) && !r.sentAt },
  { k: "aprobadas", label: "Aprobadas", f: (r: SignupRequest) => r.status === "approved" },
  { k: "rechazadas", label: "Rechazadas", f: (r: SignupRequest) => r.status === "rejected" },
  { k: "todas", label: "Todas", f: () => true },
];
const LINK_DAYS = 7;
const SERVICES: Record<string, string> = { transfers: "Transporte privado", activities: "Actividades y tours" };

const when = (iso: string) => new Date(iso).toLocaleString("es-CR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** The activation message Starknot sends by hand, in the language of the site the request came from. */
function message(r: SignupRequest): { subject: string; body: string } {
  const en = r.locale === "en";
  const first = r.contactName.split(" ")[0] ?? r.contactName;
  const expiresAt = new Date((r.linkCreatedAt ? new Date(r.linkCreatedAt).getTime() : Date.now()) + LINK_DAYS * 86400000);
  const expires = expiresAt.toLocaleDateString(en ? "en-US" : "es-CR", { weekday: "long", day: "numeric", month: "long" });
  if (en) {
    return {
      subject: `Your Altair for ${r.business} is ready`,
      body: [
        `Hi ${first},`,
        ``,
        `Welcome to Altair. We approved the request for ${r.business}.`,
        ``,
        `Use this private link to activate your system and create your owner account:`,
        `${r.claimLink}`,
        ``,
        `The link works once and expires on ${expires}. When you open it, you will set up your two-step code, and a guided assistant will help you add your brand, your rates and how you get paid.`,
        ``,
        `If you have any questions, just reply to this message.`,
        `The Starknot team`,
      ].join("\n"),
    };
  }
  return {
    subject: `Su Altair para ${r.business} está listo`,
    body: [
      `Hola, ${first}:`,
      ``,
      `Le damos la bienvenida a Altair. Aprobamos la solicitud de ${r.business}.`,
      ``,
      `Con este enlace privado activa su sistema y crea su cuenta de propietario:`,
      `${r.claimLink}`,
      ``,
      `El enlace es de un solo uso y vence el ${expires}. Al entrar, configurará su código de dos pasos y un asistente le guiará para cargar su marca, sus tarifas y su forma de pago.`,
      ``,
      `Si tiene cualquier duda, responda a este mensaje.`,
      `Equipo Starknot`,
    ].join("\n"),
  };
}

export default async function ConsolePage({ searchParams }: { searchParams: Promise<{ abierta?: string; tab?: string; error?: string }> }) {
  if (!(await isConsole())) redirect("/consola/entrar");
  const { abierta, tab = "pendientes", error } = await searchParams;
  const rows = await listRequests();
  const mode = provisionMode();
  const active = TABS.find((t) => t.k === tab) ?? TABS[0]!;
  const shown = rows.filter(active.f);
  const open = rows.find((r) => r.id === abierta) ?? shown[0] ?? null;
  const msg = open?.claimLink ? message(open) : null;

  return (
    <main className="h-con-page">
      <div className="h-con-wrap">
        <header className="h-nav glass h-con-bar">
          <Link href="/consola" className="h-brand" aria-label="Consola Altair">
            <AltairLogo size={26} />
          </Link>
          <span className="h-con-label">Consola Starknot</span>
          <div className="h-con-barend">
            <span className={`h-pill ${mode === "local" ? "warn" : "ok"}`}>{mode === "local" ? "Modo local (desarrollo)" : "Modo nube"}</span>
            <form action={consoleLogout}>
              <button className="btn line sm" type="submit"><Icon name="logout" size={15} /> Salir</button>
            </form>
          </div>
        </header>

        <div className="h-con-head">
          <div>
            <p className="h-kicker">Solicitudes</p>
            <h1 className="h-h2">Negocios que quieren <em>su Altair.</em></h1>
          </div>
          <nav className="seg glass flat h-con-tabs" aria-label="Filtrar solicitudes">
            {TABS.map((t) => (
              <Link key={t.k} href={`/consola?tab=${t.k}`} className={t.k === active.k ? "on" : undefined} aria-current={t.k === active.k ? "page" : undefined}>
                {t.label} <span className="h-count">{rows.filter(t.f).length}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="h-con-grid">
          <aside className="h-con-list" aria-label="Lista de solicitudes">
            {shown.length === 0 ? <p className="h-con-empty">No hay solicitudes en esta lista.</p> : null}
            {shown.map((r) => (
              <Link key={r.id} href={`/consola?tab=${active.k}&abierta=${r.id}`} className={`h-con-item${open?.id === r.id ? " on" : ""}`} aria-current={open?.id === r.id ? "true" : undefined}>
                <span className="h-con-item-top">
                  <b>{r.business}</b>
                  <span className={`h-pill ${STATUS[r.status]?.tone}`}>{STATUS[r.status]?.label}</span>
                </span>
                <span className="h-con-item-meta">{r.contactName} · {when(r.createdAt)}</span>
                {r.status === "approved" && r.claimLink ? (
                  <span className={`h-con-item-sent${r.sentAt ? " ok" : ""}`}>
                    <Icon name={r.sentAt ? "check" : "mail"} size={12} /> {r.sentAt ? `Enlace enviado · ${when(r.sentAt)}` : "Enlace sin enviar"}
                  </span>
                ) : null}
              </Link>
            ))}
          </aside>

          {open ? (
            <section className="h-con-detail" aria-label={open.business}>
              <div className="h-con-detail-head">
                <div>
                  <h2 className="h-con-name">{open.business}</h2>
                  <p className="h-con-sub">
                    {open.services.map((s) => SERVICES[s] ?? s).join(" + ")}
                    {open.country ? ` · ${open.country}` : ""}
                    {open.locale ? ` · Sitio en ${open.locale === "en" ? "inglés" : "español"}` : ""}
                  </p>
                </div>
                <span className={`h-pill ${STATUS[open.status]?.tone}`}>{STATUS[open.status]?.label}</span>
              </div>

              <dl className="h-con-kv">
                <div><dt>Contacto</dt><dd>{open.contactName}</dd></div>
                <div><dt>Correo</dt><dd><a href={`mailto:${open.email}`}>{open.email}</a></dd></div>
                <div><dt>WhatsApp</dt><dd>{open.whatsapp || "—"}</dd></div>
                <div><dt>Web o redes</dt><dd>{open.website || "—"}</dd></div>
                <div><dt>Recibida</dt><dd>{when(open.createdAt)}</dd></div>
                {open.instanceUrl ? <div><dt>Instancia</dt><dd>{open.instanceUrl}</dd></div> : null}
              </dl>
              {open.notes ? <blockquote className="h-con-notes">{open.notes}</blockquote> : null}

              {open.status === "pending" ? (
                <div className="h-con-decide">
                  <form action={approveRequest}>
                    <input type="hidden" name="id" value={open.id} />
                    <button className="btn tint" type="submit"><Icon name="check" size={16} /> Aprobar y crear su sistema</button>
                  </form>
                  <form action={rejectRequest}>
                    <input type="hidden" name="id" value={open.id} />
                    <button className="btn ghost" type="submit">Rechazar</button>
                  </form>
                </div>
              ) : null}

              {open.status === "approved" && open.claimLink && msg ? (
                <div className="h-con-link">
                  <div className="h-con-link-head">
                    <h3><Icon name="link" size={15} /> Enlace de activación</h3>
                    {open.linkCreatedAt ? <span>Generado {when(open.linkCreatedAt)} · vence en {LINK_DAYS} días · un solo uso</span> : null}
                  </div>
                  <code className="h-code">{open.claimLink}</code>
                  <div className="h-con-actions">
                    <CopyButton text={open.claimLink} label="Copiar enlace" primary />
                    <CopyButton text={msg.body} label="Copiar mensaje" />
                    <a className="btn line sm" href={`mailto:${open.email}?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(msg.body)}`}>
                      <Icon name="mail" size={15} /> Abrir en mi correo
                    </a>
                    {open.whatsapp ? (
                      <a className="btn line sm" target="_blank" rel="noopener" href={`https://wa.me/${open.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg.body)}`}>
                        <Icon name="message" size={15} /> Abrir en WhatsApp
                      </a>
                    ) : null}
                  </div>
                  <details className="h-con-more">
                    <summary>Ver el mensaje {open.locale === "en" ? "(en inglés)" : ""}</summary>
                    <pre className="h-code">{msg.body}</pre>
                  </details>

                  {open.sentAt ? (
                    <p className="h-con-sentok">
                      <Icon name="check" size={14} /> Enviado por {open.sentVia === "whatsapp" ? "WhatsApp" : open.sentVia === "correo" ? "correo" : "otro medio"} a {open.sentTo} · {when(open.sentAt)}
                    </p>
                  ) : (
                    <form action={markSent} className="h-con-sent">
                      <input type="hidden" name="id" value={open.id} />
                      <b>¿Ya lo envió? Déjelo registrado.</b>
                      <div className="h-con-sent-row">
                        <select name="via" defaultValue="correo" className="h-inp" aria-label="Medio">
                          <option value="correo">Correo</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="otro">Otro</option>
                        </select>
                        <input className="h-inp" name="to" defaultValue={open.email} aria-label="Enviado a" maxLength={200} required />
                        <input className="h-inp" name="note" placeholder="Nota (opcional)" aria-label="Nota" maxLength={500} />
                        <button className="btn tint sm" type="submit"><Icon name="check" size={15} /> Marcar como enviado</button>
                      </div>
                      {error === "envio" ? <p className="h-error">Revise a quién se lo envió.</p> : null}
                    </form>
                  )}
                  <form action={regenerateLink}>
                    <input type="hidden" name="id" value={open.id} />
                    <button className="btn ghost sm" type="submit"><Icon name="refresh" size={15} /> Generar un enlace nuevo</button>
                  </form>
                </div>
              ) : null}

              <div className="h-con-history">
                <h3>Historial</h3>
                <ol>
                  {(open.history?.length ? open.history : [{ at: open.createdAt, what: "Solicitud recibida desde el sitio." }]).map((h, i) => (
                    <li key={i}><time dateTime={h.at}>{when(h.at)}</time>{h.what}</li>
                  ))}
                </ol>
                <form action={addNote} className="h-con-note">
                  <input type="hidden" name="id" value={open.id} />
                  <input className="h-inp" name="note" placeholder="Agregar una nota al historial (llamada, seguimiento…)" aria-label="Nota" maxLength={500} required />
                  <button className="btn line sm" type="submit">Agregar nota</button>
                </form>
              </div>

              {open.provisionLog?.length ? (
                <details className="h-con-more">
                  <summary>Detalle técnico de la creación</summary>
                  <ul className="h-con-log">
                    {open.provisionLog.map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                </details>
              ) : null}
            </section>
          ) : (
            <section className="h-con-detail h-con-empty">Elija una solicitud de la lista.</section>
          )}
        </div>

        <details className="h-con-more h-con-foot">
          <summary>Qué hace «Aprobar y crear» en producción</summary>
          <ol className="h-con-log numbered">
            {CLOUD_STEPS.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </details>
      </div>
    </main>
  );
}
