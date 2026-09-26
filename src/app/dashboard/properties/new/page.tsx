import Link from "next/link";

import { PropertyForm } from "@/components/properties/property-form";
import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { listOwners } from "@/server/owners/service";

export default async function NewPropertyPage() {
  const context = await requireOrganizationContext();
  if (!can(context.role, "properties:create")) return <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--line)] bg-white p-8"><h1 className="text-2xl font-semibold">You don’t have access to create properties.</h1><p className="mt-2 text-[var(--muted)]">Ask a workspace administrator to update your role.</p></div>;
  
  const owners = await listOwners(context.organization.id);
  
  return <div className="mx-auto max-w-3xl"><Link href="/dashboard/properties" className="text-sm font-medium text-[var(--brand)] hover:underline">← Back to properties</Link><div className="mt-5 rounded-2xl border border-[var(--line)] bg-white p-6 sm:p-8"><p className="text-sm font-medium text-[var(--brand)]">New property</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.045em]">Add a managed home</h1><p className="mt-2 text-[15px] leading-6 text-[var(--muted)]">Create the property and its primary rentable unit in one reliable, auditable operation.</p><div className="mt-8"><PropertyForm owners={owners} /></div></div></div>;
}
