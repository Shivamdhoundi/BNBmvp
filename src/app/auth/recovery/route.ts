import { type NextRequest, NextResponse } from "next/server";

import {
  createRecoveryMarker,
  getRecoveryRedirectPath,
  RECOVERY_MARKER_COOKIE,
  RECOVERY_MARKER_MAX_AGE_SECONDS,
} from "@/lib/auth/password-recovery";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  let exchangeSucceeded = false;
  let redirectType: string | null = null;
  let recoveryUserId: string | null = null;

  try {
    const supabase = await createClient();

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      exchangeSucceeded = !error && Boolean(data.user);
      // Supabase routes this callback only for recovery links; the reset page
      // additionally re-verifies the authenticated user before allowing changes.
      redirectType = exchangeSucceeded ? "recovery" : null;
      recoveryUserId = data.user?.id ?? null;
    } else if (tokenHash && type === "recovery") {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });
      exchangeSucceeded = !error && Boolean(data.user);
      redirectType = "recovery";
      recoveryUserId = data.user?.id ?? null;
    }
  } catch {
    // Invalid and expired links intentionally share the same safe restart path.
  }

  const path = getRecoveryRedirectPath({
    hasCode: Boolean(code || (tokenHash && type === "recovery")),
    exchangeSucceeded,
    redirectType,
  });
  const response = NextResponse.redirect(new URL(path, request.nextUrl.origin));

  if (path === "/auth/reset-password" && recoveryUserId) {
    response.cookies.set(
      RECOVERY_MARKER_COOKIE,
      createRecoveryMarker(recoveryUserId),
      {
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/auth/reset-password",
        maxAge: RECOVERY_MARKER_MAX_AGE_SECONDS,
      },
    );
  } else {
    response.cookies.delete(RECOVERY_MARKER_COOKIE);
  }

  return response;
}
