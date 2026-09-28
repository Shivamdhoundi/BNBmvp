"use client";

import { useActionState } from "react";

import { confirmEnrollment, type VerifyState } from "@/app/mfa/actions";

const initialState: VerifyState = {};

export function MfaEnrollForm({
  factorId,
  qrCode,
  secret,
}: {
  factorId: string;
  qrCode: string;
  secret: string;
}) {
  const [state, action, pending] = useActionState(confirmEnrollment, initialState);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
        {/* Supabase returns an SVG data URL for the QR code. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrCode} alt="Scan this QR code with your authenticator app" className="mx-auto h-44 w-44" />
        <p className="mt-3 text-xs text-slate-500">
          Scan with an authenticator app, or enter this key manually:
        </p>
        <code className="mt-1 block break-all rounded-lg bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-700">
          {secret}
        </code>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="factorId" value={factorId} />
        <label className="block text-sm font-semibold text-slate-900">
          Verification code
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            pattern="\d{6}"
            maxLength={6}
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
          {pending ? "Verifying…" : "Verify and enable"}
        </button>
      </form>
    </div>
  );
}
