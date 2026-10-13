import Link from "next/link";
import { AutomationDraftForm } from "@/components/automations/draft-form";
import { ModulePage } from "@/components/operations/shared";
import { automationDraftInput, defaultAutomationDraft } from "@/lib/automation-draft";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizationContext } from "@/server/auth/context";

export default async function AutomationsPage() {
  const context = await requireOrganizationContext();
  if (!can(context.role, "organization:manage")) {
    return <ModulePage title="Automation setup" description="Only workspace administrators can view or change automation setup."><Link href="/dashboard" className="underline">Back to dashboard</Link></ModulePage>;
  }
  const client = await createClient();
  const { data, error } = await client.from("automation_drafts")
    .select("whatsapp_requested,airbnb_requested,booking_com_requested,confirmation_requested,reminder_requested,reminder_hours,confirmation_text,reminder_text,version")
    .eq("organization_id", context.organization.id).maybeSingle();
  const parsed = automationDraftInput.safeParse(data ? {
    whatsappRequested: data.whatsapp_requested, airbnbRequested: data.airbnb_requested,
    bookingComRequested: data.booking_com_requested, confirmationRequested: data.confirmation_requested,
    reminderRequested: data.reminder_requested, reminderHours: data.reminder_hours,
    confirmationText: data.confirmation_text, reminderText: data.reminder_text, version: data.version,
  } : defaultAutomationDraft);
  return <ModulePage title="Automation setup" description="Prepare WhatsApp messages and channel calendar connections. This release saves drafts only; sending, imports and background scheduling are not implemented yet.">
    <Link href="/dashboard/settings" className="text-sm underline">Back to workspace settings</Link>
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Not connected · Automation off.</strong> Saving this plan will not contact guests, import reservations or change availability.</div>
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">WhatsApp · Account needed</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Choose a WhatsApp Business Platform provider and connect your business number. The mobile app alone is not an API connection.</li>
          <li>Configure credentials securely on the server—not in this draft form or chat.</li>
          <li>Set up guest opt-in and opt-out handling, approved templates, delivery callbacks and a test recipient.</li>
          <li>Implement and test the sender, duplicate prevention and reminder scheduling before activation.</li>
        </ol>
      </section>
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Airbnb / Booking.com · Feeds needed</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Get a private calendar export link for each eligible listing in your channel account.</li>
          <li>Map each feed to the correct Aero Stays property once the connector is available. Keep feed links private.</li>
          <li>Implement and test imports, changed dates, cancellations, conflicts and scheduled refreshes before activation.</li>
        </ol>
        <p className="text-sm text-slate-600">Calendar feeds are for availability—not guaranteed full guest details, prices or real-time booking synchronization. We will not treat every blocked date as a guest reservation.</p>
        <a href="https://www.airbnb.com/help/article/99" target="_blank" rel="noreferrer" className="text-sm underline">Airbnb calendar export guide</a>
      </section>
    </div>
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      {error || !parsed.success ? <p role="alert" className="text-sm text-red-700">Saved setup could not be loaded. No draft has been overwritten. Ask your administrator to check the database migration and permissions, then refresh.</p>
        : <AutomationDraftForm key={context.organization.id} initial={parsed.data} />}
    </section>
  </ModulePage>;
}
