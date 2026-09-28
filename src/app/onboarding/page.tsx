import { redirect } from "next/navigation";

import { getSignedInUser } from "@/server/auth/context";

export default async function OnboardingPage() {
  const user = await getSignedInUser();
  redirect(user ? "/select-profile" : "/sign-in");
}
