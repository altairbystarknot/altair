import "server-only";
import { pickText, type SiteSettings } from "@altair/config";
import type { BusinessConfig } from "@altair/config";

// The site's questions: the owner's own list when there is one; otherwise a short default list built ONLY
// from facts the system knows (how booking works, taxes, payments mode). No invented policies.

export type Faq = { q: string; a: string };

export function siteFaq(config: BusinessConfig, site: SiteSettings, locale: string, howToPay: string): Faq[] {
  if (site.faq.length) return site.faq.map((f) => ({ q: pickText(f.q, locale, ""), a: pickText(f.a, locale, "") })).filter((f) => f.q && f.a);
  const en = locale === "en";
  const contact = [config.contactWhatsapp ? "WhatsApp" : null, config.contactEmail ? (en ? "email" : "correo") : null].filter(Boolean).join(en ? " or " : " o ");
  const list: Faq[] = [
    {
      q: en ? "How do I book?" : "¿Cómo reservo?",
      a: en
        ? "Choose your transfer or activity, check the final price and send us your details. You get a booking code right away."
        : "Elija su traslado o actividad, revise el precio final y envíenos sus datos. Recibirá un código de reserva al instante.",
    },
    {
      q: en ? "Do prices include taxes?" : "¿Los precios incluyen impuestos?",
      a: en ? "Yes. Every price you see already includes taxes." : "Sí. Todos los precios que ve ya incluyen impuestos.",
    },
    {
      q: en ? "How do I pay?" : "¿Cómo pago?",
      a:
        config.paymentsMode === "stripe"
          ? en
            ? "You pay online by card on a secure payment page when you send your booking."
            : "Paga en línea con tarjeta, en una página de pago segura, al enviar su reserva."
          : howToPay ||
            (en
              ? `Nothing is charged when you book. ${config.name} confirms your booking and tells you how to pay.`
              : `No se cobra nada al reservar. ${config.name} confirma su reserva y le indica cómo pagar.`),
    },
  ];
  if (config.features.transfers) {
    list.push(
      {
        q: en ? "What does a private transfer include?" : "¿Qué incluye un traslado privado?",
        a: en
          ? "The vehicle and the driver are just for your group, with the luggage you tell us about when you book."
          : "El vehículo y el conductor son solo para su grupo, con el equipaje que nos indique al reservar.",
      },
      {
        q: en ? "Can I book a place that is not on the list?" : "¿Puedo reservar un lugar que no aparece en la lista?",
        a: en
          ? "Yes. Search any hotel or address on the map, or type it. If it is outside our zones, you send it as a request and we reply with the price."
          : "Sí. Busque cualquier hotel o dirección en el mapa, o escríbala. Si queda fuera de nuestras zonas, envíela como solicitud y le respondemos con el precio.",
      },
    );
  }
  if (contact) {
    list.push({
      q: en ? "How do I change or cancel a booking?" : "¿Cómo cambio o cancelo una reserva?",
      a: en ? `Message us by ${contact} with your booking code and we will help you.` : `Escríbanos por ${contact} con su código de reserva y con gusto le ayudamos.`,
    });
  }
  return list;
}
