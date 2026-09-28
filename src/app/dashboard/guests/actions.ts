"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { archiveGuest, createGuest, updateGuest } from "@/server/guests/service";
import { createGuestSchema } from "@/server/guests/validation";

export type GuestFormState = {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const uuid = z.string().uuid();

export async function createGuestAction(_: GuestFormState, formData: FormData): Promise<GuestFormState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "guests:create")) {
    return { formError: "You do not have permission to add guests." };
  }

  const parsed = createGuestSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    identityVerified: formData.get("identityVerified") ?? false,
  });

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await createGuest(context, {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || undefined,
      identityVerified: parsed.data.identityVerified,
    });
  } catch (error) {
    return { formError: error instanceof Error ? error.message : "Unable to create guest." };
  }

  revalidatePath("/dashboard/guests");
  redirect("/dashboard/guests");
}

export async function updateGuestAction(_: GuestFormState, formData: FormData): Promise<GuestFormState> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "guests:update")) {
    return { formError: "You do not have permission to edit guests." };
  }

  const guestId = uuid.safeParse(formData.get("guestId"));
  if (!guestId.success) return { formError: "Invalid guest." };

  const parsed = createGuestSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    identityVerified: formData.get("identityVerified") ?? false,
  });

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await updateGuest(context, guestId.data, {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || undefined,
      identityVerified: parsed.data.identityVerified,
    });
  } catch (error) {
    return { formError: error instanceof Error ? error.message : "Unable to update guest." };
  }

  revalidatePath("/dashboard/guests");
  redirect("/dashboard/guests");
}

export async function archiveGuestAction(formData: FormData): Promise<void> {
  const context = await requireOrganizationContext();
  if (!can(context.role, "guests:update")) return;

  const guestId = uuid.safeParse(formData.get("guestId"));
  if (!guestId.success) return;

  try {
    await archiveGuest(context, guestId.data);
  } catch {
    // No-op on failure.
  }
  revalidatePath("/dashboard/guests");
}
