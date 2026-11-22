import { describe, expect, it } from "vitest";
import { DEMO_CONFIG, businessConfigSchema, parseBusinessConfigRow, toBusinessConfigRow } from "./business-config";
import { themeCssVars } from "./themes";

const row = {
  name: "Marea Tours & Transfers",
  legal_name: null,
  contact_email: "reservas@marea.example",
  contact_whatsapp: "+506 8000 0000",
  locales: ["es", "en"],
  default_locale: "es",
  timezone: "America/Costa_Rica",
  currency: "USD",
  vat_rate: "0.1300",
  rounding: "whole_up",
  reservation_prefix: "MAR",
  payments_mode: "records",
  theme: { preset: "selva" },
  features: { transfers: true, activities: false },
};

describe("businessConfigSchema", () => {
  it("accepts the demo business", () => {
    expect(businessConfigSchema.safeParse(DEMO_CONFIG).success).toBe(true);
  });
  it("refuses values the database would also refuse", () => {
    const bad = (patch: object) => businessConfigSchema.safeParse({ ...DEMO_CONFIG, ...patch }).success;
    expect(bad({ reservationPrefix: "mar" })).toBe(false);
    expect(bad({ reservationPrefix: "MARIA" })).toBe(false);
    expect(bad({ vatRate: 1 })).toBe(false);
    expect(bad({ vatRate: -0.1 })).toBe(false);
    expect(bad({ timezone: "Mars/Olympus" })).toBe(false);
    expect(bad({ currency: "usd" })).toBe(false);
    expect(bad({ paymentsMode: "bank" })).toBe(false);
    expect(bad({ locales: ["en"], defaultLocale: "es" })).toBe(false);
    expect(bad({ theme: { preset: "marea", brand: "red" } })).toBe(false);
  });
});

describe("parseBusinessConfigRow", () => {
  it("maps a PostgREST row (numeric as string) into the contract", () => {
    const c = parseBusinessConfigRow(row);
    expect(c).not.toBeNull();
    expect(c!.vatRate).toBe(0.13);
    expect(c!.theme.preset).toBe("selva");
    expect(c!.features).toEqual({ transfers: true, activities: false, privateDriver: false });
  });
  it("fails closed on an unusable row", () => {
    expect(parseBusinessConfigRow(null)).toBeNull();
    expect(parseBusinessConfigRow({ ...row, vat_rate: "abc" })).toBeNull();
  });
  it("round-trips through toBusinessConfigRow", () => {
    const c = parseBusinessConfigRow(row)!;
    expect(parseBusinessConfigRow(toBusinessConfigRow(c))).toEqual(c);
  });
});

describe("themeCssVars", () => {
  it("returns the preset colors", () => {
    expect(themeCssVars("marea")["--brand"]).toBe("#002b42");
    expect(themeCssVars("oceano")["--accent"]).toBe("#f0a35e");
  });
  it("applies valid overrides and ignores anything that is not a hex color", () => {
    expect(themeCssVars("marea", { brand: "#123456" })["--brand"]).toBe("#123456");
    expect(themeCssVars("marea", { brand: "red;}body{display:none" })["--brand"]).toBe("#002b42");
  });
});
