import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;
  return (
    <AuthShell 
      mode="centered"
      title="Welcome back" 
      description="Log in to your account"
    >
      <SignInForm nextPath={nextPath} />
    </AuthShell>
  );
}
