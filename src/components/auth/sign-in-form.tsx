"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { signIn } from "@/app/actions/auth";

export function SignInForm({ nextPath }: { nextPath?: string }) {
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(undefined);
    const result = await signIn(formData, nextPath);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <label className="block text-sm font-semibold text-slate-900">
        Email Address
        <span className="relative mt-2 block">
          <Mail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="block min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-normal text-slate-900 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
            placeholder="you@company.com"
          />
        </span>
      </label>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="aero-stays-password" className="text-sm font-semibold text-slate-900">Password</label>
          <Link href="/forgot-password" className="text-sm font-semibold text-rose-700 transition hover:text-rose-800 hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative mt-2">
          <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            id="aero-stays-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="current-password"
            aria-label="Password"
            className="block min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            {showPassword ? <EyeOff aria-hidden="true" className="h-4.5 w-4.5" /> : <Eye aria-hidden="true" className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {error ? <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isLoading}
        className="brand-logo-surface group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-[0_12px_25px_-12px_rgba(190,18,60,0.65)] transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_14px_30px_-12px_rgba(190,18,60,0.7)] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none"
      >
        {isLoading ? "Authenticating…" : "Access Operations"}
        {!isLoading && <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />}
      </button>
    </form>
  );
}
