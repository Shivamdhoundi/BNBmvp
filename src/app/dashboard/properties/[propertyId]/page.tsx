/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  MapPin,
  Trash2,
  Sparkles,
  FileText,
  Edit3,
} from "lucide-react";

import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { getProperty } from "@/server/properties/service";
import { listOwners } from "@/server/owners/service";
import {
  updatePropertyDirectAction,
  archivePropertyAction,
  addAmenityAction,
  removeAmenityAction,
} from "@/app/dashboard/properties/actions";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function PropertyDetailPage({ params }: PageProps<"/dashboard/properties/[propertyId]">) {
  const { propertyId } = await params;
  const context = await requireOrganizationContext();
  const property = await getProperty(context.organization.id, propertyId);
  const owners = await listOwners(context.organization.id);

  if (!property) notFound();

  const unit = property.property_units?.[0];
  const address = [
    property.address_line_1,
    property.address_line_2,
    property.city,
    property.state,
    property.postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  const canManage = can(context.role, "properties:update");

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div>
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-800 transition"
        >
          ← Back to All Properties
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 border border-teal-200">
                {label(property.property_type)}
              </span>
              <span className="text-xs text-slate-400">ID: {property.id}</span>
            </div>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              {property.name}
            </h1>

            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-4 w-4 text-teal-600 shrink-0" />
              <span>{address}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold border shadow-sm ${
                property.status === "active"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : property.status === "maintenance"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  property.status === "active"
                    ? "bg-emerald-500 animate-pulse"
                    : property.status === "maintenance"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-slate-400"
                }`}
              />
              {label(property.status)}
            </span>

            {canManage && (
              <form action={archivePropertyAction}>
                <input type="hidden" name="propertyId" value={property.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Archive Property</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Details, Pricing & Amenities */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Operational Profile & Unit Specs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Key Pricing & Unit Capacity Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Nightly Rate</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                ₹{Number(property.base_price).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Base price per night</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Turnover Fee</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                ₹{Number(property.cleaning_fee).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Housekeeping per checkout</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Max Capacity</span>
              <p className="mt-2 text-2xl font-extrabold text-teal-700">
                {unit?.max_guests ?? 2} Guests
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {unit?.bedrooms ?? 1} bed • {unit?.bathrooms ?? 1} bath
              </p>
            </div>
          </div>

          {/* Operational Settings Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-teal-600" />
                Operational Profile & Schedule
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Check-In Window</span>
                <p className="text-sm font-bold text-slate-900">{property.check_in_time?.slice(0, 5)} onwards</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Check-Out Deadline</span>
                <p className="text-sm font-bold text-slate-900">Before {property.check_out_time?.slice(0, 5)}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Security Deposit</span>
                <p className="text-sm font-bold text-slate-900">₹{Number(property.security_deposit).toLocaleString("en-IN")}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Timezone</span>
                <p className="text-sm font-bold text-slate-900">{property.timezone}</p>
              </div>
            </div>

            {property.description && (
              <div className="space-y-1.5 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Internal Description</h3>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {property.description}
                </p>
              </div>
            )}

            {property.house_rules && (
              <div className="space-y-1.5 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">House Rules & Guest Directives</h3>
                <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                  {property.house_rules}
                </p>
              </div>
            )}
          </div>

          {/* Property Amenities Section */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-600" />
                Amenities & Facilities ({property.property_amenities?.length || 0})
              </h2>
            </div>

            {/* List Existing Amenities */}
            {property.property_amenities && property.property_amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {property.property_amenities.map((am) => (
                  <div
                    key={am.id}
                    className="flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200/80 px-3.5 py-2 text-xs font-semibold text-teal-900"
                  >
                    <span>{am.amenity_key}</span>
                    {am.details && <span className="text-[10px] text-teal-600">({am.details})</span>}

                    {canManage && (
                      <form action={removeAmenityAction} className="inline-block ml-1">
                        <input type="hidden" name="amenityId" value={am.id} />
                        <input type="hidden" name="propertyId" value={property.id} />
                        <button type="submit" className="text-slate-400 hover:text-rose-600 font-bold">
                          ×
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No amenities registered yet for this property.</p>
            )}

            {/* Add Amenity Form */}
            {canManage && (
              <form action={addAmenityAction} className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                <input type="hidden" name="propertyId" value={property.id} />
                <input
                  name="amenityKey"
                  required
                  placeholder="e.g. Swimming Pool, High-Speed WiFi"
                  className="flex-1 min-w-[200px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-teal-600 focus:bg-white"
                />
                <input
                  name="details"
                  placeholder="Details (optional)"
                  className="w-44 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-teal-600 focus:bg-white"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-teal-700"
                >
                  + Add Amenity
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Update Property Settings Form */}
        <div className="space-y-6">
          {canManage && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-teal-600" />
                Update Property Record
              </h2>

              <form action={updatePropertyDirectAction} className="space-y-4 text-xs">
                <input type="hidden" name="id" value={property.id} />

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={property.status}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:border-teal-600"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance Block</option>
                    <option value="paused">Paused</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Base Price (₹)</label>
                  <input
                    name="basePrice"
                    type="number"
                    defaultValue={Number(property.base_price)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Management Commission (%)</label>
                  <input
                    name="managementCommissionPercent"
                    type="number"
                    step="0.5"
                    defaultValue={Number((property as any).management_commission_percent || 20)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cleaning Fee (₹)</label>
                  <input
                    name="cleaningFee"
                    type="number"
                    defaultValue={Number(property.cleaning_fee)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Property Owner</label>
                  <select
                    name="ownerId"
                    defaultValue={((property.owners as any) && !Array.isArray(property.owners) ? (property.owners as any).id : (property.owners as any)?.[0]?.id) || ""}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:border-teal-600"
                  >
                    <option value="" disabled>Select an owner (Optional)</option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.legal_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">House Rules</label>
                  <textarea
                    name="houseRules"
                    rows={3}
                    defaultValue={property.house_rules || ""}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:border-teal-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white transition hover:bg-slate-800"
                >
                  Save Updates
                </button>
              </form>
            </div>
          )}

          {/* Documents & Files */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-600" />
              Property Documents
            </h3>
            {property.property_documents && property.property_documents.length > 0 ? (
              <div className="space-y-2">
                {property.property_documents.map((doc) => (
                  <div key={doc.id} className="p-3 rounded-xl bg-slate-50 text-xs flex justify-between">
                    <span className="font-medium text-slate-800">{doc.file_name}</span>
                    <span className="text-[10px] text-slate-400">{doc.visibility}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No uploaded documents or lease agreements attached yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

