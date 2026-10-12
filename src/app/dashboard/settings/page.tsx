import Link from "next/link";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizationContext } from "@/server/auth/context";
import { ActionForm } from "@/components/operations/action-form";
import { Field, inputClass, ModulePage } from "@/components/operations/shared";
import { saveSettingsAction } from "./actions";

export default async function SettingsPage() {
  const context = await requireOrganizationContext();
  const client = await createClient();
  const { data, error } = await client.from("organizations").select("name,slug,default_currency,timezone,country_code,updated_at").eq("id", context.organization.id).single();
  if (error || !data) throw new Error("Unable to load settings.");
  return <ModulePage title="Workspace settings" description="Manage workspace presentation and the timezone used for reporting. Property-local scheduling remains unchanged.">
    {can(context.role, "organization:manage") && <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Automation &amp; integrations</h2><p className="mt-2 text-sm text-slate-600">Prepare WhatsApp messaging and Airbnb / Booking.com calendar sync. Draft setup only; no live automation yet.</p><Link href="/dashboard/settings/automations" className="mt-3 inline-block text-sm font-semibold underline">Open automation setup</Link></section>}
    <section className="max-w-xl rounded-xl border border-slate-200 bg-white p-5">
      <dl className="mb-5 space-y-2 text-sm"><div><dt className="font-semibold">Workspace slug</dt><dd>{data.slug}</dd></div><div><dt className="font-semibold">Base currency / country</dt><dd>{data.default_currency} / {data.country_code}</dd></div></dl>
      <p className="mb-5 text-sm text-slate-600">Currency cannot be changed here because existing booking and expense amounts must not be relabeled.</p>
      {can(context.role, "organization:manage") ? <ActionForm key={data.updated_at} action={saveSettingsAction} label="Save settings">
        <input type="hidden" name="updatedAt" value={data.updated_at} />
        <Field label="Workspace name"><input name="name" required maxLength={120} defaultValue={data.name} className={inputClass} /></Field>
        <Field label="Reporting timezone (IANA)"><input name="timezone" required maxLength={100} defaultValue={data.timezone} placeholder="Asia/Kolkata" className={inputClass} /></Field>
      </ActionForm> : <p className="text-sm text-slate-600">Only workspace administrators can change these settings. Current timezone: {data.timezone}.</p>}
    </section>
    <p className="text-sm"><Link href="/mfa/enroll" className="underline">Manage two-factor authentication</Link>{can(context.role, "team:read") && <> · <Link href="/dashboard/team" className="underline">Team &amp; Security</Link></>}</p>
  </ModulePage>;
}
