import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createSignedRecoveryMarker, isValidSignedRecoveryMarker } from "./recovery-marker";
afterEach(() => vi.unstubAllEnvs());
describe("signed recovery sessions", () => {
  it("rejects tampering, expiry and another user's marker", () => {
    vi.stubEnv("HEALTHCHECK_SECRET", "test-secret-at-least-thirty-two-characters-long");
    const now = Date.now();
    const marker = createSignedRecoveryMarker("user-1", now);
    expect(isValidSignedRecoveryMarker(marker,"user-1",now+1)).toBe(true);
    expect(isValidSignedRecoveryMarker(marker,"user-2",now)).toBe(false);
    expect(isValidSignedRecoveryMarker(marker,"user-1",now+16*60*1000)).toBe(false);
    expect(isValidSignedRecoveryMarker(marker.replace('user-1','user-2'),"user-2",now)).toBe(false);
    expect(isValidSignedRecoveryMarker(`user-1.${now}`,"user-1",now)).toBe(false);
  });
});
