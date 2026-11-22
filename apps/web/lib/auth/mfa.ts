import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";

// The ONE place the Supabase TOTP sequence lives.
// Staff sign in with email + password, then a 6-digit code from an authenticator app, which raises the
// session to aal2. Two-step is mandatory: the panel and every staff policy require aal2.
// FAIL-CLOSED: an undeterminable session is "needs a code", never "satisfied".

export type MfaStatus = "satisfied" | "needs_challenge" | "needs_enrollment";

export async function mfaStatus(supabase: ServerSupabase): Promise<MfaStatus> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) return "needs_challenge";
    if (data.currentLevel === "aal2") return "satisfied";
    if (data.nextLevel === "aal2") return "needs_challenge";
    return "needs_enrollment";
  } catch {
    return "needs_challenge";
  }
}

async function firstVerifiedTotpFactorId(supabase: ServerSupabase): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error || !data) return null;
    return data.totp[0]?.id ?? null;
  } catch {
    return null;
  }
}

/** Supabase returns the QR as a data URL or as raw SVG depending on version; normalize both. */
function normalizeQrCode(qr: string): string {
  return qr.startsWith("data:") ? qr : `data:image/svg+xml;utf-8,${encodeURIComponent(qr)}`;
}

export type BeginEnrollResult = { factorId: string; qrCode: string; secret: string } | { error: string };

/** Start TOTP enrollment. Clears stale unverified factors first (repeated visits), best effort. */
export async function beginEnroll(supabase: ServerSupabase, issuer: string): Promise<BeginEnrollResult> {
  try {
    const { data: list } = await supabase.auth.mfa.listFactors();
    const stale = (list?.all ?? []).filter((f) => f.factor_type === "totp" && f.status !== "verified");
    for (const f of stale) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", issuer });
    if (error || !data) return { error: "No se pudo iniciar la activación. Intente de nuevo." };
    return { factorId: data.id, qrCode: normalizeQrCode(data.totp.qr_code), secret: data.totp.secret };
  } catch {
    return { error: "No se pudo iniciar la activación. Intente de nuevo." };
  }
}

async function verifyCode(supabase: ServerSupabase, factorId: string, code: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    return !error;
  } catch {
    return false;
  }
}

/** Activate a just-enrolled factor. */
export function verifyEnroll(supabase: ServerSupabase, factorId: string, code: string): Promise<boolean> {
  return verifyCode(supabase, factorId, code);
}

/** Step up an existing verified factor at sign-in. */
export async function verifyChallenge(supabase: ServerSupabase, code: string): Promise<boolean> {
  const factorId = await firstVerifiedTotpFactorId(supabase);
  if (!factorId) return false;
  return verifyCode(supabase, factorId, code);
}

/** Keep only the digits of a submitted code (authenticator apps sometimes insert spaces). */
export function readCode(raw: unknown): string {
  return String(raw ?? "").replace(/\D/g, "").slice(0, 6);
}
