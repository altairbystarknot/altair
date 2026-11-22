// Where a staff member lands after signing in.
//
// A return target is accepted ONLY when it is a panel PATH made of plain segments: "/panel", then at most
// four "/<letters, digits, - or _>" segments. No scheme, host, "//", backslash, dot, percent, "?" or "#".
// Anything else reads as "/panel", so redirect() to it can never leave this site. Checked on every hop.

export const DEFAULT_RETURN = "/panel";

const SAFE_PANEL_PATH = /^\/panel(?:\/[A-Za-z0-9_-]{1,80}){0,4}$/;

export function safePanelReturn(raw: unknown): string {
  if (typeof raw !== "string" || raw.length > 200) return DEFAULT_RETURN;
  return SAFE_PANEL_PATH.test(raw) ? raw : DEFAULT_RETURN;
}

export function withReturn(page: "/login" | "/mfa" | "/mfa/enroll", next: unknown): string {
  const safe = safePanelReturn(next);
  return safe === DEFAULT_RETURN ? page : `${page}?next=${encodeURIComponent(safe)}`;
}
