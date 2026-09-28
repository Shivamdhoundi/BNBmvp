"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assignableRoles, can, type AppRole } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { requireMfaForPrivilegedAction } from "@/server/auth/mfa";
import { inviteMember, revokeInvitation } from "@/server/invitations/service";
import { changeMemberRole, changeMemberStatus } from "@/server/team/service";

export type TeamActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(240),
  role: z.enum(["super_admin", "admin", "operations", "owner", "vendor"]),
});

const uuid = z.string().uuid();
const roleSchema = z.enum(["super_admin", "admin", "operations", "owner", "vendor"]);
const statusSchema = z.enum(["active", "suspended"]);

export async function inviteMemberAction(_: TeamActionState, formData: FormData): Promise<TeamActionState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "team:invite")) return { error: "You do not have permission to invite members." };
  try {
    await requireMfaForPrivilegedAction(context);
  } catch {
    return { error: "Multi-factor authentication is required." };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  // Only a super_admin may assign super_admin; others limited to assignable roles.
  const role = parsed.data.role as AppRole;
  if (role === "super_admin" && context.role !== "super_admin") {
    return { error: "Only a super admin may assign the super admin role." };
  }
  if (role !== "super_admin" && !assignableRoles.includes(role)) {
    return { error: "Invalid role." };
  }

  const result = await inviteMember(context, { email: parsed.data.email, role });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/team");
  return { success: "Invitation sent." };
}

export async function resendInvitationAction(formData: FormData): Promise<void> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "team:invite")) return;

  const email = z.string().trim().email().max(240).safeParse(formData.get("email"));
  const role = roleSchema.safeParse(formData.get("role"));
  if (!email.success || !role.success) return;

  if (role.data === "super_admin" && context.role !== "super_admin") return;

  await inviteMember(context, { email: email.data, role: role.data as AppRole });
  revalidatePath("/dashboard/team");
}

export async function revokeInvitationAction(formData: FormData): Promise<void> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "team:invite")) return;

  const invitationId = uuid.safeParse(formData.get("invitationId"));
  if (!invitationId.success) return;

  try {
    await revokeInvitation(context, invitationId.data);
  } catch {
    // Surface nothing; the list reflects the current state on revalidation.
  }
  revalidatePath("/dashboard/team");
}

export async function changeRoleAction(formData: FormData): Promise<void> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "team:change_role")) return;

  const targetUserId = uuid.safeParse(formData.get("userId"));
  const newRole = roleSchema.safeParse(formData.get("role"));
  if (!targetUserId.success || !newRole.success) return;

  try {
    await requireMfaForPrivilegedAction(context);
    await changeMemberRole(context, targetUserId.data, newRole.data as AppRole);
  } catch {
    // Invariants enforced in the RPC; failures leave state unchanged.
  }
  revalidatePath("/dashboard/team");
}

export async function changeStatusAction(formData: FormData): Promise<void> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "team:change_status")) return;

  const targetUserId = uuid.safeParse(formData.get("userId"));
  const newStatus = statusSchema.safeParse(formData.get("status"));
  if (!targetUserId.success || !newStatus.success) return;

  try {
    await requireMfaForPrivilegedAction(context);
    await changeMemberStatus(context, targetUserId.data, newStatus.data);
  } catch {
    // Invariants enforced in the RPC; failures leave state unchanged.
  }
  revalidatePath("/dashboard/team");
}
