import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const propertyTypes = ["apartment", "house", "villa", "studio", "serviced_apartment", "other"] as const;
export const propertyStatuses = ["draft", "onboarding", "active", "paused", "inactive", "maintenance"] as const;

export const createPropertySchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(160),
  slug: z.string().trim().regex(slugPattern, "Use lowercase letters, numbers, and hyphens only.").max(100),
  propertyType: z.enum(propertyTypes),
  status: z.enum(propertyStatuses).default("active"),
  addressLine1: z.string().trim().min(4, "Enter a complete street address.").max(240),
  addressLine2: z.string().trim().max(240).optional(),
  city: z.string().trim().min(2).max(100).default("Gurugram"),
  state: z.string().trim().min(2).max(100).default("Haryana"),
  postalCode: z.string().trim().optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  checkInTime: z.string().default("15:00"),
  checkOutTime: z.string().default("11:00"),
  basePrice: z.coerce.number().min(0, "Base price cannot be negative.").default(0),
  cleaningFee: z.coerce.number().min(0).default(0),
  securityDeposit: z.coerce.number().min(0).default(0),
  description: z.string().trim().max(1_500).optional(),
  houseRules: z.string().trim().max(2_000).optional(),
  bedrooms: z.coerce.number().min(0).max(99).default(1),
  bathrooms: z.coerce.number().positive().max(99).default(1),
  maxGuests: z.coerce.number().int().min(1).max(100).default(2),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = createPropertySchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

