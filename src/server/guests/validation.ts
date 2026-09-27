import { z } from "zod";

export const createGuestSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(120),
  lastName: z.string().trim().min(1, "Last name is required.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(240).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  identityVerified: z.coerce.boolean().default(false),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
