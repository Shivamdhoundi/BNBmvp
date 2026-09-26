import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Star,
  Building2
} from "lucide-react";

import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { listProperties } from "@/server/properties/service";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const defaultShowcase = [
  {
    id: "demo-1",
    name: "The Grand Pavilion Villa & Pool",
    city: "Golf Course Road",
    state: "Gurugram",
    property_type: "luxury_villa",
    status: "occupied",
    rate: "₹24,500/night",
    image: "/properties/villa.png",
    rating: "4.98",
  },
  {
    id: "demo-2",
    name: "Skyline Luxury Penthouse 4B",
    city: "Cyber City Sector 24",
    state: "Gurugram",
    property_type: "penthouse_suite",
    status: "cleaning_dispatched",
    rate: "₹18,000/night",
    image: "/properties/penthouse.png",
    rating: "4.95",
  },
  {
    id: "demo-3",
    name: "Boutique Heritage Suite",
    city: "DLF Phase 5",
    state: "Gurugram",
    property_type: "boutique_suite",
    status: "occupied",
    rate: "₹12,500/night",
    image: "/properties/suite.png",
    rating: "4.92",
  },
  {
    id: "demo-4",
    name: "Stone Veranda Farmhouse & Spa",
    city: "Sohna Road Greens",
    state: "Gurugram",
    property_type: "luxury_farmhouse",
    status: "available",
    rate: "₹32,000/night",
    image: "/properties/farmhouse.png",
    rating: "4.99",
  },
];

export default async function PropertiesPage() {
  const context = await requireOrganizationContext();
  const dbProperties = await listProperties(context.organization.id);

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Your Properties
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {dbProperties.length > 0 ? dbProperties.length : defaultShowcase.length} properties managed by your team.
          </p>
        </div>

        {can(context.role, "properties:create") && (
          <Link
            href="/dashboard/properties/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/20 transition hover:bg-rose-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Property</span>
          </Link>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto text-sm font-semibold pb-2">
          <button className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800">
            All Units
          </button>
          <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:border-slate-400">
            Occupied
          </button>
          <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:border-slate-400">
            Turnovers
          </button>
        </div>
      </div>

      {/* Database Properties Grid */}
      {dbProperties.length > 0 ? (
        <section className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {dbProperties.map((property) => (
            <Link
              href={`/dashboard/properties/${property.id}`}
              key={property.id}
              className="group relative flex flex-col overflow-hidden bg-white transition-all duration-300"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-slate-100">
                <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                   <Building2 className="h-10 w-10 text-slate-400 opacity-50" />
                </div>
                
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm border border-white/20">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {label(property.status)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col pt-4 pb-2 px-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-[15px] text-slate-900 leading-tight truncate pr-2">
                    {property.name}
                  </h3>
                </div>
                <p className="text-sm text-slate-500">{property.city}, {property.state}</p>
                <p className="text-sm text-slate-500">{label(property.property_type)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-2">Manage</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        /* Showcase Cards Grid */
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {defaultShowcase.map((item) => (
            <Link
              href="/dashboard/properties"
              key={item.id}
              className="group relative flex flex-col overflow-hidden bg-white transition-all duration-300"
            >
              <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden rounded-3xl">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm border border-white/20">
                    <span className={`h-2 w-2 rounded-full ${item.status === 'occupied' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {label(item.status)}
                  </span>
                </div>

                <div className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-800 backdrop-blur-md flex items-center gap-1 shadow-sm border border-white/20">
                  <Star className="h-3.5 w-3.5 fill-slate-800" />
                  <span>{item.rating}</span>
                </div>
              </div>

              <div className="flex flex-col pt-4 pb-2 px-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-[15px] text-slate-900 leading-tight">
                    {item.city}, {item.state}
                  </h3>
                  <div className="flex items-center gap-1 font-semibold text-[15px]">
                    <span>{item.rate.split('/')[0]}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500">{label(item.property_type)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-2">Manage</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

