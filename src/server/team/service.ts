import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/env.server";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/permissions";
import type { OrganizationContext } from "@/server/auth/context";

export type MemberStatus = "invited" | "active" | "suspended";

export type TeamMemberDTO = {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string | null;
  role: AppRole;
  status: MemberStatus;
  accountCreatedAt: string | null;
  lastSignInAt: string | null;
  mfaVerified: boolean;
};

type MembershipRow = {
  id: string;
  user_id: string;
  role: AppRole;
  status: MemberStatus;
  users: { email: string; full_name: string | null } | { email: string; full_name: string | null }[] | null;
};

/**
 * Returns organization-scoped team members with minimal Auth Admin metadata.
 * Membership data is read through the RLS client; identity/security fields are
 * enriched server-side and never expose the raw Auth user object.
 */
export async function listTeamMembers(context: OrganizationContext): Promise<TeamMemberDTO[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_members")
    .select("id, user_id, role, status, users:users!inner (email, full_name)")
    .eq("organization_id", context.organization.id)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) throw new Error("Unable to load team members: " + error.message);

  const rows = (data ?? []) as unknown as MembershipRow[];

  const members: TeamMemberDTO[] = rows.map((row) => {
    const profile = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      membershipId: row.id,
      userId: row.user_id,
      email: profile?.email ?? "",
      fullName: profile?.full_name ?? null,
      role: row.role,
      status: row.status,
      accountCreatedAt: null,
      lastSignInAt: null,
      mfaVerified: false,
    };
  });

  // Enrich with Auth Admin metadata only when configured; degrade gracefully.
  if (!isServiceRoleConfigured()) return members;

  try {
    const admin = createAdminClient();
    await Promise.all(
      members.map(async (member) => {
        const { data: adminData } = await admin.auth.admin.getUserById(member.userId);
        const authUser = adminData?.user;
        if (!authUser) return;
        member.accountCreatedAt = authUser.created_at ?? null;
        member.lastSignInAt = authUser.last_sign_in_at ?? null;
        const factors = authUser.factors ?? [];
        member.mfaVerified = factors.some((factor) => factor.status === "verified");
      }),
    );
  } catch {
    // Identity enrichment is best-effort; membership data remains authoritative.
  }

  return members;
}

export async function changeMemberRole(
  context: OrganizationContext,
  targetUserId: string,
  newRole: AppRole,
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("change_member_role", {
    input_organization_id: context.organization.id,
    input_target_user_id: targetUserId,
    input_new_role: newRole,
  });
  if (error) throw new Error(error.message);
}

export async function changeMemberStatus(
  context: OrganizationContext,
  targetUserId: string,
  newStatus: "active" | "suspended",
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("change_member_status", {
    input_organization_id: context.organization.id,
    input_target_user_id: targetUserId,
    input_new_status: newStatus,
  });
  if (error) throw new Error(error.message);
}
