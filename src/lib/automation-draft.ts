import { z } from "zod";

export const templateVariables = ["guest_name", "property_name", "check_in", "check_out"] as const;
const allowedVariables = new Set<string>(templateVariables);

export function hasValidTemplateVariables(text: string): boolean {
  const remaining = text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (match, name: string) => allowedVariables.has(name) ? "" : match);
  return !/[{}]/.test(remaining);
}

const draftText = z.string().trim().max(1000, "Keep each message under 1,000 characters.")
  .refine(hasValidTemplateVariables, "Use only the supported message variables shown below.");

export const automationDraftInput = z.object({
  whatsappRequested: z.boolean(),
  airbnbRequested: z.boolean(),
  bookingComRequested: z.boolean(),
  confirmationRequested: z.boolean(),
  reminderRequested: z.boolean(),
  reminderHours: z.number().int().min(1).max(168),
  confirmationText: draftText,
  reminderText: draftText,
  version: z.number().int().min(0).max(2147483646),
}).superRefine((draft, ctx) => {
  for (const [requested, text, field] of [
    [draft.confirmationRequested, draft.confirmationText, "confirmationText"],
    [draft.reminderRequested, draft.reminderText, "reminderText"],
  ] as const) {
    if (requested && (!draft.whatsappRequested || !text)) {
      ctx.addIssue({ code: "custom", path: [field], message: "Select WhatsApp and provide message text for each planned message." });
    }
  }
});

export type AutomationDraft = z.infer<typeof automationDraftInput>;
export const defaultAutomationDraft: AutomationDraft = {
  whatsappRequested: false, airbnbRequested: false, bookingComRequested: false,
  confirmationRequested: false, reminderRequested: false, reminderHours: 24, version: 0,
  confirmationText: "Hi {{guest_name}}, your stay at {{property_name}} is confirmed for {{check_in}} to {{check_out}}.",
  reminderText: "Hi {{guest_name}}, we look forward to welcoming you to {{property_name}} on {{check_in}}.",
};

// Synthetic examples only; this renderer never reads or contacts a real guest.
export function previewMessage(template: string): string {
  const examples: Record<typeof templateVariables[number], string> = {
    guest_name: "Sample guest", property_name: "Sample property",
    check_in: "15 Nov 2030, 3:00 PM", check_out: "18 Nov 2030, 11:00 AM",
  };
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (match, name: string) =>
    allowedVariables.has(name) ? examples[name as keyof typeof examples] : match);
}
