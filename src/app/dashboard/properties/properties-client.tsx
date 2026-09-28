"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Building2, Plus, Download } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { columns, type PropertyData } from "./columns";

export function PropertiesClient({ properties, canCreate }: { properties: PropertyData[], canCreate: boolean }) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Properties
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {properties.length} {properties.length === 1 ? "property" : "properties"} managed by your team.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
          {/* View Toggle */}
          <div className="col-span-2 flex min-h-11 items-center rounded-xl border border-slate-200 bg-white p-1 sm:col-span-1">
            <button
              onClick={() => setViewMode("table")}
              aria-label="Show properties as a table"
              className={`flex min-h-9 flex-1 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === "table"
                  ? "bg-slate-100 text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <List className="mr-2 h-4 w-4" />
              Table
            </button>
            <button
              onClick={() => setViewMode("grid")}
              aria-label="Show properties as cards"
              className={`flex min-h-9 flex-1 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-slate-100 text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              Cards
            </button>
          </div>
          
          <button className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
            <Download className="h-4 w-4" />
            Export
          </button>

          {canCreate && (
            <Link
              href="/dashboard/properties/new"
              className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 sm:col-span-1 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              <span>Add Property</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          data={properties}
          searchKey="name"
          searchPlaceholder="Search properties..."
          emptyStateTitle="No properties found"
          emptyStateDescription="Get started by creating your first property."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {properties.length > 0 ? (
            properties.map((property) => (
              <Link
                href={`/dashboard/properties/${property.id}`}
                key={property.id}
                className="group relative flex flex-col overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-slate-300" />
                  </div>
                  
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm border border-slate-200/50">
                      <span className={`h-1.5 w-1.5 rounded-full ${property.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="capitalize">{property.status}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col p-4">
                  <h3 className="font-semibold text-[15px] text-slate-900 leading-tight truncate">
                    {property.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 truncate">{property.city}, {property.state}</p>
                  
                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100">
                     <span className="text-sm font-semibold text-slate-900">
                       ₹{parseFloat(property.base_price).toLocaleString('en-IN')}
                       <span className="text-xs font-normal text-slate-500">/night</span>
                     </span>
                     <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md capitalize">
                       {property.property_type.replace(/_/g, " ")}
                     </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
               <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-4" />
               <h3 className="text-lg font-medium text-slate-900">No properties found</h3>
               <p className="mt-1 text-slate-500">Get started by creating your first property.</p>
               {canCreate && (
                 <Link href="/dashboard/properties/new" className="mt-6 inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors">
                   <Plus className="mr-2 h-4 w-4" />
                   Add Property
                 </Link>
               )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
