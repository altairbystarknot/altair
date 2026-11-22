import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { list, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Sign-up requests. Development keeps them in a local JSON file (apps/hub/.data, gitignored). In
// production the hub stores them in Starknot's own hub database; the interface stays the same.

export type RequestStatus = "pending" | "approved" | "rejected";

export type SignupRequest = {
  id: string;
  createdAt: string;
  status: RequestStatus;
  business: string;
  contactName: string;
  email: string;
  whatsapp: string;
  country: string;
  services: string[];
  website: string;
  notes: string;
  /** Language of the site the request came from ("es" or "en"); older requests have none. */
  locale?: string;
  decidedAt?: string;
  instanceUrl?: string;
  claimLink?: string;
  /** When the current claim link was generated (links are valid 7 days, one use). */
  linkCreatedAt?: string;
  /** Starknot sends the link by hand; these record that it was sent, how and to whom. */
  sentAt?: string;
  sentVia?: string;
  sentTo?: string;
  provisionLog?: string[];
  /** Everything that happened to this request, newest last. */
  history?: Array<{ at: string; what: string }>;
};

const FILE = path.join(process.cwd(), ".data", "requests.json");

// Where the requests live. In development: a local JSON file. In production (Vercel, read-only disk):
// one object in Vercel Blob, ENCRYPTED with AES-256-GCM under a key derived from HUB_SESSION_SECRET, so
// the stored object reveals nothing even if its URL were known.
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN ?? "";
const BLOB_PATH = "hub/requests.v1.enc";

function storeKey(): Buffer {
  const s = process.env.HUB_SESSION_SECRET ?? "";
  if (s.length < 32) throw new Error("HUB_SESSION_SECRET is not configured");
  return createHash("sha256").update(`altair-hub-store:${s}`).digest();
}
function seal(text: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", storeKey(), iv);
  const body = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString("base64");
}
function open(b64: string): string {
  const raw = Buffer.from(b64, "base64");
  const d = createDecipheriv("aes-256-gcm", storeKey(), raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8");
}

async function readAll(): Promise<SignupRequest[]> {
  if (BLOB_TOKEN) {
    const { blobs } = await list({ prefix: BLOB_PATH, token: BLOB_TOKEN });
    const b = blobs.find((x) => x.pathname === BLOB_PATH);
    if (!b) return [];
    const r = await fetch(`${b.url}?v=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) throw new Error(`request store unavailable (${r.status})`);
    return JSON.parse(open(await r.text())) as SignupRequest[];
  }
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as SignupRequest[];
  } catch {
    return [];
  }
}

async function writeAll(rows: SignupRequest[]) {
  if (BLOB_TOKEN) {
    await put(BLOB_PATH, seal(JSON.stringify(rows)), { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "text/plain", cacheControlMaxAge: 60, token: BLOB_TOKEN });
    return;
  }
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}

export async function listRequests(): Promise<SignupRequest[]> {
  return (await readAll()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getRequest(id: string): Promise<SignupRequest | null> {
  return (await readAll()).find((r) => r.id === id) ?? null;
}

export async function addRequest(r: Omit<SignupRequest, "id" | "createdAt" | "status">): Promise<SignupRequest> {
  const rows = await readAll();
  const now = new Date().toISOString();
  const row: SignupRequest = { ...r, id: randomUUID(), createdAt: now, status: "pending", history: [{ at: now, what: "Solicitud recibida desde el sitio." }] };
  rows.push(row);
  await writeAll(rows.slice(-2000));
  return row;
}

export async function updateRequest(id: string, patch: Partial<SignupRequest>, event?: string): Promise<SignupRequest | null> {
  const rows = await readAll();
  const i = rows.findIndex((r) => r.id === id);
  if (i < 0) return null;
  const history = [...(rows[i]!.history ?? []), ...(event ? [{ at: new Date().toISOString(), what: event.slice(0, 500) }] : [])];
  rows[i] = { ...rows[i]!, ...patch, history: history.slice(-100) };
  await writeAll(rows);
  return rows[i]!;
}
