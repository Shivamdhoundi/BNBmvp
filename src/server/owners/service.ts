import { createClient } from "@/lib/supabase/server";
import type { OrganizationContext } from "@/server/auth/context";

export async function listOwners(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owners")
    .select(`*`)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load owners: " + error.message);
  return data ?? [];
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
  return data.id;
}
