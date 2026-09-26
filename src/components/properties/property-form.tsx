"use client";

import { useActionState, useState } from "react";
import { createPropertyAction, type PropertyFormState } from "@/app/dashboard/properties/actions";
import { propertyTypes, propertyStatuses } from "@/server/properties/validation";

const initialState: PropertyFormState = {};

function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="mt-1.5 text-xs text-red-700">{errors[0]}</p> : null;
}

const inputClass = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10";

export function PropertyForm() {
  const [state, action, pending] = useActionState(createPropertyAction, initialState);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);

  const displayedSlug = isSlugEdited ? slug : toSlug(name);

  return (
    <form action={action} className="space-y-8">
      {/* Identity & Basic Info */}
      <section>
        <div>
          <h2 className="font-bold text-base text-slate-900">Property Identity</h2>
          <p className="mt-1 text-xs text-slate-500">
            Define your property&apos;s name, type, and unit capacity.
          </p>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">
            Property Name
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={160}
              className={inputClass}
              placeholder="e.g. Skyline Luxury Villa"
            />
            <FieldError errors={state.fieldErrors?.name} />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            URL Slug Key
            <input
              name="slug"
              value={displayedSlug}
              onChange={(e) => {
                setIsSlugEdited(true);
                setSlug(toSlug(e.target.value));
              }}
              required
              maxLength={100}
              className={inputClass}
              placeholder="skyline-luxury-villa"
            />
            <FieldError errors={state.fieldErrors?.slug} />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Property Type
            <select name="propertyType" defaultValue="apartment" className={inputClass}>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}
                </option>
              ))}
            </select>
            <FieldError errors={state.fieldErrors?.propertyType} />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Initial Operational Status
            <select name="status" defaultValue="active" className={inputClass}>
              {propertyStatuses.map((st) => (
                <option key={st} value={st}>
                  {st.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}
                </option>
              ))}
            </select>
            <FieldError errors={state.fieldErrors?.status} />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Maximum Guests
            <input name="maxGuests" type="number" defaultValue="2" required min="1" max="100" className={inputClass} />
            <FieldError errors={state.fieldErrors?.maxGuests} />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Bedrooms
            <input name="bedrooms" type="number" defaultValue="1" required min="0" max="99" step="0.5" className={inputClass} />
            <FieldError errors={state.fieldErrors?.bedrooms} />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Bathrooms
            <input name="bathrooms" type="number" defaultValue="1" required min="0.5" max="99" step="0.5" className={inputClass} />
            <FieldError errors={state.fieldErrors?.bathrooms} />
          </label>
        </div>
      </section>

      {/* Pricing & Fees */}
      <section className="border-t border-slate-100 pt-8">
        <div>
          <h2 className="font-bold text-base text-slate-900">Rates & Pricing (₹ INR)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Set default nightly rate, turnover cleaning fee, and security deposit.
          </p>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <label className="block text-xs font-semibold text-slate-700">
            Base Nightly Price (₹)
            <input name="basePrice" type="number" defaultValue="5000" min="0" step="100" className={inputClass} placeholder="5000" />
            <FieldError errors={state.fieldErrors?.basePrice} />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Cleaning Fee (₹)
            <input name="cleaningFee" type="number" defaultValue="1500" min="0" step="50" className={inputClass} placeholder="1500" />
            <FieldError errors={state.fieldErrors?.cleaningFee} />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Security Deposit (₹)
            <input name="securityDeposit" type="number" defaultValue="3000" min="0" step="100" className={inputClass} placeholder="3000" />
            <FieldError errors={state.fieldErrors?.securityDeposit} />
          </label>
        </div>
      </section>

      {/* Check-in & Check-out Times */}
      <section className="border-t border-slate-100 pt-8">
        <div>
          <h2 className="font-bold text-base text-slate-900">Stay Windows & Schedule</h2>
          <p className="mt-1 text-xs text-slate-500">
            Standard arrival & departure times for guest access.
          </p>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">
            Check-In Time
            <input name="checkInTime" type="time" defaultValue="15:00" className={inputClass} />
            <FieldError errors={state.fieldErrors?.checkInTime} />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Check-Out Time
            <input name="checkOutTime" type="time" defaultValue="11:00" className={inputClass} />
            <FieldError errors={state.fieldErrors?.checkOutTime} />
          </label>
        </div>
      </section>

      {/* Location */}
      <section className="border-t border-slate-100 pt-8">
        <div>
          <h2 className="font-bold text-base text-slate-900">Location Details</h2>
          <p className="mt-1 text-xs text-slate-500">
            Address and geographic coordinates for navigation & smart locks.
          </p>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700 md:col-span-2">
            Address Line 1
            <input name="addressLine1" required maxLength={240} className={inputClass} placeholder="Building, street, sector name" />
            <FieldError errors={state.fieldErrors?.addressLine1} />
          </label>

          <label className="block text-xs font-semibold text-slate-700 md:col-span-2">
            Address Line 2 <span className="font-normal text-slate-400">(optional)</span>
            <input name="addressLine2" maxLength={240} className={inputClass} placeholder="Landmark, floor, suite number" />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            City
            <input name="city" defaultValue="Gurugram" required maxLength={100} className={inputClass} />
            <FieldError errors={state.fieldErrors?.city} />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            State
            <input name="state" defaultValue="Haryana" required maxLength={100} className={inputClass} />
            <FieldError errors={state.fieldErrors?.state} />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Latitude <span className="font-normal text-slate-400">(optional)</span>
            <input name="latitude" type="number" step="any" className={inputClass} placeholder="28.4595" />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Longitude <span className="font-normal text-slate-400">(optional)</span>
            <input name="longitude" type="number" step="any" className={inputClass} placeholder="77.0266" />
          </label>
        </div>
      </section>

      {/* Description & Rules */}
      <section className="border-t border-slate-100 pt-8 space-y-5">
        <label className="block text-xs font-semibold text-slate-700">
          Internal Operational Description <span className="font-normal text-slate-400">(optional)</span>
          <textarea name="description" rows={3} maxLength={1500} className={`${inputClass} resize-y`} placeholder="Operational notes, wifi router location, gate entry codes..." />
          <FieldError errors={state.fieldErrors?.description} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          House Rules & Guest Directives <span className="font-normal text-slate-400">(optional)</span>
          <textarea name="houseRules" rows={3} maxLength={2000} className={`${inputClass} resize-y`} placeholder="e.g. Quiet hours after 10 PM. No smoking indoors. Max 4 guests." />
          <FieldError errors={state.fieldErrors?.houseRules} />
        </label>
      </section>

      {state.formError && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700">
          {state.formError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md transition hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50"
        >
          {pending ? "Creating Property Record…" : "Save Property Record"}
        </button>
      </div>
    </form>
  );
}

