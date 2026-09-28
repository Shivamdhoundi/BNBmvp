"use client";

import Link from "next/link";
import { useActionState } from "react";

import { resetPassword } from "@/app/actions/password-recovery";
import type { ResetState } from "@/lib/auth/password-recovery";

const initialState: ResetState = {};

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  return errors?.[0] ? (
    <p id={id} className="mt-1.5 text-sm font-medium text-red-700">{errors[0]}</p>
  ) : null;
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, initialState);
  const passwordError = state.fieldErrors?.password;
  const confirmationError = state.fieldErrors?.confirmation;

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-5">
        <label className="block text-sm font-semibold text-slate-900">
          New Password
          <input
            name="password"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            aria-describedby="new-password-help new-password-error"
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-50"
          />
          <span id="new-password-help" className="mt-1.5 block text-xs font-normal text-slate-500">
            Use at least 12 characters.
          </span>
          <FieldError id="new-password-error" errors={passwordError} />
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          Confirm New Password
          <input
            name="confirmation"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            aria-describedby="confirm-password-error"
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-50"
          />
          <FieldError id="confirm-password-error" errors={confirmationError} />
        </label>

        {state.formError ? (
          <div role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
            <p>{state.formError}</p>
            <Link href="/forgot-password" className="mt-1 inline-block font-bold underline">
              Request a new reset link
            </Link>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-slate-900 px-4 py-3.5 font-bold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Updating password…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
