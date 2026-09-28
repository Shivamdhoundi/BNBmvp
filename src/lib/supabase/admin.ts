import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getPublicSupabaseEnv } from "@/lib/env";
import { getServiceRoleKey } from "@/lib/env.server";

/**
 * Creates a Supabase client authenticated with the service-role key.
 *
 * SECURITY:
 * - This client bypasses Row Level Security. Every caller MUST independently
 *   authorize the request (session, active organization, role, MFA assurance)
 *   before invoking any Admin operation.
 * - It must never be imported by Client Components and never reads user cookies.
 * - The returned client does not persist or refresh sessions.
 */
export function createAdminClient(): SupabaseClient {
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicSupabaseEnv();
  const serviceRoleKey = getServiceRoleKey();

  return createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
