"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordRecovery } from "@/app/actions/password-recovery";
import type { RecoveryState } from "@/lib/auth/password-recovery";

const initialState: RecoveryState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordRecovery, initialState);
  const emailError = state.fieldErrors?.email?.[0];

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-5">
        <label className="block text-sm font-semibold text-slate-900">
          Email Address
          <input
            name="email"
            type="email"
            required
            maxLength={240}
            autoComplete="email"
            aria-describedby={emailError ? "recovery-email-error" : undefined}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-50"
            placeholder="you@company.com"
          />
        </label>

        {emailError ? (
          <p id="recovery-email-error" role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
            {emailError}
          </p>
        ) : null}
        {state.message ? (
          <p role="status" aria-live="polite" className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-slate-900 px-4 py-3.5 font-bold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Sending instructions…" : "Send reset instructions"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        <Link href="/sign-in" className="font-semibold text-rose-600 hover:text-rose-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
