import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;
  return <AuthShell eyebrow="Welcome back" title="Sign in to your workspace" description="Use the email and password associated with your StayPilot account."><SignInForm nextPath={nextPath} /></AuthShell>;
}
