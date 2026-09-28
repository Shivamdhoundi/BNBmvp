import Link from "next/link";
import { Plus, User } from "lucide-react";
import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { listGuests } from "@/server/guests/service";
import { ComingSoonButton } from "@/components/ui/coming-soon-button";

export default async function GuestsPage() {
  const context = await requireOrganizationContext();
  const dbGuests = await listGuests(context.organization.id);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Guests
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your guest profiles, identity verification, and past stays.
          </p>
        </div>

        {can(context.role, "guests:create") && (
          <Link
            href="/dashboard/guests/new"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/20 transition hover:bg-rose-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Guest</span>
          </Link>
        )}
      </div>

      {/* Database Guests List */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dbGuests.map((guest) => (
          <div
            key={guest.id}
            className="group relative flex flex-col overflow-hidden bg-white rounded-3xl border border-slate-200 p-6 transition-all duration-300 hover:border-rose-300 hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <User className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="break-words text-lg font-bold leading-tight text-slate-900">
                  {guest.first_name} {guest.last_name}
                </h3>
                <p className="mt-1 break-all text-sm text-slate-500">{guest.email || 'No email provided'}</p>
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${guest.identity_verified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {guest.identity_verified ? 'Identity Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-4 text-sm border-t border-slate-100 pt-4">
              <ComingSoonButton className="font-bold text-slate-900">
                View Profile →
              </ComingSoonButton>
            </div>
          </div>
        ))}
        {dbGuests.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-sm text-slate-500">No guests found. They will appear here once added or imported.</p>
          </div>
        )}
      </section>
    </div>
  );
}
