import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <AuthShell 
      mode="split"
      title="Create your account" 
      description="Start managing your properties with ease."
    >
      <SignUpForm />
    </AuthShell>
  );
}
