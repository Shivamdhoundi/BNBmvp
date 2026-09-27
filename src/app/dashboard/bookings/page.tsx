import Link from "next/link";
import { Plus, Calendar, Clock, MapPin } from "lucide-react";
import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { listBookings } from "@/server/bookings/service";
import { ComingSoonButton } from "@/components/ui/coming-soon-button";

type BookingItem = {
  id: string;
  status: string;
  check_in_date: string;
  check_out_date: string;
  total_price: string;
  properties?: { name: string; city: string; state: string } | null;
  guests?: { first_name: string; last_name: string } | null;
};

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function BookingsPage() {
  const context = await requireOrganizationContext();
  const dbBookings = await listBookings(context.organization.id);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View upcoming stays, past reservations, and current guests.
          </p>
        </div>

        {can(context.role, "bookings:create") && (
          <Link
            href="/dashboard/bookings/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/20 transition hover:bg-rose-700"
          >
            <Plus className="h-4 w-4" />
            <span>New Booking</span>
          </Link>
        )}
      </div>

      {/* Database Bookings List */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dbBookings.map((booking: BookingItem) => (
          <div
            key={booking.id}
            className="group relative flex flex-col overflow-hidden bg-white rounded-3xl border border-slate-200 p-6 transition-all duration-300 hover:border-rose-300 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg leading-tight">
                  {booking.properties?.name || 'Unknown Property'}
                </h3>
                <p className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                  <MapPin className="h-3 w-3" />
                  {booking.properties?.city}, {booking.properties?.state}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm border ${
                booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                booking.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                {label(booking.status)}
              </span>
            </div>
            
            <div className="mt-6 space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Check-in</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {new Date(booking.check_in_date).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>Check-out</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {new Date(booking.check_out_date).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-slate-600">Guest</span>
                <span className="font-semibold text-slate-900">
                  {booking.guests?.first_name} {booking.guests?.last_name}
                </span>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between text-sm border-t border-slate-100 pt-4">
              <span className="font-bold text-lg text-slate-900">
                ₹{booking.total_price}
              </span>
              <ComingSoonButton className="font-bold text-slate-900">
                Details →
              </ComingSoonButton>
            </div>
          </div>
        ))}
        {dbBookings.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-sm text-slate-500">No bookings found. Try adding some properties and reservations.</p>
          </div>
        )}
      </section>
    </div>
  );
}
