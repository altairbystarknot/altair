import type { CatalogDraft } from "./change-sets";

// SAMPLE DATA. A starting catalog a new business can load to see Altair working before typing its own
// (onboarding step "Tus datos" -> "Empezar con datos de ejemplo"). Prices are illustrative, NOT market
// prices, and the panel labels this draft as sample data. Places are generic ("Hoteles en el centro de La
// Fortuna"), never real businesses. Photos are Altair's own sample images under /sample.

export const SAMPLE_LABEL = "Datos de ejemplo (precios ilustrativos)";

// Public geography (approximate town and airport coordinates) and an illustrative coverage radius.
const AREAS = [
  { name: "Aeropuerto SJO", kind: "airport" as const, iata: "SJO", lat: 9.9939, lng: -84.2088, radiusKm: 3 },
  { name: "Aeropuerto LIR", kind: "airport" as const, iata: "LIR", lat: 10.5933, lng: -85.5444, radiusKm: 3 },
  { name: "San José", kind: "zone" as const, iata: null, lat: 9.9281, lng: -84.0907, radiusKm: 18 },
  { name: "La Fortuna", kind: "zone" as const, iata: null, lat: 10.4679, lng: -84.6427, radiusKm: 18 },
  { name: "Monteverde", kind: "zone" as const, iata: null, lat: 10.315, lng: -84.8254, radiusKm: 10 },
  { name: "Manuel Antonio", kind: "zone" as const, iata: null, lat: 9.4316, lng: -84.1625, radiusKm: 14 },
  { name: "Tamarindo", kind: "zone" as const, iata: null, lat: 10.2993, lng: -85.8371, radiusKm: 16 },
  { name: "Puerto Viejo", kind: "zone" as const, iata: null, lat: 9.6563, lng: -82.7539, radiusKm: 18 },
];

// Illustrative before-tax prices for a sedan; the van adds 30% and the minibus 80%.
const ROUTES: Array<[string, string, number, number]> = [
  ["Aeropuerto SJO", "San José", 35, 35],
  ["Aeropuerto SJO", "La Fortuna", 150, 180],
  ["Aeropuerto SJO", "Monteverde", 160, 210],
  ["Aeropuerto SJO", "Manuel Antonio", 165, 200],
  ["Aeropuerto SJO", "Tamarindo", 210, 270],
  ["Aeropuerto SJO", "Puerto Viejo", 230, 260],
  ["Aeropuerto LIR", "Tamarindo", 75, 75],
  ["Aeropuerto LIR", "La Fortuna", 170, 180],
  ["Aeropuerto LIR", "Monteverde", 175, 200],
  ["San José", "La Fortuna", 150, 180],
  ["La Fortuna", "Monteverde", 170, 210],
  ["La Fortuna", "Tamarindo", 190, 210],
  ["Monteverde", "Manuel Antonio", 210, 240],
];

const VEHICLES = [
  { name: "Sedán", nameEn: "Sedan", capacityPax: 3, capacityBags: 3, description: "Hasta 3 personas con equipaje.", factor: 1 },
  { name: "Van", nameEn: "Van", capacityPax: 8, capacityBags: 8, description: "Hasta 8 personas, aire acondicionado.", factor: 1.3 },
  { name: "Minibús", nameEn: "Minibus", capacityPax: 18, capacityBags: 18, description: "Grupos de hasta 18 personas.", factor: 1.8 },
];

const round5 = (n: number) => Math.round(n / 5) * 5;

export function sampleCatalog(): CatalogDraft {
  return {
    areas: AREAS,
    places: [
      { name: "Aeropuerto Internacional Juan Santamaría (SJO)", area: "Aeropuerto SJO", kind: "airport", aliases: ["SJO", "Alajuela"], lat: 9.9939, lng: -84.2088 },
      { name: "Aeropuerto Internacional de Liberia (LIR)", area: "Aeropuerto LIR", kind: "airport", aliases: ["LIR", "Liberia"], lat: 10.5933, lng: -85.5444 },
      { name: "Hoteles en el centro de San José", area: "San José", kind: "hotel", aliases: ["Escazú", "Santa Ana"], lat: 9.9325, lng: -84.0796 },
      { name: "Hoteles en el centro de La Fortuna", area: "La Fortuna", kind: "hotel", aliases: ["Arenal"], lat: 10.4713, lng: -84.6453 },
      { name: "Hoteles en la zona del volcán Arenal", area: "La Fortuna", kind: "hotel", aliases: ["Arenal", "El Castillo"], lat: 10.4637, lng: -84.7029 },
      { name: "Hoteles en Santa Elena", area: "Monteverde", kind: "hotel", aliases: ["Monteverde"], lat: 10.3126, lng: -84.8251 },
      { name: "Hoteles en Quepos y Manuel Antonio", area: "Manuel Antonio", kind: "hotel", aliases: ["Quepos"], lat: 9.4239, lng: -84.1683 },
      { name: "Hoteles en Tamarindo", area: "Tamarindo", kind: "hotel", aliases: ["Langosta", "Playa Grande"], lat: 10.2993, lng: -85.8371 },
      { name: "Hoteles en Puerto Viejo y Cocles", area: "Puerto Viejo", kind: "hotel", aliases: ["Cocles", "Cahuita"], lat: 9.6563, lng: -82.7539 },
    ],
    vehicles: VEHICLES.map(({ factor: _f, ...v }) => v),
    seasons: [{ name: "Temporada alta", startsOn: "2026-12-15", endsOn: "2027-04-15" }],
    rates: ROUTES.flatMap(([from, to, price, minutes]) =>
      VEHICLES.flatMap((v) => [
        { from, to, vehicle: v.name, season: null, price: round5(price * v.factor), netCost: round5(price * v.factor * 0.7), minutes, bothWays: true },
        { from, to, vehicle: v.name, season: "Temporada alta", price: round5(price * v.factor * 1.15), netCost: round5(price * v.factor * 0.75), minutes, bothWays: true },
      ]),
    ),
    surcharges: [{ name: "Recargo nocturno", nameEn: "Night surcharge", startTime: "22:00", endTime: "05:00", amount: 25 }],
    extras: [
      { name: "Silla de bebé", nameEn: "Child seat", price: 10, maxQty: 2 },
      { name: "Parada para compras (30 min)", nameEn: "Grocery stop (30 min)", price: 20, maxQty: 1 },
    ],
    activities: [
      {
        slug: "snorkel-con-tortugas",
        title: "Snorkel con tortugas",
        titleEn: "Snorkeling with sea turtles",
        summary: "Media mañana en aguas tranquilas con guía local y equipo incluido.",
        summaryEn: "A half morning in calm water with a local guide and gear included.",
        description:
          "Salimos en lancha hacia un arrecife protegido donde las tortugas se alimentan. El guía le acompaña en el agua, explica cómo comportarse cerca de ellas y se asegura de que todos se sientan cómodos. Apto para principiantes que sepan nadar.",
        descriptionEn:
          "We head out by boat to a protected reef where turtles feed. Your guide swims with you, explains how to behave around them and makes sure everyone feels comfortable. Good for beginners who can swim.",
        category: "Mar",
        area: "Tamarindo",
        durationMinutes: 210,
        meetingPoint: "Playa Tamarindo, frente a la escuela de surf",
        includes: ["Guía bilingüe", "Equipo de snorkel", "Fruta y agua"],
        includesEn: ["Bilingual guide", "Snorkel gear", "Fruit and water"],
        bring: ["Bloqueador biodegradable", "Toalla", "Ropa de baño"],
        bringEn: ["Reef-safe sunscreen", "Towel", "Swimwear"],
        coverPath: "/stock/snorkel.jpg",
        priceAdult: 70,
        priceChild: 50,
        netCostAdult: 40,
        childMinAge: 6,
        childMaxAge: 11,
        minPax: 1,
        maxPax: 10,
        bookingMode: "instant",
        difficulty: "easy",
        minAge: 6,
        photos: ["/stock/snorkel.jpg", "/sample/turtle.jpg", "/stock/catamaran.jpg"],
        pickupMode: "by_area",
        schedules: [
          { time: "08:00", capacity: 12 },
          { time: "13:00", weekdays: [1, 2, 3, 4, 5, 6], capacity: 12 },
        ],
        pickupAreas: [{ area: "Tamarindo", fee: 0 }],
      },
      {
        slug: "avistamiento-de-aves",
        title: "Avistamiento de aves al amanecer",
        titleEn: "Sunrise birdwatching",
        summary: "Tucanes, colibríes y lapas con telescopio y guía naturalista.",
        summaryEn: "Toucans, hummingbirds and macaws with a spotting scope and a naturalist guide.",
        description:
          "Caminata suave por senderos de bosque cuando las aves están más activas. El guía lleva telescopio para que vea cada detalle y le ayuda a reconocer los cantos.",
        descriptionEn: "An easy walk on forest trails when birds are most active. Your guide carries a spotting scope and helps you recognize their calls.",
        category: "Naturaleza",
        area: "La Fortuna",
        durationMinutes: 180,
        meetingPoint: "Recepción de su hotel",
        includes: ["Guía naturalista", "Telescopio", "Desayuno ligero"],
        includesEn: ["Naturalist guide", "Spotting scope", "Light breakfast"],
        bring: ["Zapatos cerrados", "Repelente"],
        bringEn: ["Closed shoes", "Insect repellent"],
        coverPath: "/sample/toucan.jpg",
        priceAdult: 55,
        priceChild: 40,
        netCostAdult: 30,
        childMinAge: 5,
        childMaxAge: 11,
        minPax: 1,
        maxPax: 8,
        bookingMode: "instant",
        difficulty: "easy",
        minAge: 5,
        photos: ["/sample/toucan.jpg", "/sample/hummingbird.jpg", "/sample/macaws.jpg"],
        pickupMode: "by_area",
        schedules: [{ time: "05:30", capacity: 8 }],
        pickupAreas: [{ area: "La Fortuna", fee: 10 }],
      },
      {
        slug: "tour-de-perezosos",
        title: "Tour de perezosos y vida silvestre",
        titleEn: "Sloth and wildlife tour",
        summary: "Perezosos, monos y ranas en un refugio privado, a su ritmo.",
        summaryEn: "Sloths, monkeys and frogs in a private reserve, at your pace.",
        description: "Recorrido guiado por un refugio privado. Ideal para familias: senderos planos y muchas paradas para observar.",
        descriptionEn: "Guided walk through a private reserve. Great for families: flat trails and plenty of stops to look around.",
        category: "Naturaleza",
        area: "Manuel Antonio",
        durationMinutes: 150,
        meetingPoint: "Entrada del refugio",
        includes: ["Guía", "Entrada al refugio"],
        includesEn: ["Guide", "Reserve entrance"],
        bring: ["Cámara", "Agua"],
        bringEn: ["Camera", "Water"],
        coverPath: "/stock/wildlife.jpg",
        priceAdult: 45,
        priceChild: 30,
        netCostAdult: 25,
        minPax: 1,
        maxPax: 12,
        bookingMode: "instant",
        difficulty: "easy",
        minAge: 0,
        photos: ["/stock/wildlife.jpg", "/sample/sloth.jpg", "/sample/monkeys.jpg", "/stock/rainforest.jpg"],
        pickupMode: "included",
        schedules: [
          { time: "08:00", capacity: 15 },
          { time: "14:00", capacity: 15 },
        ],
      },
      {
        slug: "caminata-nocturna",
        title: "Caminata nocturna",
        titleEn: "Night walk",
        summary: "Ranas de ojos rojos, insectos y sonidos del bosque de noche.",
        summaryEn: "Red-eyed tree frogs, insects and the sounds of the forest at night.",
        description: "Con linternas y un guía experto descubrís el bosque cuando despierta la vida nocturna.",
        descriptionEn: "With flashlights and an expert guide you discover the forest when night life wakes up.",
        category: "Naturaleza",
        area: "Monteverde",
        durationMinutes: 120,
        meetingPoint: "Centro de Santa Elena",
        includes: ["Guía", "Linterna"],
        includesEn: ["Guide", "Flashlight"],
        coverPath: "/sample/frog.jpg",
        priceAdult: 35,
        priceChild: 25,
        minPax: 2,
        maxPax: 10,
        bookingMode: "request",
        difficulty: "moderate",
        minAge: 8,
        photos: ["/sample/frog.jpg"],
        pickupMode: "none",
        schedules: [{ time: "17:45", capacity: 14 }],
      },
    ],
    suppliers: [
      { name: "Transportes de ejemplo", kind: "transport", contactName: "Coordinación", whatsapp: "+506 8000 0000", notes: SAMPLE_LABEL },
      { name: "Guías de ejemplo", kind: "guide", contactName: "Coordinación", whatsapp: "+506 8000 0001", notes: SAMPLE_LABEL },
    ],
  };
}
