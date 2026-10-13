"use server";

import { revalidatePath } from "next/cache";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizationContext } from "@/server/auth/context";
import { parseGuestImport, type GuestImportRow } from "@/server/operations/import-validation";
import { enforceRateLimit, RateLimitError } from "@/server/rate-limit";
import type { OperationState } from "../operations/actions";

export type ImportPreview = OperationState & { csv?: string; rows?: GuestImportRow[] };
export async function previewImportAction(_: ImportPreview, form: FormData): Promise<ImportPreview> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "organization:manage")) return { error: "Only administrators can import data." };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 128 * 1024) return { error: "Choose a non-empty CSV file, up to 128 KB." };
  try {
    const csv = await file.text();
    return { csv, rows: parseGuestImport(csv) };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to read CSV." }; }
}
export async function importGuestsAction(_: OperationState, form: FormData): Promise<OperationState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "organization:manage")) return { error: "Only administrators can import data." };
  const csv = form.get("csv");
  if (typeof csv !== "string") return { error: "Choose and preview a CSV first." };
  let rows: GuestImportRow[];
  try { rows = parseGuestImport(csv); } catch (error) { return { error: error instanceof Error ? error.message : "Invalid CSV." }; }
  try {
    await enforceRateLimit("guest-import", context.user.id, 10);
    const client = await createClient();
    const { data, error } = await client.rpc("import_guests", { input_organization_id: context.organization.id, input_rows: rows });
    if (error || !data) return { error: "Import failed. No records were added. Please retry." };
    revalidatePath("/dashboard/guests"); revalidatePath("/dashboard");
    return { success: `${data.already_imported ? "This file was already processed. " : ""}${data.imported} imported; ${data.skipped} skipped because their email already exists.` };
  } catch (error) {
    return { error: error instanceof RateLimitError ? error.message : "Unable to import. Retry the same file safely; completed imports are not duplicated." };
  }
}
