import "server-only";

import { z } from "zod";

// Server-only environment access. These values must never be imported by
// Client Components or exposed in the browser bundle.

const serviceRoleSchema = z.string().min(1);

/**
 * Returns the Supabase service-role key for privileged Auth Admin operations.
 * Throws a generic error when unavailable so callers fail closed without
 * leaking configuration state.
 */
export function getServiceRoleKey(): string {
  const parsed = serviceRoleSchema.safeParse(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!parsed.success) {
    throw new Error("Administrative operations are not configured.");
  }
  return parsed.data;
}

export function isServiceRoleConfigured(): boolean {
  return serviceRoleSchema.safeParse(process.env.SUPABASE_SERVICE_ROLE_KEY).success;
}

/**
 * Returns the shared health-check secret used to authenticate monitoring
 * requests. Throws a generic error when unavailable.
 */
export function getHealthcheckSecret(): string {
  const parsed = serviceRoleSchema.safeParse(process.env.HEALTHCHECK_SECRET);
  if (!parsed.success) {
    throw new Error("Health monitoring is not configured.");
  }
  return parsed.data;
}

export function isHealthcheckConfigured(): boolean {
  return serviceRoleSchema.safeParse(process.env.HEALTHCHECK_SECRET).success;
}
