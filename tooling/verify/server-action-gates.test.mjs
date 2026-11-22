import { describe, expect, it } from "vitest";
import { checkSource } from "./server-action-gates.mjs";

const ALLOW = { "x/auth.ts": { login: "test" } };

describe("server-action gate check", () => {
  it("passes a gated action", () => {
    const src = `"use server";\nexport async function save(fd: FormData) { const s = await requireStaff(sb, ["owner"]); if (!s) return; }`;
    expect(checkSource("x/a.ts", src, ALLOW)).toEqual([]);
  });
  it("flags an action without requireStaff", () => {
    const src = `"use server";\nexport async function save(fd: FormData) { return 1; }`;
    expect(checkSource("x/a.ts", src, ALLOW)[0]).toMatch(/does not call requireStaff/);
  });
  it("does not accept requireStaff mentioned only in a comment or string", () => {
    const src = `"use server";\nexport async function save() { // requireStaff(\n const s = "requireStaff("; }`;
    expect(checkSource("x/a.ts", src, ALLOW)).toHaveLength(1);
  });
  it("honours the allow-list", () => {
    const src = `"use server";\nexport async function login() { return null; }`;
    expect(checkSource("x/auth.ts", src, ALLOW)).toEqual([]);
  });
  it("refuses exported arrow functions, re-exports and inline directives", () => {
    expect(checkSource("x/a.ts", `"use server";\nexport const go = async () => 1;`, ALLOW)[0]).toMatch(/only export async function declarations/);
    expect(checkSource("x/a.ts", `"use server";\nexport { x } from "./y";`, ALLOW)[0]).toMatch(/re-exports/);
    expect(checkSource("x/a.tsx", `export function C() { async function act() { "use server"; } return null; }`, ALLOW)[0]).toMatch(/inline "use server"/);
  });
  it("allows type exports", () => {
    expect(checkSource("x/a.ts", `"use server";\nexport type S = { ok: boolean };\nexport type { T } from "./t";`, ALLOW)).toEqual([]);
  });
});
