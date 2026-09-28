"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  buildRecoveryCallbackUrl,
  isValidRecoveryMarker,
  RECOVERY_MARKER_COOKIE,
  RECOVERY_PUBLIC_MESSAGE,
  RECOVERY_SESSION_ERROR,
  recoveryRequestSchema,
  resetPasswordSchema,
  type RecoveryState,
  type ResetState,
} from "@/lib/auth/password-recovery";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordRecovery(
  _: RecoveryState,
  formData: FormData,
): Promise<RecoveryState> {
  const parsed = recoveryRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: buildRecoveryCallbackUrl(),
    });
  } catch {
    // Keep valid-email responses indistinguishable; never log submitted data or provider errors.
  }

  return { message: RECOVERY_PUBLIC_MESSAGE };
}

export async function resetPassword(_: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const marker = cookieStore.get(RECOVERY_MARKER_COOKIE)?.value;

  if (!user || !isValidRecoveryMarker(marker, user.id)) {
    return { formError: RECOVERY_SESSION_ERROR };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { formError: RECOVERY_SESSION_ERROR };
  }

  cookieStore.set(RECOVERY_MARKER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth/reset-password",
    maxAge: 0,
  });
  await supabase.auth.signOut();
  redirect("/sign-in?reset=success");
}
