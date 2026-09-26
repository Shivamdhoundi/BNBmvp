import { requireOrganizationContext } from "@/server/auth/context";
import { listProperties } from "@/server/properties/service";
import { listBookings } from "@/server/bookings/service";
import { TimelineView } from "@/components/calendar/timeline-view";
import { Plus } from "lucide-react";
import Link from "next/link";

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
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500">Manage property availability and bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/bookings/new"
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New Booking
          </Link>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[600px]">
          <TimelineView properties={properties} bookings={bookings} />
        </div>
      </main>
    </div>
  );
}
