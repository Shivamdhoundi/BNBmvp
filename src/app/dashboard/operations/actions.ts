"use server";

import { revalidatePath } from "next/cache";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizationContext } from "@/server/auth/context";
import { expenseInput, progressInput, scheduleInput, taskInput, voidExpenseInput } from "@/server/operations/validation";

export type OperationState = { error?: string; success?: string };
function refreshOperations() {
  for (const path of ["cleaning", "maintenance", "expenses", "reports"]) revalidatePath(`/dashboard/${path}`);
}

export async function createTaskAction(_: OperationState, form: FormData): Promise<OperationState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "tasks:manage")) return { error: "You cannot create tasks." };
  const parsed = taskInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;
  const client = await createClient();
  const { error } = await client.from("operation_tasks").insert({
    id: input.id, organization_id: context.organization.id, property_id: input.propertyId,
    kind: input.kind, title: input.title, notes: input.notes, priority: input.priority,
    due_date: input.dueDate, assigned_to: input.assignedTo || null, created_by: context.user.id,
  });
  if (error) return { error: error.code === "23505" ? "This task was already saved. Refresh before adding another." : "Unable to save. Check the property and assignee, then try again." };
  refreshOperations();
  return { success: "Task created." };
}

export async function progressTaskAction(_: OperationState, form: FormData): Promise<OperationState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "tasks:progress")) return { error: "You cannot update tasks." };
  const parsed = progressInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, version, status, notes } = parsed.data;
  const client = await createClient();
  const { data, error } = await client.from("operation_tasks").update({ status, notes, version: version + 1 })
    .eq("organization_id", context.organization.id).eq("id", id).eq("version", version).select("id").maybeSingle();
  if (error || !data) return { error: "Not saved. The task changed or you no longer have access. Refresh and retry." };
  refreshOperations();
  return { success: "Task updated." };
}

export async function createExpenseAction(_: OperationState, form: FormData): Promise<OperationState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "expenses:manage")) return { error: "You cannot record expenses." };
  const parsed = expenseInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;
  const client = await createClient();
  const { error } = await client.from("expenses").insert({
    id: input.id, organization_id: context.organization.id, property_id: input.propertyId,
    description: input.description, category: input.category, amount: input.amount,
    incurred_on: input.incurredOn, created_by: context.user.id,
  });
  if (error) return { error: error.code === "23505" ? "This expense was already saved. Refresh before adding another." : "Unable to record the expense. Check the property and try again." };
  refreshOperations();
  return { success: "Expense recorded." };
}

export async function scheduleTaskAction(_: OperationState, form: FormData): Promise<OperationState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "tasks:manage")) return { error: "You cannot schedule tasks." };
  const parsed = scheduleInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;
  const client = await createClient();
  const { data, error } = await client.from("operation_tasks").update({
    title: input.title, priority: input.priority, due_date: input.dueDate,
    assigned_to: input.assignedTo || null, version: input.version + 1,
  }).eq("organization_id", context.organization.id).eq("id", input.id).eq("version", input.version).select("id").maybeSingle();
  if (error || !data) return { error: "Not saved. Refresh and check the task and assignee before retrying." };
  refreshOperations();
  return { success: "Task scheduling updated." };
}

export async function voidExpenseAction(_: OperationState, form: FormData): Promise<OperationState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "expenses:manage")) return { error: "You cannot void expenses." };
  const parsed = voidExpenseInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, version, voidReason } = parsed.data;
  const client = await createClient();
  const { data, error } = await client.from("expenses").update({ status: "void", void_reason: voidReason, version: version + 1 })
    .eq("organization_id", context.organization.id).eq("id", id).eq("version", version).eq("status", "recorded").select("id").maybeSingle();
  if (error || !data) return { error: "Not saved. The expense changed or you no longer have access. Refresh and retry." };
  refreshOperations();
  return { success: "Expense voided. The original record is retained." };
}
