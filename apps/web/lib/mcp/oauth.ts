import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { guard } from "@/lib/doors";

// OAuth helpers for the Claude connector. The authorization request travels from /oauth/authorize to the
// consent screen inside the panel in a short-lived, signed, httpOnly cookie (so the panel URL stays a plain
// path the sign-in flow can return to). Codes and tokens themselves are issued and checked by the database.

export const OAUTH_COOKIE = "altair_oauth_req";

export const SCOPES = ["bookings:read", "ops:write", "catalog:draft", "messages:draft"] as const;
export type Scope = (typeof SCOPES)[number];

export const SCOPE_INFO: Record<Scope, { label: string; detail: string }> = {
  "bookings:read": { label: "Ver reservas, operación y catálogo", detail: "Leer reservas, servicios del día, tarifas y reportes." },
  "ops:write": { label: "Asignar servicios y cambiar estados", detail: "Asignar proveedor, conductor y vehículo; marcar servicios como hechos." },
  "catalog:draft": { label: "Proponer cambios de catálogo", detail: "Crear borradores de tarifas, zonas, vehículos y actividades. Una persona los publica." },
  "messages:draft": { label: "Redactar mensajes a clientes", detail: "Dejar borradores de WhatsApp o correo. Una persona los envía." },
};

export const ROLE_SCOPES: Record<string, Scope[]> = {
  owner: ["bookings:read", "ops:write", "catalog:draft", "messages:draft"],
  admin: ["bookings:read", "ops:write", "catalog:draft", "messages:draft"],
  ops: ["bookings:read", "ops:write", "messages:draft"],
  finance: ["bookings:read"],
  readonly: ["bookings:read"],
};

export type AuthRequest = {
  clientId: string;
  clientName: string;
  redirectUri: string;
  state: string | null;
  scopes: Scope[];
  challenge: string;
  resource: string | null;
  exp: number;
};

function key(): Buffer {
  return createHash("sha256").update(`altair-oauth-cookie:${guard("oauth")}`).digest();
}

export function sealRequest(req: AuthRequest): string {
  const body = Buffer.from(JSON.stringify(req)).toString("base64url");
  const sig = createHmac("sha256", key()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function openRequest(value: string | undefined): AuthRequest | null {
  if (!value) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", key()).update(body).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const req = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AuthRequest;
    return req.exp > Date.now() ? req : null;
  } catch {
    return null;
  }
}

/** PKCE S256: BASE64URL(SHA256(verifier)). */
export function s256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function parseScopes(raw: string | null | undefined): Scope[] {
  const asked = (raw ?? "").split(/\s+/).filter(Boolean);
  return SCOPES.filter((s) => asked.includes(s));
}

export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Protocol-Version, Mcp-Session-Id",
    "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
    "Access-Control-Max-Age": "86400",
  };
}
