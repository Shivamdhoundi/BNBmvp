import Link from "next/link";
import { notFound } from "next/navigation";

import { GuestForm } from "@/components/guests/guest-form";
import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { getGuest } from "@/server/guests/service";

export const metadata = { title: "Edit Guest | StayPilot" };

export default async function EditGuestPage({ params }: { params: Promise<{ guestId: string }> }) {
  const { guestId } = await params;
  const context = await requireOrganizationContext();
  if (!can(context.role, "guests:update")) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-semibold text-slate-900">You don&apos;t have access to edit guests.</h1>
      </div>
    );
  }

  const guest = await getGuest(context.organization.id, guestId);
  if (!guest) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/guests" className="text-sm font-medium text-rose-600 hover:underline">
        ← Back to guests
      </Link>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-8">
        <p className="text-sm font-medium text-rose-600">Edit guest</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {guest.first_name} {guest.last_name}
        </h1>
        <div className="mt-8">
          <GuestForm
            guest={{
              id: guest.id,
              firstName: guest.first_name,
              lastName: guest.last_name,
              email: guest.email ?? "",
              phone: guest.phone ?? "",
              identityVerified: guest.identity_verified,
            }}
          />
        </div>
      </div>
    </div>
  );
}
