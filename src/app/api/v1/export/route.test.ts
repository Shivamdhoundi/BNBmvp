import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ context: vi.fn(), gate: vi.fn(), limit: vi.fn(), client: vi.fn() }));
vi.mock("@/server/auth/context", () => ({ getOrganizationContext: mocks.context }));
vi.mock("@/server/auth/mfa", () => ({ getMfaGate: mocks.gate }));
vi.mock("@/server/rate-limit", () => ({ enforceRateLimit: mocks.limit, RateLimitError: class extends Error {} }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
import { GET } from "./route";
const request = (query = "dataset=guests&from=2030-01-01&to=2030-01-31") => new Request(`https://staypilot.example/api/v1/export?${query}`);
describe("CSV export authorization and completeness", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.context.mockResolvedValue({ role: "admin", user: { id: "user" }, organization: { id: "org" } });
    mocks.gate.mockResolvedValue({ kind: "allow" });
  });
  it("rejects unauthenticated exports", async () => {
    mocks.context.mockResolvedValue(null); expect((await GET(request())).status).toBe(401); expect(mocks.client).not.toHaveBeenCalled();
  });
  it.each(["owner", "operations", "vendor"])("rejects %s exports", async role => {
    mocks.context.mockResolvedValue({ role }); expect((await GET(request())).status).toBe(403); expect(mocks.client).not.toHaveBeenCalled();
  });
  it("requires MFA before reading data", async () => {
    mocks.gate.mockResolvedValue({ kind: "verify" }); expect((await GET(request())).status).toBe(403); expect(mocks.client).not.toHaveBeenCalled();
  });
  it("rejects arbitrary table names and bad ranges", async () => {
    expect((await GET(request("dataset=users"))).status).toBe(400);
    expect((await GET(request("dataset=guests&from=2030-01-01&to=2032-01-01"))).status).toBe(400);
  });
  function backend(count: number, auditError: unknown = null) {
    const builder = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [{ id: "id", first_name: "=cmd", last_name: "Guest" }], count, error: null }) };
    const client = { from: vi.fn().mockReturnValue(builder), rpc: vi.fn().mockResolvedValue({ error: auditError }) };
    mocks.client.mockResolvedValue(client); return { builder, client };
  }
  it("refuses truncated results instead of exporting incomplete data", async () => {
    const { client } = backend(1001); expect((await GET(request())).status).toBe(413); expect(client.rpc).not.toHaveBeenCalled();
  });
  it("exports tenant-bound safe CSV only after audit succeeds", async () => {
    const { builder, client } = backend(1); const response = await GET(request());
    expect(response.status).toBe(200); expect(builder.eq).toHaveBeenCalledWith("organization_id", "org");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.text()).toContain("'=cmd");
    expect(client.rpc).toHaveBeenCalledWith("record_audit_event", expect.objectContaining({ input_action: "data.exported" }));
  });
  it("fails closed if auditing fails", async () => {
    backend(1, { message: "secret" }); const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try { const response = await GET(request()); expect(response.status).toBe(500); expect(await response.text()).not.toContain("secret"); } finally { log.mockRestore(); }
  });
});
