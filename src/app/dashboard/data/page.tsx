import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { Field, inputClass, ModulePage } from "@/components/operations/shared";

export default async function ExportPage() {
  const context = await requireOrganizationContext();
  if (!can(context.role, "data:export")) return <ModulePage title="Export data" description="Only administrators can export workspace data.">{null}</ModulePage>;
  const today = new Date().toISOString().slice(0, 10);
  return <ModulePage title="Export data" description="Download a UTF-8 CSV that opens in Excel or other spreadsheet software. Exports contain personal data; store and share them securely. Every export is audited.">
    <form action="/api/v1/export" method="get" className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <Field label="Dataset"><select name="dataset" className={inputClass}>{[["properties","Properties"],["guests","Guests"],["owners","Owners"],["bookings","Bookings"],["expenses","Expenses"],["operation_tasks","Cleaning / maintenance tasks"]].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field label="Created from (UTC, inclusive)"><input required type="date" name="from" defaultValue={today.slice(0,7) + "-01"} className={inputClass} /></Field>
      <Field label="Created to (UTC, inclusive)"><input required type="date" name="to" defaultValue={today} className={inputClass} /></Field>
      <p className="text-sm text-slate-600">Maximum 1,000 records and 367 days per export. The date filter is record creation date, not stay or expense date. Large results are rejected, never silently truncated.</p>
      <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Download CSV</button>
    </form>
  </ModulePage>;
}
