import { cookies } from "next/headers";
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

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get("staypilot_active_org_id")?.value;

  const supabase = await createClient();
  let query = supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (activeOrgId) {
    query = query.eq("organization_id", activeOrgId);
  }

  // Load the active org if specified, otherwise load the first one they belong to 
  // ONLY if they only have 1 (wait, let's just use the activeOrgId. If none, return null so they go to selection)
  
  if (!activeOrgId) return null;

  const { data: membership, error: membershipError } = await query.single();

  if (membershipError || !membership) return null;

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
    redirect(user ? "/select-profile" : "/sign-in");
  }
  return context;
}
