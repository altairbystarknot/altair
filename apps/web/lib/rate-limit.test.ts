import { describe, expect, it } from "vitest";
import { allowRequest, clientKey } from "./rate-limit";

describe("allowRequest", () => {
  it("allows up to the limit inside the window, then refuses", () => {
    const k = `t-${Math.random()}`;
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) expect(allowRequest(k, 5, 60_000, t0 + i)).toBe(true);
    expect(allowRequest(k, 5, 60_000, t0 + 10)).toBe(false);
  });
  it("frees capacity once the window has passed", () => {
    const k = `t-${Math.random()}`;
    const t0 = 2_000_000;
    for (let i = 0; i < 3; i++) allowRequest(k, 3, 60_000, t0);
    expect(allowRequest(k, 3, 60_000, t0 + 1)).toBe(false);
    expect(allowRequest(k, 3, 60_000, t0 + 60_001)).toBe(true);
  });
});

describe("clientKey", () => {
  it("uses the first forwarded address", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" });
    expect(clientKey(h, "login")).toBe("login:203.0.113.9");
  });
});
