import { createClient } from "@/lib/supabase/server";
import type { OrganizationContext } from "@/server/auth/context";
import { recordAuditEvent } from "@/server/audit/service";

export async function listBookings(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      properties (id, name, city, state, property_type),
      guests (id, first_name, last_name, email, phone)
    `)
    .eq("organization_id", organizationId)
    .order("check_in_date", { ascending: false });

  if (error) throw new Error("Unable to load bookings: " + error.message);
  return data ?? [];
}

export async function createBooking(context: OrganizationContext, input: { 
  propertyId: string;
  guestId: string;
  checkInDate: string;
  checkOutDate: string;
  status?: string;
  totalGuests?: number;
  totalPrice?: number;
  bookingSource?: string;
}) {
  const supabase = await createClient();

  const [{ data: property }, { data: guest }] = await Promise.all([
    supabase
      .from("properties")
      .select("id")
      .eq("id", input.propertyId)
      .eq("organization_id", context.organization.id)
      .maybeSingle(),
    supabase
      .from("guests")
      .select("id")
      .eq("id", input.guestId)
      .eq("organization_id", context.organization.id)
      .maybeSingle(),
  ]);

  if (!property || !guest) throw new Error("Select a property and guest from this workspace.");
  
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      organization_id: context.organization.id,
      property_id: input.propertyId,
      guest_id: input.guestId,
      check_in_date: input.checkInDate,
      check_out_date: input.checkOutDate,
      status: input.status || 'pending',
      total_guests: input.totalGuests || 1,
      total_price: String(input.totalPrice || 0),
      booking_source: input.bookingSource || 'direct',
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to create booking.");

  await recordAuditEvent(context, {
    action: "booking.created",
    entityType: "booking",
    entityId: data.id,
    metadata: { status: input.status || "pending", booking_source: input.bookingSource || "direct" },
  });

  return data.id;
}
