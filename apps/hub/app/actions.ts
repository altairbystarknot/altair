"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, isConsole, passwordOk, startSession } from "@/lib/session";
import { provision } from "@/lib/provision";
import { addRequest, getRequest, updateRequest } from "@/lib/store";
import { dict, isLocale, type Locale } from "./_i18n/copy";

// Hub actions: the public request form, and the console (login, approve, reject). Console actions check
// the console session themselves.

const hits = new Map<string, number[]>();
function throttle(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
  if (list.length >= limit) return false;
  list.push(now);
  hits.set(key, list);
  return true;
}

export type FormState = { error: string | null };

const requestSchema = z.object({
  business: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  whatsapp: z.string().trim().max(40),
  country: z.string().trim().max(60),
  services: z.array(z.enum(["transfers", "activities"])).min(1),
  website: z.string().trim().max(200),
  notes: z.string().trim().max(1000),
});

/** The public request form (Spanish or English site). Errors come back in the visitor's language. */
export async function submitRequest(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = String(fd.get("locale") ?? "");
  const locale: Locale = isLocale(raw) ? raw : "es";
  const errors = dict(locale).request.errors;
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!throttle(`req:${ip}`, 5, 60 * 60_000)) return { error: errors.throttled };
  if (String(fd.get("company_url") ?? "")) return { error: errors.failed }; // honeypot
  const parsed = requestSchema.safeParse({
    business: fd.get("business"),
    contactName: fd.get("contactName"),
    email: fd.get("email"),
    whatsapp: fd.get("whatsapp") ?? "",
    country: fd.get("country") ?? "",
    services: fd.getAll("services"),
    website: fd.get("website") ?? "",
    notes: fd.get("notes") ?? "",
  });
  if (!parsed.success) return { error: errors.invalid };
  await addRequest({ ...parsed.data, locale });
  redirect(`/${locale}/solicitar?enviada=1`);
}

export async function consoleLogin(_prev: FormState, fd: FormData): Promise<FormState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!throttle(`login:${ip}`, 8, 10 * 60_000)) return { error: "Demasiados intentos." };
  if (!passwordOk(String(fd.get("password") ?? ""))) return { error: "Contraseña incorrecta." };
  await startSession();
  redirect("/consola");
}

export async function consoleLogout(): Promise<void> {
  await endSession();
  redirect("/consola/entrar");
}

export async function approveRequest(fd: FormData): Promise<void> {
  if (!(await isConsole())) redirect("/consola/entrar");
  const id = String(fd.get("id") ?? "");
  const req = await getRequest(id);
  if (!req || req.status !== "pending") redirect("/consola");
  const result = await provision(req);
  const now = new Date().toISOString();
  await updateRequest(
    id,
    {
      status: result.ok ? "approved" : "pending",
      decidedAt: result.ok ? now : undefined,
      instanceUrl: result.instanceUrl ?? undefined,
      claimLink: result.claimLink ?? undefined,
      linkCreatedAt: result.claimLink ? now : undefined,
      provisionLog: result.log,
    },
    result.ok ? "Aprobada. Sistema creado y enlace de activación generado." : `Intento de aprobación sin éxito: ${result.log.at(-1) ?? ""}`,
  );
  redirect(`/consola?abierta=${id}`);
}

/** A fresh claim link for an approved business whose link expired or got lost (the old one stops working). */
export async function regenerateLink(fd: FormData): Promise<void> {
  if (!(await isConsole())) redirect("/consola/entrar");
  const id = String(fd.get("id") ?? "");
  const req = await getRequest(id);
  if (!req || req.status !== "approved") redirect("/consola");
  const result = await provision(req);
  const now = new Date().toISOString();
  await updateRequest(
    id,
    result.claimLink
      ? { claimLink: result.claimLink, linkCreatedAt: now, sentAt: undefined, sentVia: undefined, sentTo: undefined, provisionLog: result.log }
      : { provisionLog: result.log },
    result.claimLink ? "Nuevo enlace de activación generado (el anterior deja de servir)." : `No se pudo generar un enlace nuevo: ${result.log.at(-1) ?? ""}`,
  );
  redirect(`/consola?abierta=${id}`);
}

const sentSchema = z.object({
  id: z.string().uuid(),
  via: z.enum(["correo", "whatsapp", "otro"]),
  to: z.string().trim().min(3).max(200),
  note: z.string().trim().max(500),
});

/** Starknot sends the link by hand (email or WhatsApp) and records it here. */
export async function markSent(fd: FormData): Promise<void> {
  if (!(await isConsole())) redirect("/consola/entrar");
  const p = sentSchema.safeParse({ id: fd.get("id"), via: fd.get("via"), to: fd.get("to"), note: fd.get("note") ?? "" });
  if (!p.success) redirect(`/consola?abierta=${String(fd.get("id") ?? "")}&error=envio`);
  const label = p.data.via === "correo" ? "correo" : p.data.via === "whatsapp" ? "WhatsApp" : "otro medio";
  await updateRequest(
    p.data.id,
    { sentAt: new Date().toISOString(), sentVia: p.data.via, sentTo: p.data.to },
    `Enlace enviado por ${label} a ${p.data.to}.${p.data.note ? ` Nota: ${p.data.note}` : ""}`,
  );
  redirect(`/consola?abierta=${p.data.id}`);
}

/** A free note on the request's history (calls, follow-ups). */
export async function addNote(fd: FormData): Promise<void> {
  if (!(await isConsole())) redirect("/consola/entrar");
  const id = String(fd.get("id") ?? "");
  const note = String(fd.get("note") ?? "").trim().slice(0, 500);
  if (id && note) await updateRequest(id, {}, `Nota: ${note}`);
  redirect(`/consola?abierta=${id}`);
}

export async function rejectRequest(fd: FormData): Promise<void> {
  if (!(await isConsole())) redirect("/consola/entrar");
  const id = String(fd.get("id") ?? "");
  await updateRequest(id, { status: "rejected", decidedAt: new Date().toISOString() }, "Rechazada.");
  redirect("/consola");
}
