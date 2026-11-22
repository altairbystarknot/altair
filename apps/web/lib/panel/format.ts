import { formatCurrency } from "@altair/core";

export function money(cents: number | null | undefined, currency: string): string {
  return formatCurrency((cents ?? 0) / 100, currency);
}

export function dateLabel(dateISO: string | null | undefined): string {
  if (!dateISO) return "";
  const [y, m, d] = dateISO.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("es-CR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y!, m! - 1, d!)));
}

export function dateTimeLabel(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-CR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(iso));
}

export const LINE_STATUS: Record<string, { label: string; tone: "ok" | "warn" | "bad" | "info" | "gold" | "mute" }> = {
  pending: { label: "Por asignar", tone: "warn" },
  assigned: { label: "Asignado", tone: "info" },
  confirmed: { label: "Confirmado", tone: "ok" },
  done: { label: "Hecho", tone: "mute" },
  no_show: { label: "No se presentó", tone: "bad" },
  cancelled: { label: "Cancelado", tone: "bad" },
};

export const BOOKING_STATUS: Record<string, { label: string; tone: "ok" | "warn" | "bad" | "info" | "gold" | "mute" }> = {
  received: { label: "Recibida", tone: "info" },
  confirmed: { label: "Confirmada", tone: "ok" },
  cancelled: { label: "Cancelada", tone: "bad" },
  completed: { label: "Completada", tone: "mute" },
};

export const PAYMENT_METHODS: Record<string, string> = {
  sinpe: "SINPE Móvil",
  transfer: "Transferencia",
  cash: "Efectivo",
  card_terminal: "Datáfono",
  paypal: "PayPal",
  other: "Otro",
};

export function waLink(phone: string | null | undefined, text: string): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 7) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
