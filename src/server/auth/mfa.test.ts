import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
const mocks = vi.hoisted(() => ({ aal: vi.fn(), factors: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { mfa: {
  getAuthenticatorAssuranceLevel: mocks.aal, listFactors: mocks.factors,
} } }) }));
import { getMfaSnapshot } from "./mfa";

describe("MFA failures deny access", () => {
  it("does not treat an unavailable factor service as an unenrolled user", async () => {
    mocks.aal.mockResolvedValue({ data: { currentLevel: 'aal1' }, error: null });
    mocks.factors.mockResolvedValue({ data: null, error: new Error('unavailable') });
    await expect(getMfaSnapshot()).rejects.toThrow('Unable to verify');
  });
  it("does not allow access when assurance cannot be verified", async () => {
    mocks.aal.mockResolvedValue({ data: null, error: new Error('unavailable') });
    mocks.factors.mockResolvedValue({ data: { totp: [] }, error: null });
    await expect(getMfaSnapshot()).rejects.toThrow('Unable to verify');
  });
});
