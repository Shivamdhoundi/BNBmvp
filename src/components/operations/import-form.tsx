"use client";

import { useActionState } from "react";
import { previewImportAction, importGuestsAction } from "@/app/dashboard/import/actions";
import { ActionForm } from "./action-form";

export function ImportForm() {
  const [preview, previewAction, pending] = useActionState(previewImportAction, {});
  return <div className="space-y-5">
    <form action={previewAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <label className="block text-sm font-medium">Guest CSV (maximum 200 rows / 128 KB)<input type="file" name="file" accept=".csv,text/csv" required className="mt-2 block w-full text-sm" disabled={pending} /></label>
      <button disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">{pending ? "Checking…" : "Preview import"}</button>
      {preview.error && <p role="alert" className="text-sm text-red-700">{preview.error}</p>}
    </form>
    {!pending && preview.rows && preview.csv && <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Preview: {preview.rows.length} guests</h2>
      <p className="text-sm text-slate-600">Check the names and contact details before confirming. Existing emails are skipped; no existing records are overwritten. Identity verification is always false for imported guests.</p>
      <div className="max-h-80 overflow-auto"><table className="w-full text-left text-sm"><thead><tr>{["First name", "Last name", "Email", "Phone"].map(h => <th key={h} scope="col" className="p-2">{h}</th>)}</tr></thead><tbody>{preview.rows.map((row, i) => <tr key={i}><td className="p-2">{row.first_name}</td><td className="p-2">{row.last_name}</td><td className="p-2">{row.email}</td><td className="p-2">{row.phone}</td></tr>)}</tbody></table></div>
      <ActionForm key={preview.csv} action={importGuestsAction} label="Confirm guest import" refreshAfterCreate="/dashboard/import">
        <input type="hidden" name="csv" value={preview.csv} />
      </ActionForm>
    </section>}
  </div>;
}
