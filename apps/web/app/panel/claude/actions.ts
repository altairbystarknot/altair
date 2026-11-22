"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/staff";
import { createServerSupabase } from "@/lib/supabase/server";

// Disconnect a Claude connection. Anyone revokes their own; owner/admin revoke anyone's (RLS decides).
export async function revokeGrant(formData: FormData): Promise<void> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb);
  if (!staff) redirect("/login");
  const id = String(formData.get("id") ?? "");
  const { data } = await sb.from("oauth_grants").update({ revoked_at: new Date().toISOString() }).eq("id", id).is("revoked_at", null).select("id");
  if (data?.length) await sb.rpc("audit_log", { p_action: "claude.disconnected", p_target: id, p_detail: {} });
  revalidatePath("/panel/claude");
  redirect("/panel/claude?ok=desconectado");
}

// ---------------------------------------------------------------------------------------------------
// Consent for a new Claude connection (OAuth). The request arrives in a signed cookie from
// /oauth/authorize; approving asks the database for a single-use code bound to the PKCE challenge and
// returns where the browser must go next (the client navigates, so CSP form-action stays 'self').
// ---------------------------------------------------------------------------------------------------

export type ConsentResult = { url: string | null; error: string | null };

export async function approveConnection(scopes: string[]): Promise<ConsentResult> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb);
  if (!staff) return { url: null, error: "Su sesión venció. Vuelva a entrar." };
  const { OAUTH_COOKIE, ROLE_SCOPES, openRequest } = await import("@/lib/mcp/oauth");
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const req = openRequest(jar.get(OAUTH_COOKIE)?.value);
  if (!req) return { url: null, error: "La solicitud venció. Conecte de nuevo desde Claude." };
  const allowed = ROLE_SCOPES[staff.role] ?? [];
  const granted = allowed.filter((s) => scopes.includes(s));
  if (!granted.length) return { url: null, error: "Elija al menos un permiso." };
  const { data, error } = await sb.rpc("oauth_code_issue", {
    p_client_id: req.clientId,
    p_redirect_uri: req.redirectUri,
    p_scopes: granted,
    p_code_challenge: req.challenge,
    p_resource: req.resource,
  });
  if (error || typeof data !== "string") return { url: null, error: "No se pudo autorizar. Intente de nuevo desde Claude." };
  jar.delete(OAUTH_COOKIE);
  const to = new URL(req.redirectUri);
  to.searchParams.set("code", data);
  if (req.state) to.searchParams.set("state", req.state);
  const { siteOrigin } = await import("@/lib/site-url");
  to.searchParams.set("iss", await siteOrigin());
  revalidatePath("/panel/claude");
  return { url: to.toString(), error: null };
}

export async function denyConnection(): Promise<ConsentResult> {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb);
  if (!staff) return { url: null, error: "Su sesión venció." };
  const { OAUTH_COOKIE, openRequest } = await import("@/lib/mcp/oauth");
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const req = openRequest(jar.get(OAUTH_COOKIE)?.value);
  jar.delete(OAUTH_COOKIE);
  if (!req) return { url: "/panel/claude", error: null };
  const to = new URL(req.redirectUri);
  to.searchParams.set("error", "access_denied");
  if (req.state) to.searchParams.set("state", req.state);
  return { url: to.toString(), error: null };
}
