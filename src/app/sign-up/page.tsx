import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return <AuthShell eyebrow="Start simply" title="Create your workspace" description="Set up your secure account, then add your property-management organization."><SignUpForm /></AuthShell>;
}
