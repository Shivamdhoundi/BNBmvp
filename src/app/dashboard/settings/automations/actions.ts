"use server";

import { revalidatePath } from "next/cache";
import { automationDraftInput } from "@/lib/automation-draft";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizationContext } from "@/server/auth/context";

export type DraftState = { error?: string; success?: string; version?: number };

export async function saveAutomationDraft(_: DraftState, form: FormData): Promise<DraftState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "organization:manage")) return { error: "Only workspace administrators can configure automation." };
  const parsed = automationDraftInput.safeParse({
    whatsappRequested: form.get("whatsappRequested") === "on",
    airbnbRequested: form.get("airbnbRequested") === "on",
    bookingComRequested: form.get("bookingComRequested") === "on",
    confirmationRequested: form.get("confirmationRequested") === "on",
    reminderRequested: form.get("reminderRequested") === "on",
    reminderHours: Number(form.get("reminderHours")),
    confirmationText: form.get("confirmationText"), reminderText: form.get("reminderText"),
    version: form.has("version") ? Number(form.get("version")) : -1,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const draft = parsed.data;
  const values = {
    whatsapp_requested: draft.whatsappRequested, airbnb_requested: draft.airbnbRequested,
    booking_com_requested: draft.bookingComRequested, confirmation_requested: draft.confirmationRequested,
    reminder_requested: draft.reminderRequested, reminder_hours: draft.reminderHours,
    confirmation_text: draft.confirmationText, reminder_text: draft.reminderText, version: draft.version + 1,
  };
  const client = await createClient();
  const table = client.from("automation_drafts");
  const query = draft.version === 0
    ? table.insert({ ...values, organization_id: context.organization.id })
    : table.update(values).eq("organization_id", context.organization.id).eq("version", draft.version);
  const { data, error } = await query.select("version").maybeSingle();
  if (error || !data) return { error: "Draft not saved. Refresh to check for changes, then try again. Contact your administrator if setup storage is unavailable." };
  revalidatePath("/dashboard/settings/automations");
  return { success: "Draft saved. No messages sent; calendar sync remains off.", version: data.version };
}
