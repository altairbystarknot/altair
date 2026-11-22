"use client";

import { useActionState, useState } from "react";
import { SITE_LAYOUT_INFO, THEME_PRESETS, THEME_PRESET_IDS, type SiteLayout, type ThemePresetId } from "@altair/config";
import { Button, Icon, Notice } from "@altair/ui";
import { saveBrand, type BrandState } from "./actions";

type Props = {
  site: {
    layout: SiteLayout;
    font: "moderna" | "elegante";
    logoUrl: string | null;
    heroUrl: string | null;
    eyebrow: { es?: string; en?: string };
    headline: { es?: string; en?: string };
    subheadline: { es?: string; en?: string };
    about: { es?: string; en?: string };
  };
  theme: { preset: ThemePresetId; brand?: string; brand2?: string; accent?: string };
  showEnglish: boolean;
};

const initial: BrandState = { status: "idle", message: null };

/** Most common saturated color of an image (ignores near-white, near-black and grey pixels). */
function dominantColor(img: HTMLImageElement): string | null {
  const c = document.createElement("canvas");
  const s = 64;
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, s, s);
  const data = ctx.getImageData(0, 0, s, s).data;
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i]!, data[i + 1]!, data[i + 2]!, data[i + 3]!];
    if (a < 200) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 35 || min > 225 || max - min < 40) continue;
    const k = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const e = buckets.get(k) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++;
    e.r += r;
    e.g += g;
    e.b += b;
    buckets.set(k, e);
  }
  const best = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
  if (!best) return null;
  const hex = (v: number) => Math.round(v / best.n).toString(16).padStart(2, "0");
  return `#${hex(best.r)}${hex(best.g)}${hex(best.b)}`;
}

function shade(hex: string, f: number): string {
  const n = (i: number) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f)));
  return `#${[1, 3, 5].map((i) => n(i).toString(16).padStart(2, "0")).join("")}`;
}

export function BrandForm({ site, theme, showEnglish }: Props) {
  const [state, action, pending] = useActionState(saveBrand, initial);
  const [preset, setPreset] = useState<ThemePresetId>(theme.preset);
  const [custom, setCustom] = useState(Boolean(theme.brand || theme.accent));
  const base = THEME_PRESETS[preset];
  const [brand, setBrand] = useState(theme.brand ?? base.brand);
  const [brand2, setBrand2] = useState(theme.brand2 ?? base.brand2);
  const [accent, setAccent] = useState(theme.accent ?? base.accent);
  const [layout, setLayout] = useState<SiteLayout>(site.layout);
  const [logoPreview, setLogoPreview] = useState<string | null>(site.logoUrl);
  const [heroPreview, setHeroPreview] = useState<string | null>(site.heroUrl);
  const [logoTip, setLogoTip] = useState<string | null>(null);

  const shown = custom ? { brand, brand2, accent } : { brand: base.brand, brand2: base.brand2, accent: base.accent };

  function onLogo(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
    const img = new Image();
    img.onload = () => {
      const c = dominantColor(img);
      if (c) {
        setLogoTip(c);
      }
    };
    img.src = url;
  }

  const texts: Array<{ k: "eyebrow" | "headline" | "subheadline" | "about"; label: string; max: number; area?: boolean }> = [
    { k: "eyebrow", label: "Frase corta sobre el título", max: 60 },
    { k: "headline", label: "Título principal", max: 90 },
    { k: "subheadline", label: "Bajada", max: 240, area: true },
    { k: "about", label: "Sobre nosotros (opcional)", max: 900, area: true },
  ];

  return (
    <form action={action} className="col" style={{ gap: 20 }}>
      <section className="card pad-l col" style={{ gap: 16 }}>
        <h2 className="h4">Logo</h2>
        <div className="row" style={{ gap: 18 }}>
          <div style={{ width: 120, height: 120, borderRadius: 24, background: "var(--mist)", display: "grid", placeItems: "center", overflow: "hidden" }}>
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Logo" style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }} />
            ) : (
              <Icon name="image" size={34} />
            )}
          </div>
          <div className="col" style={{ gap: 8, flex: "1 1 240px" }}>
            <input type="file" name="logo" accept="image/png,image/jpeg,image/webp" onChange={(e) => onLogo(e.target.files?.[0])} className="input" style={{ padding: 10 }} />
            <span className="tiny">PNG con fondo transparente queda mejor. Hasta 5 MB.</span>
            {site.logoUrl ? (
              <label className="row tiny" style={{ gap: 6 }}>
                <input type="checkbox" name="removeLogo" /> Quitar el logo actual
              </label>
            ) : null}
            {logoTip ? (
              <button
                type="button"
                className="btn line sm"
                style={{ alignSelf: "flex-start" }}
                onClick={() => {
                  setCustom(true);
                  setBrand(shade(logoTip, 0.45));
                  setBrand2(shade(logoTip, 0.7));
                  setAccent(logoTip);
                  setLogoTip(null);
                }}
              >
                <span style={{ width: 16, height: 16, borderRadius: 5, background: logoTip, display: "inline-block" }} /> Usar los colores de mi logo
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="card pad-l col" style={{ gap: 16 }}>
        <h2 className="h4">Colores</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {THEME_PRESET_IDS.map((id) => {
            const p = THEME_PRESETS[id];
            const on = !custom && id === preset;
            return (
              <label key={id} className={`opt${on ? " on" : ""}`} style={{ width: "auto", padding: 12, gap: 10 }}>
                <input type="radio" name="preset" value={id} checked={id === preset} onChange={() => { setPreset(id); setCustom(false); }} className="sr-only" />
                <span style={{ display: "flex", borderRadius: 10, overflow: "hidden", flex: "none" }}>
                  {[p.brand, p.brand2, p.accent].map((c) => <span key={c} style={{ width: 16, height: 28, background: c }} />)}
                </span>
                <b style={{ fontSize: 14 }}>{p.label}</b>
              </label>
            );
          })}
        </div>
        <label className="row" style={{ gap: 10 }}>
          <input type="checkbox" name="customColors" checked={custom} onChange={(e) => setCustom(e.target.checked)} style={{ width: 18, height: 18 }} />
          <b>Usar mis propios colores</b>
        </label>
        {custom ? (
          <div className="row" style={{ gap: 14 }}>
            {[
              { name: "brand", label: "Principal", v: brand, set: setBrand },
              { name: "brand2", label: "Secundario", v: brand2, set: setBrand2 },
              { name: "accent", label: "Acento", v: accent, set: setAccent },
            ].map((c) => (
              <label key={c.name} className="col" style={{ gap: 6 }}>
                <span className="lbl">{c.label}</span>
                <input type="color" name={c.name} value={c.v} onChange={(e) => c.set(e.target.value)} style={{ width: 72, height: 44, border: 0, background: "none" }} />
              </label>
            ))}
          </div>
        ) : null}
        <div style={{ borderRadius: 24, padding: 18, background: `linear-gradient(150deg, ${shown.brand}, ${shown.brand2})`, color: "#fff" }}>
          <b style={{ fontSize: 20 }}>Así se ve su marca</b>
          <div className="row" style={{ gap: 10, marginTop: 12 }}>
            <span className="btn sm" style={{ background: shown.accent, color: "#1d1a12" }}>Reservar</span>
            <span className="btn sm" style={{ background: "#fff", color: shown.brand }}>Ver precios</span>
          </div>
        </div>
      </section>

      <section className="card pad-l col" style={{ gap: 16 }}>
        <h2 className="h4">Diseño de la página</h2>
        <div className="g3">
          {(Object.keys(SITE_LAYOUT_INFO) as SiteLayout[]).map((id) => (
            <label key={id} className={`opt${layout === id ? " on" : ""}`} style={{ flexDirection: "column", alignItems: "stretch" }}>
              <input type="radio" name="layout" value={id} checked={layout === id} onChange={() => setLayout(id)} className="sr-only" />
              <LayoutThumb id={id} c={shown} />
              <b>{SITE_LAYOUT_INFO[id].label}</b>
              <span className="tiny">{SITE_LAYOUT_INFO[id].description}</span>
            </label>
          ))}
        </div>
        <div className="row" style={{ gap: 10 }}>
          <span className="lbl">Tipografía de los títulos</span>
          <select name="font" defaultValue={site.font} className="input" style={{ width: "auto", minWidth: 230, minHeight: 42 }} aria-label="Tipografía de los títulos">
            <option value="moderna">Moderna (sin serifa)</option>
            <option value="elegante">Elegante (con serifa)</option>
          </select>
        </div>
        <div className="col" style={{ gap: 8 }}>
          <span className="lbl">Foto principal</span>
          {heroPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroPreview} alt="" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 20 }} />
          ) : null}
          <input type="file" name="hero" accept="image/png,image/jpeg,image/webp" className="input" style={{ padding: 10 }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setHeroPreview(URL.createObjectURL(f)); }} />
          <span className="tiny">Una foto horizontal y luminosa de su zona o de sus vehículos. Hasta 8 MB.</span>
          {site.heroUrl ? (
            <label className="row tiny" style={{ gap: 6 }}>
              <input type="checkbox" name="removeHero" /> Quitar la foto actual
            </label>
          ) : null}
        </div>
      </section>

      <section className="card pad-l col" style={{ gap: 14 }}>
        <h2 className="h4">Textos de la portada</h2>
        <p className="tiny">Si deja un campo vacío, usamos un texto estándar.</p>
        {texts.map((f) => (
          <div key={f.k} className={showEnglish ? "g2" : "col"}>
            {(showEnglish ? (["es", "en"] as const) : (["es"] as const)).map((l) => (
              <div key={l} className="field">
                <label className="lbl" htmlFor={`${f.k}_${l}`}>{f.label}{showEnglish ? ` (${l.toUpperCase()})` : ""}</label>
                <div className={`input${f.area ? " area" : ""}`}>
                  {f.area ? (
                    <textarea id={`${f.k}_${l}`} name={`${f.k}_${l}`} maxLength={f.max} rows={3} defaultValue={site[f.k][l] ?? ""} />
                  ) : (
                    <input id={`${f.k}_${l}`} name={`${f.k}_${l}`} maxLength={f.max} defaultValue={site[f.k][l] ?? ""} />
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>

      {state.message ? <Notice tone={state.status === "error" ? "bad" : "ok"}>{state.message}</Notice> : null}
      <div className="row" style={{ gap: 10 }}>
        <Button type="submit" size="lg" disabled={pending}>{pending ? "Guardando…" : "Guardar diseño"}</Button>
        <a className="btn line lg" href="/" target="_blank" rel="noopener">
          <Icon name="external" size={17} /> Ver mi sitio
        </a>
      </div>
    </form>
  );
}

function LayoutThumb({ id, c }: { id: SiteLayout; c: { brand: string; brand2: string; accent: string } }) {
  const bar = (w: string, h = 6, bg = "#cfdadd") => <span style={{ display: "block", width: w, height: h, borderRadius: 4, background: bg }} />;
  return (
    <span style={{ height: 120, borderRadius: 16, overflow: "hidden", background: "#f4f7f8", display: "flex", flexDirection: "column", gap: 6, padding: 10, position: "relative" }} aria-hidden="true">
      {id === "inmersivo" ? (
        <span style={{ position: "absolute", inset: 0, background: `linear-gradient(150deg, ${c.brand}, ${c.brand2})`, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 10, gap: 6 }}>
          {bar("70%", 9, "rgba(255,255,255,.9)")}
          {bar("45%", 5, "rgba(255,255,255,.6)")}
          <span style={{ height: 22, borderRadius: 10, background: "rgba(255,255,255,.75)" }} />
        </span>
      ) : id === "catalogo" ? (
        <>
          {bar("55%", 9, c.brand)}
          <span style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, flex: 1 }}>
            {[0, 1, 2].map((i) => <span key={i} style={{ borderRadius: 8, background: i === 1 ? c.accent : "#dde7ea" }} />)}
          </span>
          <span style={{ height: 16, borderRadius: 8, background: `linear-gradient(90deg, ${c.brand}, ${c.brand2})` }} />
        </>
      ) : (
        <>
          <span style={{ alignSelf: "center" }}>{bar("90px", 9, c.brand)}</span>
          <span style={{ alignSelf: "center" }}>{bar("60px", 5)}</span>
          <span style={{ height: 22, borderRadius: 11, background: "#fff", boxShadow: `inset 0 0 0 1px #cfdadd`, marginTop: 4 }} />
          <span style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, flex: 1 }}>
            {[0, 1, 2].map((i) => <span key={i} style={{ borderRadius: 8, background: i === 0 ? c.accent : "#dde7ea" }} />)}
          </span>
        </>
      )}
    </span>
  );
}
