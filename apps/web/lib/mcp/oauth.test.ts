import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

beforeAll(() => {
  process.env.ALTAIR_GUARD_OAUTH = "test-oauth-guard-0123456789abcdef0123456789";
  process.env.ALTAIR_GUARD_MCP = "test-mcp-guard-0123456789abcdef0123456789ab";
});

describe("OAuth helpers", () => {
  it("PKCE S256 is base64url(sha256(verifier)) with no padding", async () => {
    const { s256 } = await import("./oauth");
    expect(s256("abc")).toBe("ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0"); // SHA-256("abc"), FIPS 180-2
  });

  it("a sealed authorization request opens only untampered and unexpired", async () => {
    const { openRequest, sealRequest } = await import("./oauth");
    const req = { clientId: "altair_x", clientName: "Claude", redirectUri: "https://claude.ai/api/mcp/auth_callback", state: "s", scopes: ["bookings:read" as const], challenge: "c".repeat(43), resource: null, exp: Date.now() + 60_000 };
    const sealed = sealRequest(req);
    expect(openRequest(sealed)?.clientId).toBe("altair_x");
    const [body, sig] = sealed.split(".");
    const forged = Buffer.from(JSON.stringify({ ...req, redirectUri: "https://evil.example/cb" })).toString("base64url");
    expect(openRequest(`${forged}.${sig}`)).toBeNull();
    expect(openRequest(`${body}.x${sig!.slice(1)}`)).toBeNull();
    expect(openRequest(sealRequest({ ...req, exp: Date.now() - 1 }))).toBeNull();
    expect(openRequest(undefined)).toBeNull();
  });

  it("only known scopes survive parsing, and money is not one of them", async () => {
    const { parseScopes, ROLE_SCOPES } = await import("./oauth");
    expect(parseScopes("bookings:read payments:write ops:write")).toEqual(["bookings:read", "ops:write"]);
    expect(Object.values(ROLE_SCOPES).flat().some((s) => s.includes("pay"))).toBe(false);
    expect(ROLE_SCOPES.readonly).toEqual(["bookings:read"]);
  });
});

describe("connector tools", () => {
  it("lists only the tools a connection's scopes allow, each with a JSON schema", async () => {
    const { toolList } = await import("./tools");
    const readOnly = toolList(["bookings:read"]).map((t) => t.name);
    expect(readOnly).toContain("resumen_del_dia");
    expect(readOnly).not.toContain("asignar_servicio");
    expect(readOnly).not.toContain("proponer_cambios_catalogo");
    const all = toolList(["bookings:read", "ops:write", "catalog:draft", "messages:draft"]);
    expect(all).toHaveLength(10);
    for (const t of all) expect((t.inputSchema as { type?: string }).type).toBe("object");
  });

  it("rejects invalid arguments before touching the database", async () => {
    const { callTool } = await import("./tools");
    const r = await callTool("ver_reserva", { codigo: "" }, { token: "t", origin: "http://x" });
    expect(r.isError).toBe(true);
    const unknown = await callTool("borrar_todo", {}, { token: "t", origin: "http://x" });
    expect(unknown.isError).toBe(true);
  });
});
