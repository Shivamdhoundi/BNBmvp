import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next, reset } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;
  return (
    <AuthShell 
      mode="centered"
      title="StayPilot Operations" 
      description="Sign in to your account to continue."
    >
      {reset === "success" ? (
        <p role="status" className="mb-5 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
          Your password has been updated. Sign in with your new password.
        </p>
      ) : null}
      <SignInForm nextPath={nextPath} />
    </AuthShell>
  );
}
