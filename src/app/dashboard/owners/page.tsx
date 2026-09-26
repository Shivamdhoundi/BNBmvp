import { Plus, Building } from "lucide-react";
import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { listOwners } from "@/server/owners/service";

export default async function OwnersPage() {
  const context = await requireOrganizationContext();
  const dbOwners = await listOwners(context.organization.id);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Property Owners
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your homeowner clients and their contact information.
          </p>
        </div>

        {can(context.role, "properties:create") && (
          <button className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/20 transition hover:bg-rose-700">
            <Plus className="h-4 w-4" />
            <span>Add Owner</span>
          </button>
        )}
      </div>

      {/* Database Owners List */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dbOwners.map((owner) => (
          <div
            key={owner.id}
            className="group relative flex flex-col overflow-hidden bg-white rounded-3xl border border-slate-200 p-6 transition-all duration-300 hover:border-rose-300 hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg leading-tight">
                  {owner.legal_name}
                </h3>
                <p className="text-sm text-slate-500 mt-1">{owner.email}</p>
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${owner.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {owner.is_active ? 'Active Partner' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-4 text-sm border-t border-slate-100 pt-4">
              <button className="font-bold text-slate-900 hover:text-rose-600 transition">
                View Portfolio →
              </button>
            </div>
          </div>
        ))}
        {dbOwners.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-sm text-slate-500">No property owners found. Add an owner to start assigning properties.</p>
          </div>
        )}
      </section>
    </div>
  );
}
