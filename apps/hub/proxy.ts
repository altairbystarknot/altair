import { NextResponse, type NextRequest } from "next/server";

// Altair's site lives under /es and /en. "/" and any unprefixed path (including the old /como-funciona,
// /producto, /claude, /historia and /solicitar) go to the visitor's language from Accept-Language,
// Spanish by default. The console, Next's own files and public files are never touched.

function preferred(header: string | null): "es" | "en" {
  if (!header) return "es";
  const prefs = header
    .split(",")
    .map((part, i) => {
      const [tag = "", ...rest] = part.trim().toLowerCase().split(";");
      const q = rest.map((r) => r.trim()).find((r) => r.startsWith("q="));
      return { tag, q: q ? Number(q.slice(2)) || 0 : 1, i };
    })
    .sort((a, b) => b.q - a.q || a.i - b.i);
  for (const p of prefs) {
    if (p.tag.startsWith("es")) return "es";
    if (p.tag.startsWith("en")) return "en";
  }
  return "es";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";
  if (first === "es" || first === "en") return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/${preferred(request.headers.get("accept-language"))}${pathname === "/" ? "" : pathname}`;
  const res = NextResponse.redirect(url);
  res.headers.set("Vary", "Accept-Language");
  return res;
}

export const config = {
  matcher: ["/((?!_next/|api/|consola|media/|.*\\.[a-zA-Z0-9]+$).*)"],
};
