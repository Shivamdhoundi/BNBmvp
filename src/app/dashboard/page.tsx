import Link from "next/link";
import { Building2, Users, UserCheck, CalendarCheck, Plus, ChevronRight } from "lucide-react";

import { can } from "@/lib/permissions";
import { getOrganizationContext } from "@/server/auth/context";
import { listProperties } from "@/server/properties/service";
import { listOwners } from "@/server/owners/service";
import { listGuests } from "@/server/guests/service";
import { listBookings } from "@/server/bookings/service";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type BookingRow = { status: string; check_in_date: string; check_out_date: string };

export default async function DashboardPage() {
  const context = await getOrganizationContext();
  if (!context) return null; // Let the layout handle the redirect

  const [properties, owners, guests, bookings] = await Promise.all([
    listProperties(context.organization.id),
    listOwners(context.organization.id),
    listGuests(context.organization.id),
    listBookings(context.organization.id),
  ]);

  // Metrics derived only from real workspace data.
  const now = new Date();
  const activeBookings = (bookings as BookingRow[]).filter(
    (b) => b.status === "pending" || b.status === "confirmed",
  );
  const inHouse = activeBookings.filter(
    (b) => new Date(b.check_in_date) <= now && new Date(b.check_out_date) > now,
  ).length;
  const upcoming = activeBookings.filter((b) => new Date(b.check_in_date) > now).length;

  const stats = [
    { label: "Properties", value: properties.length, icon: Building2, href: "/dashboard/properties" },
    { label: "Owners", value: owners.length, icon: UserCheck, href: "/dashboard/owners" },
    { label: "Guests", value: guests.length, icon: Users, href: "/dashboard/guests" },
    { label: "Active bookings", value: activeBookings.length, icon: CalendarCheck, href: "/dashboard/bookings" },
  ];

  const greeting = getGreeting();

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-8 md:flex-row md:items-center md:justify-between lg:p-10">
        <div className="relative z-10 flex min-w-0 flex-col gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1 text-xs font-semibold text-rose-600">
            <span>Operations Overview</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            {greeting}, {context.user.fullName || "Operator"}.
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-slate-500">
            {properties.length > 0
              ? `Managing ${properties.length} ${properties.length === 1 ? "property" : "properties"} in this workspace.`
              : "Add your first property to get started."}
          </p>
        </div>

        <div className="relative z-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {can(context.role, "properties:create") && (
            <Link
              href="/dashboard/properties/new"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-rose-600/20 transition hover:bg-rose-700 sm:w-auto sm:hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" />
              Add New Property
            </Link>
          )}
        </div>
      </div>

      {/* Real metric cards */}
      <section className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition hover:border-rose-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{stat.label}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-slate-900">{stat.value}</p>
            </Link>
          );
        })}
      </section>

      {/* Booking snapshot — calculated from real bookings */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Currently in-house</span>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{inHouse}</p>
          <p className="mt-1 text-xs text-slate-500">Active bookings covering today</p>
        </div>
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming arrivals</span>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{upcoming}</p>
          <p className="mt-1 text-xs text-slate-500">Confirmed/pending future check-ins</p>
        </div>
      </section>

      {/* Real properties list */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Your Properties</h2>
          <Link
            href="/dashboard/properties"
            className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900 hover:decoration-rose-500"
          >
            View all
          </Link>
        </div>

        {properties.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((prop) => (
              <Link
                key={prop.id}
                href={`/dashboard/properties/${prop.id}`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-rose-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900 group-hover:text-rose-600">{prop.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{prop.city}, {prop.state}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-rose-500" />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="capitalize text-slate-500">{prop.status}</span>
                  <span className="font-semibold text-slate-900">₹{Number(prop.base_price).toLocaleString("en-IN")}/night</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-sm text-slate-500">No properties yet. Add your first property to see it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
