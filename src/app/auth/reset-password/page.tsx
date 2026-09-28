import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { isValidRecoveryMarker, RECOVERY_MARKER_COOKIE } from "@/lib/auth/password-recovery";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const marker = (await cookies()).get(RECOVERY_MARKER_COOKIE)?.value;
  const canReset = Boolean(user && isValidRecoveryMarker(marker, user.id));

  return (
    <AuthShell
      mode="centered"
      title="Choose a new password"
      description="Set a strong password for your StayPilot account."
    >
      {canReset ? (
        <ResetPasswordForm />
      ) : (
        <div className="space-y-4">
          <p role="alert" className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800">
            This password reset link is invalid or expired. Request a new link to continue.
          </p>
          <Link
            href="/forgot-password"
            className="block w-full rounded-xl bg-slate-900 px-4 py-3.5 text-center font-bold text-white shadow-md transition hover:bg-slate-800"
          >
            Request a new reset link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
