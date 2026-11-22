import { describe, expect, it, vi } from "vitest";
import { catalogDraftSchema, sampleCatalog } from "@altair/config";

vi.mock("server-only", () => ({}));

describe("Excel template", () => {
  it("round-trips the sample catalog: download, re-upload, same draft", async () => {
    const { catalogWorkbook, parseCatalogWorkbook } = await import("./spreadsheet");
    const sample = catalogDraftSchema.parse(sampleCatalog());
    const buf = await catalogWorkbook(sample);
    const back = await parseCatalogWorkbook(buf);
    expect(back.problems).toEqual([]);
    expect(back.draft?.areas).toHaveLength(sample.areas!.length);
    expect(back.draft?.rates).toHaveLength(sample.rates!.length);
    expect(back.draft?.activities?.[0]?.schedules?.map((s) => s.time)).toEqual(sample.activities![0]!.schedules!.map((s) => s.time));
    const rate = back.draft!.rates!.find((r) => r.from === "Aeropuerto SJO" && r.to === "Tamarindo" && r.vehicle === "Sedán" && !r.season);
    expect(rate?.price).toBe(210);
  });

  it("an empty template has headers and nothing to import", async () => {
    const { catalogWorkbook, parseCatalogWorkbook } = await import("./spreadsheet");
    const back = await parseCatalogWorkbook(await catalogWorkbook({}));
    expect(back.draft).toBeNull();
  });

  it("a file that is not a workbook is refused with a clear message", async () => {
    const { parseCatalogWorkbook } = await import("./spreadsheet");
    const back = await parseCatalogWorkbook(Buffer.from("not an excel file"));
    expect(back.draft).toBeNull();
    expect(back.problems[0]).toMatch(/plantilla/);
  });
});
