import Link from "next/link";

import { OwnerForm } from "@/components/owners/owner-form";
import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";

export const metadata = {
  title: "Add Owner | StayPilot",
};

export default async function NewOwnerPage() {
  const context = await requireOrganizationContext();
  if (!can(context.role, "owners:create")) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-semibold text-slate-900">You don&apos;t have access to add owners.</h1>
        <p className="mt-2 text-slate-500">Ask a workspace administrator to update your role.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/owners" className="text-sm font-medium text-rose-600 hover:underline">
        ← Back to owners
      </Link>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-8">
        <p className="text-sm font-medium text-rose-600">New owner</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Add a property owner</h1>
        <p className="mt-2 text-[15px] leading-6 text-slate-500">
          Register a homeowner client so you can assign their properties and track payouts.
        </p>
        <div className="mt-8">
          <OwnerForm />
        </div>
      </div>
    </div>
  );
}
