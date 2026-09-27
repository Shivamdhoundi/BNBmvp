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
    <div className="flex flex-col h-full min-h-[calc(100vh-64px)]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500">Availability and reservations across your properties</p>
        </div>
        <div className="flex items-center gap-3">
          {can(context.role, "bookings:create") && (
            <Link
              href="/dashboard/bookings/new"
              className="flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              New Booking
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 px-6 pb-8">
        <div className="flex h-[640px] flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
          <TimelineView properties={properties} bookings={bookings} />
        </div>
      </main>
    </div>
  );
}
