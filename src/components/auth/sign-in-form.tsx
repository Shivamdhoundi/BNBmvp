"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signIn } from "@/app/actions/auth";

export function SignInForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="space-y-5">
      <form action={onSubmit} className="space-y-5">
        <label className="block text-sm font-semibold text-slate-900">
          Email
          <input 
            name="email" 
            type="email" 
            required 
            autoComplete="email" 
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-50" 
            placeholder="shivam@example.com" 
          />
        </label>
        
        <label className="block text-sm font-semibold text-slate-900">
          Password
          <input 
            name="password" 
            type="password" 
            required 
            minLength={8} 
            autoComplete="current-password" 
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-50" 
            placeholder="••••••••" 
          />
        </label>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs font-semibold text-slate-500 hover:text-slate-900">
            Forgot password?
          </Link>
        </div>

        {error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p> : null}
        
        <button 
          disabled={isLoading} 
          className="w-full rounded-xl bg-slate-900 px-4 py-3.5 font-bold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink-0 px-4 text-xs font-medium text-slate-400 uppercase">Or</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <button className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <p className="pt-2 text-center text-sm font-medium text-slate-500">
        Don&apos;t have an account? <Link href="/sign-up" className="text-slate-900 hover:underline">Create account</Link>
      </p>
    </div>
  );
}
