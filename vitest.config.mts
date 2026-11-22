import path from "node:path";
import { defineConfig } from "vitest/config";

// One test run for every workspace package. Pure domain code (money, dates, codes, config, engines) and the
// web app's server libraries are tested here; database rules are tested by `npm run test:db` against a
// real Postgres (core/tooling/db-test).
export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "apps/web") } },
  test: {
    include: ["packages/*/src/**/*.test.ts", "core/packages/*/src/**/*.test.ts", "apps/web/lib/**/*.test.ts", "tooling/**/*.test.mjs", "core/tooling/**/*.test.mjs"],
    environment: "node",
  },
});
