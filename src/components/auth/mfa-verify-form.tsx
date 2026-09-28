"use client";

import { useActionState } from "react";

import { verifyChallenge, type VerifyState } from "@/app/mfa/actions";

const initialState: VerifyState = {};

export function MfaVerifyForm() {
  const [state, action, pending] = useActionState(verifyChallenge, initialState);

  return (
    <form action={action} className="space-y-5">
      <label className="block text-sm font-semibold text-slate-900">
        Authentication code
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          pattern="\d{6}"
          maxLength={6}
          autoFocus
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-center text-lg tracking-[0.4em] outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-50"
          placeholder="000000"
        />
      </label>

      {state.error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3.5 font-bold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Verifying…" : "Verify"}
      </button>
    </form>
  );
}
