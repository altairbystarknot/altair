import { describe, expect, it } from "vitest";
import { catalogDraftSchema, checkDraftReferences, draftKind, draftRowCount, sampleCatalog, slugify } from "./index";

describe("catalog drafts", () => {
  it("the sample catalog is a valid draft with consistent references", () => {
    const d = catalogDraftSchema.parse(sampleCatalog());
    expect(draftRowCount(d)).toBeGreaterThan(80);
    expect(draftKind(d)).toBe("catalog");
    expect(checkDraftReferences(d, { areas: [], vehicles: [], seasons: [] })).toEqual([]);
  });
  it("an empty draft is refused", () => {
    expect(catalogDraftSchema.safeParse({}).success).toBe(false);
    expect(catalogDraftSchema.safeParse({ rates: [] }).success).toBe(false);
  });
  it("finds rates that point at unknown areas or vehicles", () => {
    const d = catalogDraftSchema.parse({ rates: [{ from: "Aa", to: "Bb", vehicle: "Van", price: 10 }] });
    expect(draftKind(d)).toBe("rates");
    expect(checkDraftReferences(d, { areas: ["Bb"], vehicles: ["van"], seasons: [] })).toEqual([
      'Tarifa Aa → Bb: la zona "Aa" no existe',
    ]);
  });
  it("prices are before tax and may be empty (a quote), never negative", () => {
    expect(catalogDraftSchema.safeParse({ rates: [{ from: "Aa", to: "Bb", vehicle: "Van", price: null }] }).success).toBe(true);
    expect(catalogDraftSchema.safeParse({ rates: [{ from: "Aa", to: "Bb", vehicle: "Van", price: -1 }] }).success).toBe(false);
  });
  it("slugs", () => {
    expect(slugify("Tour de Perezosos y Vida Silvestre!")).toBe("tour-de-perezosos-y-vida-silvestre");
    expect(slugify("¿?")).toBe("actividad");
  });
});
