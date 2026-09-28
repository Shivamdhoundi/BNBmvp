import type { AppRole } from "@/lib/permissions";

/**
 * Roles that must complete TOTP MFA before accessing privileged operations.
 * Financial/owner-payment access maps to these administrative roles today.
 */
const MFA_REQUIRED_ROLES: readonly AppRole[] = ["super_admin", "admin"];

/**
 * Optional enforcement deadline. Before this date, privileged users without a
 * verified factor are prompted to enroll but not hard-blocked (grace period).
 * After it, enrollment is mandatory. Unset means no grace period is applied.
 */
export function getMfaEnforcementDate(
  environment: Record<string, string | undefined> = process.env,
): Date | null {
  const raw = environment.MFA_ENFORCEMENT_DATE?.trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function roleRequiresMfa(role: AppRole): boolean {
  return MFA_REQUIRED_ROLES.includes(role);
}

/**
 * Whether MFA enrollment is mandatory right now for the given role.
 *
 * Enforcement requires an explicitly configured MFA_ENFORCEMENT_DATE. Until an
 * administrator sets that date (and enrolls a recovery-capable factor), the app
 * prompts enrollment but does not hard-block privileged access, preventing an
 * accidental single-admin lockout on first deploy. Once a factor is verified,
 * the AAL2 verify gate always applies regardless of this date.
 */
export function isMfaMandatory(role: AppRole, now = new Date()): boolean {
  if (!roleRequiresMfa(role)) return false;
  const enforcementDate = getMfaEnforcementDate();
  if (!enforcementDate) return false;
  return now >= enforcementDate;
}

export type AssuranceLevel = "aal1" | "aal2" | null;

export type MfaGateDecision =
  | { kind: "allow" }
  | { kind: "enroll" }
  | { kind: "verify" };

/**
 * Decides the MFA gate for a privileged surface given the user's role, whether
 * they have a verified factor, and their current assurance level.
 *
 * - verify: has a factor but session is only AAL1 -> must complete a challenge.
 * - enroll: required and no verified factor -> must enroll (mandatory or grace).
 * - allow: requirement satisfied or not applicable.
 */
export function evaluateMfaGate(input: {
  role: AppRole;
  hasVerifiedFactor: boolean;
  currentLevel: AssuranceLevel;
  now?: Date;
}): MfaGateDecision {
  const { role, hasVerifiedFactor, currentLevel } = input;

  if (!roleRequiresMfa(role)) return { kind: "allow" };

  if (hasVerifiedFactor) {
    return currentLevel === "aal2" ? { kind: "allow" } : { kind: "verify" };
  }

  // No verified factor.
  if (isMfaMandatory(role, input.now)) return { kind: "enroll" };
  return { kind: "allow" };
}
