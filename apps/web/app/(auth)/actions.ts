"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { mfaStatus, readCode, verifyChallenge, verifyEnroll } from "@/lib/auth/mfa";
import { safePanelReturn, withReturn } from "@/lib/auth/safe-return";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase/server";

// Sign-in, second factor and sign-out. These run BEFORE the session reaches aal2, so they are the only
// server actions allowed to skip requireStaff() (allow-listed in tooling/verify/server-action-gates.mjs).
// Accounts are created only through the owner's claim link or a team invitation (both checked by a door).
// Errors are generic on purpose: never reveal whether an email exists or why a code failed.

export type FormState = { error: string | null };

const NOT_CONFIGURED = "Este entorno todavía no tiene Supabase configurado (ver apps/web/.env.example).";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Escriba su correo y su contraseña." };

  if (!allowRequest(clientKey(await headers(), "login"), 10)) {
    return { error: "Demasiados intentos. Espere un minuto e intente de nuevo." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Correo o contraseña incorrectos." };

  revalidatePath("/", "layout");
  const next = safePanelReturn(formData.get("next"));
  const status = await mfaStatus(supabase);
  // redirect() throws, so it stays outside any try/catch.
  if (status === "needs_enrollment") redirect(withReturn("/mfa/enroll", next));
  if (status === "needs_challenge") redirect(withReturn("/mfa", next));
  redirect(next);
}

export async function submitChallenge(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };
  const code = readCode(formData.get("code"));
  if (code.length !== 6) return { error: "Escriba los 6 dígitos." };
  if (!allowRequest(clientKey(await headers(), "mfa"), 10)) {
    return { error: "Demasiados intentos. Espere un minuto e intente de nuevo." };
  }
  const supabase = await createServerSupabase();
  if (!(await verifyChallenge(supabase, code))) return { error: "Código incorrecto. Intente de nuevo." };
  revalidatePath("/", "layout");
  redirect(safePanelReturn(formData.get("next")));
}

export async function submitEnrollment(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };
  const code = readCode(formData.get("code"));
  const factorId = String(formData.get("factorId") ?? "");
  if (!factorId) return { error: "La activación venció. Recargue la página e intente de nuevo." };
  if (code.length !== 6) return { error: "Escriba los 6 dígitos de su app de autenticación." };
  if (!allowRequest(clientKey(await headers(), "mfa"), 10)) {
    return { error: "Demasiados intentos. Espere un minuto e intente de nuevo." };
  }
  const supabase = await createServerSupabase();
  if (!(await verifyEnroll(supabase, factorId, code))) return { error: "Código incorrecto. Intente de nuevo." };
  revalidatePath("/", "layout");
  redirect(safePanelReturn(formData.get("next")));
}

export async function logout(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

// ---------------------------------------------------------------------------------------------------
// Joining: the business owner claims a NEW instance with the one-time link Starknot sent, and team
// members accept the owner's invitation. Both create (or reuse) a sign-in, then a database door checks
// the one-time token. No staff role exists yet at this point, hence the allow-list entry.
// ---------------------------------------------------------------------------------------------------

const PASSWORD_RULE = "La contraseña necesita al menos 10 caracteres.";

async function signUpOrIn(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (!error && data.session) return { ok: true };
  // The account may already exist (for example, staff of another business): sign in instead.
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (!signIn.error) return { ok: true };
  if (!error && !data.session) return { ok: false, error: "Le enviamos un correo para confirmar su cuenta. Ábralo y vuelva a este enlace." };
  return { ok: false, error: "No pudimos crear su acceso con esos datos. Si ya tiene cuenta, use su contraseña actual." };
}

export async function claimInstance(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };
  if (!allowRequest(clientKey(await headers(), "claim"), 6)) return { error: "Demasiados intentos. Espere un minuto." };
  const token = String(formData.get("token") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (fullName.length < 2) return { error: "Escriba su nombre." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Escriba un correo válido." };
  if (password.length < 10) return { error: PASSWORD_RULE };

  const auth = await signUpOrIn(email, password);
  if (!auth.ok) return { error: auth.error };
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("instance_claim", { p_token: token, p_full_name: fullName });
  if (error) {
    await supabase.auth.signOut();
    return { error: error.code === "P0001" ? "Este sistema ya tiene dueño. Inicie sesión desde el panel." : "Este enlace ya no es válido. Solicite uno nuevo a Starknot." };
  }
  revalidatePath("/", "layout");
  redirect(withReturn("/mfa/enroll", "/panel/configurar"));
}

export async function acceptInvite(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };
  if (!allowRequest(clientKey(await headers(), "invite"), 6)) return { error: "Demasiados intentos. Espere un minuto." };
  const token = String(formData.get("token") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) return { error: PASSWORD_RULE };

  const check = await (await createServerSupabase()).rpc("staff_invite_check", { p_token: token });
  const invite = check.data as { valid: boolean; email?: string } | null;
  if (!invite?.valid || !invite.email) return { error: "Esta invitación ya no es válida. Solicite una nueva al dueño del negocio." };

  const auth = await signUpOrIn(invite.email, password);
  if (!auth.ok) return { error: auth.error };
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("staff_invite_accept", { p_token: token, p_full_name: fullName });
  if (error) {
    await supabase.auth.signOut();
    return { error: "No pudimos aceptar la invitación. Solicite una nueva al dueño del negocio." };
  }
  revalidatePath("/", "layout");
  redirect(withReturn("/mfa/enroll", "/panel"));
}
