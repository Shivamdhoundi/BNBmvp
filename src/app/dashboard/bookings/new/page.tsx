import Link from "next/link";

import { BookingForm } from "@/components/bookings/booking-form";
import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { listProperties } from "@/server/properties/service";
import { listGuests } from "@/server/guests/service";

export const metadata = {
  title: "New Booking | StayPilot",
};

export default async function NewBookingPage() {
  const context = await requireOrganizationContext();
  if (!can(context.role, "bookings:create")) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-semibold text-slate-900">You don&apos;t have access to create bookings.</h1>
        <p className="mt-2 text-slate-500">Ask a workspace administrator to update your role.</p>
      </div>
    );
  }

  const [properties, guests] = await Promise.all([
    listProperties(context.organization.id),
    listGuests(context.organization.id),
  ]);

  const propertyOptions = properties.map((p) => ({
    id: p.id as string,
    label: `${p.name}${p.city ? ` — ${p.city}` : ""}`,
  }));
  const guestOptions = guests.map((g) => ({
    id: g.id as string,
    label: `${g.first_name} ${g.last_name}`.trim(),
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/bookings" className="text-sm font-medium text-rose-600 hover:underline">
        ← Back to bookings
      </Link>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-8">
        <p className="text-sm font-medium text-rose-600">New booking</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Create a reservation</h1>
        <p className="mt-2 text-[15px] leading-6 text-slate-500">
          Assign a guest to a property for a set of dates. It will appear on the calendar and bookings list.
        </p>
        <div className="mt-8">
          <BookingForm properties={propertyOptions} guests={guestOptions} />
        </div>
      </div>
    </div>
  );
}
