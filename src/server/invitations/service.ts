import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCanonicalAppOrigin } from "@/lib/auth/password-recovery";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/permissions";
import type { OrganizationContext } from "@/server/auth/context";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type InviteResult = { ok: true } | { ok: false; error: string };

function buildInviteRedirect(): string {
  return new URL(
    "/auth/confirm?next=/auth/accept-invite",
    getCanonicalAppOrigin(),
  ).toString();
}

/**
 * Reserves a pending invitation, sends the Supabase Auth invite, and records the
 * outcome. Idempotent: repeated calls reuse the pending invitation and never
 * create duplicate accounts or memberships. Caller must already be authorized.
 */
export async function inviteMember(
  context: OrganizationContext,
  input: { email: string; role: AppRole },
): Promise<InviteResult> {
  const supabase = await createClient();
  const normalizedEmail = input.email.trim().toLowerCase();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS).toISOString();

  // 1. Reserve the invitation (authorization + idempotency enforced in the RPC).
  const { data: invitationId, error: reserveError } = await supabase.rpc(
    "reserve_organization_invitation",
    {
      input_organization_id: context.organization.id,
      input_email: normalizedEmail,
      input_role: input.role,
      input_expires_at: expiresAt,
    },
  );

  if (reserveError || !invitationId) {
    return { ok: false, error: "Unable to create the invitation." };
  }

  // 2. Send the Auth invite from the server-only Admin client.
  let invitedUserId: string | null = null;
  let failureCode: string | null = null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo: buildInviteRedirect(),
      data: { invited_organization_id: context.organization.id },
    });

    if (error) {
      // A user that already exists is not a failure; membership still activates on accept.
      const alreadyRegistered = /already/i.test(error.message);
      if (!alreadyRegistered) {
        failureCode = "invite_send_failed";
      }
    } else {
      invitedUserId = data.user?.id ?? null;
    }
  } catch {
    failureCode = "invite_admin_unavailable";
  }

  // 3. Record the outcome (idempotent; keeps a safe failed state for retry).
  await supabase.rpc("record_invitation_outcome", {
    input_invitation_id: invitationId as string,
    input_organization_id: context.organization.id,
    input_invited_user_id: invitedUserId,
    input_failure_code: failureCode,
  });

  if (failureCode) {
    return { ok: false, error: "The invitation could not be delivered. You can retry." };
  }

  return { ok: true };
}

export async function listInvitations(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_invitations")
    .select("id, email, role, status, invited_by, expires_at, created_at, last_sent_at")
    .eq("organization_id", organizationId)
    .in("status", ["pending", "failed"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error("Unable to load invitations: " + error.message);
  return data ?? [];
}

export async function revokeInvitation(context: OrganizationContext, invitationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_organization_invitation", {
    input_invitation_id: invitationId,
    input_organization_id: context.organization.id,
  });
  if (error) throw new Error("Unable to revoke the invitation.");
}
