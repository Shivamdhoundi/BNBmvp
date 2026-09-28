import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingForm } from "@/components/bookings/booking-form";
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button";
import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { getBooking } from "@/server/bookings/service";
import { listProperties } from "@/server/properties/service";
import { listGuests } from "@/server/guests/service";

export const metadata = { title: "Edit Booking | StayPilot" };

function toDateInput(value: string | null): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default async function EditBookingPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const context = await requireOrganizationContext();
  if (!can(context.role, "bookings:update")) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-semibold text-slate-900">You don&apos;t have access to edit bookings.</h1>
      </div>
    );
  }

  const [booking, properties, guests] = await Promise.all([
    getBooking(context.organization.id, bookingId),
    listProperties(context.organization.id),
    listGuests(context.organization.id),
  ]);

  if (!booking) notFound();

  const propertyOptions = properties.map((p) => ({ id: p.id as string, label: `${p.name}${p.city ? ` — ${p.city}` : ""}` }));
  const guestOptions = guests.map((g) => ({ id: g.id as string, label: `${g.first_name} ${g.last_name}`.trim() }));

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/bookings" className="text-sm font-medium text-rose-600 hover:underline">
        ← Back to bookings
      </Link>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-rose-600">Edit booking</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Reservation</h1>
          </div>
          {booking.status !== "cancelled" && <CancelBookingButton bookingId={booking.id} />}
        </div>
        <div className="mt-8">
          <BookingForm
            properties={propertyOptions}
            guests={guestOptions}
            booking={{
              id: booking.id,
              propertyId: booking.property_id,
              guestId: booking.guest_id,
              checkInDate: toDateInput(booking.check_in_date),
              checkOutDate: toDateInput(booking.check_out_date),
              status: booking.status,
              totalGuests: booking.total_guests,
              totalPrice: Number(booking.total_price),
              bookingSource: booking.booking_source,
            }}
          />
        </div>
      </div>
    </div>
  );
}
