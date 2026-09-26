import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { OrganizationForm } from "@/components/onboarding/organization-form";
import { getSignedInUser } from "@/server/auth/context";

export default async function OnboardingPage() {
  const user = await getSignedInUser();
  if (!user) redirect("/sign-in");
  return <AuthShell eyebrow="One last step" title="Name your operation" description="This creates your private, tenant-isolated workspace. You’ll be its first administrator."><OrganizationForm /></AuthShell>;
}
