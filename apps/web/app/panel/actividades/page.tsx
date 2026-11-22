import Link from "next/link";
import { customerPrice, formatPrice } from "@altair/core";
import { Icon } from "@altair/ui";
import { getPublicConfig } from "@/lib/config/business-config";
import { mediaUrl } from "@/lib/media";
import { panelSession } from "@/lib/panel/context";
import { PageHeader } from "../page-header";

export const metadata = { title: "Actividades" };

export default async function ActivitiesAdminPage() {
  const { sb, staff } = await panelSession();
  const { config } = await getPublicConfig();
  const canEdit = staff.role === "owner" || staff.role === "admin";
  const [acts, scheds] = await Promise.all([
    sb.from("activities").select("id, slug, title, category, price_adult, booking_mode, active, cover_path, areas!activities_area_id_fkey(name)").order("sort").order("title"),
    sb.from("activity_schedules").select("activity_id, start_time"),
  ]);
  return (
    <>
      <PageHeader
        title="Actividades"
        subtitle="Sus tours: fotos, precios por adulto y niño, horarios con cupo y recogida por zona."
        actions={canEdit ? <Link className="btn tint sm" href="/panel/actividades/nueva"><Icon name="plus" size={16} /> Nueva actividad</Link> : null}
      />
      {(acts.data ?? []).length === 0 ? (
        <div className="card pad-l small">Todavía no hay actividades. Cree una, importe un Excel o pídasela a su Claude.</div>
      ) : (
        <div className="g3">
          {(acts.data ?? []).map((a) => {
            const img = mediaUrl(a.cover_path);
            const times = (scheds.data ?? []).filter((s) => s.activity_id === a.id).map((s) => String(s.start_time).slice(0, 5)).sort();
            return (
              <Link key={a.id} href={`/panel/actividades/${a.id}`} className="card" style={{ overflow: "hidden", opacity: a.active ? 1 : 0.55 }}>
                <div className="ph-img" style={{ height: 150, borderRadius: 0 }}>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" />
                  ) : null}
                </div>
                <div className="col" style={{ gap: 6, padding: 16 }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <b>{a.title}</b>
                    <span className={`st ${a.active ? "ok" : "mute"}`}>{a.active ? "Visible" : "Oculta"}</span>
                  </div>
                  <span className="tiny">{[(a.areas as unknown as { name: string } | null)?.name, a.category, times.join(" · ")].filter(Boolean).join(" · ") || "Sin horarios"}</span>
                  <span className="small">
                    {a.price_adult !== null ? `${formatPrice(customerPrice(Number(a.price_adult), config?.vatRate ?? 0, config?.rounding ?? "whole_up"), config?.currency ?? "USD")} adulto` : "A cotizar"}
                    {a.booking_mode === "request" ? " · bajo solicitud" : ""}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
