"use client";

import { useActionState } from "react";

import { createOwnerAction, updateOwnerAction, type OwnerFormState } from "@/app/dashboard/owners/actions";

const initialState: OwnerFormState = {};

const inputClass =
  "mt-1.5 block min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 sm:text-sm";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="mt-1.5 text-xs text-red-700">{errors[0]}</p> : null;
}

export type OwnerInitialValues = {
  id: string;
  legalName: string;
  email: string;
  phone: string;
  isActive: boolean;
};

export function OwnerForm({ owner }: { owner?: OwnerInitialValues }) {
  const isEdit = Boolean(owner);
  const [state, action, pending] = useActionState(
    isEdit ? updateOwnerAction : createOwnerAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-6">
      {isEdit && <input type="hidden" name="ownerId" value={owner!.id} />}
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-700 md:col-span-2">
          Legal Name
          <input
            name="legalName"
            required
            minLength={2}
            maxLength={160}
            defaultValue={owner?.legalName}
            className={inputClass}
            placeholder="e.g. Rohan Malhotra"
          />
          <FieldError errors={state.fieldErrors?.legalName} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Email Address
          <input
            name="email"
            type="email"
            required
            maxLength={240}
            defaultValue={owner?.email}
            className={inputClass}
            placeholder="owner@example.com"
          />
          <FieldError errors={state.fieldErrors?.email} />
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Phone <span className="font-normal text-slate-400">(optional)</span>
          <input name="phone" maxLength={30} defaultValue={owner?.phone} className={inputClass} placeholder="+91 98765 43210" />
          <FieldError errors={state.fieldErrors?.phone} />
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 md:col-span-2">
          <input name="isActive" type="checkbox" defaultChecked={owner ? owner.isActive : true} value="true" className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500" />
          Active partner
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
          {pending ? "Saving owner…" : isEdit ? "Update owner" : "Save owner"}
        </button>
      </div>
    </form>
  );
}
