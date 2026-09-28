import { createClient } from "@/lib/supabase/server";
import type { OrganizationContext } from "@/server/auth/context";
import { recordAuditEvent } from "@/server/audit/service";

export async function listGuests(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .select(`*`)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load guests: " + error.message);
  return data ?? [];
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
