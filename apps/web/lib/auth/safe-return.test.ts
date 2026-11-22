import { describe, expect, it } from "vitest";
import { safePanelReturn, withReturn } from "./safe-return";

describe("safePanelReturn", () => {
  it("keeps plain panel paths", () => {
    expect(safePanelReturn("/panel")).toBe("/panel");
    expect(safePanelReturn("/panel/ajustes")).toBe("/panel/ajustes");
    expect(safePanelReturn("/panel/reservas/MAR-0042")).toBe("/panel/reservas/MAR-0042");
  });
  it("turns anything that could leave the site into /panel", () => {
    for (const bad of [
      "https://evil.example/panel",
      "//evil.example",
      "/\\evil",
      "/panel@evil.example",
      "/panel/../login",
      "/panel/%2F%2Fevil",
      "/panel?x=1",
      "/panel#x",
      "/paneles",
      "/panel/a/b/c/d/e",
      "x".repeat(300),
      null,
      42,
    ]) {
      expect(safePanelReturn(bad)).toBe("/panel");
    }
  });
});

describe("withReturn", () => {
  it("carries a safe target and drops the default", () => {
    expect(withReturn("/login", "/panel/ajustes")).toBe("/login?next=%2Fpanel%2Fajustes");
    expect(withReturn("/mfa", "/panel")).toBe("/mfa");
    expect(withReturn("/mfa/enroll", "https://evil.example")).toBe("/mfa/enroll");
  });
});
