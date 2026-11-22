import Link from "next/link";
import { customerPrice, formatPrice } from "@altair/core";
import { Icon } from "@altair/ui";
import { getPublicConfig } from "@/lib/config/business-config";
import { mediaUrl } from "@/lib/media";
import { panelSession } from "@/lib/panel/context";
import { Flash, PageHeader } from "../page-header";
import { addRoute, saveArea, saveExtra, savePlace, saveRates, saveSeason, saveSurcharge, saveVehicle, toggleActive } from "./actions";

export const metadata = { title: "Transporte" };

const TABS = [
  { id: "tarifas", label: "Tarifas" },
  { id: "zonas", label: "Zonas y lugares" },
  { id: "vehiculos", label: "Vehículos" },
  { id: "extras", label: "Recargos y extras" },
];
const KIND_PLACE: Record<string, string> = { airport: "Aeropuerto", hotel: "Hotel", town: "Pueblo", port: "Puerto", other: "Otro" };
const OK: Record<string, string> = { zona: "Zona agregada.", lugar: "Lugar agregado.", vehiculo: "Vehículo guardado.", tarifas: "Tarifas guardadas.", ruta: "Ruta agregada.", temporada: "Temporada agregada.", extra: "Extra agregado.", recargo: "Recargo agregado.", estado: "Actualizado." };

function Toggle({ table, id, active, tab }: { table: string; id: string; active: boolean; tab: string }) {
  return (
    <form action={toggleActive}>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="tab" value={tab} />
      <button type="submit" className={`st ${active ? "ok" : "mute"}`} title={active ? "Desactivar" : "Activar"} style={{ cursor: "pointer", border: 0 }}>
        {active ? "Activo" : "Inactivo"}
      </button>
    </form>
  );
}

export default async function TransportPage({ searchParams }: { searchParams: Promise<{ tab?: string; ok?: string; error?: string; temporada?: string }> }) {
  const sp = await searchParams;
  const tab = TABS.some((t) => t.id === sp.tab) ? sp.tab! : "tarifas";
  const { sb, staff } = await panelSession();
  const canEdit = staff.role === "owner" || staff.role === "admin";
  const { config } = await getPublicConfig();
  const vat = config?.vatRate ?? 0;
  const rounding = config?.rounding ?? "whole_up";
  const currency = config?.currency ?? "USD";

  const [areas, places, vehicles, seasons, rates, extras, surcharges] = await Promise.all([
    sb.from("areas").select("*").order("sort").order("name"),
    sb.from("places").select("*").order("name"),
    sb.from("vehicle_classes").select("*").order("sort").order("name"),
    sb.from("rate_seasons").select("*").order("starts_on"),
    sb.from("route_rates").select("*").limit(20000),
    sb.from("transfer_extras").select("*").order("sort"),
    sb.from("surcharge_rules").select("*").order("name"),
  ]);
  const A = areas.data ?? [];
  const V = (vehicles.data ?? []).filter((v) => v.active);
  const S = seasons.data ?? [];
  const season = S.find((x) => x.id === sp.temporada) ?? null;
  const areaName = new Map(A.map((a) => [a.id, a.name]));
  const R = (rates.data ?? []).filter((r) => (season ? r.season_id === season.id : r.season_id === null));
  const routes = [...new Map(R.map((r) => [`${r.from_area_id}|${r.to_area_id}`, { from: r.from_area_id as string, to: r.to_area_id as string }])).values()].sort((a, b) =>
    `${areaName.get(a.from)}${areaName.get(a.to)}`.localeCompare(`${areaName.get(b.from)}${areaName.get(b.to)}`),
  );
  const rate = (f: string, t: string, v: string) => R.find((r) => r.from_area_id === f && r.to_area_id === t && r.vehicle_class_id === v);
  const final = (p: unknown) => (p === null || p === undefined ? null : customerPrice(Number(p), vat, rounding));

  return (
    <>
      <PageHeader
        title="Transporte privado"
        subtitle={`Precios por zona de origen, zona de destino y vehículo. Usted escribe el precio sin impuestos; el cliente ve el precio final con ${Math.round(vat * 1000) / 10}% incluido.`}
        actions={canEdit ? <Link className="btn line sm" href="/panel/importar"><Icon name="sheet" size={16} /> Importar Excel</Link> : null}
      />
      <nav className="tabs" aria-label="Secciones">
        {TABS.map((t) => (
          <Link key={t.id} href={`/panel/transporte?tab=${t.id}`} className={t.id === tab ? "on" : undefined}>{t.label}</Link>
        ))}
      </nav>
      <Flash ok={sp.ok ? (OK[sp.ok] ?? "Guardado.") : null} error={sp.error ?? null} />

      {tab === "tarifas" ? (
        <>
          <div className="row" style={{ gap: 8 }}>
            <span className="lbl">Temporada:</span>
            <Link href="/panel/transporte?tab=tarifas" className={`chip${!season ? " on" : ""}`}>Todo el año</Link>
            {S.map((x) => (
              <Link key={x.id} href={`/panel/transporte?tab=tarifas&temporada=${x.id}`} className={`chip${season?.id === x.id ? " on" : ""}`}>{x.name}</Link>
            ))}
          </div>
          {V.length === 0 || A.length < 2 ? (
            <div className="notice warn">Primero agregue al menos dos zonas y un vehículo (o cargue los datos de ejemplo desde «Configurar»).</div>
          ) : (
            <form action={saveRates} className="card">
              <input type="hidden" name="season" value={season?.id ?? ""} />
              <div style={{ overflowX: "auto", borderRadius: 28 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ position: "sticky", left: 0, zIndex: 1, background: "var(--paper)" }}>Ruta</th>
                    {V.map((v) => <th key={v.id} className="r">{v.name}<div className="tiny">sin imp. · costo</div></th>)}
                  </tr>
                </thead>
                <tbody>
                  {routes.length === 0 ? (
                    <tr><td colSpan={V.length + 1} className="small" style={{ padding: 20 }}>No hay tarifas {season ? `para ${season.name}` : "base"} todavía. Agregue una ruta abajo.</td></tr>
                  ) : (
                    routes.map((rt) => (
                      <tr key={`${rt.from}|${rt.to}`}>
                        <td style={{ position: "sticky", left: 0, zIndex: 1, background: "var(--paper)" }}><b>{areaName.get(rt.from)}</b> → {areaName.get(rt.to)}</td>
                        {V.map((v) => {
                          const r = rate(rt.from, rt.to, v.id);
                          const price = r?.price ?? "";
                          const cost = r?.net_cost ?? "";
                          const f = final(r?.price);
                          return (
                            <td key={v.id} className="r">
                              <input type="hidden" name={`orig|${rt.from}|${rt.to}|${v.id}`} value={`${price}|${cost}`} />
                              <div className="row" style={{ gap: 4, justifyContent: "flex-end", flexWrap: "nowrap" }}>
                                <input aria-label={`Precio ${v.name}`} name={`price|${rt.from}|${rt.to}|${v.id}`} defaultValue={price} inputMode="decimal" disabled={!canEdit} style={{ width: 74, textAlign: "right", border: "1px solid var(--line-2)", borderRadius: 8, padding: "6px 8px" }} />
                                <input aria-label={`Costo ${v.name}`} name={`cost|${rt.from}|${rt.to}|${v.id}`} defaultValue={cost} inputMode="decimal" disabled={!canEdit} style={{ width: 64, textAlign: "right", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 8px", color: "var(--mute)" }} />
                              </div>
                              <div className="tiny">{f !== null ? `cliente ${formatPrice(f, currency)}` : "a cotizar"}</div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
              {canEdit && routes.length ? (
                <div className="row" style={{ padding: 14, justifyContent: "flex-end" }}>
                  <span className="tiny">Vacío = a cotizar (nunca $0).</span>
                  <button className="btn tint sm" type="submit">Guardar tarifas</button>
                </div>
              ) : null}
            </form>
          )}
          {canEdit && V.length && A.length >= 2 ? (
            <div className="g2">
              <form action={addRoute} className="card pad col" style={{ gap: 10 }}>
                <h3 className="h4">Agregar ruta {season ? `(${season.name})` : ""}</h3>
                <input type="hidden" name="season" value={season?.id ?? ""} />
                <div className="row" style={{ gap: 8 }}>
                  <select name="from" className="input" style={{ flex: 1, minHeight: 44 }} required>{A.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                  <Icon name="arrowRight" />
                  <select name="to" className="input" style={{ flex: 1, minHeight: 44 }} required>{A.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                </div>
                {V.map((v) => (
                  <div key={v.id} className="row" style={{ gap: 8 }}>
                    <span style={{ flex: "1 1 90px" }}>{v.name}</span>
                    <input name={`newprice|${v.id}`} placeholder="Precio sin imp." aria-label={`Precio sin impuestos ${v.name}`} inputMode="decimal" className="input" style={{ flex: "1 1 120px", width: "auto", minHeight: 40 }} />
                    <input name={`newcost|${v.id}`} placeholder="Costo" aria-label={`Costo ${v.name}`} inputMode="decimal" className="input" style={{ flex: "1 1 90px", width: "auto", minHeight: 40 }} />
                  </div>
                ))}
                <div className="row" style={{ gap: 12 }}>
                  <input name="minutes" placeholder="Minutos de viaje" inputMode="numeric" className="input" style={{ flex: "0 1 180px", width: "auto", minHeight: 40 }} />
                  <label className="row" style={{ gap: 6 }}><input type="checkbox" name="both" defaultChecked /> También el regreso</label>
                </div>
                <button className="btn tint sm" type="submit" style={{ alignSelf: "flex-start" }}>Agregar ruta</button>
              </form>
              <form action={saveSeason} className="card pad col" style={{ gap: 10 }}>
                <h3 className="h4">Nueva temporada</h3>
                <p className="tiny">Una temporada tiene sus propios precios. Fuera de ella se usan los de «todo el año».</p>
                <input name="name" placeholder="Temporada alta" className="input" style={{ minHeight: 44 }} required maxLength={60} />
                <div className="row" style={{ gap: 8 }}>
                  <label className="field" style={{ flex: "1 1 150px" }}><span className="lbl">Desde</span><input type="date" name="startsOn" className="input" style={{ minHeight: 44 }} required /></label>
                  <label className="field" style={{ flex: "1 1 150px" }}><span className="lbl">Hasta</span><input type="date" name="endsOn" className="input" style={{ minHeight: 44 }} required /></label>
                </div>
                <button className="btn line sm" type="submit" style={{ alignSelf: "flex-start" }}>Agregar temporada</button>
              </form>
            </div>
          ) : null}
        </>
      ) : null}

      {tab === "zonas" ? (
        <div className="g2">
          <section className="card">
            <div style={{ padding: "16px 18px 4px" }}><h2 className="h4">Zonas</h2><p className="tiny">Los precios se ponen entre zonas. Un aeropuerto es su propia zona.</p></div>
            <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Zona</th><th>Tipo</th><th className="r">Lugares</th><th></th></tr></thead>
              <tbody>
                {A.map((a) => (
                  <tr key={a.id}>
                    <td><b>{a.name}</b>{a.iata ? <span className="tiny"> · {a.iata}</span> : null}</td>
                    <td>{a.kind === "airport" ? "Aeropuerto" : "Zona"}</td>
                    <td className="r">{(places.data ?? []).filter((p) => p.area_id === a.id).length}</td>
                    <td className="r">{canEdit ? <Toggle table="areas" id={a.id} active={a.active} tab="zonas" /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {canEdit ? (
              <form action={saveArea} className="row" style={{ gap: 8, padding: 14, borderTop: "1px solid var(--line)" }}>
                <input name="name" placeholder="Nueva zona" className="input" style={{ flex: "1 1 160px", minHeight: 42 }} required maxLength={80} />
                <select name="kind" className="input" aria-label="Tipo" style={{ flex: "1 1 130px", width: "auto", minHeight: 42 }}><option value="zone">Zona</option><option value="airport">Aeropuerto</option></select>
                <input name="iata" placeholder="IATA" aria-label="Código IATA" maxLength={3} className="input" style={{ flex: "0 1 90px", width: "auto", minHeight: 42 }} />
                <button className="btn tint sm" type="submit">Agregar</button>
              </form>
            ) : null}
          </section>
          <section className="card">
            <div style={{ padding: "16px 18px 4px" }}><h2 className="h4">Lugares</h2><p className="tiny">Lo que su cliente busca: hoteles, pueblos, aeropuertos. Cada lugar pertenece a una zona.</p></div>
            <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Lugar</th><th>Zona</th><th>Tipo</th><th></th></tr></thead>
              <tbody>
                {(places.data ?? []).map((p) => (
                  <tr key={p.id}>
                    <td style={{ whiteSpace: "normal" }}><b>{p.name}</b>{p.aliases?.length ? <div className="tiny">{p.aliases.join(", ")}</div> : null}</td>
                    <td>{areaName.get(p.area_id)}</td>
                    <td>{KIND_PLACE[p.kind] ?? p.kind}</td>
                    <td className="r">{canEdit ? <Toggle table="places" id={p.id} active={p.active} tab="zonas" /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {canEdit && A.length ? (
              <form action={savePlace} className="col" style={{ gap: 8, padding: 14, borderTop: "1px solid var(--line)" }}>
                <div className="row" style={{ gap: 8 }}>
                  <input name="name" placeholder="Hotel o lugar" className="input" style={{ flex: "1 1 180px", minHeight: 42 }} required maxLength={120} />
                  <select name="areaId" className="input" aria-label="Zona" style={{ flex: "1 1 160px", width: "auto", minHeight: 42 }}>{A.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <select name="kind" className="input" aria-label="Tipo" style={{ flex: "1 1 130px", width: "auto", minHeight: 42 }}>{Object.entries(KIND_PLACE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                  <input name="aliases" placeholder="Otros nombres (separados por coma)" className="input" style={{ flex: "2 1 200px", width: "auto", minHeight: 42 }} />
                  <button className="btn tint sm" type="submit">Agregar</button>
                </div>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}

      {tab === "vehiculos" ? (
        <div className="g3">
          {(vehicles.data ?? []).map((v) => (
            // The active toggle is its own form, so it sits outside the vehicle's form (forms cannot nest).
            <div key={v.id} className="card pad col" style={{ gap: 10 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="ico t"><Icon name="car" /></span>
                {canEdit ? <Toggle table="vehicle_classes" id={v.id} active={v.active} tab="vehiculos" /> : null}
              </div>
              <form action={saveVehicle} className="col" style={{ gap: 10 }}>
              <input type="hidden" name="id" value={v.id} />
              <input name="name" defaultValue={v.name} aria-label="Nombre" className="input" style={{ minHeight: 42, fontWeight: 700 }} disabled={!canEdit} />
              <input name="nameEn" defaultValue={v.name_en ?? ""} placeholder="Nombre en inglés" className="input" style={{ minHeight: 40 }} disabled={!canEdit} />
              <div className="row" style={{ gap: 8 }}>
                <label className="col" style={{ gap: 4, flex: 1 }}><span className="lbl">Pasajeros</span><input name="capacityPax" type="number" min={1} max={60} defaultValue={v.capacity_pax} className="input" style={{ minHeight: 40 }} disabled={!canEdit} /></label>
                <label className="col" style={{ gap: 4, flex: 1 }}><span className="lbl">Maletas</span><input name="capacityBags" type="number" min={0} max={80} defaultValue={v.capacity_bags} className="input" style={{ minHeight: 40 }} disabled={!canEdit} /></label>
              </div>
              <input name="description" defaultValue={v.description ?? ""} placeholder="Descripción" className="input" style={{ minHeight: 40 }} disabled={!canEdit} />
              {v.photo_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(v.photo_path) ?? ""} alt="" style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", borderRadius: 14 }} />
              ) : null}
              {canEdit ? (
                <label className="col" style={{ gap: 4 }}>
                  <span className="lbl">{v.photo_path ? "Cambiar foto" : "Foto del vehículo (opcional)"}</span>
                  <input type="file" name="photo" accept="image/png,image/jpeg,image/webp" className="input" style={{ padding: 8 }} />
                </label>
              ) : null}
              {canEdit && v.photo_path ? <label className="row tiny" style={{ gap: 6 }}><input type="checkbox" name="removePhoto" /> Quitar la foto</label> : null}
              {canEdit ? <button className="btn line sm" type="submit" style={{ alignSelf: "flex-start" }}>Guardar</button> : null}
              </form>
            </div>
          ))}
          {canEdit ? (
            <form action={saveVehicle} className="card pad col" style={{ gap: 10, border: "2px dashed var(--line-2)" }}>
              <h3 className="h4">Nuevo vehículo</h3>
              <input name="name" placeholder="Sedán, Van, Minibús…" className="input" style={{ minHeight: 42 }} required />
              <input name="nameEn" placeholder="Nombre en inglés" className="input" style={{ minHeight: 40 }} />
              <div className="row" style={{ gap: 8 }}>
                <input name="capacityPax" type="number" min={1} max={60} placeholder="Pasajeros" className="input" style={{ minHeight: 40, flex: 1 }} required />
                <input name="capacityBags" type="number" min={0} max={80} placeholder="Maletas" className="input" style={{ minHeight: 40, flex: 1 }} />
              </div>
              <label className="col" style={{ gap: 4 }}>
                <span className="lbl">Foto (opcional)</span>
                <input type="file" name="photo" accept="image/png,image/jpeg,image/webp" className="input" style={{ padding: 8 }} />
              </label>
              <button className="btn tint sm" type="submit" style={{ alignSelf: "flex-start" }}>Agregar</button>
            </form>
          ) : null}
        </div>
      ) : null}

      {tab === "extras" ? (
        <div className="g2">
          <section className="card">
            <div style={{ padding: "16px 18px 4px" }}><h2 className="h4">Recargos</h2><p className="tiny">Se suman solos cuando la hora, la fecha o el día coinciden (por ejemplo, de noche).</p></div>
            <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Recargo</th><th>Cuándo</th><th className="r">Monto</th><th></th></tr></thead>
              <tbody>
                {(surcharges.data ?? []).map((x) => (
                  <tr key={x.id}>
                    <td><b>{x.name}</b></td>
                    <td className="tiny" style={{ whiteSpace: "normal" }}>
                      {[x.start_time ? `${String(x.start_time).slice(0, 5)}–${String(x.end_time).slice(0, 5)}` : null, x.date_from ? `desde ${x.date_from}` : null, x.date_to ? `hasta ${x.date_to}` : null, x.weekdays ? `días ${x.weekdays.join(",")}` : null].filter(Boolean).join(" · ")}
                    </td>
                    <td className="r">{formatPrice(Number(x.amount), currency)} <span className="tiny">→ {formatPrice(customerPrice(Number(x.amount), vat, rounding), currency)}</span></td>
                    <td className="r">{canEdit ? <Toggle table="surcharge_rules" id={x.id} active={x.active} tab="extras" /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {canEdit ? (
              <form action={saveSurcharge} className="col" style={{ gap: 8, padding: 14, borderTop: "1px solid var(--line)" }}>
                <div className="row" style={{ gap: 8 }}>
                  <input name="name" placeholder="Recargo nocturno" aria-label="Nombre del recargo" className="input" style={{ flex: "2 1 180px", width: "auto", minHeight: 42 }} required />
                  <input name="amount" placeholder="Monto sin imp." aria-label="Monto sin impuestos" inputMode="decimal" className="input" style={{ flex: "1 1 130px", width: "auto", minHeight: 42 }} required />
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <span className="tiny" style={{ flex: "0 0 52px" }}>Horario</span>
                  <input type="time" name="startTime" aria-label="Desde la hora" className="input" style={{ flex: "1 1 120px", width: "auto", minHeight: 40 }} />
                  <input type="time" name="endTime" aria-label="Hasta la hora" className="input" style={{ flex: "1 1 120px", width: "auto", minHeight: 40 }} />
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <span className="tiny" style={{ flex: "0 0 52px" }}>Fechas</span>
                  <input type="date" name="dateFrom" aria-label="Desde la fecha" className="input" style={{ flex: "1 1 120px", width: "auto", minHeight: 40 }} />
                  <input type="date" name="dateTo" aria-label="Hasta la fecha" className="input" style={{ flex: "1 1 120px", width: "auto", minHeight: 40 }} />
                </div>
                <div className="row" style={{ gap: 10 }}>
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d, i) => <label key={i} className="row tiny" style={{ gap: 4 }}><input type="checkbox" name={`wd${i}`} />{d}</label>)}
                </div>
                <button className="btn tint sm" type="submit" style={{ alignSelf: "flex-start" }}>Agregar recargo</button>
              </form>
            ) : null}
          </section>
          <section className="card">
            <div style={{ padding: "16px 18px 4px" }}><h2 className="h4">Extras</h2><p className="tiny">Lo que el cliente puede agregar a su traslado.</p></div>
            <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Extra</th><th className="r">Precio</th><th className="r">Máx.</th><th></th></tr></thead>
              <tbody>
                {(extras.data ?? []).map((x) => (
                  <tr key={x.id}>
                    <td><b>{x.name}</b>{x.name_en ? <div className="tiny">{x.name_en}</div> : null}</td>
                    <td className="r">{formatPrice(Number(x.price), currency)} <span className="tiny">→ {formatPrice(customerPrice(Number(x.price), vat, rounding), currency)}</span></td>
                    <td className="r">{x.max_qty}</td>
                    <td className="r">{canEdit ? <Toggle table="transfer_extras" id={x.id} active={x.active} tab="extras" /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {canEdit ? (
              <form action={saveExtra} className="row" style={{ gap: 8, padding: 14, borderTop: "1px solid var(--line)" }}>
                <input name="name" placeholder="Silla de bebé" className="input" style={{ flex: "1 1 160px", minHeight: 42 }} required />
                <input name="nameEn" placeholder="En inglés" className="input" style={{ flex: "1 1 120px", width: "auto", minHeight: 42 }} />
                <input name="price" placeholder="Precio" aria-label="Precio sin impuestos" inputMode="decimal" className="input" style={{ flex: "1 1 90px", width: "auto", minHeight: 42 }} required />
                <input name="maxQty" placeholder="Máx." aria-label="Cantidad máxima" type="number" min={1} max={20} className="input" style={{ flex: "0 1 80px", width: "auto", minHeight: 42 }} />
                <button className="btn tint sm" type="submit">Agregar</button>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
