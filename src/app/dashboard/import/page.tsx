import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { ModulePage } from "@/components/operations/shared";
import { ImportForm } from "@/components/operations/import-form";

export default async function ImportPage() {
  const context = await requireOrganizationContext();
  if (!can(context.role, "organization:manage")) return <ModulePage title="Import guests" description="Only workspace administrators can import data.">{null}</ModulePage>;
  return <ModulePage title="Import guests" description="Preview and import a guest CSV atomically. Re-uploading the same content is safe. Property, booking, and owner imports are not supported yet.">
    <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="mb-3 text-sm">CSV format (UTF-8; the first row must contain these exact headers):</p><pre className="overflow-x-auto text-sm">{"first_name,last_name,email,phone\nExample,Guest,guest@example.com,+910000000000"}</pre></div>
    <ImportForm />
  </ModulePage>;
}
