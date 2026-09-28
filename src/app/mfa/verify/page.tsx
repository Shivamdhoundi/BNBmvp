import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { MfaVerifyForm } from "@/components/auth/mfa-verify-form";
import { getSignedInUser } from "@/server/auth/context";
import { getMfaSnapshot } from "@/server/auth/mfa";

export const metadata = { title: "Verify MFA | StayPilot" };

export default async function MfaVerifyPage() {
  const user = await getSignedInUser();
  if (!user) redirect("/sign-in");

  const snapshot = await getMfaSnapshot();

  // Already at AAL2 — nothing to verify.
  if (snapshot.currentLevel === "aal2") redirect("/dashboard");
  // No verified factor — must enroll first.
  if (!snapshot.hasVerifiedFactor) redirect("/mfa/enroll");

  return (
    <AuthShell
      mode="centered"
      title="Two-factor verification"
      description="Enter the code from your authenticator app to continue."
    >
      <MfaVerifyForm />
    </AuthShell>
  );
}
