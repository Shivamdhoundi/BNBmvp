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

  it("is mandatory immediately when no enforcement date is set", () => {
    // No MFA_ENFORCEMENT_DATE in the test env → mandatory now for admins.
    expect(isMfaMandatory("admin")).toBe(true);
    expect(isMfaMandatory("operations")).toBe(false);
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

  it("requires enrollment when a privileged user has no factor and MFA is mandatory", () => {
    expect(evaluateMfaGate({ role: "super_admin", hasVerifiedFactor: false, currentLevel: "aal1" })).toEqual({ kind: "enroll" });
  });
});
