import { redirect } from "next/navigation";

import type { AppRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type OrganizationContext = {
  user: { id: string; email: string | undefined; fullName: string | undefined };
  organization: { id: string; name: string; slug: string };
  role: AppRole;
};

export async function getSignedInUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getOrganizationContext(): Promise<OrganizationContext | null> {
  const user = await getSignedInUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) throw new Error("Unable to load organization membership.");
  if (!membership) return null;

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", membership.organization_id)
    .single();

  if (organizationError || !organization) throw new Error("Unable to load your organization.");

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : undefined,
    },
    organization,
    role: membership.role as AppRole,
  };
}

export async function requireOrganizationContext(): Promise<OrganizationContext> {
  const context = await getOrganizationContext();
  if (!context) {
    const user = await getSignedInUser();
    redirect(user ? "/onboarding" : "/sign-in");
  }
  return context;
}
