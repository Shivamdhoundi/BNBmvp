"use client";

import { useActionState } from "react";

import { createGuestAction, updateGuestAction, type GuestFormState } from "@/app/dashboard/guests/actions";

const initialState: GuestFormState = {};

const inputClass =
  "mt-1.5 block min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 sm:text-sm";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="mt-1.5 text-xs text-red-700">{errors[0]}</p> : null;
}

export type GuestInitialValues = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  identityVerified: boolean;
};

export function GuestForm({ guest }: { guest?: GuestInitialValues }) {
  const isEdit = Boolean(guest);
  const [state, action, pending] = useActionState(
    isEdit ? updateGuestAction : createGuestAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-6">
      {isEdit && <input type="hidden" name="guestId" value={guest!.id} />}
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-700">
          First Name
          <input name="firstName" required minLength={1} maxLength={120} defaultValue={guest?.firstName} className={inputClass} placeholder="Ananya" />
          <FieldError errors={state.fieldErrors?.firstName} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Last Name
          <input name="lastName" required minLength={1} maxLength={120} defaultValue={guest?.lastName} className={inputClass} placeholder="Sharma" />
          <FieldError errors={state.fieldErrors?.lastName} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Email <span className="font-normal text-slate-400">(optional)</span>
          <input name="email" type="email" maxLength={240} defaultValue={guest?.email} className={inputClass} placeholder="guest@example.com" />
          <FieldError errors={state.fieldErrors?.email} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Phone <span className="font-normal text-slate-400">(optional)</span>
          <input name="phone" maxLength={30} defaultValue={guest?.phone} className={inputClass} placeholder="+91 98765 43210" />
          <FieldError errors={state.fieldErrors?.phone} />
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 md:col-span-2">
          <input name="identityVerified" type="checkbox" defaultChecked={guest?.identityVerified} value="true" className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500" />
          Identity verified
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
          {pending ? "Saving guest…" : isEdit ? "Update guest" : "Save guest"}
        </button>
      </div>
    </form>
  );
}
