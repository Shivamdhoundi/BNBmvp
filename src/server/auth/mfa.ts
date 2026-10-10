import "server-only";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import {
  evaluateMfaGate,
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
export const getMfaSnapshot = cache(async (): Promise<MfaSnapshot> => {
  const supabase = await createClient();

  // These two reads are independent, so run them concurrently to avoid a
  // second sequential round-trip to Supabase.
  const [{ data: aal, error: aalError }, { data: factors, error: factorsError }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);
  if (aalError || factorsError || !aal || !factors || (aal.currentLevel !== "aal1" && aal.currentLevel !== "aal2")) {
    throw new Error("Unable to verify authentication assurance.");
  }

  const verifiedTotp = (factors?.totp ?? []).some((factor) => factor.status === "verified");

  return {
    hasVerifiedFactor: verifiedTotp,
    currentLevel: (aal?.currentLevel as AssuranceLevel) ?? null,
    nextLevel: (aal?.nextLevel as AssuranceLevel) ?? null,
  };
});

/**
 * Computes the MFA gate decision for the current organization context.
 */
export async function getMfaGate(context: OrganizationContext): Promise<MfaGateDecision> {
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
