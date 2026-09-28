"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getOrganizationContext } from "@/server/auth/context";
import { getMfaSnapshot } from "@/server/auth/mfa";
import { recordAuditEvent } from "@/server/audit/service";

export type EnrollState = {
  error?: string;
  factorId?: string;
  qrCode?: string;
  secret?: string;
};

export type VerifyState = { error?: string };

const codeSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.");

/**
 * Begins TOTP enrollment and returns the QR/secret for the authenticator app.
 * The secret is returned only during enrollment and never persisted by the app.
 */
export async function beginEnrollment(): Promise<EnrollState> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (error || !data) {
    return { error: "Unable to start MFA enrollment. Try again." };
  }

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function confirmEnrollment(_: VerifyState, formData: FormData): Promise<VerifyState> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const factorId = z.string().min(1).safeParse(formData.get("factorId"));
  const code = codeSchema.safeParse(formData.get("code"));
  if (!factorId.success || !code.success) return { error: "Enter the 6-digit code." };

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: factorId.data,
  });
  if (challengeError || !challenge) return { error: "Verification failed. Try again." };

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: factorId.data,
    challengeId: challenge.id,
    code: code.data,
  });
  if (verifyError) return { error: "That code was incorrect or expired." };

  const context = await getOrganizationContext();
  if (context) {
    await recordAuditEvent(context, {
      action: "settings.updated",
      entityType: "mfa_factor",
      entityId: null,
      metadata: { event: "enrolled" },
    });
  }

  redirect("/dashboard");
}

export async function verifyChallenge(_: VerifyState, formData: FormData): Promise<VerifyState> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const code = codeSchema.safeParse(formData.get("code"));
  if (!code.success) return { error: "Enter the 6-digit code." };

  const snapshot = await getMfaSnapshot();
  if (!snapshot.hasVerifiedFactor) redirect("/mfa/enroll");

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = (factors?.totp ?? []).find((f) => f.status === "verified");
  if (!factor) redirect("/mfa/enroll");

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: factor.id,
  });
  if (challengeError || !challenge) return { error: "Verification failed. Try again." };

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code: code.data,
  });
  if (verifyError) return { error: "That code was incorrect or expired." };

  redirect("/dashboard");
}

export async function removeFactor(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const factorId = z.string().min(1).safeParse(formData.get("factorId"));
  if (!factorId.success) return;

  // Require AAL2 to remove a factor.
  const snapshot = await getMfaSnapshot();
  if (snapshot.currentLevel !== "aal2") return;

  await supabase.auth.mfa.unenroll({ factorId: factorId.data });

  const context = await getOrganizationContext();
  if (context) {
    await recordAuditEvent(context, {
      action: "settings.updated",
      entityType: "mfa_factor",
      entityId: null,
      metadata: { event: "removed" },
    });
  }
}
