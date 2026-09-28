import { createClient } from "@/lib/supabase/server";
import type { OrganizationContext } from "@/server/auth/context";
import { recordAuditEvent } from "@/server/audit/service";

export async function listGuests(organizationId: string, options: { includeArchived?: boolean } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("guests")
    .select(`*`)
    .eq("organization_id", organizationId);

  if (!options.includeArchived) query = query.is("archived_at", null);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load guests: " + error.message);
  return data ?? [];
}

export async function getGuest(organizationId: string, guestId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .select(`*`)
    .eq("organization_id", organizationId)
    .eq("id", guestId)
    .maybeSingle();

  if (error) throw new Error("Unable to load guest: " + error.message);
  return data;
}

export async function createGuest(context: OrganizationContext, input: { firstName: string; lastName: string; email?: string; phone?: string; identityVerified?: boolean }) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guests")
    .insert({
      organization_id: context.organization.id,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email || null,
      phone: input.phone || null,
      identity_verified: input.identityVerified || false,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to create guest.");

  await recordAuditEvent(context, {
    action: "guest.created",
    entityType: "guest",
    entityId: data.id,
    metadata: { identity_verified: input.identityVerified || false },
  });

  return data.id;
}

export async function updateGuest(
  context: OrganizationContext,
  guestId: string,
  input: { firstName: string; lastName: string; email?: string; phone?: string; identityVerified?: boolean },
) {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from("guests")
    .update(
      {
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email || null,
        phone: input.phone || null,
        identity_verified: input.identityVerified || false,
      },
      { count: "exact" },
    )
    .eq("organization_id", context.organization.id)
    .eq("id", guestId);

  if (error) throw new Error("Unable to update guest: " + error.message);
  if (!count) throw new Error("Guest not found in this workspace.");

  await recordAuditEvent(context, {
    action: "guest.updated",
    entityType: "guest",
    entityId: guestId,
    metadata: { identity_verified: input.identityVerified || false },
  });
}

export async function archiveGuest(context: OrganizationContext, guestId: string) {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from("guests")
    .update({ archived_at: new Date().toISOString() }, { count: "exact" })
    .eq("organization_id", context.organization.id)
    .eq("id", guestId)
    .is("archived_at", null);

  if (error) throw new Error("Unable to archive guest: " + error.message);
  if (!count) throw new Error("Guest not found or already archived.");

  await recordAuditEvent(context, {
    action: "guest.updated",
    entityType: "guest",
    entityId: guestId,
    metadata: { event: "archived" },
  });
}
