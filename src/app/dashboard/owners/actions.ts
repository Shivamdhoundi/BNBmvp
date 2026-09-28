"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { archiveOwner, createOwner, updateOwner } from "@/server/owners/service";
import { createOwnerSchema } from "@/server/owners/validation";

export type OwnerFormState = {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const uuid = z.string().uuid();

export async function createOwnerAction(_: OwnerFormState, formData: FormData): Promise<OwnerFormState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "owners:create")) {
    return { formError: "You do not have permission to add owners." };
  }

  const parsed = createOwnerSchema.safeParse({
    legalName: formData.get("legalName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    isActive: formData.get("isActive") ?? true,
  });

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await createOwner(context, {
      legalName: parsed.data.legalName,
      email: parsed.data.email,
      phone: parsed.data.phone || undefined,
      isActive: parsed.data.isActive,
    });
  } catch (error) {
    return { formError: error instanceof Error ? error.message : "Unable to create owner." };
  }

  revalidatePath("/dashboard/owners");
  redirect("/dashboard/owners");
}

export async function updateOwnerAction(_: OwnerFormState, formData: FormData): Promise<OwnerFormState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "owners:update")) {
    return { formError: "You do not have permission to edit owners." };
  }

  const ownerId = uuid.safeParse(formData.get("ownerId"));
  if (!ownerId.success) return { formError: "Invalid owner." };

  const parsed = createOwnerSchema.safeParse({
    legalName: formData.get("legalName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    isActive: formData.get("isActive") ?? true,
  });

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await updateOwner(context, ownerId.data, {
      legalName: parsed.data.legalName,
      email: parsed.data.email,
      phone: parsed.data.phone || undefined,
      isActive: parsed.data.isActive,
    });
  } catch (error) {
    return { formError: error instanceof Error ? error.message : "Unable to update owner." };
  }

  revalidatePath("/dashboard/owners");
  redirect("/dashboard/owners");
}

export async function archiveOwnerAction(formData: FormData): Promise<void> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "owners:update")) return;

  const ownerId = uuid.safeParse(formData.get("ownerId"));
  if (!ownerId.success) return;

  try {
    await archiveOwner(context, ownerId.data);
  } catch {
    // No-op on failure; list reflects current state after revalidation.
  }
  revalidatePath("/dashboard/owners");
}
