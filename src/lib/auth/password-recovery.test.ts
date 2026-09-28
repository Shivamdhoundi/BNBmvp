import { describe, expect, it } from "vitest";

import {
  createRecoveryMarker,
  getCanonicalAppOrigin,
  getRecoveryRedirectPath,
  isValidRecoveryMarker,
  RECOVERY_RESTART_PATH,
  RECOVERY_SUCCESS_PATH,
} from "@/lib/auth/password-recovery";

describe("recovery redirect path", () => {
  it("routes to reset only on a successful recovery exchange", () => {
    expect(getRecoveryRedirectPath({ hasCode: true, exchangeSucceeded: true, redirectType: "recovery" })).toBe(RECOVERY_SUCCESS_PATH);
  });

  it("routes to restart on failure, missing code, or wrong type", () => {
    expect(getRecoveryRedirectPath({ hasCode: false, exchangeSucceeded: false, redirectType: null })).toBe(RECOVERY_RESTART_PATH);
    expect(getRecoveryRedirectPath({ hasCode: true, exchangeSucceeded: false, redirectType: "recovery" })).toBe(RECOVERY_RESTART_PATH);
    expect(getRecoveryRedirectPath({ hasCode: true, exchangeSucceeded: true, redirectType: "signup" })).toBe(RECOVERY_RESTART_PATH);
  });
});

describe("recovery marker", () => {
  it("validates a fresh marker for the same user", () => {
    const now = 1_000_000_000_000;
    const marker = createRecoveryMarker("user-1", now);
    expect(isValidRecoveryMarker(marker, "user-1", now + 1000)).toBe(true);
  });

  it("rejects a marker for a different user", () => {
    const now = 1_000_000_000_000;
    const marker = createRecoveryMarker("user-1", now);
    expect(isValidRecoveryMarker(marker, "user-2", now)).toBe(false);
  });

  it("rejects an expired marker", () => {
    const now = 1_000_000_000_000;
    const marker = createRecoveryMarker("user-1", now);
    expect(isValidRecoveryMarker(marker, "user-1", now + 16 * 60 * 1000)).toBe(false);
  });

  it("rejects an empty marker", () => {
    expect(isValidRecoveryMarker(undefined, "user-1")).toBe(false);
  });
});

describe("canonical app origin", () => {
  it("accepts https origins", () => {
    expect(getCanonicalAppOrigin({ NEXT_PUBLIC_APP_URL: "https://app.example.com", NODE_ENV: "production" })).toBe("https://app.example.com");
  });

  it("rejects non-https production origins", () => {
    expect(() => getCanonicalAppOrigin({ NEXT_PUBLIC_APP_URL: "http://app.example.com", NODE_ENV: "production" })).toThrow();
  });

  it("allows localhost http in development", () => {
    expect(getCanonicalAppOrigin({ NEXT_PUBLIC_APP_URL: "http://localhost:3000", NODE_ENV: "development" })).toBe("http://localhost:3000");
  });
});
