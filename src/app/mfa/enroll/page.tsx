import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { MfaEnrollForm } from "@/components/auth/mfa-enroll-form";
import { getSignedInUser } from "@/server/auth/context";

export const metadata = { title: "Set up MFA | StayPilot" };

export default async function MfaEnrollPage() {
  const user = await getSignedInUser();
  if (!user) redirect("/sign-in");

  return (
    <AuthShell
      mode="centered"
      title="Set up two-factor authentication"
      description="Protect your account with a time-based authenticator app."
    >
      <MfaEnrollForm />
      <Link href="/dashboard" className="mt-4 block text-center text-sm font-semibold text-slate-600 hover:text-slate-900">
        Back to dashboard
      </Link>
    </AuthShell>
  );
}
