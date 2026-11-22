import "server-only";
import type { SignupRequest } from "./store";

// PROVISIONING: what happens when Starknot approves a business. Each business gets its OWN instance
// (its own Supabase project, Vercel project and domain); the owner then receives a one-time link to
// claim it and runs the setup wizard in the browser. Nobody installs or runs code on their computer.
//
// Drivers:
//   local  (development) asks a running local instance for a claim link through its guarded install
//          endpoint. One local instance exists, so once it has an owner this step reports that.
//   cloud  (production) creates the instance with the Supabase Management API and the Vercel API, then
//          asks the new instance for the claim link. Needs Starknot's tokens in the hub's environment.

export type ProvisionResult = { ok: boolean; instanceUrl: string | null; claimLink: string | null; log: string[] };

export const CLOUD_STEPS = [
  "Crear el proyecto de Supabase del negocio (Management API, región más cercana).",
  "Esperar a que la base esté lista y aplicar las migraciones de Altair.",
  "Generar las llaves de las puertas (una por puerta) y guardar solo sus huellas en la base.",
  "Escribir la configuración del negocio (nombre, país, moneda, impuesto, prefijo) con los datos de la solicitud.",
  "Configurar el acceso: confirmación de correo con Resend, códigos de dos pasos, direcciones permitidas.",
  "Crear el proyecto de Vercel desde el repo de Altair con sus variables de entorno.",
  "Desplegar y asignar el dominio del negocio (o un subdominio de Altair).",
  "Pedirle a la nueva instancia el enlace de activación y mostrarlo en esta consola para enviarlo a mano (correo o WhatsApp).",
];

export function provisionMode(): "local" | "cloud" {
  return process.env.HUB_PROVISION_MODE === "cloud" ? "cloud" : "local";
}

export async function provision(req: SignupRequest): Promise<ProvisionResult> {
  if (provisionMode() === "cloud") {
    const ready = Boolean(process.env.HUB_SUPABASE_MANAGEMENT_TOKEN && process.env.HUB_VERCEL_TOKEN);
    return {
      ok: false,
      instanceUrl: null,
      claimLink: null,
      log: ready
        ? ["El modo nube está configurado pero todavía no está habilitado en esta versión.", ...CLOUD_STEPS.map((s, i) => `${i + 1}. ${s}`)]
        : ["Faltan las llaves de Starknot para Supabase y Vercel en el entorno del hub.", ...CLOUD_STEPS.map((s, i) => `${i + 1}. ${s}`)],
    };
  }

  const base = process.env.HUB_LOCAL_INSTANCE_URL ?? "http://localhost:3000";
  const guard = process.env.HUB_LOCAL_INSTALL_GUARD ?? "";
  const log = [`Modo local: instancia de desarrollo en ${base} para «${req.business}».`];
  if (guard.length < 32) return { ok: false, instanceUrl: base, claimLink: null, log: [...log, "Falta HUB_LOCAL_INSTALL_GUARD en apps/hub/.env.local."] };
  try {
    const r = await fetch(`${base}/api/install/claim-link`, { method: "POST", headers: { "x-altair-install-guard": guard }, cache: "no-store" });
    const body = (await r.json()) as { link?: string; error?: string };
    if (r.ok && body.link) return { ok: true, instanceUrl: base, claimLink: body.link, log: [...log, "Enlace de activación generado (vale 7 días, una sola vez)."] };
    if (body.error === "already_claimed") {
      return { ok: false, instanceUrl: base, claimLink: null, log: [...log, "La instancia local ya tiene dueño. En producción, este paso crea una instancia NUEVA para este negocio."] };
    }
    return { ok: false, instanceUrl: base, claimLink: null, log: [...log, `La instancia respondió: ${body.error ?? r.status}`] };
  } catch {
    return { ok: false, instanceUrl: base, claimLink: null, log: [...log, "No se pudo contactar a la instancia local (¿está corriendo npm run dev?)."] };
  }
}
