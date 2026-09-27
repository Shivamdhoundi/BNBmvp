"use client";

import { useActionState } from "react";

import { createGuestAction, type GuestFormState } from "@/app/dashboard/guests/actions";

const initialState: GuestFormState = {};

const inputClass =
  "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="mt-1.5 text-xs text-red-700">{errors[0]}</p> : null;
}

export function GuestForm() {
  const [state, action, pending] = useActionState(createGuestAction, initialState);

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-700">
          First Name
          <input name="firstName" required minLength={1} maxLength={120} className={inputClass} placeholder="Ananya" />
          <FieldError errors={state.fieldErrors?.firstName} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Last Name
          <input name="lastName" required minLength={1} maxLength={120} className={inputClass} placeholder="Sharma" />
          <FieldError errors={state.fieldErrors?.lastName} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Email <span className="font-normal text-slate-400">(optional)</span>
          <input name="email" type="email" maxLength={240} className={inputClass} placeholder="guest@example.com" />
          <FieldError errors={state.fieldErrors?.email} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Phone <span className="font-normal text-slate-400">(optional)</span>
          <input name="phone" maxLength={30} className={inputClass} placeholder="+91 98765 43210" />
          <FieldError errors={state.fieldErrors?.phone} />
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 md:col-span-2">
          <input name="identityVerified" type="checkbox" value="true" className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500" />
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
          className="rounded-xl bg-rose-600 px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-rose-700 disabled:opacity-50"
        >
          {pending ? "Saving guest…" : "Save guest"}
        </button>
      </div>
    </form>
  );
}
