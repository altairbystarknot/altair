import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";

// Photos and product screenshots are dropped into public/media later. Until a file exists, its frame shows a
// quiet neutral surface instead of a broken image. Pages are prerendered, so the check runs at build time
// (and on every request in development, so a newly added file shows up on reload).
export function publicFileExists(src: string): boolean {
  try {
    return existsSync(path.join(process.cwd(), "public", src.replace(/^\/+/, "")));
  } catch {
    return false;
  }
}
