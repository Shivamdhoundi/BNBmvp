import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const invalidLink = error === "invalid_link";

  return (
    <AuthShell
      mode="centered"
      title="Reset your password"
      description="Enter your account email and we’ll send secure reset instructions."
    >
      {invalidLink ? (
        <p role="alert" className="mb-5 rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800">
          This password reset link is invalid or expired. Request a new link below.
        </p>
      ) : null}
      <ForgotPasswordForm />
    </AuthShell>
  );
}
