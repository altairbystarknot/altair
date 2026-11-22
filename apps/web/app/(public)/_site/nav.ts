import type { MenuGroup } from "./ui/Menu";

type Features = { transfers: boolean; activities: boolean };
export type SiteNav = {
  left: Array<{ href: string; label: string }>;
  right: Array<{ href: string; label: string }>;
  groups: MenuGroup[];
  labels: { home: string; transfers: string; activities: string; about: string; faq: string; contact: string; services: string; bookNow: string; explore: string; menu: string; close: string; nav: string; menuLabel: string; language: string };
};

/** The site's links, built from what the business offers (the bar, the hero's bar and the glass menu share them). */
export function siteNav(features: Features, en: boolean): SiteNav {
  const labels = en
    ? { home: "Home", transfers: "Transfers", activities: "Activities", about: "About us", faq: "FAQ", contact: "Contact", services: "Book", bookNow: "Book now", explore: "Explore", menu: "Menu", close: "Close", nav: "Main", menuLabel: "Site menu", language: "Language" }
    : { home: "Inicio", transfers: "Traslados", activities: "Actividades", about: "Nosotros", faq: "Preguntas", contact: "Contacto", services: "Reservar", bookNow: "Reservar", explore: "Explorar", menu: "Menú", close: "Cerrar", nav: "Principal", menuLabel: "Menú del sitio", language: "Idioma" };
  const left = [
    ...(features.transfers ? [{ href: "/traslados", label: labels.transfers }] : []),
    ...(features.activities ? [{ href: "/actividades", label: labels.activities }] : []),
  ];
  const right = [
    { href: "/nosotros", label: labels.about },
    { href: "/contacto", label: labels.contact },
  ];
  const groups: MenuGroup[] = [
    { heading: labels.explore, links: [{ href: "/", label: labels.home }, ...left, ...right, { href: "/preguntas", label: labels.faq }] },
    {
      heading: labels.services,
      links: [
        ...(features.transfers ? [{ href: "/reservar/traslado", label: en ? "Book a private transfer" : "Reservar un traslado privado" }] : []),
        ...(features.activities ? [{ href: "/actividades", label: en ? "Book an activity" : "Reservar una actividad" }] : []),
      ],
    },
  ];
  return { left, right, groups, labels };
}

/** The app's own stock photographs (used until the business uploads its own). */
export const STOCK = {
  hero: "/stock/hero.jpg", road: "/stock/road.jpg", transfer: "/stock/transfer.jpg", about: "/stock/about.jpg", airport: "/stock/airport.jpg",
  sunset: "/stock/sunset-beach.jpg", sedan: "/stock/sedan.jpg", van: "/stock/van.jpg", minibus: "/stock/minibus.jpg",
} as const;

/** A vehicle without its own photo gets the stock one closest to its size. */
export function stockVehicle(capacityPax: number): string {
  return capacityPax <= 4 ? STOCK.sedan : capacityPax <= 10 ? STOCK.van : STOCK.minibus;
}
