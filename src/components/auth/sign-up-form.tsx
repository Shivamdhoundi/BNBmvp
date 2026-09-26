"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(undefined);
    const email = String(formData.get("email"));
    const fullName = String(formData.get("fullName"));
    const { data, error: signUpError } = await createClient().auth.signUp({
      email,
      password: String(formData.get("password")),
      options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }
    if (!data.session) setNotice("Check your inbox to confirm your email, then return here to sign in.");
    else {
      router.replace("/onboarding");
      router.refresh();
    }
    setIsLoading(false);
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <label className="block text-sm font-medium text-[#24332b]">Full name<input name="fullName" required minLength={2} autoComplete="name" className="mt-2 block w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[#e8f5ee]" placeholder="Your name" /></label>
      <label className="block text-sm font-medium text-[#24332b]">Work email<input name="email" type="email" required autoComplete="email" className="mt-2 block w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[#e8f5ee]" placeholder="you@company.com" /></label>
      <label className="block text-sm font-medium text-[#24332b]">Password<input name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-2 block w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[#e8f5ee]" placeholder="At least 8 characters" /></label>
      {error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p> : null}
      {notice ? <p role="status" className="rounded-xl bg-[var(--brand-soft)] px-3 py-2.5 text-sm text-[var(--brand-dark)]">{notice}</p> : null}
      <button disabled={isLoading} className="w-full rounded-xl bg-[var(--brand)] px-4 py-3 font-medium text-white transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? "Creating account…" : "Create account"}</button>
      <p className="text-center text-sm text-[var(--muted)]">Already have an account? <Link href="/sign-in" className="font-medium text-[var(--brand)] hover:underline">Sign in</Link></p>
    </form>
  );
}
