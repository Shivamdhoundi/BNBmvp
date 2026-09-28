import { describe, expect, it } from "vitest";

import { evaluateMfaGate, isMfaMandatory, roleRequiresMfa } from "@/lib/auth/mfa";

describe("MFA policy", () => {
  it("requires MFA only for privileged roles", () => {
    expect(roleRequiresMfa("super_admin")).toBe(true);
    expect(roleRequiresMfa("admin")).toBe(true);
    expect(roleRequiresMfa("operations")).toBe(false);
    expect(roleRequiresMfa("owner")).toBe(false);
    expect(roleRequiresMfa("vendor")).toBe(false);
  });

  it("is not hard-mandatory when no enforcement date is set (lockout prevention)", () => {
    // No MFA_ENFORCEMENT_DATE → prompt-only, not a hard block, for admins.
    expect(isMfaMandatory("admin")).toBe(false);
    expect(isMfaMandatory("operations")).toBe(false);
  });

  it("becomes mandatory once a past enforcement date is configured", () => {
    const original = process.env.MFA_ENFORCEMENT_DATE;
    process.env.MFA_ENFORCEMENT_DATE = "2020-01-01T00:00:00Z";
    try {
      expect(isMfaMandatory("admin")).toBe(true);
      expect(isMfaMandatory("operations")).toBe(false);
    } finally {
      if (original === undefined) delete process.env.MFA_ENFORCEMENT_DATE;
      else process.env.MFA_ENFORCEMENT_DATE = original;
    }
  });

  it("allows non-privileged roles through the gate", () => {
    expect(evaluateMfaGate({ role: "operations", hasVerifiedFactor: false, currentLevel: "aal1" })).toEqual({ kind: "allow" });
  });

  it("requires verification when a privileged user has a factor but is only AAL1", () => {
    expect(evaluateMfaGate({ role: "admin", hasVerifiedFactor: true, currentLevel: "aal1" })).toEqual({ kind: "verify" });
  });

  it("allows a privileged user at AAL2", () => {
    expect(evaluateMfaGate({ role: "admin", hasVerifiedFactor: true, currentLevel: "aal2" })).toEqual({ kind: "allow" });
  });

  it("allows a privileged user without a factor when enforcement is not yet mandatory", () => {
    // No enforcement date configured → not hard-blocked (lockout prevention).
    expect(evaluateMfaGate({ role: "super_admin", hasVerifiedFactor: false, currentLevel: "aal1" })).toEqual({ kind: "allow" });
  });

  it("requires enrollment when a privileged user has no factor and enforcement is active", () => {
    const past = new Date("2020-01-01T00:00:00Z");
    const original = process.env.MFA_ENFORCEMENT_DATE;
    process.env.MFA_ENFORCEMENT_DATE = past.toISOString();
    try {
      expect(evaluateMfaGate({ role: "super_admin", hasVerifiedFactor: false, currentLevel: "aal1", now: new Date() })).toEqual({ kind: "enroll" });
    } finally {
      if (original === undefined) delete process.env.MFA_ENFORCEMENT_DATE;
      else process.env.MFA_ENFORCEMENT_DATE = original;
    }
  });
});
