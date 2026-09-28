"use client";

import { useActionState } from "react";
import Link from "next/link";

import { createBookingAction, type BookingFormState } from "@/app/dashboard/bookings/actions";
import { bookingStatuses, bookingSources } from "@/server/bookings/validation";

const initialState: BookingFormState = {};

const inputClass =
  "mt-1.5 block min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 sm:text-sm";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="mt-1.5 text-xs text-red-700">{errors[0]}</p> : null;
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type Option = { id: string; label: string };

export function BookingForm({ properties, guests }: { properties: Option[]; guests: Option[] }) {
  const [state, action, pending] = useActionState(createBookingAction, initialState);

  const hasProperties = properties.length > 0;
  const hasGuests = guests.length > 0;

  if (!hasProperties || !hasGuests) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        <p className="font-semibold">You need at least one property and one guest first.</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {!hasProperties && (
            <li>
              <Link href="/dashboard/properties/new" className="font-semibold underline">Add a property</Link>
            </li>
          )}
          {!hasGuests && (
            <li>
              <Link href="/dashboard/guests/new" className="font-semibold underline">Add a guest</Link>
            </li>
          )}
        </ul>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-700">
          Property
          <select name="propertyId" required defaultValue="" className={inputClass}>
            <option value="" disabled>Select a property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <FieldError errors={state.fieldErrors?.propertyId} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Guest
          <select name="guestId" required defaultValue="" className={inputClass}>
            <option value="" disabled>Select a guest</option>
            {guests.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
          <FieldError errors={state.fieldErrors?.guestId} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Check-in Date
          <input name="checkInDate" type="date" required className={inputClass} />
          <FieldError errors={state.fieldErrors?.checkInDate} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Check-out Date
          <input name="checkOutDate" type="date" required className={inputClass} />
          <FieldError errors={state.fieldErrors?.checkOutDate} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Status
          <select name="status" defaultValue="pending" className={inputClass}>
            {bookingStatuses.map((s) => (
              <option key={s} value={s}>{titleCase(s)}</option>
            ))}
          </select>
          <FieldError errors={state.fieldErrors?.status} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Booking Source
          <select name="bookingSource" defaultValue="direct" className={inputClass}>
            {bookingSources.map((s) => (
              <option key={s} value={s}>{titleCase(s)}</option>
            ))}
          </select>
          <FieldError errors={state.fieldErrors?.bookingSource} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Total Guests
          <input name="totalGuests" type="number" defaultValue="1" min="1" max="100" className={inputClass} />
          <FieldError errors={state.fieldErrors?.totalGuests} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Total Price (₹)
          <input name="totalPrice" type="number" defaultValue="0" min="0" step="100" className={inputClass} placeholder="0" />
          <FieldError errors={state.fieldErrors?.totalPrice} />
        </label>
      </div>

      {state.formError && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700">
          {state.formError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 w-full rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-rose-700 disabled:opacity-50 sm:w-auto sm:text-xs"
        >
          {pending ? "Saving booking…" : "Save booking"}
        </button>
      </div>
    </form>
  );
}
