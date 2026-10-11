import { NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { toCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationContext } from "@/server/auth/context";
import { getMfaGate } from "@/server/auth/mfa";
import { enforceRateLimit, RateLimitError } from "@/server/rate-limit";
import { reportRange } from "@/server/operations/validation";

const columns = {
  properties: ["id", "name", "status", "city", "state", "base_price", "created_at"],
  guests: ["id", "first_name", "last_name", "email", "phone", "created_at"],
  owners: ["id", "legal_name", "email", "phone", "is_active", "created_at"],
  bookings: ["id", "property_id", "guest_id", "check_in_date", "check_out_date", "status", "total_price", "booking_source", "created_at"],
  expenses: ["id", "property_id", "description", "category", "amount", "incurred_on", "status", "void_reason", "created_at"],
  operation_tasks: ["id", "property_id", "kind", "title", "priority", "status", "due_date", "assigned_to", "completed_at", "created_at"],
} as const;

export async function GET(request: Request) {
  try {
    const context = await getOrganizationContext();
    if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!can(context.role, "data:export")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if ((await getMfaGate(context)).kind !== "allow") return NextResponse.json({ error: "MFA required" }, { status: 403 });
    const params = new URL(request.url).searchParams;
    const dataset = params.get("dataset") ?? "";
    if (!Object.hasOwn(columns, dataset)) return NextResponse.json({ error: "Invalid dataset" }, { status: 400 });
    const range = reportRange.safeParse({ from: params.get("from"), to: params.get("to") });
    if (!range.success) return NextResponse.json({ error: "Choose a creation-date range of at most 367 days." }, { status: 400 });
    await enforceRateLimit("data-export", context.user.id, 10);
    const client = await createClient();
    const fields = columns[dataset as keyof typeof columns];
    return await boundedExport(client, context, dataset, fields, range.data);
  } catch (error) {
    if (error instanceof RateLimitError) return NextResponse.json({ error: error.message }, { status: error.unavailable ? 503 : 429, headers: { "Retry-After": "900" } });
    console.error(JSON.stringify({ event: "data_export_failed" }));
    return NextResponse.json({ error: "Unable to export data." }, { status: 500 });
  }
}

async function boundedExport(client: Awaited<ReturnType<typeof createClient>>, context: NonNullable<Awaited<ReturnType<typeof getOrganizationContext>>>, dataset: string, fields: readonly string[], range: { from: string; to: string }) {
  const { data, count, error } = await client.from(dataset).select(fields.join(","), { count: "exact" })
    .eq("organization_id", context.organization.id).gte("created_at", `${range.from}T00:00:00Z`).lte("created_at", `${range.to}T23:59:59.999999Z`).order("id").limit(1000);
  if (error || !data || count === null) throw new Error("Export failed");
  if (count !== data.length) return NextResponse.json({ error: "Too many records. Narrow the creation-date range; exports are limited to 1,000 rows." }, { status: 413 });
  const audit = await client.rpc("record_audit_event", { input_organization_id: context.organization.id, input_action: "data.exported", input_entity_type: dataset, input_entity_id: null, input_metadata: { row_count: count, date_from: range.from, date_to: range.to } });
  if (audit.error) throw new Error("Export audit failed");
  return new Response(toCsv(fields, data as unknown as Record<string, unknown>[]), { headers: {
    "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="staypilot-${dataset}-${range.from}-${range.to}.csv"`,
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
  } });
}
