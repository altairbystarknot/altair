import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";

// Image uploads to the instance's own Supabase Storage, with the staff session (storage RLS: owner/admin
// at aal2). The type is checked from the file's first bytes, not from its name or the browser's claim.

const SIGNATURES: Array<{ type: string; ext: string; test: (b: Uint8Array) => boolean }> = [
  { type: "image/png", ext: "png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/webp", ext: "webp", test: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
];

export class UploadError extends Error {}

export async function uploadImage(sb: ServerSupabase, bucket: "brand" | "media", prefix: string, file: File, maxBytes = 5 * 1024 * 1024): Promise<string> {
  if (file.size === 0) throw new UploadError("El archivo está vacío.");
  if (file.size > maxBytes) throw new UploadError(`La imagen pesa más de ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const sig = SIGNATURES.find((s) => s.test(bytes));
  if (!sig) throw new UploadError("Use una imagen PNG, JPG o WebP.");
  const name = `${prefix.replace(/[^a-z0-9-]/gi, "")}-${Date.now().toString(36)}.${sig.ext}`;
  const { error } = await sb.storage.from(bucket).upload(name, bytes, { contentType: sig.type, upsert: false, cacheControl: "31536000" });
  if (error) throw new UploadError("No se pudo subir la imagen. Intente de nuevo.");
  return `${bucket}/${name}`;
}
