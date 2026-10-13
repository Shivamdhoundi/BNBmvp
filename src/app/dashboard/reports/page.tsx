import { can } from "@/lib/permissions";
import { displayMoney, minorUnits } from "@/lib/money";
import { requireOrganizationContext } from "@/server/auth/context";
import { operatingReport, operationOptions } from "@/server/operations/service";
import { reportRange } from "@/server/operations/validation";
import { Field, inputClass, ModulePage } from "@/components/operations/shared";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await requireOrganizationContext();
  if (!can(context.role, "reports:read")) return <ModulePage title="Reports" description="Your role cannot access reports.">{null}</ModulePage>;
  const query = await searchParams;
  const options = await operationOptions(context.organization.id);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: options.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const parsed = reportRange.safeParse({ from: query.from ?? `${today.slice(0, 7)}-01`, to: query.to ?? today });
  const rows = parsed.success ? await operatingReport(context.organization.id, parsed.data.from, parsed.data.to) : [];
  const revenue = rows.reduce((sum, r) => sum + minorUnits(r.booked_revenue), BigInt("0"));
  const expenses = rows.reduce((sum, r) => sum + minorUnits(r.recorded_expenses), BigInt("0"));
  const totals: [string, bigint][] = [["Completed booking value", revenue], ["Recorded expenses", expenses], ["Difference before fees / taxes", revenue - expenses]];
  return <ModulePage title="Operating report" description={`Completed-stay booking value by checkout date (${options.timezone}), less recorded expenses by expense date. Excludes cancelled/pending/confirmed bookings and void expenses. This is not a cash-flow, tax, or payout statement.`}>
    <form className="flex flex-wrap items-end gap-4">
      <Field label="From (inclusive)"><input required type="date" name="from" defaultValue={parsed.success ? parsed.data.from : ""} className={inputClass} /></Field>
      <Field label="To (inclusive)"><input required type="date" name="to" defaultValue={parsed.success ? parsed.data.to : ""} className={inputClass} /></Field>
      <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Run report</button>
    </form>
    {!parsed.success ? <p role="alert" className="text-red-700">Choose a valid date range, no longer than 367 days.</p> : <>
      <div className="grid gap-4 sm:grid-cols-3">{totals.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 break-words font-mono text-xl">{displayMoney(value, options.currency)}</p></div>)}</div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><caption className="p-4 text-left text-slate-600">Property breakdown · {parsed.data.from} to {parsed.data.to} · {options.currency}</caption><thead><tr>{["Property", "Completed stays", "Booking value", "Expenses", "Difference"].map(h => <th key={h} scope="col" className="whitespace-nowrap p-4">{h}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.property_id} className="border-t border-slate-100"><th scope="row" className="p-4">{row.property_name}</th><td className="p-4">{row.completed_bookings}</td><td className="whitespace-nowrap p-4">{displayMoney(minorUnits(row.booked_revenue), options.currency)}</td><td className="whitespace-nowrap p-4">{displayMoney(minorUnits(row.recorded_expenses), options.currency)}</td><td className="whitespace-nowrap p-4">{displayMoney(minorUnits(row.booked_revenue) - minorUnits(row.recorded_expenses), options.currency)}</td></tr>)}</tbody></table>{rows.length === 0 && <p className="p-4 text-slate-600">No accessible properties in this workspace.</p>}</div>
    </>}
  </ModulePage>;
}
