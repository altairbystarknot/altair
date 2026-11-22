import { supabaseEnv } from "@/lib/env";

// Media paths are either app assets ("/sample/turtle.jpg") or Supabase Storage objects ("brand/logo.png",
// "media/activities/x.jpg"). Never arbitrary URLs: the CSP only allows our origin and the instance's own
// Supabase project for images.
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("/")) return path;
  const env = supabaseEnv();
  if (!env) return null;
  const [bucket, ...rest] = path.split("/");
  if ((bucket !== "brand" && bucket !== "media") || rest.length === 0) return null;
  return `${env.url}/storage/v1/object/public/${bucket}/${rest.map(encodeURIComponent).join("/")}`;
}
