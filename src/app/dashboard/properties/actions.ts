"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import {
  createProperty,
  updateProperty,
  archiveProperty,
  addPropertyAmenity,
  removePropertyAmenity,
} from "@/server/properties/service";
import { createPropertySchema, updatePropertySchema } from "@/server/properties/validation";

export type PropertyFormState = {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const uuid = z.string().uuid();
const amenitySchema = z.object({
  propertyId: z.string().uuid(),
  amenityKey: z.string().trim().min(1).max(120),
  details: z.string().trim().max(240).optional(),
});

export async function createPropertyAction(_: PropertyFormState, formData: FormData): Promise<PropertyFormState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "properties:create")) return { formError: "You do not have permission to create properties." };

  const parsed = createPropertySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    propertyType: formData.get("propertyType"),
    status: formData.get("status") || "active",
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.has("addressLine2") ? String(formData.get("addressLine2") ?? "") : undefined,
    city: formData.get("city") || "Gurugram",
    state: formData.get("state") || "Haryana",
    postalCode: formData.has("postalCode") ? String(formData.get("postalCode") ?? "") : undefined,
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
    checkInTime: formData.get("checkInTime") || "15:00",
    checkOutTime: formData.get("checkOutTime") || "11:00",
    basePrice: formData.get("basePrice") || 0,
    cleaningFee: formData.get("cleaningFee") || 0,
    securityDeposit: formData.get("securityDeposit") || 0,
    description: formData.has("description") ? String(formData.get("description") ?? "") : undefined,
    houseRules: formData.has("houseRules") ? String(formData.get("houseRules") ?? "") : undefined,
    bedrooms: formData.get("bedrooms") || 1,
    bathrooms: formData.get("bathrooms") || 1,
    maxGuests: formData.get("maxGuests") || 2,
    ownerId: formData.has("ownerId") ? (formData.get("ownerId") || null) : undefined,
    managementCommissionPercent: formData.get("managementCommissionPercent") || 20,
  });

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  let propertyId: string;
  try {
    propertyId = await createProperty(context, parsed.data);
  } catch (error) {
    return { formError: error instanceof Error ? error.message : "Unable to create property." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  redirect(`/dashboard/properties/${propertyId}`);
}

export async function updatePropertyAction(_: PropertyFormState, formData: FormData): Promise<PropertyFormState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "properties:update")) return { formError: "You do not have permission to update properties." };

  const parsed = updatePropertySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name") || undefined,
    slug: formData.get("slug") || undefined,
    propertyType: formData.get("propertyType") || undefined,
    status: formData.get("status") || undefined,
    addressLine1: formData.get("addressLine1") || undefined,
    addressLine2: formData.has("addressLine2") ? String(formData.get("addressLine2") ?? "") : undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    postalCode: formData.has("postalCode") ? String(formData.get("postalCode") ?? "") : undefined,
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
    checkInTime: formData.get("checkInTime") || undefined,
    checkOutTime: formData.get("checkOutTime") || undefined,
    basePrice: formData.get("basePrice") || undefined,
    cleaningFee: formData.get("cleaningFee") || undefined,
    securityDeposit: formData.get("securityDeposit") || undefined,
    description: formData.has("description") ? String(formData.get("description") ?? "") : undefined,
    houseRules: formData.has("houseRules") ? String(formData.get("houseRules") ?? "") : undefined,
    bedrooms: formData.get("bedrooms") || undefined,
    bathrooms: formData.get("bathrooms") || undefined,
    maxGuests: formData.get("maxGuests") || undefined,
    ownerId: formData.has("ownerId") ? (formData.get("ownerId") || null) : undefined,
    managementCommissionPercent: formData.get("managementCommissionPercent") || undefined,
  });

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await updateProperty(context, parsed.data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/properties");
    revalidatePath(`/dashboard/properties/${parsed.data.id}`);
    return {};
  } catch (error) {
    return { formError: error instanceof Error ? error.message : "Unable to update property." };
  }
}

export async function updatePropertyDirectAction(formData: FormData) {
  const context = await requireOrganizationContext();
  if (!can(context.role, "properties:update")) throw new Error("Permission denied.");

  const parsed = updatePropertySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name") || undefined,
    slug: formData.get("slug") || undefined,
    propertyType: formData.get("propertyType") || undefined,
    status: formData.get("status") || undefined,
    addressLine1: formData.get("addressLine1") || undefined,
    addressLine2: formData.has("addressLine2") ? String(formData.get("addressLine2") ?? "") : undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    postalCode: formData.has("postalCode") ? String(formData.get("postalCode") ?? "") : undefined,
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
    checkInTime: formData.get("checkInTime") || undefined,
    checkOutTime: formData.get("checkOutTime") || undefined,
    basePrice: formData.get("basePrice") || undefined,
    cleaningFee: formData.get("cleaningFee") || undefined,
    securityDeposit: formData.get("securityDeposit") || undefined,
    description: formData.has("description") ? String(formData.get("description") ?? "") : undefined,
    houseRules: formData.has("houseRules") ? String(formData.get("houseRules") ?? "") : undefined,
    bedrooms: formData.get("bedrooms") || undefined,
    bathrooms: formData.get("bathrooms") || undefined,
    maxGuests: formData.get("maxGuests") || undefined,
    ownerId: formData.has("ownerId") ? (formData.get("ownerId") || null) : undefined,
    managementCommissionPercent: formData.get("managementCommissionPercent") || undefined,
  });

  if (!parsed.success) throw new Error("Validation failed for property update.");

  await updateProperty(context, parsed.data);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  revalidatePath(`/dashboard/properties/${parsed.data.id}`);
}


export async function archivePropertyAction(formData: FormData) {
  const context = await requireOrganizationContext();
  if (!can(context.role, "properties:update")) throw new Error("Permission denied.");

  const propertyId = uuid.safeParse(formData.get("propertyId"));
  if (!propertyId.success) throw new Error("Invalid property.");
  await archiveProperty(context, propertyId.data);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

export async function addAmenityAction(formData: FormData) {
  const context = await requireOrganizationContext();
  if (!can(context.role, "properties:update")) throw new Error("Permission denied.");
  const parsed = amenitySchema.safeParse({
    propertyId: formData.get("propertyId"),
    amenityKey: formData.get("amenityKey"),
    details: formData.get("details") || undefined,
  });
  if (!parsed.success) throw new Error("Enter a valid amenity.");

  await addPropertyAmenity(context, parsed.data.propertyId, parsed.data.amenityKey, parsed.data.details);
  revalidatePath(`/dashboard/properties/${parsed.data.propertyId}`);
}

export async function removeAmenityAction(formData: FormData) {
  const context = await requireOrganizationContext();
  if (!can(context.role, "properties:update")) throw new Error("Permission denied.");
  const amenityId = uuid.safeParse(formData.get("amenityId"));
  const propertyId = uuid.safeParse(formData.get("propertyId"));
  if (!amenityId.success || !propertyId.success) throw new Error("Invalid amenity.");

  await removePropertyAmenity(context, amenityId.data);
  revalidatePath(`/dashboard/properties/${propertyId.data}`);
}
