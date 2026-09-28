import { createClient } from "@/lib/supabase/server";
import type { OrganizationContext } from "@/server/auth/context";
import { recordAuditEvent } from "@/server/audit/service";

export async function listOwners(organizationId: string, options: { includeArchived?: boolean } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("owners")
    .select(`*`)
    .eq("organization_id", organizationId);

  if (!options.includeArchived) query = query.is("archived_at", null);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load owners: " + error.message);
  return data ?? [];
}

export async function getOwner(organizationId: string, ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owners")
    .select(`*`)
    .eq("organization_id", organizationId)
    .eq("id", ownerId)
    .maybeSingle();

  if (error) throw new Error("Unable to load owner: " + error.message);
  return data;
}

export async function createOwner(context: OrganizationContext, input: { legalName: string; email: string; phone?: string; isActive?: boolean }) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("owners")
    .insert({
      organization_id: context.organization.id,
      legal_name: input.legalName,
      email: input.email,
      phone: input.phone || null,
      is_active: input.isActive ?? true,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to create owner.");

  await recordAuditEvent(context, {
    action: "owner.created",
    entityType: "owner",
    entityId: data.id,
    metadata: { is_active: input.isActive ?? true },
  });

  return data.id;
}

export async function updateOwner(
  context: OrganizationContext,
  ownerId: string,
  input: { legalName: string; email: string; phone?: string; isActive?: boolean },
) {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from("owners")
    .update(
      {
        legal_name: input.legalName,
        email: input.email,
        phone: input.phone || null,
        is_active: input.isActive ?? true,
      },
      { count: "exact" },
    )
    .eq("organization_id", context.organization.id)
    .eq("id", ownerId);

  if (error) throw new Error("Unable to update owner: " + error.message);
  if (!count) throw new Error("Owner not found in this workspace.");

  await recordAuditEvent(context, {
    action: "owner.updated",
    entityType: "owner",
    entityId: ownerId,
    metadata: { is_active: input.isActive ?? true },
  });
}

export async function archiveOwner(context: OrganizationContext, ownerId: string) {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from("owners")
    .update({ archived_at: new Date().toISOString(), is_active: false }, { count: "exact" })
    .eq("organization_id", context.organization.id)
    .eq("id", ownerId)
    .is("archived_at", null);

  if (error) throw new Error("Unable to archive owner: " + error.message);
  if (!count) throw new Error("Owner not found or already archived.");

  await recordAuditEvent(context, {
    action: "owner.updated",
    entityType: "owner",
    entityId: ownerId,
    metadata: { event: "archived" },
  });
}
