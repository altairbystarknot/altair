import { Icon } from "@altair/ui";
import { CAN, panelSessionFor } from "@/lib/panel/context";
import { waLink } from "@/lib/panel/format";
import { Flash, PageHeader } from "../page-header";
import { saveSupplier, toggleSupplier } from "./actions";

export const metadata = { title: "Proveedores" };

const KIND: Record<string, string> = { transport: "Transporte", activity: "Actividades", guide: "Guía", other: "Otro" };

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { sb } = await panelSessionFor(CAN.ops);
  const { data } = await sb.from("suppliers").select("*").order("active", { ascending: false }).order("name");
  return (
    <>
      <PageHeader title="Proveedores" subtitle="Empresas de transporte, operadores de tours y guías a quienes asigna servicios." />
      <Flash ok={sp.ok ? "Guardado." : null} error={sp.error ? "Revise los datos (el nombre no puede repetirse)." : null} />
      <div className="g3">
        {(data ?? []).map((s) => {
          const wa = waLink(s.whatsapp ?? s.phone, `Hola ${s.contact_name ?? s.name}`);
          return (
            <form key={s.id} action={saveSupplier} className="card pad col" style={{ gap: 8, opacity: s.active ? 1 : 0.55 }}>
              <input type="hidden" name="id" value={s.id} />
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="st info">{KIND[s.kind] ?? s.kind}</span>
                {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="btn ghost sm" aria-label="WhatsApp"><Icon name="message" size={16} /></a> : null}
              </div>
              <input name="name" defaultValue={s.name} aria-label="Nombre" className="input" style={{ minHeight: 42, fontWeight: 700 }} required />
              <select name="kind" aria-label="Tipo" defaultValue={s.kind} className="input" style={{ minHeight: 40 }}>{Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              <input name="contactName" defaultValue={s.contact_name ?? ""} placeholder="Contacto" aria-label="Contacto" className="input" style={{ minHeight: 40 }} />
              <input name="whatsapp" defaultValue={s.whatsapp ?? ""} placeholder="WhatsApp" aria-label="WhatsApp" className="input" style={{ minHeight: 40 }} />
              <input name="email" defaultValue={s.email ?? ""} placeholder="Correo" aria-label="Correo" className="input" style={{ minHeight: 40 }} />
              <input name="notes" defaultValue={s.notes ?? ""} placeholder="Notas" aria-label="Notas" className="input" style={{ minHeight: 40 }} />
              <div className="row" style={{ justifyContent: "space-between" }}>
                <button className="btn line sm" type="submit">Guardar</button>
                <button className="btn ghost sm" type="submit" formAction={toggleSupplier}>{s.active ? "Desactivar" : "Activar"}</button>
              </div>
            </form>
          );
        })}
        <form action={saveSupplier} className="card pad col" style={{ gap: 8, border: "2px dashed var(--line-2)" }}>
          <h2 className="h4">Nuevo proveedor</h2>
          <input name="name" placeholder="Nombre" className="input" style={{ minHeight: 42 }} required />
          <select name="kind" aria-label="Tipo" className="input" style={{ minHeight: 40 }}>{Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <input name="contactName" placeholder="Contacto" aria-label="Contacto" className="input" style={{ minHeight: 40 }} />
          <input name="whatsapp" placeholder="WhatsApp (+506…)" aria-label="WhatsApp" className="input" style={{ minHeight: 40 }} />
          <input name="email" placeholder="Correo" aria-label="Correo" className="input" style={{ minHeight: 40 }} />
          <button className="btn tint sm" type="submit" style={{ alignSelf: "flex-start" }}>Agregar</button>
        </form>
      </div>
    </>
  );
}
