import "server-only";
import { isPastServiceDate } from "@altair/core";
import {
  linePayload,
  quoteActivity,
  quoteTransfer,
  resolveEnd,
  type BookingLinePayload,
  type MoneyRules,
  type TransferCatalog,
} from "@altair/engine";
import type { CartItem, PricedItem } from "@/lib/public/cart-types";
import type { PublicActivity } from "@/lib/public/catalog";

// THE SERVER'S PRICE. Every cart item is priced again here from the database catalog, with the same engine
// the browser used for display. Only this result is ever stored.

export type ServerLine = { display: PricedItem; payload: BookingLinePayload | null };

function pick(locale: string, es: string | null | undefined, en: string | null | undefined): string {
  return (locale === "en" ? en || es : es || en) ?? "";
}

export function priceItems(
  items: CartItem[],
  ctx: { catalog: TransferCatalog; activities: PublicActivity[]; money: MoneyRules; timezone: string; locale: string },
): ServerLine[] {
  const en = ctx.locale === "en";
  return items.map((item): ServerLine => {
    const fail = (title: string, error: string, editHref: string | null = null): ServerLine => ({
      display: { key: item.key, kind: item.kind, title, subtitle: "", date: item.date, time: item.time, status: "quote", components: [], total: null, error, editHref },
      payload: null,
    });
    if (isPastServiceDate(item.date, ctx.timezone)) return fail(item.kind === "transfer" ? (en ? "Transfer" : "Traslado") : en ? "Activity" : "Actividad", "past_date");

    try {
      if (item.kind === "transfer") {
        const q = quoteTransfer(
          ctx.catalog,
          { from: item.from, to: item.to, date: item.date, time: item.time, adults: item.adults, children: item.children, infants: item.infants, bags: item.bags, extras: item.extras },
          ctx.money,
        );
        const opt = q.options.find((o) => o.vehicleClassId === item.vehicleClassId);
        const title = `${q.from.label} → ${q.to.label}`;
        if (!opt) return fail(title, "vehicle_unavailable", "/reservar/traslado");
        const vehicle = pick(ctx.locale, opt.vehicleName, opt.vehicleNameEn);
        const pax = item.adults + item.children + item.infants;
        return {
          display: {
            key: item.key,
            kind: "transfer",
            title,
            subtitle: `${vehicle} · ${pax} ${en ? (pax === 1 ? "passenger" : "passengers") : pax === 1 ? "pasajero" : "pasajeros"}`,
            date: item.date,
            time: item.time,
            status: opt.status,
            components: opt.components.map((c) => ({ label: pick(ctx.locale, c.label, c.labelEn), qty: c.qty, unit: c.unit, total: c.total })),
            total: opt.total,
            error: null,
            editHref: `/reservar/traslado?edit=${encodeURIComponent(item.key)}`,
          },
          payload: linePayload({
            kind: "transfer",
            title: `${title} (${opt.vehicleName})`,
            date: item.date,
            time: item.time,
            adults: item.adults,
            children: item.children,
            infants: item.infants,
            priced: opt,
            details: {
              from: q.from.label,
              from_area: q.from.areaName,
              from_point: q.from.placeId ? null : { lat: q.from.lat, lng: q.from.lng },
              to: q.to.label,
              to_area: q.to.areaName,
              to_point: q.to.placeId ? null : { lat: q.to.lat, lng: q.to.lng },
              vehicle: opt.vehicleName,
              vehicle_class_id: opt.vehicleClassId,
              bags: item.bags ?? null,
              child_ages: item.childAges,
              flight: item.flight || null,
              note: item.note || null,
              season: opt.seasonName,
            },
          }),
        };
      }

      const act = ctx.activities.find((a) => a.id === item.activityId);
      if (!act) return fail(en ? "Activity" : "Actividad", "activity_unavailable");
      const title = pick(ctx.locale, act.title, act.titleEn);
      // Pickup: the zone that covers the customer's hotel decides the fee (outside the list = quote).
      const pickupEnd = item.pickup ? resolveEnd(item.pickup, ctx.catalog.areas, ctx.catalog.places) : null;
      const pickupAreaId = act.pickupMode === "by_area" && item.pickup ? (pickupEnd?.areaId ?? "outside") : null;
      const q = quoteActivity(
        act,
        { activityId: act.id, date: item.date, time: item.time, adults: item.adults, children: item.children, infants: item.infants, pickupAreaId },
        ctx.money,
      );
      const people = item.adults + item.children + item.infants;
      const pickupText = pickupEnd ? ` · ${en ? "pickup" : "recogida"}: ${pickupEnd.label}` : "";
      return {
        display: {
          key: item.key,
          kind: "activity",
          title,
          subtitle: `${people} ${en ? (people === 1 ? "person" : "people") : people === 1 ? "persona" : "personas"}${pickupText}`,
          date: item.date,
          time: item.time,
          status: q.status,
          components: q.components.map((c) => ({ label: pick(ctx.locale, c.label, c.labelEn), qty: c.qty, unit: c.unit, total: c.total })),
          total: q.total,
          error: null,
          editHref: `/actividades/${act.slug}?edit=${encodeURIComponent(item.key)}#reservar`,
        },
        payload: linePayload({
          kind: "activity",
          title: act.title,
          date: item.date,
          time: item.time,
          adults: item.adults,
          children: item.children,
          infants: item.infants,
          activityId: act.id,
          priced: q,
          details: {
            activity_slug: act.slug,
            pickup: pickupEnd?.label ?? null,
            pickup_area: pickupEnd?.areaName ?? null,
            pickup_point: pickupEnd && !pickupEnd.placeId ? { lat: pickupEnd.lat, lng: pickupEnd.lng } : null,
            child_ages: item.childAges,
            note: item.note || null,
            booking_mode: act.bookingMode,
            meeting_point: act.meetingPoint,
          },
        }),
      };
    } catch (e) {
      return fail(item.kind === "transfer" ? (en ? "Transfer" : "Traslado") : en ? "Activity" : "Actividad", e instanceof Error ? e.message : "invalid");
    }
  });
}
