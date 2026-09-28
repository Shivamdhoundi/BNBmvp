import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { MfaEnrollForm } from "@/components/auth/mfa-enroll-form";
import { beginEnrollment } from "@/app/mfa/actions";
import { getSignedInUser } from "@/server/auth/context";

export const metadata = { title: "Set up MFA | StayPilot" };

export default async function MfaEnrollPage() {
  const user = await getSignedInUser();
  if (!user) redirect("/sign-in");

  const enrollment = await beginEnrollment();

  return (
    <AuthShell
      mode="centered"
      title="Set up two-factor authentication"
      description="Protect your account with a time-based authenticator app."
    >
      {enrollment.factorId && enrollment.qrCode && enrollment.secret ? (
        <MfaEnrollForm factorId={enrollment.factorId} qrCode={enrollment.qrCode} secret={enrollment.secret} />
      ) : (
        <div className="space-y-4">
          <p role="alert" className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800">
            {enrollment.error ?? "Unable to start MFA enrollment."}
          </p>
          <Link href="/dashboard" className="block w-full rounded-xl bg-slate-900 px-4 py-3.5 text-center font-bold text-white transition hover:bg-slate-800">
            Back to dashboard
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
