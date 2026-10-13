import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ context: vi.fn(), gate: vi.fn(), limit: vi.fn(), list: vi.fn(), create: vi.fn() }));
vi.mock("@/server/auth/context", () => ({ getOrganizationContext: mocks.context }));
vi.mock("@/server/auth/mfa", () => ({ getMfaGate: mocks.gate }));
vi.mock("@/server/rate-limit", () => ({ enforceRateLimit: mocks.limit, RateLimitError: class extends Error {} }));
vi.mock("@/server/properties/service", () => ({ listProperties: mocks.list, createProperty: mocks.create }));
import { GET, POST } from "./route";

const request = (body: string, origin = "https://staypilot.example") => new Request("http://internal:3000/api/v1/properties", {
  method: "POST", headers: { origin, "content-type": "application/json" }, body,
});
describe("property API authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://staypilot.example");
    mocks.context.mockResolvedValue({ role: "admin", user: { id: "user" }, organization: { id: "org" } });
    mocks.gate.mockResolvedValue({ kind: "allow" });
    mocks.limit.mockResolvedValue(undefined);
    mocks.list.mockResolvedValue([]);
  });
  it("rejects anonymous reads", async () => {
    mocks.context.mockResolvedValue(null); expect((await GET()).status).toBe(401); expect(mocks.list).not.toHaveBeenCalled();
  });
  it("rejects vendors before accessing data", async () => {
    mocks.context.mockResolvedValue({ role: "vendor" }); expect((await GET()).status).toBe(403); expect(mocks.list).not.toHaveBeenCalled();
  });
  it("requires MFA on reads and writes, even with an active session", async () => {
    mocks.gate.mockResolvedValue({ kind: "verify" });
    expect((await GET()).status).toBe(403); expect((await POST(request('{}'))).status).toBe(403);
    expect(mocks.list).not.toHaveBeenCalled(); expect(mocks.create).not.toHaveBeenCalled();
  });
  it("rejects cross-origin writes before authentication or data access", async () => {
    expect((await POST(request('{}', 'https://evil.example'))).status).toBe(403); expect(mocks.context).not.toHaveBeenCalled();
  });
  it("accepts canonical origin behind an internal reverse proxy", async () => {
    expect((await POST(request('{'))).status).toBe(400); expect(mocks.limit).toHaveBeenCalled();
  });
  it("rejects oversized authenticated JSON requests", async () => {
    expect((await POST(request(JSON.stringify({ value: 'x'.repeat(17000) })))).status).toBe(413);
  });
  it("does not report backend failure as an authentication failure", async () => {
    mocks.list.mockRejectedValue(new Error('private backend detail'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try { const response = await GET(); expect(response.status).toBe(500); expect(await response.text()).not.toContain('private backend'); }
    finally { spy.mockRestore(); }
  });
});
