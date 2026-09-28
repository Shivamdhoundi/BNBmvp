import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Plus,
  ShieldCheck,
  Star,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import { can } from "@/lib/permissions";
import { getOrganizationContext } from "@/server/auth/context";
import { listProperties } from "@/server/properties/service";
import { ComingSoonButton } from "@/components/ui/coming-soon-button";

// High-end demo properties for visualization & operational demo
const showcaseProperties = [
  {
    id: "prop-1",
    name: "The Grand Pavilion Villa & Pool",
    city: "Golf Course Road",
    state: "Gurugram",
    rate: "₹24,500",
    status: "Occupied",
    statusColor: "bg-emerald-500",
    badgeText: "Guest Checked In",
    badgeStyle: "bg-emerald-100 text-emerald-800 border-emerald-200",
    guest: "Rohan Malhotra (4 guests)",
    checkout: "Tomorrow, 11:00 AM",
    image: "/properties/villa.png",
    type: "Luxury Villa",
    rating: "4.98",
  },
  {
    id: "prop-2",
    name: "Skyline Luxury Penthouse 4B",
    city: "Cyber City Sector 24",
    state: "Gurugram",
    rate: "₹18,000",
    status: "Turnover Pending",
    statusColor: "bg-amber-500",
    badgeText: "Cleaning Dispatched",
    badgeStyle: "bg-amber-100 text-amber-800 border-amber-200",
    guest: "Cleaning Staff Assigned (Pooja M.)",
    checkout: "Checked out 10:30 AM",
    image: "/properties/penthouse.png",
    type: "Penthouse Suite",
    rating: "4.95",
  },
  {
    id: "prop-3",
    name: "Boutique Heritage Suite",
    city: "DLF Phase 5",
    state: "Gurugram",
    rate: "₹12,500",
    status: "Occupied",
    statusColor: "bg-emerald-500",
    badgeText: "Guest Checked In",
    badgeStyle: "bg-emerald-100 text-emerald-800 border-emerald-200",
    guest: "Dr. Ananya Sharma",
    checkout: "28 Sep, 12:00 PM",
    image: "/properties/suite.png",
    type: "Boutique Suite",
    rating: "4.92",
  },
  {
    id: "prop-4",
    name: "Stone Veranda Farmhouse & Spa",
    city: "Sohna Road Greens",
    state: "Gurugram",
    rate: "₹32,000",
    status: "Available",
    statusColor: "bg-blue-500",
    badgeText: "Instant Book Ready",
    badgeStyle: "bg-blue-100 text-blue-800 border-blue-200",
    guest: "Ready for arrival",
    checkout: "Smart Lock Verified",
    image: "/properties/farmhouse.png",
    type: "Luxury Farmhouse",
    rating: "4.99",
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const context = await getOrganizationContext();
  if (!context) return null; // Let the layout handle the redirect
  const dbProperties = await listProperties(context.organization.id);
  
  const totalCount = dbProperties.length || 14;
  const greeting = getGreeting();

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Welcome Section */}
      <div className="relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-8 md:flex-row md:items-center md:justify-between lg:p-10">
        <div className="relative z-10 flex min-w-0 flex-col gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1 text-xs font-semibold text-rose-600">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Operations Command Center</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            {greeting}, {context.user.fullName || "Operator"}.
          </h1>
          <p className="max-w-xl text-sm text-slate-500 leading-relaxed">
            Here&apos;s what&apos;s happening today across your <span className="font-semibold text-rose-600">{totalCount} properties</span> in Gurugram & Delhi NCR.
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
          <ComingSoonButton className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 sm:w-auto">
            <RefreshCw className="h-4 w-4 text-slate-400" />
            <span>Sync Channels</span>
          </ComingSoonButton>
        </div>
      </div>

      {/* High-Impact Metric Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Occupancy Rate</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-2xl font-extrabold text-slate-900 sm:text-3xl">88.5%</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3.5 w-3.5" /> +12.4%
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">12 of 14 units occupied tonight</p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: "88.5%" }} />
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">MTD Gross Revenue</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-2xl font-extrabold text-slate-900 sm:text-3xl">₹8,45,000</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3.5 w-3.5" /> +18.2%
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">Projected ₹10.2L payout this month</p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
            <span>RevPAR: ₹6,800/night</span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cleanliness & Ops</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-2xl font-extrabold text-slate-900 sm:text-3xl">98.2%</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              2 Turnovers Active
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">12 housekeeping dispatches done</p>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-600">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>0 maintenance blocks</span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Guest Experience</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Star className="h-5 w-5 fill-amber-400" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-2xl font-extrabold text-slate-900 sm:text-3xl">4.94 ★</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
              Superhost status
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">Based on 148 verified stays</p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-slate-600">
            <span>Response time: &lt; 8 mins</span>
          </div>
        </div>
      </section>

      {/* Main Content Grid: Property Showcase & Today's Operational Feed */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Properties Showcase Cards */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Your Properties
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage operations, guests, and listings
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/properties"
                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
              >
                <span className="underline decoration-slate-300 underline-offset-4 decoration-2 hover:decoration-rose-500">View All Properties</span>
              </Link>
            </div>
          </div>

          {/* Database Properties Alert if present */}
          {dbProperties.length > 0 && (
            <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-6">
              <h3 className="text-sm font-semibold text-rose-900 mb-4">Workspace Database ({dbProperties.length})</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {dbProperties.map((prop) => (
                  <Link
                    key={prop.id}
                    href={`/dashboard/properties/${prop.id}`}
                    className="flex flex-col rounded-2xl border border-rose-100 bg-white p-4 transition hover:shadow-md hover:border-rose-200 group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm text-slate-900 group-hover:text-rose-600 transition-colors">{prop.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{prop.city}, {prop.state}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-rose-500" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Luxury Showcase Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            {showcaseProperties.map((prop) => (
              <Link
                href={`/dashboard/properties`}
                key={prop.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl bg-white transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 rounded-3xl">
                  <Image
                    src={prop.image}
                    alt={prop.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm border border-white/20">
                      <span className={`h-2 w-2 rounded-full ${prop.statusColor}`} />
                      {prop.status}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm border border-white/20 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-slate-800 text-slate-800" />
                    <span>{prop.rating}</span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="flex flex-col pt-4 pb-2 px-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-[15px] text-slate-900 leading-tight">
                      {prop.city}, {prop.state}
                    </h3>
                    <div className="flex items-center gap-1 font-semibold text-[15px]">
                      <span>{prop.rate}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">{prop.type}</p>
                  <p className="text-sm text-slate-500">{prop.guest}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-slate-900 underline decoration-slate-300 underline-offset-2">Manage property</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Sidebar: Operations Dispatch & Live Activity Stream */}
        <div className="space-y-6">
          {/* Operations Dispatch Box */}
          <div className="rounded-[2rem] border border-slate-200/60 bg-white p-7 shadow-sm space-y-6">
            <div className="flex flex-col gap-1 pb-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Today&apos;s Operations</h3>
              <p className="text-sm text-slate-500">Live feed for your team</p>
            </div>

            <div className="space-y-6">
              <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-0 before:w-px before:bg-slate-200">
                <span className="absolute left-0.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                <p className="text-sm font-semibold text-slate-900">Turnover Verified</p>
                <p className="text-xs text-slate-500 mt-1">Villa Serenity (Gurugram) • Cleaner ID #204</p>
                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg mt-2 inline-block">Ready for 2:00 PM Check-in</span>
              </div>

              <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-0 before:w-px before:bg-slate-200">
                <span className="absolute left-0.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-amber-500 shadow-sm" />
                <p className="text-sm font-semibold text-slate-900">Housekeeping Dispatched</p>
                <p className="text-xs text-slate-500 mt-1">Penthouse 4B • Linen & Deep Clean</p>
                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg mt-2 inline-block">Estimated completion 1:30 PM</span>
              </div>

              <div className="relative pl-6">
                <span className="absolute left-0.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-rose-500 shadow-sm" />
                <p className="text-sm font-semibold text-slate-900">Smart Lock Pin Generated</p>
                <p className="text-xs text-slate-500 mt-1">Boutique Heritage Suite • Sent via WhatsApp</p>
                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg mt-2 inline-block">Active for next 48 hrs</span>
              </div>
            </div>
          </div>

          {/* Quick Hub Tools */}
          <div className="rounded-[2rem] bg-slate-900 p-8 text-white space-y-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 blur-3xl rounded-full" />
            <h3 className="font-bold text-lg text-white relative z-10 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-rose-400" />
              StayPilot AI
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed relative z-10">
              Automated WhatsApp guest communications and dynamic nightly rate optimization are active.
            </p>
            <div className="pt-2 relative z-10">
              <button className="w-full rounded-2xl bg-white text-slate-900 py-3 text-sm font-bold transition hover:bg-slate-100 shadow-sm">
                View Insights
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

