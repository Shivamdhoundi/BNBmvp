import Link from "next/link";

import { GuestForm } from "@/components/guests/guest-form";
import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";

export const metadata = {
  title: "Add Guest | StayPilot",
};

export default async function NewGuestPage() {
  const context = await requireOrganizationContext();
  if (!can(context.role, "guests:create")) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-semibold text-slate-900">You don&apos;t have access to add guests.</h1>
        <p className="mt-2 text-slate-500">Ask a workspace administrator to update your role.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/guests" className="text-sm font-medium text-rose-600 hover:underline">
        ← Back to guests
      </Link>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <p className="text-sm font-medium text-rose-600">New guest</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Add a guest profile</h1>
        <p className="mt-2 text-[15px] leading-6 text-slate-500">
          Store guest details so you can attach them to bookings and track their stays.
        </p>
        <div className="mt-8">
          <GuestForm />
        </div>
      </div>
    </div>
  );
}
