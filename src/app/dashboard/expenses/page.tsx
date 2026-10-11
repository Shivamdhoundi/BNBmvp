import { randomUUID } from "node:crypto";
import { can } from "@/lib/permissions";
import { displayMoney, minorUnits } from "@/lib/money";
import { requireOrganizationContext } from "@/server/auth/context";
import { listExpenses, operationOptions } from "@/server/operations/service";
import { createExpenseAction, voidExpenseAction } from "../operations/actions";
import { ActionForm } from "@/components/operations/action-form";
import { Field, inputClass, ModulePage, PageLinks, pageNumber } from "@/components/operations/shared";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await requireOrganizationContext();
  if (!can(context.role, "expenses:read")) return <ModulePage title="Expenses" description="Your role cannot access expenses.">{null}</ModulePage>;
  const manage = can(context.role, "expenses:manage");
  const page = pageNumber((await searchParams).page);
  const [{ expenses, total }, options] = await Promise.all([listExpenses(context.organization.id, page), operationOptions(context.organization.id)]);
  return <ModulePage title="Expenses" description={`Record property costs in ${options.currency}. These records track expenses, not bank payments. To correct an entry, void it with a reason and create a replacement.`}>
    {manage && <details className="rounded-xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-semibold">Record expense</summary>
      <div className="mt-4"><ActionForm action={createExpenseAction} label="Record expense" refreshAfterCreate="/dashboard/expenses">
        <input type="hidden" name="id" value={randomUUID()} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Property"><select required name="propertyId" defaultValue="" className={inputClass}><option value="" disabled>Select property</option>{options.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Description"><input required name="description" maxLength={300} className={inputClass} /></Field>
          <Field label={`Amount (${options.currency})`}><input required name="amount" type="number" step="0.01" min="0.01" max="9999999999.99" className={inputClass} /></Field>
          <Field label="Expense date"><input required name="incurredOn" type="date" min="2000-01-01" max="2100-12-31" className={inputClass} /></Field>
          <Field label="Category"><select name="category" className={inputClass}>{["cleaning", "maintenance", "utilities", "supplies", "other"].map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
        </div>
      </ActionForm></div>
    </details>}
    <div className="space-y-4">{expenses.map(expense => <article key={expense.id} className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap justify-between gap-3"><h2 className="font-semibold">{expense.description}</h2><span className="font-mono">{displayMoney(minorUnits(expense.amount), options.currency)}</span></div>
      <p className="mt-2 text-sm text-slate-600">{options.properties.find(p => p.id === expense.property_id)?.name ?? "Archived property"} · {expense.incurred_on} · {expense.category} · {expense.status}</p>
      {expense.void_reason && <p className="mt-2 text-sm text-slate-600">Void reason: {expense.void_reason}</p>}
      {manage && expense.status === "recorded" && <details className="mt-3"><summary className="cursor-pointer text-sm text-red-700">Void this expense</summary><div className="mt-3">
        <ActionForm action={voidExpenseAction} label="Confirm void" confirmMessage="Void this expense? It will be excluded from reports. The original record and reason will be retained.">
          <input type="hidden" name="id" value={expense.id} /><input type="hidden" name="version" value={expense.version} />
          <Field label="Reason for voiding"><input required name="voidReason" maxLength={300} className={inputClass} /></Field>
        </ActionForm>
      </div></details>}
    </article>)}</div>
    {expenses.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-sm text-slate-600">No expenses on this page.</p>}
    <PageLinks page={page} total={total} path="/dashboard/expenses" />
  </ModulePage>;
}
