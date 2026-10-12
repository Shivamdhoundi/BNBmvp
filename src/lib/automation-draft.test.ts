import { describe, expect, it } from "vitest";
import { automationDraftInput, defaultAutomationDraft, hasValidTemplateVariables, previewMessage } from "./automation-draft";

describe("automation draft validation", () => {
  it("starts with all automation requests off", () => {
    expect(automationDraftInput.parse(defaultAutomationDraft)).toEqual(defaultAutomationDraft);
    expect(defaultAutomationDraft.whatsappRequested).toBe(false);
    expect(defaultAutomationDraft.airbnbRequested).toBe(false);
    expect(defaultAutomationDraft.bookingComRequested).toBe(false);
  });
  it.each([0, 169, 1.5, NaN])("rejects invalid reminder hours %s", reminderHours => {
    expect(automationDraftInput.safeParse({ ...defaultAutomationDraft, reminderHours }).success).toBe(false);
  });
  it.each([-1, 1.5, 2147483647])("rejects invalid version %s", version => {
    expect(automationDraftInput.safeParse({ ...defaultAutomationDraft, version }).success).toBe(false);
  });
  it("requires WhatsApp when requesting a message", () => {
    expect(automationDraftInput.safeParse({ ...defaultAutomationDraft, confirmationRequested: true }).success).toBe(false);
  });
  it("requires nonempty wording when requesting messages", () => {
    expect(automationDraftInput.safeParse({ ...defaultAutomationDraft, whatsappRequested: true, reminderRequested: true, reminderText: "  " }).success).toBe(false);
  });
  it("accepts a complete plan without treating it as active", () => {
    const result = automationDraftInput.parse({ ...defaultAutomationDraft, whatsappRequested: true, confirmationRequested: true, reminderRequested: true, active: true });
    expect(result).not.toHaveProperty("active");
  });
  it.each(["{{unknown}}", "{{guest_name}", "{guest_name}", "{{constructor}}", "{{__proto__}}"])("rejects unsupported/malformed variables %s", text => {
    expect(hasValidTemplateVariables(text)).toBe(false);
  });
  it("bounds message length", () => {
    expect(automationDraftInput.safeParse({ ...defaultAutomationDraft, confirmationText: "x".repeat(1001) }).success).toBe(false);
  });
  it("renders repeated supported variables with synthetic values only", () => {
    expect(previewMessage("{{ guest_name }} at {{property_name}}: {{guest_name}}"))
      .toBe("Sample guest at Sample property: Sample guest");
    expect(previewMessage("{{constructor}} {{unknown}}" )).toBe("{{constructor}} {{unknown}}");
  });
});
