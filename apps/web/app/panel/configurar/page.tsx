import Link from "next/link";
import { ONBOARDING_STEPS, parseBusinessConfigRow, parsePaymentInstructions, parseSite, type ThemePresetId } from "@altair/config";
import { Icon, Notice } from "@altair/ui";
import { mediaUrl } from "@/lib/media";
import { CAN, panelSessionFor } from "@/lib/panel/context";
import { siteOrigin } from "@/lib/site-url";
import { SettingsForm } from "../ajustes/settings-form";
import { loadSampleCatalog } from "../borradores/actions";
import { CopyField } from "../claude/copy-field";
import { Flash, PageHeader } from "../page-header";
import { BrandForm } from "../sitio/brand-form";
import { setPublished } from "../sitio/actions";
import { completeStep, savePayments, saveServices } from "./actions";

export const metadata = { title: "Configurar mi negocio" };

const LABELS: Record<string, { label: string; help: string }> = {
  negocio: { label: "Su negocio", help: "Nombre, contacto, idioma, moneda e impuestos." },
  marca: { label: "Su marca", help: "Logo, colores y diseño de su página." },
  servicios: { label: "Qué vende", help: "Transporte privado, actividades o ambos." },
  datos: { label: "Sus tarifas", help: "Zonas, precios, vehículos y actividades." },
  cobros: { label: "Cómo le pagan", help: "Instrucciones de pago para sus clientes." },
  claude: { label: "Su Claude", help: "Conecte su suscripción para administrar todo conversando." },
  publicar: { label: "Publicar", help: "Revise y abra su sitio al público." },
};

function Continue({ step, label = "Listo, seguir" }: { step: string; label?: string }) {
  return (
    <form action={completeStep}>
      <input type="hidden" name="step" value={step} />
      <button className="btn tint" type="submit">
        {label} <Icon name="arrowRight" size={17} />
      </button>
    </form>
  );
}

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ paso?: string; ok?: string; error?: string }> }) {
  const { sb } = await panelSessionFor(CAN.catalog);
  const sp = await searchParams;
  const { data: row } = await sb.from("business_config").select("*").eq("id", 1).maybeSingle();
  const config = parseBusinessConfigRow(row);
  const onboarding = (row?.onboarding ?? {}) as Record<string, boolean>;
  const step = (ONBOARDING_STEPS as readonly string[]).includes(sp.paso ?? "") ? sp.paso! : (ONBOARDING_STEPS.find((s) => !onboarding[s]) ?? "publicar");
  const origin = await siteOrigin();

  const [areas, rates, activities, drafts, grants] = await Promise.all([
    sb.from("areas").select("id", { count: "exact", head: true }),
    sb.from("route_rates").select("id", { count: "exact", head: true }),
    sb.from("activities").select("id", { count: "exact", head: true }),
    sb.from("change_sets").select("id, title, source").eq("status", "draft").order("created_at", { ascending: false }).limit(5),
    sb.from("oauth_grants").select("id", { count: "exact", head: true }).is("revoked_at", null),
  ]);
  const site = parseSite(row?.site);
  const pay = parsePaymentInstructions(row?.payment_instructions);
  const doneCount = ONBOARDING_STEPS.filter((s) => onboarding[s]).length;

  return (
    <>
      <PageHeader
        eyebrow={`Paso ${ONBOARDING_STEPS.indexOf(step as never) + 1} de ${ONBOARDING_STEPS.length}`}
        title="Configurar mi negocio"
        subtitle="Le guiamos paso a paso. Puede volver a cualquier paso cuando quiera, y su Claude puede hacer buena parte del trabajo."
      />
      <div className="row" style={{ gap: 20, alignItems: "flex-start" }}>
        <nav className="card pad col panel-steps" style={{ gap: 4 }} aria-label="Pasos">
          <div className="row" style={{ justifyContent: "space-between", padding: "0 6px 8px" }}>
            <b>Progreso</b>
            <span className="st info">{doneCount}/{ONBOARDING_STEPS.length}</span>
          </div>
          {ONBOARDING_STEPS.map((s, i) => (
            <Link key={s} href={`/panel/configurar?paso=${s}`} className="row" style={{ gap: 10, padding: "10px 8px", borderRadius: 14, flexWrap: "nowrap", background: s === step ? "var(--mist)" : "transparent" }} aria-current={s === step ? "step" : undefined}>
              <span style={{ width: 26, height: 26, borderRadius: 13, display: "grid", placeItems: "center", fontSize: 12.5, fontWeight: 700, flex: "none", background: onboarding[s] ? "var(--ok-bg)" : s === step ? "var(--brand)" : "var(--mist-2)", color: onboarding[s] ? "var(--ok)" : s === step ? "#fff" : "var(--mute)" }}>
                {onboarding[s] ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className="col" style={{ gap: 0, flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 14.5 }}>{LABELS[s]!.label}</b>
                <span className="tiny">{LABELS[s]!.help}</span>
              </span>
            </Link>
          ))}
        </nav>

        <section className="col" style={{ gap: 18, flex: "1 1 560px", minWidth: 0 }}>
          <Flash ok={sp.ok === "publicado" ? "¡Listo! Su sitio está publicado." : sp.ok === "publicado_datos" ? "Datos publicados en su catálogo. Ya se ven en su sitio." : null} error={sp.error === "ninguno" ? "Elija al menos un servicio." : sp.error ? "Revise los datos." : null} />

          {step === "negocio" && config ? (
            <>
              <SettingsForm config={config} canEdit />
              <Continue step="negocio" />
            </>
          ) : null}

          {step === "marca" ? (
            <>
              <BrandForm
                site={{ ...site, logoUrl: mediaUrl(site.logoPath), heroUrl: mediaUrl(site.heroPath) }}
                theme={(row?.theme ?? { preset: "marea" }) as { preset: ThemePresetId }}
                showEnglish={(config?.locales ?? []).includes("en")}
              />
              <Continue step="marca" />
            </>
          ) : null}

          {step === "servicios" && config ? (
            <form action={saveServices} className="card pad-l col" style={{ gap: 16 }}>
              <h2 className="h4">¿Qué vende en su sitio?</h2>
              {[
                { name: "transfers", label: "Transporte privado", help: "Traslados puerta a puerta entre aeropuertos, hoteles y pueblos, con precio por zona y vehículo.", icon: "car" as const, on: config.features.transfers },
                { name: "activities", label: "Actividades y tours", help: "Tours con horarios, cupos, precio por adulto y niño, y recogida en hotel.", icon: "mountain" as const, on: config.features.activities },
              ].map((f) => (
                <label key={f.name} className="opt" style={{ alignItems: "flex-start" }}>
                  <input type="checkbox" name={f.name} defaultChecked={f.on} style={{ width: 20, height: 20, marginTop: 10 }} />
                  <span className="ico t"><Icon name={f.icon} /></span>
                  <span className="col" style={{ gap: 2 }}>
                    <b>{f.label}</b>
                    <span className="tiny">{f.help}</span>
                  </span>
                </label>
              ))}
              <button className="btn tint" type="submit" style={{ alignSelf: "flex-start" }}>Guardar y seguir <Icon name="arrowRight" size={17} /></button>
            </form>
          ) : null}

          {step === "datos" ? (
            <>
              <div className="panel-kpis">
                {[
                  { label: "Zonas", v: areas.count ?? 0 },
                  { label: "Tarifas", v: rates.count ?? 0 },
                  { label: "Actividades", v: activities.count ?? 0 },
                  { label: "Borradores", v: drafts.data?.length ?? 0 },
                ].map((k) => (
                  <div key={k.label} className="kpi glass flat"><span>{k.label}</span><b>{k.v}</b></div>
                ))}
              </div>
              {(drafts.data ?? []).length ? (
                <Notice tone="warn">
                  Tiene borradores por revisar:{" "}
                  {(drafts.data ?? []).map((d, i) => (
                    <span key={d.id}>{i ? " · " : ""}<Link href={`/panel/borradores/${d.id}?desde=configurar`} style={{ textDecoration: "underline" }}>{d.title}</Link></span>
                  ))}
                </Notice>
              ) : null}
              <div className="g3">
                <div className="card pad-l col" style={{ gap: 10 }}>
                  <span className="ico t"><Icon name="sparkle" /></span>
                  <h3 className="h4">Con su Claude</h3>
                  <p className="small">Envíe su Excel, PDF o foto de tarifas a su Claude conectado y pídale «Cargue mis tarifas en Altair». Todo queda como borrador.</p>
                  <Link className="btn line sm" href="/panel/configurar?paso=claude" style={{ alignSelf: "flex-start" }}>Conectar Claude</Link>
                </div>
                <div className="card pad-l col" style={{ gap: 10 }}>
                  <span className="ico t"><Icon name="sheet" /></span>
                  <h3 className="h4">Con Excel</h3>
                  <p className="small">Descargue la plantilla, complétela y súbala. Le mostramos cada fila antes de publicar.</p>
                  <Link className="btn line sm" href="/panel/importar" style={{ alignSelf: "flex-start" }}>Importar Excel</Link>
                </div>
                <div className="card pad-l col" style={{ gap: 10 }}>
                  <span className="ico t"><Icon name="check" /></span>
                  <h3 className="h4">Con datos de ejemplo</h3>
                  <p className="small">Cargamos zonas, tarifas y actividades de muestra para que vea todo funcionando. Luego las cambia por las suyas.</p>
                  <form action={loadSampleCatalog}>
                    <input type="hidden" name="back" value="configurar" />
                    <button className="btn line sm" type="submit">Cargar ejemplo</button>
                  </form>
                </div>
              </div>
              <Continue step="datos" />
            </>
          ) : null}

          {step === "cobros" ? (
            <form action={savePayments} className="card pad-l col" style={{ gap: 14 }}>
              <h2 className="h4">¿Cómo le pagan sus clientes?</h2>
              <div className="g2">
                <label className="opt on" style={{ alignItems: "flex-start" }}>
                  <span className="ico t"><Icon name="clipboard" /></span>
                  <span className="col" style={{ gap: 2 }}>
                    <b>Solo registros</b>
                    <span className="tiny">Sus clientes reservan sin pagar en línea. Usted cobra (SINPE, transferencia, efectivo) y lo registra en el panel. Altair nunca toca dinero.</span>
                  </span>
                </label>
                <div className="opt" style={{ alignItems: "flex-start", opacity: 0.6, cursor: "default" }}>
                  <span className="ico soft"><Icon name="card" /></span>
                  <span className="col" style={{ gap: 2 }}>
                    <b>Tarjeta con Stripe <span className="st mute">Pronto</span></b>
                    <span className="tiny">Cobro con tarjeta en la página segura de Stripe, con su propia cuenta.</span>
                  </span>
                </div>
              </div>
              <div className="field">
                <label className="lbl" htmlFor="pay_es">Instrucciones de pago que ve su cliente</label>
                <div className="input area"><textarea id="pay_es" name="pay_es" rows={4} maxLength={1200} defaultValue={pay.es ?? ""} placeholder={"Ej.: Pague el 30% por SINPE Móvil al 8888-8888 a nombre de …, y el resto el día del servicio.\nEnvíenos el comprobante por WhatsApp con su código de reserva."} /></div>
              </div>
              {(config?.locales ?? []).includes("en") ? (
                <div className="field">
                  <label className="lbl" htmlFor="pay_en">En inglés</label>
                  <div className="input area"><textarea id="pay_en" name="pay_en" rows={4} maxLength={1200} defaultValue={pay.en ?? ""} /></div>
                </div>
              ) : null}
              <button className="btn tint" type="submit" style={{ alignSelf: "flex-start" }}>Guardar y seguir <Icon name="arrowRight" size={17} /></button>
            </form>
          ) : null}

          {step === "claude" ? (
            <>
              <div className="card pad-l col" style={{ gap: 14 }}>
                <div className="row" style={{ gap: 12 }}>
                  <span className="ico t"><Icon name="sparkle" /></span>
                  <div className="col" style={{ gap: 2 }}>
                    <h2 className="h4">Conecte su Claude</h2>
                    <span className="tiny">Funciona con su propia suscripción de Claude. Altair nunca ve su cuenta ni su contraseña de Claude.</span>
                  </div>
                  {(grants.count ?? 0) > 0 ? <span className="st ok" style={{ marginLeft: "auto" }}>Conectado</span> : <span className="st warn" style={{ marginLeft: "auto" }}>Sin conectar</span>}
                </div>
                <CopyField label="Dirección del conector" value={`${origin}/mcp`} />
                <ol className="col" style={{ gap: 8, paddingLeft: 20, listStyle: "decimal" }}>
                  <li>En Claude (web, escritorio o celular) abra <b>Configuración → Conectores → Agregar conector personalizado</b>.</li>
                  <li>Asígnele el nombre <b>{config?.name ?? "Mi negocio"}</b> y pegue la dirección de arriba.</li>
                  <li>Toque <b>Conectar</b>: se abre esta página para que entre con su usuario y su código, y elija qué puede hacer Claude.</li>
                  <li>Listo. Pruebe: «¿Qué servicios tengo mañana?» o «Cargue estas tarifas en Altair».</li>
                </ol>
                {origin.startsWith("http://localhost") ? (
                  <Notice tone="info">Está en una copia local: Claude en la web solo llega a direcciones públicas. Para probar ahora, use Claude Code: <span className="mono">claude mcp add --transport http altair {origin}/mcp</span></Notice>
                ) : null}
              </div>
              <Continue step="claude" label={(grants.count ?? 0) > 0 ? "Listo, seguir" : "Lo hago después"} />
            </>
          ) : null}

          {step === "publicar" ? (
            <div className="card pad-l col" style={{ gap: 14 }}>
              <h2 className="h4">Revise y publique</h2>
              {[
                { ok: Boolean(config?.contactWhatsapp || config?.contactEmail), label: "Datos de contacto", href: "negocio" },
                { ok: Boolean(site.logoPath), label: "Logo", href: "marca" },
                { ok: (rates.count ?? 0) > 0 || (activities.count ?? 0) > 0, label: "Tarifas o actividades publicadas", href: "datos" },
                { ok: Boolean(pay.es), label: "Instrucciones de pago", href: "cobros" },
                { ok: (grants.count ?? 0) > 0, label: "Claude conectado (opcional)", href: "claude" },
              ].map((c) => (
                <Link key={c.label} href={`/panel/configurar?paso=${c.href}`} className="row panel" style={{ gap: 10 }}>
                  <span className={`st ${c.ok ? "ok" : "warn"}`}>{c.ok ? "Listo" : "Falta"}</span>
                  <b>{c.label}</b>
                </Link>
              ))}
              <div className="row" style={{ gap: 10 }}>
                <a className="btn line" href="/" target="_blank" rel="noopener"><Icon name="eye" size={17} /> Vista previa</a>
                {row?.published ? (
                  <span className="st ok">Su sitio ya está publicado</span>
                ) : (
                  <form action={setPublished}>
                    <input type="hidden" name="publish" value="1" />
                    <input type="hidden" name="back" value="configurar" />
                    <button className="btn gold" type="submit"><Icon name="globe" size={17} /> Publicar mi sitio</button>
                  </form>
                )}
              </div>
              <p className="tiny">{row?.published ? "Su sitio está abierto al público. Puede ocultarlo de nuevo desde «Sitio y marca»." : "Al publicar, sus clientes podrán reservar de inmediato. Puede ocultar el sitio de nuevo desde «Sitio y marca»."}</p>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
