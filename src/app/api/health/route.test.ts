import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ admin: vi.fn(), configured: vi.fn(), secret: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));
vi.mock("@/lib/env.server", () => ({ isHealthcheckConfigured: mocks.configured, getHealthcheckSecret: mocks.secret }));
import { GET } from "./route";
const secret = "test-health-secret-at-least-32-characters";
function request(token?: string) { return new NextRequest("http://localhost/api/health", { headers: token ? { authorization: token } : {} }); }
describe("protected health probe", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.configured.mockReturnValue(true); mocks.secret.mockReturnValue(secret); });
  it.each([undefined, "Bearer wrong", `Bearer ${secret} extra`])("rejects invalid credentials before using service privileges", async token => {
    expect((await GET(request(token))).status).toBe(401);
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("reports database health without returning records", async () => {
    const probe = { select: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), abortSignal: vi.fn().mockResolvedValue({ error: null }) };
    mocks.admin.mockReturnValue({ from: vi.fn().mockReturnValue(probe) });
    const result = await GET(request(`Bearer ${secret}`));
    expect(result.status).toBe(200); expect(await result.json()).toEqual({ status: "ok" });
    expect(probe.select).toHaveBeenCalledWith("id", { head: true });
    expect(probe.limit).toHaveBeenCalledWith(1);
  });
  it("does not expose configuration or backend errors", async () => {
    mocks.admin.mockImplementation(() => { throw new Error("secret configuration error"); });
    const result = await GET(request(`Bearer ${secret}`));
    expect(result.status).toBe(503); expect(await result.json()).toEqual({ status: "unavailable" });
  });
});
