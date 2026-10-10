import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";
import type { OrganizationContext } from "@/server/auth/context";
import { recordAuditEvent } from "@/server/audit/service";
import type { CreatePropertyInput, UpdatePropertyInput } from "@/server/properties/validation";

export async function listProperties(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(`
      id, name, slug, property_type, status, address_line_1, city, state, postal_code,
      base_price, cleaning_fee, security_deposit, management_commission_percent, latitude, longitude, created_at,
      property_units (id, name, bedrooms, bathrooms, max_guests, is_active),
      owners (id, legal_name, email, phone)
    `)
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load properties: " + error.message);
  return data ?? [];
}

export async function getProperty(organizationId: string, propertyId: string) {
  if (!isUuid(propertyId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(`
      id, name, slug, property_type, status, address_line_1, address_line_2, city, state,
      postal_code, country_code, latitude, longitude, timezone, check_in_time, check_out_time,
      base_price, cleaning_fee, security_deposit, management_commission_percent, description, house_rules, created_at, updated_at,
      property_units (id, name, bedrooms, bathrooms, max_guests, is_active),
      property_amenities (id, amenity_key, details),
      property_documents (id, file_name, storage_key, content_type, visibility, created_at),
      owners (id, legal_name, email, phone)
    `)
    .eq("organization_id", organizationId)
    .eq("id", propertyId)
    .maybeSingle();

  if (error) throw new Error("Unable to load property: " + error.message);
  return data;
}

export async function createProperty(context: OrganizationContext, input: CreatePropertyInput) {
  const supabase = await createClient();

  if (input.ownerId) {
    const { data: owner } = await supabase
      .from("owners")
      .select("id")
      .eq("id", input.ownerId)
      .eq("organization_id", context.organization.id)
      .maybeSingle();
    if (!owner) throw new Error("Select an owner from this workspace.");
  }

  // Property, unit, pricing, owner and audit entry commit or roll back together.
  const { data: rpcData, error: rpcError } = await supabase.rpc("create_property_complete", {
    input_organization_id: context.organization.id,
    input,
  });

  if (rpcError || typeof rpcData !== "string") {
    if (rpcError?.code === "23505") throw new Error("A property with that slug already exists in this workspace.");
    throw new Error("Unable to create property. Please try again.");
  }

  return rpcData;
}

export async function updateProperty(context: OrganizationContext, input: UpdatePropertyInput) {
  const supabase = await createClient();
  const { id, ...updates } = input;

  if (updates.ownerId) {
    const { data: owner } = await supabase
      .from("owners")
      .select("id")
      .eq("id", updates.ownerId)
      .eq("organization_id", context.organization.id)
      .maybeSingle();
    if (!owner) throw new Error("Select an owner from this workspace.");
  }

  const patch: Record<string, unknown> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.slug !== undefined) patch.slug = updates.slug;
  if (updates.propertyType !== undefined) patch.property_type = updates.propertyType;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.addressLine1 !== undefined) patch.address_line_1 = updates.addressLine1;
  if (updates.addressLine2 !== undefined) patch.address_line_2 = updates.addressLine2;
  if (updates.city !== undefined) patch.city = updates.city;
  if (updates.state !== undefined) patch.state = updates.state;
  if (updates.postalCode !== undefined) patch.postal_code = updates.postalCode;
  if (updates.basePrice !== undefined) patch.base_price = String(updates.basePrice);
  if (updates.cleaningFee !== undefined) patch.cleaning_fee = String(updates.cleaningFee);
  if (updates.securityDeposit !== undefined) patch.security_deposit = String(updates.securityDeposit);
  if (updates.checkInTime !== undefined) patch.check_in_time = updates.checkInTime;
  if (updates.checkOutTime !== undefined) patch.check_out_time = updates.checkOutTime;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.houseRules !== undefined) patch.house_rules = updates.houseRules;
  if (updates.ownerId !== undefined) patch.owner_id = updates.ownerId;
  if (updates.managementCommissionPercent !== undefined) patch.management_commission_percent = String(updates.managementCommissionPercent);
  if (updates.latitude !== undefined) patch.latitude = updates.latitude === null ? null : String(updates.latitude);
  if (updates.longitude !== undefined) patch.longitude = updates.longitude === null ? null : String(updates.longitude);

  const { error, count } = await supabase
    .from("properties")
    .update(patch, { count: "exact" })
    .eq("organization_id", context.organization.id)
    .eq("id", id);

  if (error) throw new Error("Unable to update property.");
  if (!count) throw new Error("Property not found in this workspace.");

  // Update main unit if bedrooms/bathrooms/maxGuests provided
  if (updates.bedrooms !== undefined || updates.bathrooms !== undefined || updates.maxGuests !== undefined) {
    const unitPatch: Record<string, unknown> = {};
    if (updates.bedrooms !== undefined) unitPatch.bedrooms = String(updates.bedrooms);
    if (updates.bathrooms !== undefined) unitPatch.bathrooms = String(updates.bathrooms);
    if (updates.maxGuests !== undefined) unitPatch.max_guests = updates.maxGuests;

    const { error: unitError, count: unitCount } = await supabase
      .from("property_units")
      .update(unitPatch, { count: "exact" })
      .eq("organization_id", context.organization.id)
      .eq("property_id", id);
    if (unitError || !unitCount) throw new Error("Unable to update the property's unit details.");
  }

  await recordAuditEvent(context, {
    action: "property.updated",
    entityType: "property",
    entityId: id,
    metadata: { updated_fields: Object.keys(patch) },
  });
}

export async function archiveProperty(context: OrganizationContext, propertyId: string) {
  const supabase = await createClient();

  // Soft archive: preserve the record and its history instead of deleting.
  const { error, count } = await supabase
    .from("properties")
    .update({ archived_at: new Date().toISOString(), status: "inactive" }, { count: "exact" })
    .eq("organization_id", context.organization.id)
    .eq("id", propertyId)
    .is("archived_at", null);

  if (error) throw new Error("Unable to archive property.");
  if (!count) throw new Error("Property not found or already archived.");

  await recordAuditEvent(context, {
    action: "property.updated",
    entityType: "property",
    entityId: propertyId,
    metadata: { event: "archived" },
  });
}

export async function addPropertyAmenity(
  context: OrganizationContext,
  propertyId: string,
  amenityKey: string,
  details?: string
) {
  const supabase = await createClient();
  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("organization_id", context.organization.id)
    .eq("id", propertyId)
    .is("archived_at", null)
    .maybeSingle();
  if (!property) throw new Error("Property not found in this workspace.");

  const { error } = await supabase.from("property_amenities").insert({
    organization_id: context.organization.id,
    property_id: propertyId,
    amenity_key: amenityKey,
    details: details || null,
  });

  if (error) throw new Error("Unable to add amenity.");
}

export async function removePropertyAmenity(context: OrganizationContext, amenityId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("property_amenities")
    .delete()
    .eq("organization_id", context.organization.id)
    .eq("id", amenityId);

  if (error) throw new Error("Unable to remove amenity.");
}
