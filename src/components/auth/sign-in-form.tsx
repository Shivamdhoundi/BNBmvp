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
    <form action={onSubmit} className="space-y-5">
      <label className="block text-sm font-medium text-[#24332b]">Email<input name="email" type="email" required autoComplete="email" className="mt-2 block w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[#e8f5ee]" placeholder="you@company.com" /></label>
      <label className="block text-sm font-medium text-[#24332b]">Password<input name="password" type="password" required minLength={8} autoComplete="current-password" className="mt-2 block w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[#e8f5ee]" placeholder="Your password" /></label>
      {error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p> : null}
      <button disabled={isLoading} className="w-full rounded-xl bg-[var(--brand)] px-4 py-3 font-medium text-white transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? "Signing in…" : "Sign in"}</button>
      <p className="text-center text-sm text-[var(--muted)]">New to StayPilot? <Link href="/sign-up" className="font-medium text-[var(--brand)] hover:underline">Create an account</Link></p>
    </form>
  );
}
