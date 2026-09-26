"use client";

import Link from "next/link";
import { useState } from "react";

import { signUp } from "@/app/actions/auth";

export function SignUpForm() {
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(undefined);
    const result = await signUp(formData);
    
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }
    
    setNotice("Check your inbox to confirm your email, then return here to sign in.");
    setIsLoading(false);
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <label className="block text-sm font-semibold text-slate-900">
        Full name
        <input 
          name="fullName" 
          required 
          minLength={2} 
          autoComplete="name" 
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-50" 
          placeholder="Shivam Dhoundiyal" 
        />
      </label>
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
          autoComplete="new-password" 
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-50" 
          placeholder="••••••••" 
        />
      </label>
      <label className="block text-sm font-semibold text-slate-900">
        Confirm password
        <input 
          name="confirmPassword" 
          type="password" 
          required 
          minLength={8} 
          autoComplete="new-password" 
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-50" 
          placeholder="••••••••" 
        />
      </label>
      
      {error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p> : null}
      {notice ? <p role="status" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">{notice}</p> : null}
      
      <button 
        disabled={isLoading} 
        className="w-full rounded-xl bg-rose-500 px-4 py-3.5 font-bold text-white shadow-md transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Creating account…" : "Create account"}
      </button>
      
      <p className="pt-2 text-center text-sm font-medium text-slate-500">
        Already have an account? <Link href="/sign-in" className="text-rose-500 hover:underline">Log in</Link>
      </p>
    </form>
  );
}
