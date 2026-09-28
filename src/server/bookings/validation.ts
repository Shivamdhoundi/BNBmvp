import { z } from "zod";

export const bookingStatuses = ["pending", "confirmed", "cancelled", "completed"] as const;
export const bookingSources = ["direct", "airbnb", "booking_com", "makemytrip", "other"] as const;

const bookingFields = {
  propertyId: z.string().uuid("Select a property."),
  guestId: z.string().uuid("Select a guest."),
  checkInDate: z.string().min(1, "Check-in date is required."),
  checkOutDate: z.string().min(1, "Check-out date is required."),
  status: z.enum(bookingStatuses).default("pending"),
  totalGuests: z.coerce.number().int().min(1, "At least 1 guest.").max(100).default(1),
  totalPrice: z.coerce.number().min(0, "Price cannot be negative.").default(0),
  bookingSource: z.enum(bookingSources).default("direct"),
};

const checkoutAfterCheckin = (data: { checkInDate: string; checkOutDate: string }) =>
  new Date(data.checkInDate) < new Date(data.checkOutDate);

export const createBookingSchema = z
  .object(bookingFields)
  .refine(checkoutAfterCheckin, {
    message: "Check-out must be after check-in.",
    path: ["checkOutDate"],
  });

export const updateBookingSchema = z
  .object({ id: z.string().uuid(), ...bookingFields })
  .refine(checkoutAfterCheckin, {
    message: "Check-out must be after check-in.",
    path: ["checkOutDate"],
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
