import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Building2, CalendarCheck, ChevronRight,
  Clock3, Home, Plus, UserCheck, Users,
} from "lucide-react";

import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { listProperties } from "@/server/properties/service";
import { listOwners } from "@/server/owners/service";
import { listGuests } from "@/server/guests/service";
import { listBookings } from "@/server/bookings/service";

type BookingRow = { status: string; check_in_date: string; check_out_date: string };

export default async function DashboardPage() {
  const context = await requireOrganizationContext();
  const [properties, owners, guests, bookings] = await Promise.all([
    listProperties(context.organization.id),
    listOwners(context.organization.id),
    listGuests(context.organization.id),
    listBookings(context.organization.id),
  ]);

  // All counts come from the signed-in workspace; no sample statistics.
  const now = new Date();
  const activeBookings = (bookings as BookingRow[]).filter(
    (booking) => booking.status === "pending" || booking.status === "confirmed",
  );
  const inHouse = activeBookings.filter(
    (booking) => new Date(booking.check_in_date) <= now && new Date(booking.check_out_date) > now,
  ).length;
  const upcoming = activeBookings.filter((booking) => new Date(booking.check_in_date) > now).length;

  const metrics = [
    { label: "Properties", value: properties.length, icon: Building2, href: "/dashboard/properties", detail: "In your workspace" },
    { label: "Owners", value: owners.length, icon: UserCheck, href: "/dashboard/owners", detail: "Property partners" },
    { label: "Guests", value: guests.length, icon: Users, href: "/dashboard/guests", detail: "Guest profiles" },
    { label: "Open bookings", value: activeBookings.length, icon: CalendarCheck, href: "/dashboard/bookings", detail: "Pending or confirmed" },
  ];
  const name = context.user.fullName?.trim().split(/\s+/)[0] || "there";
  const propertyPreview = properties.slice(0, 6);

  return (
    <div className="space-y-8 pb-12 sm:space-y-10">
      <header className="relative isolate overflow-hidden rounded-[1.75rem] bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-9 sm:py-10 lg:px-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl sm:h-96 sm:w-96" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-1/3 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-rose-100">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-rose-400" />
              Workspace overview
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.7rem]">
              Welcome back, {name}.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {properties.length
                ? `You’re managing ${properties.length} ${properties.length === 1 ? "property" : "properties"} in ${context.organization.name}. Keep your stays and team on track.`
                : "Everything starts with your first property. Add one to begin managing stays in this workspace."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {can(context.role, "bookings:create") && (
              <Link href="/dashboard/bookings/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
                New booking <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            )}
            {can(context.role, "properties:create") && (
              <Link href="/dashboard/properties/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-950/30 transition hover:bg-rose-500">
                <Plus aria-hidden="true" className="h-4 w-4" /> Add property
              </Link>
            )}
          </div>
        </div>
      </header>

      <section aria-labelledby="portfolio-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-700">At a glance</p>
            <h2 id="portfolio-heading" className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Portfolio overview</h2>
          </div>
          <span className="hidden text-xs text-slate-500 sm:block">Current workspace</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {metrics.map(({ label, value, icon: Icon, href, detail }) => (
            <Link key={label} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-xl bg-rose-50 p-2.5 text-rose-700"><Icon aria-hidden="true" className="h-5 w-5" /></span>
                <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-slate-300 transition group-hover:text-rose-600" />
              </div>
              <p className="mt-5 text-3xl font-extrabold tabular-nums tracking-tight text-slate-950">{value.toLocaleString("en-IN")}</p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900">{label}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="stays-heading" className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-700">Guest activity</p>
          <h2 id="stays-heading" className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Stay snapshot</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/dashboard/bookings" className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-md sm:p-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Home aria-hidden="true" className="h-4 w-4 text-teal-700" /> Currently in-house</div>
              <p className="mt-3 text-3xl font-extrabold tabular-nums text-slate-950">{inHouse}</p>
              <p className="mt-1 text-xs text-slate-500">Active bookings covering today</p>
            </div>
            <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-rose-600" />
          </Link>
          <Link href="/dashboard/calendar" className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-md sm:p-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Clock3 aria-hidden="true" className="h-4 w-4 text-blue-700" /> Upcoming arrivals</div>
              <p className="mt-3 text-3xl font-extrabold tabular-nums text-slate-950">{upcoming}</p>
              <p className="mt-1 text-xs text-slate-500">Pending or confirmed future check-ins</p>
            </div>
            <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-rose-600" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="properties-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-700">Your portfolio</p>
            <h2 id="properties-heading" className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Properties</h2>
          </div>
          <Link href="/dashboard/properties" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-bold text-rose-700 transition hover:text-rose-800">
            View all properties <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        {propertyPreview.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {propertyPreview.map((property) => (
              <Link
                key={property.id}
                href={`/dashboard/properties/${property.id}`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-md"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Building2 aria-hidden="true" className="h-5 w-5" /></span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${property.status === "active" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${property.status === "active" ? "bg-emerald-500" : "bg-slate-500"}`} />
                    {property.status}
                  </span>
                </div>
                <h3 className="mt-5 truncate text-base font-bold text-slate-900 group-hover:text-rose-700">{property.name}</h3>
                <p className="mt-1 truncate text-sm text-slate-500">{property.city}, {property.state}</p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <p className="text-sm font-bold text-slate-900">₹{Number(property.base_price).toLocaleString("en-IN")}<span className="font-normal text-slate-500"> / night</span></p>
                  <ChevronRight aria-hidden="true" className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-rose-600" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <span className="rounded-2xl bg-slate-100 p-4 text-slate-600"><Building2 aria-hidden="true" className="h-7 w-7" /></span>
            <h3 className="mt-4 text-base font-bold text-slate-900">Your property list is empty</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-600">Add a property to see it in your overview and begin managing reservations.</p>
            {can(context.role, "properties:create") && (
              <Link href="/dashboard/properties/new" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                <Plus aria-hidden="true" className="h-4 w-4" /> Add your first property
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
