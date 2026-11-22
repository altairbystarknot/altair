import type { NextConfig } from "next";

// Static security headers for every response. The Content-Security-Policy is per request (it carries a
// nonce), so it lives in proxy.ts, not here.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // The production build type-checks the app without its unit tests (Vitest runs and checks those).
  typescript: { tsconfigPath: "tsconfig.build.json" },
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@altair/ui", "@altair/core", "@altair/config", "@altair/engine"],
  // Logo, photos and Excel files are uploaded through server actions (checked and size-capped there).
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
