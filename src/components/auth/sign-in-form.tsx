"use client";

import Link from "next/link";
import { useState } from "react";

import { signIn } from "@/app/actions/auth";

export function SignInForm({ nextPath }: { nextPath?: string }) {
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(undefined);
    
    // Remove hardcoded email
    // formData.set("email", "admin@staypilot.com");

    const result = await signIn(formData, nextPath);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form action={onSubmit} className="space-y-5">
        <label className="block text-sm font-semibold text-slate-900">
          Email Address
          <input 
            name="email" 
            type="email" 
            required 
            autoComplete="email" 
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-50" 
            placeholder="you@company.com" 
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <label className="block text-sm font-semibold text-slate-900">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-rose-600 transition hover:text-rose-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input 
          name="password" 
          type="password" 
          required 
          minLength={8} 
          autoComplete="current-password" 
          aria-label="Password"
          className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-50" 
          placeholder="••••••••" 
        />

        {error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p> : null}
        
        <button 
          disabled={isLoading} 
          className="w-full rounded-xl bg-slate-900 px-4 py-3.5 font-bold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Authenticating…" : "Access Operations"}
        </button>
      </form>
    </div>
  );
}
