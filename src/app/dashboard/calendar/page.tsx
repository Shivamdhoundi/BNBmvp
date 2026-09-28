import { requireOrganizationContext } from "@/server/auth/context";
import { listProperties } from "@/server/properties/service";
import { listBookings } from "@/server/bookings/service";
import { TimelineView } from "@/components/calendar/timeline-view";
import { Plus } from "lucide-react";
import Link from "next/link";
import { can } from "@/lib/permissions";

export const metadata = {
  title: "Calendar | StayPilot",
};

export default async function CalendarPage() {
  const context = await requireOrganizationContext();
  const [properties, bookings] = await Promise.all([
    listProperties(context.organization.id),
    listBookings(context.organization.id),
  ]);

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] min-w-0 flex-col">
      <header className="flex shrink-0 flex-col gap-4 px-1 pb-5 pt-1 sm:flex-row sm:items-center sm:justify-between sm:px-2 sm:py-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Calendar</h1>
          <p className="mt-1 text-sm text-slate-500">Availability and reservations across your properties</p>
        </div>
        {can(context.role, "bookings:create") && (
          <Link
            href="/dashboard/bookings/new"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            New Booking
          </Link>
        )}
      </header>

      <main className="min-w-0 flex-1 pb-4 sm:px-2 sm:pb-8">
        <div className="flex min-h-[34rem] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm sm:h-[640px] sm:rounded-3xl">
          <TimelineView properties={properties} bookings={bookings} />
        </div>
      </main>
    </div>
  );
}
