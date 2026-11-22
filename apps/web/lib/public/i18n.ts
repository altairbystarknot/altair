// Public-site copy in Spanish and English. Business texts (names, descriptions) come from the database;
// these are the interface words around them.

export type SiteLocale = "es" | "en";

const es = {
  transfers: "Transporte privado",
  activities: "Actividades",
  total: "Total",
  quoteHelp: "No tenemos precio publicado para este trayecto. Envíelo de todos modos y le respondemos con el precio.",
  requestMode: "Sujeto a confirmación del operador",
  yourBooking: "Su reserva",
  emptyCart: "Todavía no ha agregado nada.",
  remove: "Quitar",
  fullName: "Nombre completo",
  email: "Correo",
  phone: "WhatsApp o teléfono",
  country: "País",
  notes: "Comentarios",
  acceptTerms: "Acepto las condiciones de reserva y cancelación del negocio.",
  send: "Enviar reserva",
  sending: "Enviando…",
  payLater: "No se cobra nada ahora. El negocio confirma su reserva y le indica cómo pagar.",
  pricesChanged: "Algunos precios o cupos cambiaron. Revise su reserva antes de enviarla.",
  soldOutError: "Una de las salidas se llenó mientras reservaba. Elija otra hora.",
  genericError: "No pudimos enviar su reserva. Intente de nuevo en un momento.",
  received: "¡Reserva recibida!",
  receivedHelp: "Le enviamos un correo con este resumen. Guarde este enlace para ver su reserva.",
  code: "Código",
  statusLabels: { received: "Recibida", confirmed: "Confirmada", cancelled: "Cancelada", completed: "Completada" } as Record<string, string>,
  howToPay: "Cómo pagar",
  paid: "Pagado",
  pending: "Pendiente",
  quoteLine: "Precio a confirmar",
  notFound: "No encontramos esa reserva. Revise el enlace de su correo.",
  writeUs: "Escríbanos por WhatsApp",
  people: "personas",
};

export type Dict = typeof es;

const en: Dict = {
  ...es,
  transfers: "Private transfers",
  activities: "Activities",
  total: "Total",
  quoteHelp: "We have no published price for this route. Send it anyway and we will reply with a price.",
  requestMode: "Subject to operator confirmation",
  yourBooking: "Your booking",
  emptyCart: "You have not added anything yet.",
  remove: "Remove",
  fullName: "Full name",
  email: "Email",
  phone: "WhatsApp or phone",
  country: "Country",
  notes: "Comments",
  acceptTerms: "I accept the business's booking and cancellation terms.",
  send: "Send booking",
  sending: "Sending…",
  payLater: "Nothing is charged now. The business confirms your booking and tells you how to pay.",
  pricesChanged: "Some prices or seats changed. Check your booking before sending it.",
  soldOutError: "One of the departures filled up while you were booking. Pick another time.",
  genericError: "We could not send your booking. Please try again in a moment.",
  received: "Booking received!",
  receivedHelp: "We emailed you this summary. Keep this link to see your booking.",
  code: "Code",
  statusLabels: { received: "Received", confirmed: "Confirmed", cancelled: "Cancelled", completed: "Completed" },
  howToPay: "How to pay",
  paid: "Paid",
  pending: "Pending",
  quoteLine: "Price to be confirmed",
  notFound: "We could not find that booking. Check the link in your email.",
  writeUs: "Message us on WhatsApp",
  people: "people",
};

export function dict(locale: SiteLocale): Dict {
  return locale === "en" ? en : es;
}

export function formatDateLong(dateISO: string, locale: SiteLocale): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CR", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(dt);
}
