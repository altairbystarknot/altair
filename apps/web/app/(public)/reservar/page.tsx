import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPublicConfig } from "@/lib/config/business-config";
import { mediaUrl } from "@/lib/media";
import { getActivities } from "@/lib/public/catalog";
import { getLocale } from "@/lib/public/locale";
import { STOCK } from "../_site/nav";
import { BookingBackdrop, EngineLogo } from "./_engine/chrome";
import { I } from "./_engine/ui";

export const metadata: Metadata = { title: "Reservar" };

// "What would you like to book?": the door to the two booking flows. A business that sells only one of
// them goes straight to it.
export default async function BookChooserPage() {
  const { config, site } = await getPublicConfig();
  if (!config) return null;
  const locale = await getLocale();
  const en = locale === "en";
  const activities = config.features.activities ? await getActivities() : [];
  const transfers = config.features.transfers;
  const acts = activities.length > 0;
  if (transfers && !acts) redirect("/reservar/traslado");
  if (!transfers && acts) redirect("/actividades");

  const actPhoto = mediaUrl(activities[0]?.coverPath ?? activities[0]?.photos[0]) || STOCK.sunset;
  const choices = [
    ...(transfers ? [{ href: "/reservar/traslado", img: STOCK.transfer, chip: en ? "Private transfer" : "Traslado privado", title: en ? "A private transfer" : "Un traslado privado", text: en ? "Airports, hotels and any address. Choose your route and vehicle and see the final price before you book." : "Aeropuertos, hoteles y cualquier dirección. Elija la ruta y el vehículo y vea el precio final antes de reservar.", cta: en ? "Book a transfer" : "Reservar traslado" }] : []),
    ...(acts ? [{ href: "/actividades", img: actPhoto, chip: en ? "Activities" : "Actividades", title: en ? "An activity or tour" : "Una actividad o tour", text: en ? "Choose an experience, the date and the time. Add hotel pick-up where it is offered." : "Elija una experiencia, la fecha y el horario. Agregue recogida en su hotel donde se ofrece.", cta: en ? "See activities" : "Ver actividades" }] : []),
  ];

  return (
    <main id="main-content" className="be-page">
      <BookingBackdrop image={mediaUrl(site.heroPath) || STOCK.hero} />
      <header className="be-top">
        <a href="/" className="be-top__logo" aria-label={en ? "Home" : "Inicio"}><EngineLogo name={config.name} logoUrl={mediaUrl(site.logoPath)} /></a>
        <span />
        <div className="be-top__end" aria-hidden="true" />
      </header>
      <div className="be-choose">
        <div className="be-step-head be-step-head--center">
          <p className="be-eyebrow">{en ? "Online booking" : "Reservas en línea"}</p>
          <h1 className="be-title">{en ? "What would you like to " : "¿Qué desea "}<em>{en ? "book?" : "reservar?"}</em></h1>
          <p className="be-lead">{en ? "You see the final price, taxes included, before sending anything." : "Verá el precio final, con impuestos incluidos, antes de enviar nada."}</p>
        </div>
        <div className="be-cards be-cards--choose">
          {choices.map((c) => (
            <a key={c.href} href={c.href} className="be-card">
              <span className="be-card__media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt="" />
                <span className="be-card__badges"><span className="be-badge be-badge--light">{c.chip}</span></span>
              </span>
              <span className="be-card__body">
                <span className="be-card__name">{c.title}</span>
                <span className="be-card__desc">{c.text}</span>
              </span>
              <span className="be-card__foot">
                <span />
                <span className="be-pill-select">{c.cta}{I.arrowRight()}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
