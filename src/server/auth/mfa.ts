import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  evaluateMfaGate,
  roleRequiresMfa,
  type AssuranceLevel,
  type MfaGateDecision,
} from "@/lib/auth/mfa";
import type { OrganizationContext } from "@/server/auth/context";

export type MfaSnapshot = {
  hasVerifiedFactor: boolean;
  currentLevel: AssuranceLevel;
  nextLevel: AssuranceLevel;
};

/**
 * Reads the current authenticator assurance level and verified-factor state
 * for the signed-in user from Supabase.
 */
export async function getMfaSnapshot(): Promise<MfaSnapshot> {
  const supabase = await createClient();

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const { data: factors } = await supabase.auth.mfa.listFactors();

  const verifiedTotp = (factors?.totp ?? []).some((factor) => factor.status === "verified");

  return {
    hasVerifiedFactor: verifiedTotp,
    currentLevel: (aal?.currentLevel as AssuranceLevel) ?? null,
    nextLevel: (aal?.nextLevel as AssuranceLevel) ?? null,
  };
}

/**
 * Computes the MFA gate decision for the current organization context.
 */
export async function getMfaGate(context: OrganizationContext): Promise<MfaGateDecision> {
  if (!roleRequiresMfa(context.role)) return { kind: "allow" };
  const snapshot = await getMfaSnapshot();
  return evaluateMfaGate({
    role: context.role,
    hasVerifiedFactor: snapshot.hasVerifiedFactor,
    currentLevel: snapshot.currentLevel,
  });
}

/**
 * Throws when the caller has not satisfied the MFA requirement for a privileged
 * action. Server Actions call this in addition to permission checks.
 */
export async function requireMfaForPrivilegedAction(context: OrganizationContext): Promise<void> {
  const gate = await getMfaGate(context);
  if (gate.kind !== "allow") {
    throw new Error("Multi-factor authentication is required to perform this action.");
  }
}
