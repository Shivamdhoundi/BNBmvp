"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { createBooking } from "@/server/bookings/service";
import { createBookingSchema } from "@/server/bookings/validation";

export type BookingFormState = {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createBookingAction(_: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "bookings:create")) {
    return { formError: "You do not have permission to create bookings." };
  }

  const parsed = createBookingSchema.safeParse({
    propertyId: formData.get("propertyId"),
    guestId: formData.get("guestId"),
    checkInDate: formData.get("checkInDate"),
    checkOutDate: formData.get("checkOutDate"),
    status: formData.get("status") || "pending",
    totalGuests: formData.get("totalGuests") || 1,
    totalPrice: formData.get("totalPrice") || 0,
    bookingSource: formData.get("bookingSource") || "direct",
  });

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await createBooking(context, {
      propertyId: parsed.data.propertyId,
      guestId: parsed.data.guestId,
      checkInDate: parsed.data.checkInDate,
      checkOutDate: parsed.data.checkOutDate,
      status: parsed.data.status,
      totalGuests: parsed.data.totalGuests,
      totalPrice: parsed.data.totalPrice,
      bookingSource: parsed.data.bookingSource,
    });
  } catch (error) {
    return { formError: error instanceof Error ? error.message : "Unable to create booking." };
  }

  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/calendar");
  redirect("/dashboard/bookings");
}
