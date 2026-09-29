import { cache } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AppRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type OrganizationContext = {
  user: { id: string; email: string | undefined; fullName: string | undefined };
  organization: { id: string; name: string; slug: string };
  role: AppRole;
};

// Request-scoped so repeated calls (layout guard + page/action helpers) reuse a
// single Supabase auth round-trip instead of re-fetching the user each time.
export const getSignedInUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getOrganizationContext = cache(async (): Promise<OrganizationContext | null> => {
  const user = await getSignedInUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get("staypilot_active_org_id")?.value;

  const supabase = await createClient();
  
  if (!activeOrgId) return null;

  // Validate activeOrgId is a valid UUID to prevent Postgres 22P02 errors
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(activeOrgId)) {
    // If the cookie is poisoned (e.g. string "undefined"), return null immediately
    return null;
  }

  // Combine member and organization fetch into a single query
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      role,
      organizations:organizations!inner (id, name, slug)
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .eq("organization_id", activeOrgId)
    .single();

  if (error || !data) return null;

  // Handle Supabase returning an array for joined tables in some PostgREST versions
  const orgData = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;

  if (!orgData) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : undefined,
    },
    organization: orgData as { id: string; name: string; slug: string },
    role: data.role as AppRole,
  };
});

export async function requireOrganizationContext(): Promise<OrganizationContext> {
  const context = await getOrganizationContext();
  if (!context) {
    const user = await getSignedInUser();
    redirect(user ? "/select-profile" : "/sign-in");
  }
  return context;
}
