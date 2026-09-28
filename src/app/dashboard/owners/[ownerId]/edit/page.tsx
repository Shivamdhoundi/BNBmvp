import Link from "next/link";
import { notFound } from "next/navigation";

import { OwnerForm } from "@/components/owners/owner-form";
import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { getOwner } from "@/server/owners/service";

export const metadata = { title: "Edit Owner | StayPilot" };

export default async function EditOwnerPage({ params }: { params: Promise<{ ownerId: string }> }) {
  const { ownerId } = await params;
  const context = await requireOrganizationContext();
  if (!can(context.role, "owners:update")) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-semibold text-slate-900">You don&apos;t have access to edit owners.</h1>
      </div>
    );
  }

  const owner = await getOwner(context.organization.id, ownerId);
  if (!owner) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/owners" className="text-sm font-medium text-rose-600 hover:underline">
        ← Back to owners
      </Link>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-8">
        <p className="text-sm font-medium text-rose-600">Edit owner</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{owner.legal_name}</h1>
        <div className="mt-8">
          <OwnerForm
            owner={{
              id: owner.id,
              legalName: owner.legal_name,
              email: owner.email ?? "",
              phone: owner.phone ?? "",
              isActive: owner.is_active,
            }}
          />
        </div>
      </div>
    </div>
  );
}
