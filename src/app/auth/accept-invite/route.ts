import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Completes invitation acceptance after Supabase has established the session via
 * /auth/confirm. Activation is performed by a SECURITY DEFINER RPC that resolves
 * the pending invitation from the authenticated, email-matched user and activates
 * membership atomically. Safe to call when no invitation exists (no-op).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.nextUrl.origin));
  }

  await supabase.rpc("accept_organization_invitation");

  // Membership validation and workspace selection happen in the existing flow.
  return NextResponse.redirect(new URL("/select-profile", request.nextUrl.origin));
}
