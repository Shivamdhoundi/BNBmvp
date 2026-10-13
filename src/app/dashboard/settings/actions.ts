"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { requireOrganizationContext } from "@/server/auth/context";
import type { OperationState } from "../operations/actions";

const settingsInput = z.object({
  name: z.string().trim().min(1).max(120),
  timezone: z.string().max(100).refine(value => {
    try { new Intl.DateTimeFormat("en", { timeZone: value }).format(); return true; } catch { return false; }
  }, "Enter a valid IANA timezone, for example Asia/Kolkata."),
  updatedAt: z.iso.datetime({ offset: true }),
});
export async function saveSettingsAction(_: OperationState, form: FormData): Promise<OperationState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "organization:manage")) return { error: "Only workspace administrators can change settings." };
  const parsed = settingsInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const client = await createClient();
  const { data, error } = await client.from("organizations").update({ name: parsed.data.name, timezone: parsed.data.timezone })
    .eq("id", context.organization.id).eq("updated_at", parsed.data.updatedAt).select("id").maybeSingle();
  if (error || !data) return { error: "Not saved. Settings may have changed. Refresh and try again." };
  revalidatePath("/dashboard", "layout");
  return { success: "Workspace settings saved." };
}
