import { NextResponse } from "next/server";

import { getPublicSupabaseEnv } from "@/lib/env";

export async function GET() {
  const env = getPublicSupabaseEnv();

  return NextResponse.json({
    hasUrl: Boolean(env.NEXT_PUBLIC_SUPABASE_URL),
    hasKey: Boolean(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  });
}
