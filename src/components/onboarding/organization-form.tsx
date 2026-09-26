"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function OrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const suggestedSlug = useMemo(() => toSlug(name), [name]);
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(undefined);
    const { error: rpcError } = await createClient().rpc("create_organization_with_owner", {
      input_name: String(formData.get("name")),
      input_slug: String(formData.get("slug")),
    });

    if (rpcError) {
      setError(rpcError.message);
      setIsLoading(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <label className="block text-sm font-medium text-[#24332b]">Company name<input name="name" value={name} onChange={(event) => { setName(event.target.value); if (!slug) setSlug(toSlug(event.target.value)); }} required minLength={2} maxLength={120} className="mt-2 block w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[#e8f5ee]" placeholder="Acme Stays" /></label>
      <label className="block text-sm font-medium text-[#24332b]">Workspace URL<span className="ml-1 font-normal text-[var(--muted)]">(internal)</span><div className="mt-2 flex overflow-hidden rounded-xl border border-[var(--line)] bg-white focus-within:border-[var(--brand)] focus-within:ring-4 focus-within:ring-[#e8f5ee]"><span className="border-r border-[var(--line)] bg-[#f7f8f6] px-3 py-3 text-sm text-[var(--muted)]">staypilot.app/</span><input name="slug" value={slug || suggestedSlug} onChange={(event) => setSlug(toSlug(event.target.value))} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} className="min-w-0 flex-1 px-3 py-3 outline-none" placeholder="acme-stays" /></div></label>
      <p className="rounded-xl bg-[var(--brand-soft)] px-3.5 py-3 text-sm leading-5 text-[var(--brand-dark)]">Your first workspace is set to India, INR, and Asia/Kolkata. These settings remain configurable as the product grows.</p>
      {error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p> : null}
      <button disabled={isLoading} className="w-full rounded-xl bg-[var(--brand)] px-4 py-3 font-medium text-white transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? "Creating workspace…" : "Create workspace"}</button>
    </form>
  );
}
