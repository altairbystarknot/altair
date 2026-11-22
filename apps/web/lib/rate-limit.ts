// A small in-memory throttle (per warm server instance). An honest shock absorber against password
// guessing, not the real defense: mandatory two-step is. Fail-open by construction: it has no error path.

const buckets = new Map<string, number[]>();

export function allowRequest(key: string, limit: number, windowMs = 60_000, now = Date.now()): boolean {
  const since = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > since);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) buckets.clear(); // bound memory on a busy instance
  return true;
}

/** The client address as the platform reports it (first hop of x-forwarded-for on Vercel). */
export function clientKey(h: Headers, scope: string): string {
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || h.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}
