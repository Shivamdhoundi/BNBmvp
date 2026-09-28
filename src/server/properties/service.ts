import { createClient } from "@/lib/supabase/server";
import type { OrganizationContext } from "@/server/auth/context";
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
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load properties: " + error.message);
  return data ?? [];
}

export async function getProperty(organizationId: string, propertyId: string) {
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

  // Try RPC first for transactional property + unit creation
  const { data: rpcData, error: rpcError } = await supabase.rpc("create_property_with_unit", {
    input_organization_id: context.organization.id,
    input_name: input.name,
    input_slug: input.slug,
    input_property_type: input.propertyType,
    input_address_line_1: input.addressLine1,
    input_address_line_2: input.addressLine2 || "",
    input_city: input.city || "Gurugram",
    input_state: input.state || "Haryana",
    input_postal_code: input.postalCode || "",
    input_description: input.description || "",
    input_bedrooms: input.bedrooms,
    input_bathrooms: input.bathrooms,
    input_max_guests: input.maxGuests,
  });

  if (rpcError) {
    // Fallback to direct insertion if RPC fails or parameter signature differs
    const { data: insertedProperty, error: insertError } = await supabase
      .from("properties")
      .insert({
        organization_id: context.organization.id,
        name: input.name,
        slug: input.slug,
        property_type: input.propertyType,
        status: input.status,
        address_line_1: input.addressLine1,
        address_line_2: input.addressLine2 || null,
        city: input.city || "Gurugram",
        state: input.state || "Haryana",
        postal_code: input.postalCode || null,
        latitude: input.latitude ? String(input.latitude) : null,
        longitude: input.longitude ? String(input.longitude) : null,
        check_in_time: input.checkInTime || "15:00",
        check_out_time: input.checkOutTime || "11:00",
        base_price: String(input.basePrice || 0),
        cleaning_fee: String(input.cleaningFee || 0),
        security_deposit: String(input.securityDeposit || 0),
        description: input.description || null,
        house_rules: input.houseRules || null,
        owner_id: input.ownerId || null,
        management_commission_percent: String(input.managementCommissionPercent || 20),
        created_by: context.user.id,
      })
      .select("id")
      .single();

    if (insertError || !insertedProperty) {
      throw new Error(insertError?.message ?? "Unable to create property.");
    }

    // Insert unit
    await supabase.from("property_units").insert({
      organization_id: context.organization.id,
      property_id: insertedProperty.id,
      name: "Main unit",
      bedrooms: String(input.bedrooms),
      bathrooms: String(input.bathrooms),
      max_guests: input.maxGuests,
    });

    // Record Audit Log
    await supabase.from("audit_logs").insert({
      organization_id: context.organization.id,
      actor_user_id: context.user.id,
      action: "property.created",
      entity_type: "property",
      entity_id: insertedProperty.id,
      metadata: { name: input.name, property_type: input.propertyType },
    });

    return insertedProperty.id;
  }

  // Update additional fields (pricing, rules, coordinates) if RPC succeeded
  const propertyId = rpcData as string;
  await supabase
    .from("properties")
    .update({
      status: input.status,
      base_price: String(input.basePrice || 0),
      cleaning_fee: String(input.cleaningFee || 0),
      security_deposit: String(input.securityDeposit || 0),
      latitude: input.latitude ? String(input.latitude) : null,
      longitude: input.longitude ? String(input.longitude) : null,
      house_rules: input.houseRules || null,
      check_in_time: input.checkInTime || "15:00",
      check_out_time: input.checkOutTime || "11:00",
    })
    .eq("id", propertyId);

  return propertyId;
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
  if (updates.latitude !== undefined) patch.latitude = updates.latitude ? String(updates.latitude) : null;
  if (updates.longitude !== undefined) patch.longitude = updates.longitude ? String(updates.longitude) : null;

  const { error } = await supabase
    .from("properties")
    .update(patch)
    .eq("organization_id", context.organization.id)
    .eq("id", id);

  if (error) throw new Error("Unable to update property: " + error.message);

  // Update main unit if bedrooms/bathrooms/maxGuests provided
  if (updates.bedrooms !== undefined || updates.bathrooms !== undefined || updates.maxGuests !== undefined) {
    const unitPatch: Record<string, unknown> = {};
    if (updates.bedrooms !== undefined) unitPatch.bedrooms = String(updates.bedrooms);
    if (updates.bathrooms !== undefined) unitPatch.bathrooms = String(updates.bathrooms);
    if (updates.maxGuests !== undefined) unitPatch.max_guests = updates.maxGuests;

    await supabase
      .from("property_units")
      .update(unitPatch)
      .eq("organization_id", context.organization.id)
      .eq("property_id", id);
  }

  // Audit Log
  await supabase.from("audit_logs").insert({
    organization_id: context.organization.id,
    actor_user_id: context.user.id,
    action: "property.updated",
    entity_type: "property",
    entity_id: id,
    metadata: { updated_fields: Object.keys(patch) },
  });
}

export async function deleteProperty(context: OrganizationContext, propertyId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("organization_id", context.organization.id)
    .eq("id", propertyId);

  if (error) throw new Error("Unable to delete property: " + error.message);

  // Audit Log
  await supabase.from("audit_logs").insert({
    organization_id: context.organization.id,
    actor_user_id: context.user.id,
    action: "property.deleted",
    entity_type: "property",
    entity_id: propertyId,
    metadata: {},
  });
}

export async function addPropertyAmenity(
  context: OrganizationContext,
  propertyId: string,
  amenityKey: string,
  details?: string
) {
  const supabase = await createClient();
  const { error } = await supabase.from("property_amenities").insert({
    organization_id: context.organization.id,
    property_id: propertyId,
    amenity_key: amenityKey,
    details: details || null,
  });

  if (error) throw new Error("Unable to add amenity: " + error.message);
}

export async function removePropertyAmenity(context: OrganizationContext, amenityId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("property_amenities")
    .delete()
    .eq("organization_id", context.organization.id)
    .eq("id", amenityId);

  if (error) throw new Error("Unable to remove amenity: " + error.message);
}

