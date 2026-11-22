"use client";

import { useActionState } from "react";
import { SUPPORTED_LOCALES, THEME_PRESETS, THEME_PRESET_IDS, type BusinessConfig } from "@altair/config";
import { Button, Card, Field, Icon, Notice, TextInput } from "@altair/ui";
import { saveBusinessSettings, type SettingsState } from "./actions";

const LOCALE_LABELS: Record<(typeof SUPPORTED_LOCALES)[number], string> = {
  es: "Español",
  en: "English",
  pt: "Português",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
};

const TIMEZONES = [
  "America/Costa_Rica",
  "America/Panama",
  "America/Mexico_City",
  "America/Bogota",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/Madrid",
];

const initial: SettingsState = { status: "idle", message: null, fieldErrors: {} };

export function SettingsForm({ config, canEdit }: { config: BusinessConfig; canEdit: boolean }) {
  const [state, action, pending] = useActionState(saveBusinessSettings, initial);
  const err = (k: string) => state.fieldErrors[k];
  const zones = TIMEZONES.includes(config.timezone) ? TIMEZONES : [config.timezone, ...TIMEZONES];

  return (
    <form action={action} className="col" style={{ gap: 20 }}>
      <fieldset disabled={!canEdit || pending} style={{ border: 0, padding: 0, margin: 0, display: "contents" }}>
        <Card pad="lg">
          <div className="col" style={{ gap: 16 }}>
            <h2 className="h4">El negocio</h2>
            <div className="g2" style={{ gap: 14 }}>
              <Field label="Nombre" htmlFor="name" error={err("name")}>
                <TextInput id="name" name="name" defaultValue={config.name} required invalid={!!err("name")} />
              </Field>
              <Field label="Prefijo de las reservas" htmlFor="reservationPrefix" hint="Ej.: MAR → MAR-0042" error={err("reservationPrefix")}>
                <TextInput id="reservationPrefix" name="reservationPrefix" defaultValue={config.reservationPrefix} maxLength={4} required invalid={!!err("reservationPrefix")} />
              </Field>
              <Field label="Correo para avisos" htmlFor="contactEmail" error={err("contactEmail")}>
                <TextInput id="contactEmail" name="contactEmail" type="email" defaultValue={config.contactEmail ?? ""} icon="mail" invalid={!!err("contactEmail")} />
              </Field>
              <Field label="WhatsApp de reservas" htmlFor="contactWhatsapp" error={err("contactWhatsapp")}>
                <TextInput id="contactWhatsapp" name="contactWhatsapp" defaultValue={config.contactWhatsapp ?? ""} placeholder="+506 8000 0000" invalid={!!err("contactWhatsapp")} />
              </Field>
            </div>
          </div>
        </Card>

        <Card pad="lg">
          <div className="col" style={{ gap: 14 }}>
            <h2 className="h4">Estilo del sitio</h2>
            <div className="g3" style={{ gap: 12 }} role="radiogroup" aria-label="Estilo del sitio">
              {THEME_PRESET_IDS.map((id) => {
                const p = THEME_PRESETS[id];
                return (
                  <label key={id} className="opt" style={{ cursor: canEdit ? "pointer" : "default" }}>
                    <input type="radio" name="preset" value={id} defaultChecked={config.theme.preset === id} />
                    <span className="row" style={{ gap: 4, flexWrap: "nowrap" }} aria-hidden="true">
                      <span style={{ width: 22, height: 22, borderRadius: 7, background: p.brand }} />
                      <span style={{ width: 22, height: 22, borderRadius: 7, background: p.brand2 }} />
                      <span style={{ width: 22, height: 22, borderRadius: 7, background: p.accent }} />
                    </span>
                    <b>{p.label}</b>
                  </label>
                );
              })}
            </div>
          </div>
        </Card>

        <Card pad="lg">
          <div className="col" style={{ gap: 16 }}>
            <h2 className="h4">Idiomas, hora y moneda</h2>
            <div className="row" style={{ gap: 8 }}>
              {SUPPORTED_LOCALES.map((l) => (
                <label key={l} className="chip" style={{ cursor: canEdit ? "pointer" : "default" }}>
                  <input type="checkbox" name={`locale_${l}`} defaultChecked={config.locales.includes(l)} />
                  {LOCALE_LABELS[l]}
                </label>
              ))}
            </div>
            {err("locales") ? <span className="tiny" style={{ color: "var(--bad)" }}>{err("locales")}</span> : null}
            <div className="g3" style={{ gap: 14 }}>
              <Field label="Idioma principal" htmlFor="defaultLocale" error={err("defaultLocale")}>
                <div className="input">
                  <select id="defaultLocale" name="defaultLocale" className="native" defaultValue={config.defaultLocale}>
                    {SUPPORTED_LOCALES.map((l) => (
                      <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
                    ))}
                  </select>
                  <Icon name="chevronDown" size={16} style={{ pointerEvents: "none" }} />
                </div>
              </Field>
              <Field label="Zona horaria" htmlFor="timezone" error={err("timezone")}>
                <div className="input">
                  <select id="timezone" name="timezone" className="native" defaultValue={config.timezone}>
                    {zones.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                  <Icon name="chevronDown" size={16} style={{ pointerEvents: "none" }} />
                </div>
              </Field>
              <Field label="Moneda" htmlFor="currency" error={err("currency")}>
                <TextInput id="currency" name="currency" defaultValue={config.currency} maxLength={3} required invalid={!!err("currency")} />
              </Field>
            </div>
          </div>
        </Card>

        <Card pad="lg">
          <div className="col" style={{ gap: 16 }}>
            <h2 className="h4">Precios y pagos</h2>
            <div className="g3" style={{ gap: 14 }}>
              <Field label="Impuesto incluido (%)" htmlFor="vatPercent" error={err("vatRate")}>
                <TextInput id="vatPercent" name="vatPercent" inputMode="decimal" defaultValue={String(Math.round(config.vatRate * 10000) / 100)} required invalid={!!err("vatRate")} />
              </Field>
              <Field label="Redondeo" htmlFor="rounding">
                <div className="input">
                  <select id="rounding" name="rounding" className="native" defaultValue={config.rounding}>
                    <option value="whole_up">Al dólar entero (recomendado)</option>
                    <option value="cents">Con centavos</option>
                  </select>
                  <Icon name="chevronDown" size={16} style={{ pointerEvents: "none" }} />
                </div>
              </Field>
              <Field label="Pagos" htmlFor="paymentsMode" hint="Cobro con tarjeta (Stripe): pronto.">
                <div className="input">
                  <select id="paymentsMode" name="paymentsMode" className="native" defaultValue={config.paymentsMode}>
                    <option value="records">Solo registros (sin pagos en línea)</option>
                    <option value="stripe" disabled>Cobrar con Stripe (pronto)</option>
                  </select>
                  <Icon name="chevronDown" size={16} style={{ pointerEvents: "none" }} />
                </div>
              </Field>
            </div>
          </div>
        </Card>
      </fieldset>

      {state.message ? <Notice tone={state.status === "saved" ? "ok" : "bad"}>{state.message}</Notice> : null}
      {canEdit ? (
        <div className="row" style={{ gap: 10 }}>
          <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
          <span className="small">Cada cambio queda en el registro de auditoría.</span>
        </div>
      ) : (
        <Notice tone="info">Solo el dueño o un administrador puede cambiar estos ajustes.</Notice>
      )}
    </form>
  );
}
