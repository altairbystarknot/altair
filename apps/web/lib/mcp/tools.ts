import "server-only";
import { z } from "zod";
import { catalogDraftSchema, checkDraftReferences, draftKind, draftRowCount } from "@altair/config";
import { quoteTransfer, searchPlaces, TransferRequestError } from "@altair/engine";
import { guard } from "@/lib/doors";
import { getMoneyRules, getTransferCatalog } from "@/lib/public/catalog";
import { createAnonSupabase } from "@/lib/supabase/anon";
import type { Scope } from "./oauth";

// THE TOOLS A CONNECTED CLAUDE CAN USE. Each one is a thin wrapper over ONE guarded database door that
// re-checks the token, the grant's scopes and the person's current role, and logs the call. Claude reads
// files (Excel, PDF, photos) on its own side with the owner's subscription and sends clean JSON here.

export class ToolAuthError extends Error {}
export class ToolError extends Error {}

export type ToolCtx = { token: string; origin: string };

type ToolDef = {
  name: string;
  title: string;
  description: string;
  scope: Scope | null;
  input: z.ZodType;
  annotations: { readOnlyHint: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint: boolean };
  run: (ctx: ToolCtx, args: never) => Promise<unknown>;
};

async function door(name: string, ctx: ToolCtx, params: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await createAnonSupabase().rpc(name, { p_guard: guard("mcp"), p_token: ctx.token, ...params });
  if (error) {
    if (error.code === "28000") throw new ToolAuthError("invalid_token");
    if (error.code === "42501") throw new ToolError("Esta conexión no tiene permiso para esto. Solicite ese permiso al dueño del negocio y vuelva a conectar Claude.");
    if (error.code === "22023" || error.code === "53400") throw new ToolError(error.message);
    throw new ToolError("Altair no pudo completar la acción. Intente de nuevo en un momento.");
  }
  return data;
}

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD");

export const TOOLS: ToolDef[] = [
  {
    name: "quien_soy",
    title: "Negocio y permisos",
    description: "Devuelve el negocio conectado (nombre, zona horaria, moneda, impuesto, modo de pago), la fecha de hoy en su zona, la persona que conectó Claude, su rol y los permisos de esta conexión. Llámela primero si no sabe con qué negocio está trabajando.",
    scope: null,
    input: z.object({}),
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: (ctx) => door("mcp_whoami", ctx, {}),
  },
  {
    name: "resumen_del_dia",
    title: "Resumen del día",
    description: "Servicios de un día (traslados y actividades) con hora, cliente, pasajeros, proveedor, conductor y estado; además cuántos servicios faltan asignar en los próximos 3 días, reservas nuevas de las últimas 24 h, cotizaciones pendientes y borradores por revisar. Sin fecha usa HOY en la zona horaria del negocio.",
    scope: "bookings:read",
    input: z.object({ fecha: date.optional().describe("Día a consultar, AAAA-MM-DD. Opcional.") }),
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: (ctx, a: { fecha?: string }) => door("mcp_today", ctx, { p_date: a.fecha ?? null }),
  },
  {
    name: "buscar_reservas",
    title: "Buscar reservas",
    description: "Busca reservas por código (MAR-0042), nombre o correo del cliente, estado (received, confirmed, cancelled, completed) y rango de fechas de servicio. Devuelve un resumen de cada una; use ver_reserva para el detalle.",
    scope: "bookings:read",
    input: z.object({
      texto: z.string().max(120).optional().describe("Código, nombre o correo."),
      desde: date.optional(),
      hasta: date.optional(),
      estado: z.enum(["received", "confirmed", "cancelled", "completed"]).optional(),
      limite: z.number().int().min(1).max(100).optional(),
    }),
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: (ctx, a: { texto?: string; desde?: string; hasta?: string; estado?: string; limite?: number }) =>
      door("mcp_bookings_search", ctx, { p_query: a.texto ?? null, p_from: a.desde ?? null, p_to: a.hasta ?? null, p_status: a.estado ?? null, p_limit: a.limite ?? 20 }),
  },
  {
    name: "ver_reserva",
    title: "Ver una reserva",
    description: "Detalle completo de una reserva por su código: cliente, cada servicio (line_id, fecha, hora, pasajeros, detalles como vuelo u hotel, proveedor, conductor, estado), totales, lo pagado y el historial.",
    scope: "bookings:read",
    input: z.object({ codigo: z.string().min(4).max(20).describe("Código de reserva, por ejemplo MAR-0042.") }),
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async (ctx, a: { codigo: string }) => (await door("mcp_booking_get", ctx, { p_code: a.codigo })) ?? { encontrada: false },
  },
  {
    name: "asignar_servicio",
    title: "Asignar o actualizar un servicio",
    description: "Actualiza la operación de UN servicio (line_id de ver_reserva o resumen_del_dia): proveedor (nombre exacto de ver_catalogo → suppliers), conductor o guía, su teléfono, vehículo/placa, nota y estado (pending, assigned, confirmed, done, no_show, cancelled). Al poner proveedor a un servicio pendiente pasa a 'assigned'. No cambia precios ni cobros.",
    scope: "ops:write",
    input: z.object({
      line_id: z.string().uuid(),
      estado: z.enum(["pending", "assigned", "confirmed", "done", "no_show", "cancelled"]).optional(),
      proveedor: z.string().max(120).optional(),
      conductor: z.string().max(80).optional(),
      telefono_conductor: z.string().max(40).optional(),
      vehiculo: z.string().max(80).optional(),
      nota: z.string().max(500).optional(),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    run: (ctx, a: { line_id: string; estado?: string; proveedor?: string; conductor?: string; telefono_conductor?: string; vehiculo?: string; nota?: string }) =>
      door("mcp_line_update", ctx, {
        p_line_id: a.line_id,
        p_ops_status: a.estado ?? null,
        p_supplier: a.proveedor ?? null,
        p_driver_name: a.conductor ?? null,
        p_driver_phone: a.telefono_conductor ?? null,
        p_vehicle_info: a.vehiculo ?? null,
        p_ops_notes: a.nota ?? null,
      }),
  },
  {
    name: "ver_catalogo",
    title: "Ver el catálogo",
    description: "Todo el catálogo actual por NOMBRE: zonas (aeropuertos y zonas), lugares de cada zona, vehículos con capacidad, temporadas, tarifas por ruta (precio SIN impuestos), recargos, extras, actividades con horarios y proveedores. Úselo antes de proponer cambios para reutilizar exactamente los mismos nombres.",
    scope: "bookings:read",
    input: z.object({}),
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: (ctx) => door("mcp_catalog", ctx, {}),
  },
  {
    name: "cotizar_traslado",
    title: "Cotizar un traslado",
    description: "Calcula el precio final al cliente (impuestos incluidos y redondeado según el negocio) de un traslado privado entre dos lugares, para cada vehículo que entra el grupo. Los lugares se buscan por nombre (aeropuerto, hotel, pueblo o código IATA).",
    scope: "bookings:read",
    input: z.object({
      desde: z.string().min(2).max(120),
      hacia: z.string().min(2).max(120),
      fecha: date,
      hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM"),
      adultos: z.number().int().min(0).max(50),
      ninos: z.number().int().min(0).max(50).optional(),
      bebes: z.number().int().min(0).max(20).optional(),
    }),
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async (ctx, a: { desde: string; hacia: string; fecha: string; hora: string; adultos: number; ninos?: number; bebes?: number }) => {
      await door("mcp_whoami", ctx, {}); // token check
      const [catalog, money] = await Promise.all([getTransferCatalog(), getMoneyRules()]);
      if (!money) throw new ToolError("El negocio no está configurado.");
      const from = searchPlaces(catalog.places, a.desde, 5);
      const to = searchPlaces(catalog.places, a.hacia, 5);
      if (!from.length || !to.length) {
        return { error: "No encontré esos lugares en el catálogo.", sugerencias_desde: from.map((p) => p.name), sugerencias_hacia: to.map((p) => p.name) };
      }
      try {
        const q = quoteTransfer(catalog, { from: { placeId: from[0]!.id }, to: { placeId: to[0]!.id }, date: a.fecha, time: a.hora, adults: a.adultos, children: a.ninos ?? 0, infants: a.bebes ?? 0 }, money);
        return {
          desde: `${q.from.label} (${q.from.areaName})`,
          hacia: `${q.to.label} (${q.to.areaName})`,
          moneda: money.currency,
          grupo_demasiado_grande: q.groupTooLarge,
          opciones: q.options.map((o) => ({
            vehiculo: o.vehicleName,
            capacidad: o.capacityPax,
            precio_final: o.total,
            estado: o.status === "quote" ? "a cotizar (no hay tarifa)" : "precio publicado",
            detalle: o.components.map((c) => `${c.label}${c.qty > 1 ? ` x${c.qty}` : ""}: ${c.total}`),
            temporada: o.seasonName,
          })),
        };
      } catch (e) {
        throw new ToolError(e instanceof TransferRequestError ? e.message : "No se pudo cotizar.");
      }
    },
  },
  {
    name: "proponer_cambios_catalogo",
    title: "Proponer cambios de catálogo (borrador)",
    description:
      "Crea un BORRADOR con cambios de catálogo para que una persona lo revise y publique en el panel (nada se publica solo). Úselo para cargar tarifas de un Excel o PDF, crear zonas, lugares, vehículos, temporadas, recargos, extras, actividades o proveedores. Reglas: los nombres de zona y vehículo en tarifas y lugares deben existir en el catálogo (ver_catalogo) o venir en el mismo borrador; los precios van SIN impuestos; precio null = 'a cotizar' (nunca 0 si no hay precio); en tarifas bothWays:true crea también el regreso; horarios de actividades como {time:'08:00', capacity:12, weekdays:[1,2,3,4,5]} (0 = domingo). Al publicar, las filas con el mismo nombre se actualizan.",
    scope: "catalog:draft",
    input: z.object({
      titulo: z.string().min(3).max(160).describe("Título corto del borrador, por ejemplo 'Tarifas 2027 desde el Excel de Juan'."),
      resumen: z.string().max(600).optional().describe("Qué cambia y de dónde salió."),
      borrador: catalogDraftSchema,
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    run: async (ctx, a: { titulo: string; resumen?: string; borrador: z.infer<typeof catalogDraftSchema> }) => {
      const cat = (await door("mcp_catalog", ctx, {})) as { areas: Array<{ name: string }>; vehicles: Array<{ name: string }>; seasons: Array<{ name: string }> };
      const problems = checkDraftReferences(a.borrador, {
        areas: cat.areas.map((x) => x.name),
        vehicles: cat.vehicles.map((x) => x.name),
        seasons: cat.seasons.map((x) => x.name),
      });
      if (problems.length) return { creado: false, problemas: problems, ayuda: "Corrija los nombres (use ver_catalogo) o agregue esas zonas/vehículos/temporadas en el mismo borrador." };
      const res = (await door("mcp_change_set_create", ctx, {
        p_kind: draftKind(a.borrador),
        p_title: a.titulo,
        p_summary: a.resumen ?? null,
        p_payload: a.borrador,
        p_row_count: draftRowCount(a.borrador),
      })) as { change_set_id: string };
      return {
        creado: true,
        estado: "borrador (sin publicar)",
        filas: draftRowCount(a.borrador),
        revisar_y_publicar_en: `${ctx.origin}/panel/borradores/${res.change_set_id}`,
        nota: "Pida a la persona que lo revise y toque Publicar en ese enlace.",
      };
    },
  },
  {
    name: "redactar_mensaje",
    title: "Redactar un mensaje al cliente",
    description: "Deja un mensaje REDACTADO (WhatsApp o correo) en una reserva. No se envía: una persona lo revisa y lo manda desde el panel con un toque.",
    scope: "messages:draft",
    input: z.object({ codigo: z.string().min(4).max(20), canal: z.enum(["whatsapp", "email"]), texto: z.string().min(2).max(4000) }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    run: (ctx, a: { codigo: string; canal: string; texto: string }) => door("mcp_message_draft", ctx, { p_code: a.codigo, p_channel: a.canal, p_text: a.texto }),
  },
  {
    name: "reporte_ventas",
    title: "Reporte de ventas",
    description: "Ventas por fecha de servicio en un rango (máximo 400 días): reservas, servicios, total vendido, por tipo (transfer/activity) y cotizaciones pendientes. Excluye canceladas.",
    scope: "bookings:read",
    input: z.object({ desde: date, hasta: date }),
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: (ctx, a: { desde: string; hasta: string }) => door("mcp_sales_report", ctx, { p_from: a.desde, p_to: a.hasta }),
  },
];

export function toolList(scopes: string[]) {
  return TOOLS.filter((t) => !t.scope || scopes.includes(t.scope)).map((t) => ({
    name: t.name,
    title: t.title,
    description: t.description,
    inputSchema: z.toJSONSchema(t.input, { io: "input", target: "draft-7" }),
    annotations: { title: t.title, ...t.annotations },
  }));
}

export async function callTool(name: string, rawArgs: unknown, ctx: ToolCtx) {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { content: [{ type: "text", text: `No existe la herramienta ${name}.` }], isError: true };
  const parsed = tool.input.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    const msg = parsed.error.issues.slice(0, 8).map((i) => `${i.path.join(".") || "(entrada)"}: ${i.message}`).join("\n");
    return { content: [{ type: "text", text: `Datos inválidos:\n${msg}` }], isError: true };
  }
  try {
    const out = await tool.run(ctx, parsed.data as never);
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }], isError: false };
  } catch (e) {
    if (e instanceof ToolAuthError) throw e;
    return { content: [{ type: "text", text: e instanceof ToolError ? e.message : "Error inesperado en Altair." }], isError: true };
  }
}
