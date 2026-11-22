import "server-only";
import { readSheet } from "read-excel-file/node";
import writeXlsxFile from "write-excel-file/node";
import { catalogDraftSchema, type CatalogDraft } from "@altair/config";

// EXCEL IN AND OUT. The template IS the business's current catalog: download it, edit it in Excel or
// Google Sheets, upload it back. The upload becomes a DRAFT (change set) that a person reviews and
// publishes; nothing is written to the catalog on upload. Headers are matched loosely (accents, case).
// Prices are BEFORE tax; an empty price means "a cotizar".

type Col = { key: string; title: string; width?: number };

const SHEETS: Record<string, { title: string; cols: Col[] }> = {
  areas: {
    title: "Zonas",
    cols: [
      { key: "name", title: "Nombre", width: 28 },
      { key: "kind", title: "Tipo (zona o aeropuerto)", width: 22 },
      { key: "iata", title: "Código IATA", width: 12 },
      { key: "lat", title: "Latitud", width: 12 },
      { key: "lng", title: "Longitud", width: 12 },
      { key: "radiusKm", title: "Radio de cobertura (km)", width: 20 },
    ],
  },
  places: {
    title: "Lugares",
    cols: [
      { key: "name", title: "Nombre", width: 44 },
      { key: "area", title: "Zona", width: 24 },
      { key: "kind", title: "Tipo (hotel, pueblo, aeropuerto, puerto, otro)", width: 30 },
      { key: "aliases", title: "Otros nombres (separados por coma)", width: 34 },
      { key: "lat", title: "Latitud", width: 12 },
      { key: "lng", title: "Longitud", width: 12 },
    ],
  },
  vehicles: {
    title: "Vehículos",
    cols: [
      { key: "name", title: "Nombre", width: 18 },
      { key: "nameEn", title: "Nombre en inglés", width: 18 },
      { key: "capacityPax", title: "Pasajeros", width: 12 },
      { key: "capacityBags", title: "Maletas", width: 10 },
      { key: "description", title: "Descripción", width: 40 },
    ],
  },
  seasons: {
    title: "Temporadas",
    cols: [
      { key: "name", title: "Nombre", width: 22 },
      { key: "startsOn", title: "Desde (AAAA-MM-DD)", width: 18 },
      { key: "endsOn", title: "Hasta (AAAA-MM-DD)", width: 18 },
    ],
  },
  rates: {
    title: "Tarifas",
    cols: [
      { key: "from", title: "Desde (zona)", width: 22 },
      { key: "to", title: "Hacia (zona)", width: 22 },
      { key: "vehicle", title: "Vehículo", width: 14 },
      { key: "season", title: "Temporada (vacío = todo el año)", width: 26 },
      { key: "price", title: "Precio sin impuestos", width: 18 },
      { key: "netCost", title: "Costo neto", width: 12 },
      { key: "minutes", title: "Minutos de viaje", width: 14 },
      { key: "bothWays", title: "Ida y vuelta (sí/no)", width: 16 },
    ],
  },
  surcharges: {
    title: "Recargos",
    cols: [
      { key: "name", title: "Nombre", width: 22 },
      { key: "startTime", title: "Desde hora (HH:MM)", width: 16 },
      { key: "endTime", title: "Hasta hora (HH:MM)", width: 16 },
      { key: "dateFrom", title: "Desde fecha", width: 14 },
      { key: "dateTo", title: "Hasta fecha", width: 14 },
      { key: "amount", title: "Monto sin impuestos", width: 18 },
    ],
  },
  extras: {
    title: "Extras",
    cols: [
      { key: "name", title: "Nombre", width: 28 },
      { key: "nameEn", title: "Nombre en inglés", width: 28 },
      { key: "price", title: "Precio sin impuestos", width: 18 },
      { key: "maxQty", title: "Máximo por traslado", width: 18 },
    ],
  },
  activities: {
    title: "Actividades",
    cols: [
      { key: "title", title: "Título", width: 32 },
      { key: "titleEn", title: "Título en inglés", width: 32 },
      { key: "summary", title: "Resumen", width: 48 },
      { key: "area", title: "Zona", width: 18 },
      { key: "durationMinutes", title: "Duración (minutos)", width: 16 },
      { key: "priceAdult", title: "Precio adulto sin impuestos", width: 22 },
      { key: "priceChild", title: "Precio niño sin impuestos", width: 22 },
      { key: "childMinAge", title: "Niño desde (años)", width: 14 },
      { key: "childMaxAge", title: "Niño hasta (años)", width: 14 },
      { key: "times", title: "Horarios (HH:MM separados por coma)", width: 26 },
      { key: "capacity", title: "Cupo por salida", width: 14 },
      { key: "bookingMode", title: "Confirmación (inmediata o solicitud)", width: 26 },
      { key: "meetingPoint", title: "Punto de encuentro", width: 30 },
      { key: "includes", title: "Incluye (separado por ;)", width: 40 },
    ],
  },
  suppliers: {
    title: "Proveedores",
    cols: [
      { key: "name", title: "Nombre", width: 28 },
      { key: "kind", title: "Tipo (transporte, actividad, guía, otro)", width: 30 },
      { key: "contactName", title: "Contacto", width: 20 },
      { key: "whatsapp", title: "WhatsApp", width: 18 },
      { key: "email", title: "Correo", width: 26 },
      { key: "notes", title: "Notas", width: 30 },
    ],
  },
};

const norm = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

type Cell = string | number | boolean | null;

const KIND_AREA: Record<string, "airport" | "zone"> = { aeropuerto: "airport", airport: "airport", zona: "zone", zone: "zone" };
const KIND_PLACE: Record<string, "airport" | "hotel" | "town" | "port" | "other"> = {
  aeropuerto: "airport", airport: "airport", hotel: "hotel", pueblo: "town", ciudad: "town", town: "town", puerto: "port", port: "port", otro: "other", other: "other",
};
const KIND_SUPPLIER: Record<string, "transport" | "activity" | "guide" | "other"> = {
  transporte: "transport", transport: "transport", actividad: "activity", activity: "activity", guia: "guide", guide: "guide", otro: "other", other: "other",
};

function str(v: Cell | undefined): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}
function num(v: Cell | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[^0-9.,-]/g, "").replace(/,(?=\d{3}\b)/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function int(v: Cell | undefined): number | null {
  const n = num(v);
  return n === null ? null : Math.round(n);
}
function yes(v: Cell | undefined): boolean {
  const s = norm(v);
  return s === "" || s === "si" || s === "yes" || s === "true" || s === "1" || s === "x";
}
function hhmm(v: Cell | undefined): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" && v < 1) {
    const mins = Math.round(v * 24 * 60);
    return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  }
  const m = String(v).trim().match(/^(\d{1,2})[:.h](\d{2})/);
  return m ? `${m[1]!.padStart(2, "0")}:${m[2]}` : null;
}
function isoDate(v: Cell | undefined | Date): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/) ?? s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return m[0].includes("/") ? `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}` : `${m[1]}-${m[2]}-${m[3]}`;
}
const list = (v: Cell | undefined, sep: RegExp) => (str(v) ?? "").split(sep).map((x) => x.trim()).filter(Boolean);

export type ParsedWorkbook = { draft: CatalogDraft | null; problems: string[]; sheetsRead: string[] };

export async function parseCatalogWorkbook(buf: Buffer): Promise<ParsedWorkbook> {
  const problems: string[] = [];
  const sheetsRead: string[] = [];
  const draft: Record<string, unknown[]> = {};

  for (const [section, def] of Object.entries(SHEETS)) {
    let rows: Cell[][];
    try {
      rows = (await readSheet(buf, def.title)) as unknown as Cell[][];
    } catch {
      try {
        rows = (await readSheet(buf, def.title.normalize("NFD").replace(/[̀-ͯ]/g, ""))) as unknown as Cell[][];
      } catch {
        continue; // sheet not present: nothing to import for this section
      }
    }
    if (!rows.length) continue;
    sheetsRead.push(def.title);
    const header = rows[0]!.map((h) => norm(h));
    const idx = Object.fromEntries(def.cols.map((c) => [c.key, header.indexOf(norm(c.title))]));
    const get = (row: Cell[], key: string): Cell | undefined => (idx[key]! >= 0 ? row[idx[key]!] : undefined);
    const out: unknown[] = [];
    rows.slice(1).forEach((row, i) => {
      if (row.every((c) => c === null || String(c).trim() === "")) return;
      const line = i + 2;
      try {
        switch (section) {
          case "areas":
            out.push({ name: str(get(row, "name")), kind: KIND_AREA[norm(get(row, "kind"))] ?? "zone", iata: str(get(row, "iata"))?.toUpperCase() ?? null, lat: num(get(row, "lat")), lng: num(get(row, "lng")), radiusKm: num(get(row, "radiusKm")) });
            break;
          case "places":
            out.push({ name: str(get(row, "name")), area: str(get(row, "area")), kind: KIND_PLACE[norm(get(row, "kind"))] ?? "hotel", aliases: list(get(row, "aliases"), /,/), lat: num(get(row, "lat")), lng: num(get(row, "lng")) });
            break;
          case "vehicles":
            out.push({ name: str(get(row, "name")), nameEn: str(get(row, "nameEn")), capacityPax: int(get(row, "capacityPax")), capacityBags: int(get(row, "capacityBags")) ?? 0, description: str(get(row, "description")) });
            break;
          case "seasons":
            out.push({ name: str(get(row, "name")), startsOn: isoDate(get(row, "startsOn")), endsOn: isoDate(get(row, "endsOn")) });
            break;
          case "rates":
            out.push({
              from: str(get(row, "from")), to: str(get(row, "to")), vehicle: str(get(row, "vehicle")), season: str(get(row, "season")),
              price: num(get(row, "price")), netCost: num(get(row, "netCost")), minutes: int(get(row, "minutes")), bothWays: yes(get(row, "bothWays")),
            });
            break;
          case "surcharges":
            out.push({ name: str(get(row, "name")), startTime: hhmm(get(row, "startTime")), endTime: hhmm(get(row, "endTime")), dateFrom: isoDate(get(row, "dateFrom")), dateTo: isoDate(get(row, "dateTo")), amount: num(get(row, "amount")) ?? 0 });
            break;
          case "extras":
            out.push({ name: str(get(row, "name")), nameEn: str(get(row, "nameEn")), price: num(get(row, "price")) ?? 0, maxQty: int(get(row, "maxQty")) ?? 4 });
            break;
          case "activities": {
            const times = list(get(row, "times"), /[,;]/).map((x) => hhmm(x)).filter((x): x is string => Boolean(x));
            const capacity = int(get(row, "capacity")) ?? 12;
            out.push({
              title: str(get(row, "title")), titleEn: str(get(row, "titleEn")), summary: str(get(row, "summary")), area: str(get(row, "area")),
              durationMinutes: int(get(row, "durationMinutes")), priceAdult: num(get(row, "priceAdult")), priceChild: num(get(row, "priceChild")),
              childMinAge: int(get(row, "childMinAge")) ?? undefined, childMaxAge: int(get(row, "childMaxAge")) ?? undefined,
              schedules: times.map((time) => ({ time, capacity })),
              bookingMode: norm(get(row, "bookingMode")).startsWith("sol") || norm(get(row, "bookingMode")).startsWith("req") ? "request" : "instant",
              meetingPoint: str(get(row, "meetingPoint")), includes: list(get(row, "includes"), /;/),
            });
            break;
          }
          case "suppliers":
            out.push({ name: str(get(row, "name")), kind: KIND_SUPPLIER[norm(get(row, "kind"))] ?? "transport", contactName: str(get(row, "contactName")), whatsapp: str(get(row, "whatsapp")), email: str(get(row, "email")), notes: str(get(row, "notes")) });
            break;
        }
      } catch {
        problems.push(`${def.title}, fila ${line}: no se pudo leer`);
      }
    });
    if (out.length) draft[section] = out;
  }

  if (!sheetsRead.length) return { draft: null, problems: ["No encontramos ninguna hoja conocida (Zonas, Lugares, Vehículos, Tarifas, Actividades…). Use la plantilla."], sheetsRead };
  const parsed = catalogDraftSchema.safeParse(draft);
  if (!parsed.success) {
    for (const issue of parsed.error.issues.slice(0, 30)) {
      const [section, row, field] = issue.path;
      const sheet = SHEETS[String(section)]?.title ?? String(section ?? "");
      const col = SHEETS[String(section)]?.cols.find((c) => c.key === field)?.title ?? String(field ?? "");
      problems.push(typeof row === "number" ? `${sheet}, fila ${row + 2}, ${col}: ${issue.message}` : issue.message);
    }
    return { draft: null, problems, sheetsRead };
  }
  return { draft: parsed.data, problems, sheetsRead };
}

/** The workbook to download: the current catalog in the template's columns (headers only when empty). */
export async function catalogWorkbook(current: CatalogDraft): Promise<Buffer> {
  const header = (cols: Col[]) => cols.map((c) => ({ value: c.title, fontWeight: "bold" as const, backgroundColor: "#E8F0F2" }));
  const cell = (v: unknown) => (v === null || v === undefined ? null : Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "sí" : "no") : (v as string | number));
  const sheets = Object.entries(SHEETS).map(([section, def]) => {
    const rows = ((current as Record<string, unknown[]>)[section] ?? []) as Array<Record<string, unknown>>;
    const data = rows.map((r) =>
      def.cols.map((c) => {
        if (section === "areas" && c.key === "kind") return cell(r.kind === "airport" ? "aeropuerto" : "zona");
        if (section === "activities" && c.key === "times") return cell((r.schedules as Array<{ time: string }> | undefined)?.map((s) => s.time).join(", ") ?? "");
        if (section === "activities" && c.key === "capacity") return cell((r.schedules as Array<{ capacity: number }> | undefined)?.[0]?.capacity ?? null);
        if (section === "activities" && c.key === "bookingMode") return cell(r.bookingMode === "request" ? "solicitud" : "inmediata");
        if (section === "activities" && c.key === "includes") return cell(((r.includes as string[] | undefined) ?? []).join("; "));
        return cell(r[c.key]);
      }),
    );
    return { sheet: def.title, columns: def.cols.map((c) => ({ width: c.width ?? 16 })), data: [header(def.cols), ...data], stickyRowsCount: 1 };
  });
  const help = {
    sheet: "Instrucciones",
    columns: [{ width: 110 }],
    data: [
      [{ value: "Cómo usar esta plantilla", fontWeight: "bold" as const }],
      ["1. Cada hoja es una parte de su catálogo. Puede borrar las hojas que no use."],
      ["2. Los precios van SIN impuestos. Altair agrega el impuesto y redondea según su configuración."],
      ["3. Un precio vacío significa \"a cotizar\": el cliente puede solicitarlo y usted le responde con el precio."],
      ["4. Las tarifas usan los nombres de las zonas y de los vehículos tal como están en sus hojas."],
      ["5. Suba el archivo en Panel > Importar. Se crea un borrador: revíselo y publíquelo cuando esté correcto."],
      ["También puede enviar este archivo (o el suyo, con otro formato) a su Claude conectado: él lo ordena y lo deja como borrador."],
    ],
  };
  return (await writeXlsxFile([...sheets, help] as never).toBuffer()) as Buffer;
}
