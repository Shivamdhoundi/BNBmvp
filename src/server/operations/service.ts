import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TaskKind } from "./validation";

export type Task = {
  id: string; property_id: string; kind: TaskKind; title: string; notes: string;
  priority: string; status: string; due_date: string; assigned_to: string | null; version: number;
};
export type Expense = {
  id: string; property_id: string; description: string; category: string;
  amount: string | number; incurred_on: string; status: string; void_reason: string | null; version: number;
};
export type PropertyOption = { id: string; name: string };
export type Assignee = { id: string; name: string };
export type OperatingReport = {
  property_id: string; property_name: string; completed_bookings: number;
  booked_revenue: string; recorded_expenses: string;
};

export async function operationOptions(organizationId: string, includeAssignees = false, vendor = false) {
  const client = await createClient();
  const [properties, members, organization] = await Promise.all([
    vendor ? client.rpc("task_property_names", { input_organization_id: organizationId }, { count: "exact" }) : client.from("properties").select("id,name", { count: "exact" }).eq("organization_id", organizationId).is("archived_at", null).order("name").limit(1000),
    includeAssignees ? client.rpc("operation_assignees", { input_organization_id: organizationId }, { count: "exact" }) : Promise.resolve({ data: [], error: null, count: 0 }),
    client.from("organizations").select("default_currency,timezone").eq("id", organizationId).single(),
  ]);
  if (properties.error || members.error || organization.error) throw new Error("Unable to load workspace options.");
  if (properties.count !== properties.data?.length || members.count !== members.data?.length) throw new Error("Workspace directory exceeds the supported page size. Contact support; no partial directory is shown.");
  return {
    properties: properties.data as PropertyOption[],
    assignees: members.data as Assignee[],
    currency: organization.data.default_currency as string,
    timezone: organization.data.timezone as string,
  };
}

export async function listTasks(organizationId: string, kind: TaskKind, page: number) {
  const client = await createClient();
  const { data, count, error } = await client.from("operation_tasks")
    .select("id,property_id,kind,title,notes,priority,status,due_date,assigned_to,version", { count: "exact" })
    .eq("organization_id", organizationId).eq("kind", kind)
    .order("due_date").order("id").range((page - 1) * 25, page * 25 - 1);
  if (error) throw new Error("Unable to load tasks.");
  return { tasks: data as Task[], total: count ?? 0 };
}

export async function listExpenses(organizationId: string, page: number) {
  const client = await createClient();
  const { data, count, error } = await client.from("expenses")
    .select("id,property_id,description,category,amount,incurred_on,status,void_reason,version", { count: "exact" })
    .eq("organization_id", organizationId).order("incurred_on", { ascending: false }).order("id")
    .range((page - 1) * 25, page * 25 - 1);
  if (error) throw new Error("Unable to load expenses.");
  return { expenses: data as Expense[], total: count ?? 0 };
}

export async function operatingReport(organizationId: string, from: string, to: string) {
  const client = await createClient();
  const { data, count, error } = await client.rpc("operating_report", { input_organization_id: organizationId, date_from: from, date_to: to }, { count: "exact" });
  if (error) throw new Error("Unable to load the operating report.");
  if (count !== data?.length) throw new Error("Report exceeds the supported property limit. No partial totals are shown.");
  return data as OperatingReport[];
}
