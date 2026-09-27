import { z } from "zod";

export const createOwnerSchema = z.object({
  legalName: z.string().trim().min(2, "Use at least 2 characters.").max(160),
  email: z.string().trim().email("Enter a valid email address.").max(240),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
});

export type CreateOwnerInput = z.infer<typeof createOwnerSchema>;
