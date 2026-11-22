import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@altair/ui";
import { mediaUrl } from "@/lib/media";
import { panelSession } from "@/lib/panel/context";
import { Flash, PageHeader } from "../../page-header";
import { blockDate, saveActivity, toggleActivity, unblockDate } from "../actions";

export const metadata = { title: "Actividad" };

const OK: Record<string, string> = { guardado: "Guardado. Ya se ve en su sitio.", estado: "Visibilidad actualizada.", bloqueo: "Fecha actualizada.", desbloqueo: "Fecha reabierta." };

// Spanish/English pairs side by side: at most two columns, one on phones.
const PAIRS = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, max(260px, calc((100% - 20px) / 2))), 1fr))", gap: 20 } as const;

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="lbl">{label}</span>
      {children}
      {hint ? <span className="tiny">{hint}</span> : null}
    </label>
  );
}

export default async function ActivityEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { sb, staff } = await panelSession();
  const canEdit = staff.role === "owner" || staff.role === "admin";
  const isNew = id === "nueva";
  const [{ data: a }, areas, scheds, pickups, blocks] = await Promise.all([
    isNew ? Promise.resolve({ data: null }) : sb.from("activities").select("*").eq("id", id).maybeSingle(),
    sb.from("areas").select("id, name").eq("active", true).order("name"),
    isNew ? Promise.resolve({ data: [] }) : sb.from("activity_schedules").select("*").eq("activity_id", id).order("start_time"),
    isNew ? Promise.resolve({ data: [] }) : sb.from("activity_pickup_areas").select("*").eq("activity_id", id),
    isNew ? Promise.resolve({ data: [] }) : sb.from("activity_blocks").select("*").eq("activity_id", id).order("on_date"),
  ]);
  if (!isNew && !a) notFound();
  const pick = new Map((pickups.data ?? []).map((p: { area_id: string; fee: number }) => [p.area_id, p.fee]));
  const schedText = (scheds.data ?? [])
    .map((x: { start_time: string; capacity: number; weekdays: number[] }) => `${String(x.start_time).slice(0, 5)} ${x.capacity}${x.weekdays.length < 7 ? ` ${x.weekdays.join(",")}` : ""}`)
    .join("\n");
  const cover = mediaUrl(a?.cover_path);
  const input = { className: "input", style: { minHeight: 44 }, disabled: !canEdit } as const;

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/panel/actividades"><Icon name="chevronLeft" size={14} /> Actividades</Link>}
        title={isNew ? "Nueva actividad" : a!.title}
        actions={
          !isNew ? (
            <>
              <a className="btn line sm" href={`/actividades/${a!.slug}`} target="_blank" rel="noopener"><Icon name="external" size={15} /> Ver en el sitio</a>
              {canEdit ? (
                <form action={toggleActivity}><input type="hidden" name="id" value={a!.id} /><button className="btn line sm" type="submit">{a!.active ? "Ocultar" : "Mostrar"}</button></form>
              ) : null}
            </>
          ) : null
        }
      />
      <Flash ok={sp.ok ? (OK[sp.ok] ?? "Guardado.") : null} error={sp.error ? (sp.error.length > 12 ? sp.error : "Revise los datos.") : null} />

      <form action={saveActivity} className="col" style={{ gap: 18 }}>
        <input type="hidden" name="id" value={a?.id ?? ""} />
        <section className="card pad-l col" style={{ gap: 14 }}>
          <h2 className="h4">Lo que ve su cliente</h2>
          <div style={PAIRS}>
            <Field label="Título"><input name="title" required maxLength={120} defaultValue={a?.title ?? ""} {...input} /></Field>
            <Field label="Título en inglés"><input name="titleEn" maxLength={120} defaultValue={a?.title_en ?? ""} {...input} /></Field>
            <Field label="Resumen (una línea)"><input name="summary" maxLength={300} defaultValue={a?.summary ?? ""} {...input} /></Field>
            <Field label="Resumen en inglés"><input name="summaryEn" maxLength={300} defaultValue={a?.summary_en ?? ""} {...input} /></Field>
          </div>
          <div style={PAIRS}>
            <Field label="Descripción"><textarea name="description" rows={5} maxLength={4000} defaultValue={a?.description ?? ""} className="input area" disabled={!canEdit} /></Field>
            <Field label="Descripción en inglés"><textarea name="descriptionEn" rows={5} maxLength={4000} defaultValue={a?.description_en ?? ""} className="input area" disabled={!canEdit} /></Field>
            <Field label="Incluye (una por línea)"><textarea name="includes" rows={4} defaultValue={(a?.includes ?? []).join("\n")} className="input area" disabled={!canEdit} /></Field>
            <Field label="Qué llevar (una por línea)"><textarea name="bring" rows={4} defaultValue={(a?.bring ?? []).join("\n")} className="input area" disabled={!canEdit} /></Field>
          </div>
          <div className="row" style={{ gap: 16, alignItems: "flex-end" }}>
            <div style={{ width: 180, height: 110, borderRadius: 16, overflow: "hidden", background: "var(--mist)" }}>
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : null}
            </div>
            <Field label="Foto de portada" hint="JPG, PNG o WebP, hasta 8 MB."><input type="file" name="cover" accept="image/png,image/jpeg,image/webp" className="input" style={{ padding: 10 }} disabled={!canEdit} /></Field>
          </div>
        </section>

        <section className="card pad-l col" style={{ gap: 14 }}>
          <h2 className="h4">Precio, grupo y confirmación</h2>
          <div className="g4">
            <Field label="Adulto (sin imp.)" hint="Vacío = a cotizar"><input name="priceAdult" inputMode="decimal" defaultValue={a?.price_adult ?? ""} {...input} /></Field>
            <Field label="Niño (sin imp.)" hint="Vacío = precio adulto"><input name="priceChild" inputMode="decimal" defaultValue={a?.price_child ?? ""} {...input} /></Field>
            <Field label="Costo del operador"><input name="netCost" inputMode="decimal" defaultValue={a?.net_cost_adult ?? ""} {...input} /></Field>
            <Field label="Duración (minutos)"><input name="duration" inputMode="numeric" defaultValue={a?.duration_minutes ?? ""} {...input} /></Field>
            <Field label="Niño desde (años)"><input name="childMin" type="number" min={0} max={17} defaultValue={a?.child_min_age ?? 4} {...input} /></Field>
            <Field label="Niño hasta (años)"><input name="childMax" type="number" min={0} max={17} defaultValue={a?.child_max_age ?? 11} {...input} /></Field>
            <Field label="Mínimo de personas"><input name="minPax" type="number" min={1} max={100} defaultValue={a?.min_pax ?? 1} {...input} /></Field>
            <Field label="Máximo por reserva"><input name="maxPax" type="number" min={1} max={200} defaultValue={a?.max_pax ?? 20} {...input} /></Field>
          </div>
          <div className="g3">
            <Field label="Confirmación">
              <select name="bookingMode" defaultValue={a?.booking_mode ?? "instant"} {...input}>
                <option value="instant">Inmediata (hay cupo, queda reservada)</option>
                <option value="request">Bajo solicitud (usted confirma)</option>
              </select>
            </Field>
            <Field label="Zona">
              <select name="areaId" defaultValue={a?.area_id ?? ""} {...input}>
                <option value="">—</option>
                {(areas.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </Field>
            <Field label="Categoría"><input name="category" maxLength={40} placeholder="Naturaleza, Mar, Aventura…" defaultValue={a?.category ?? ""} {...input} /></Field>
          </div>
          <Field label="Punto de encuentro"><input name="meetingPoint" maxLength={200} defaultValue={a?.meeting_point ?? ""} {...input} /></Field>
        </section>

        <section className="card pad-l col" style={{ gap: 14 }}>
          <h2 className="h4">Salidas y recogida</h2>
          <Field label="Horarios: uno por línea, «hora cupo [días]»" hint="Ej.: «08:00 12» todos los días · «13:00 10 1,2,3,4,5» de lunes a viernes (0 = domingo).">
            <textarea name="schedules" rows={4} defaultValue={schedText} className="input area mono" disabled={!canEdit} placeholder={"08:00 12\n13:00 12 1,2,3,4,5"} />
          </Field>
          <Field label="Recogida">
            <select name="pickupMode" defaultValue={a?.pickup_mode ?? "none"} {...input}>
              <option value="none">Sin recogida (punto de encuentro)</option>
              <option value="included">Recogida incluida</option>
              <option value="by_area">Recogida por zona (con cargo por zona)</option>
            </select>
          </Field>
          <div className="g3">
            {(areas.data ?? []).map((ar) => (
              <div key={ar.id} className="panel row" style={{ gap: 8, padding: 10 }}>
                <label className="row" style={{ gap: 8, flex: 1 }}><input type="checkbox" name={`pickup|${ar.id}`} defaultChecked={pick.has(ar.id)} disabled={!canEdit} /> {ar.name}</label>
                <input name={`fee|${ar.id}`} defaultValue={pick.get(ar.id) ?? ""} placeholder="Cargo" inputMode="decimal" style={{ width: 70, border: "1px solid var(--line-2)", borderRadius: 8, padding: "6px 8px" }} disabled={!canEdit} />
              </div>
            ))}
          </div>
        </section>

        {canEdit ? <button className="btn tint lg" type="submit" style={{ alignSelf: "flex-start" }}>Guardar actividad</button> : null}
      </form>

      {!isNew && canEdit ? (
        <section className="card pad-l col" style={{ gap: 12 }}>
          <h2 className="h4">Cerrar o limitar una fecha</h2>
          <p className="tiny">Por clima, feriado o grupo privado. Cupo vacío = cerrado.</p>
          <form action={blockDate} className="row" style={{ gap: 8 }}>
            <input type="hidden" name="id" value={a!.id} />
            <input type="date" name="date" required aria-label="Fecha" className="input" style={{ flex: "1 1 150px", width: "auto", minHeight: 42 }} />
            <input type="time" name="time" aria-label="Hora (vacío = todo el día)" className="input" style={{ flex: "1 1 120px", width: "auto", minHeight: 42 }} title="Vacío = todo el día" />
            <input name="capacity" placeholder="Cupo" aria-label="Cupo" inputMode="numeric" className="input" style={{ flex: "0 1 100px", width: "auto", minHeight: 42 }} />
            <input name="note" placeholder="Motivo" aria-label="Motivo" className="input" style={{ flex: "2 1 180px", width: "auto", minHeight: 42 }} />
            <button className="btn line sm" type="submit">Guardar</button>
          </form>
          {(blocks.data ?? []).map((b: { id: string; on_date: string; start_time: string | null; capacity: number | null; note: string | null }) => (
            <form key={b.id} action={unblockDate} className="panel row" style={{ gap: 10, justifyContent: "space-between" }}>
              <input type="hidden" name="id" value={a!.id} />
              <input type="hidden" name="block" value={b.id} />
              <span><b>{b.on_date}</b> {b.start_time ? String(b.start_time).slice(0, 5) : "todo el día"} · {b.capacity === null || b.capacity === 0 ? "cerrado" : `cupo ${b.capacity}`} {b.note ? `· ${b.note}` : ""}</span>
              <button className="btn ghost sm" type="submit">Reabrir</button>
            </form>
          ))}
        </section>
      ) : null}
    </>
  );
}
