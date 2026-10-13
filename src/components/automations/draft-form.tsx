"use client";

import { useActionState, useState } from "react";
import { saveAutomationDraft } from "@/app/dashboard/settings/automations/actions";
import { previewMessage, templateVariables, type AutomationDraft } from "@/lib/automation-draft";
import { Field, inputClass } from "@/components/operations/shared";

export function AutomationDraftForm({ initial }: { initial: AutomationDraft }) {
  const [state, action, pending] = useActionState(saveAutomationDraft, {});
  const [confirmation, setConfirmation] = useState(initial.confirmationText);
  const [reminder, setReminder] = useState(initial.reminderText);
  return <form action={action} className="space-y-5">
    <input type="hidden" name="version" value={state.version ?? initial.version} />
    <fieldset disabled={pending} className="space-y-5 disabled:opacity-60">
      <legend className="text-lg font-semibold">Your automation plan</legend>
      <p className="text-sm text-slate-600">Selections below are saved preferences, not activation switches. Do not enter passwords, API tokens, calendar URLs, or guest details here.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex items-center gap-2"><input type="checkbox" name="whatsappRequested" defaultChecked={initial.whatsappRequested} /> WhatsApp messages</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="airbnbRequested" defaultChecked={initial.airbnbRequested} /> Airbnb calendar</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="bookingComRequested" defaultChecked={initial.bookingComRequested} /> Booking.com calendar</label>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-slate-200 p-4">
          <h2 className="font-semibold">Booking confirmation</h2>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirmationRequested" defaultChecked={initial.confirmationRequested} /> Plan a message after confirmation</label>
          <Field label="Draft confirmation message"><textarea name="confirmationText" value={confirmation} onChange={event => setConfirmation(event.target.value)} maxLength={1000} rows={4} className={inputClass} /></Field>
          <p className="text-xs text-slate-500">Sample preview only · never sent</p>
          <blockquote className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm">{previewMessage(confirmation)}</blockquote>
        </section>
        <section className="space-y-3 rounded-lg border border-slate-200 p-4">
          <h2 className="font-semibold">Pre-arrival reminder</h2>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="reminderRequested" defaultChecked={initial.reminderRequested} /> Plan a message before check-in</label>
          <Field label="Hours before check-in (1–168)"><input type="number" name="reminderHours" min={1} max={168} step={1} required defaultValue={initial.reminderHours} className={inputClass} /></Field>
          <Field label="Draft reminder message"><textarea name="reminderText" value={reminder} onChange={event => setReminder(event.target.value)} maxLength={1000} rows={4} className={inputClass} /></Field>
          <p className="text-xs text-slate-500">Sample preview only · never sent</p>
          <blockquote className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm">{previewMessage(reminder)}</blockquote>
        </section>
      </div>
      <p className="text-sm text-slate-600">Supported variables: {templateVariables.map(name => `{{${name}}}`).join(", ")}. Final wording needs provider approval where required; these are not approved WhatsApp templates.</p>
      <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Saving draft…" : "Save draft—not activate"}</button>
    </fieldset>
    {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
    {state.success && <p role="status" className="text-sm text-emerald-700">{state.success}</p>}
  </form>;
}
