import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { OrganizationContext } from "@/server/auth/context";

/**
 * Stable audit event taxonomy. Add new actions here to keep event names
 * consistent across the application.
 */
export type AuditAction =
  | "property.created"
  | "property.updated"
  | "property.deleted"
  | "owner.created"
  | "owner.updated"
  | "guest.created"
  | "guest.updated"
  | "booking.created"
  | "booking.updated"
  | "booking.cancelled"
  | "settings.updated"
  | "data.exported";

// Keys that must never be written to audit metadata.
const FORBIDDEN_METADATA_KEYS = new Set([
  "password",
  "confirmation",
  "token",
  "token_hash",
  "access_token",
  "refresh_token",
  "service_role_key",
  "secret",
  "card_number",
  "cvv",
  "totp_secret",
]);

/**
 * Removes sensitive keys and non-primitive noise from audit metadata.
 * Only string, number, boolean, and null values are retained.
 */
export function sanitizeAuditMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_METADATA_KEYS.has(lowerKey)) continue;
    if (Array.isArray(value)) {
      safe[key] = value.filter((item) => ["string", "number", "boolean"].includes(typeof item));
      continue;
    }
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
      safe[key] = value;
    }
  }
  return safe;
}

/**
 * Records an audit event through the tenant-checked, actor-bound RPC.
 * Best-effort: audit failures do not throw, so they never mask the primary
 * operation, but they are surfaced to server logs without sensitive data.
 */
export async function recordAuditEvent(
  context: OrganizationContext,
  event: {
    action: AuditAction;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_audit_event", {
    input_organization_id: context.organization.id,
    input_action: event.action,
    input_entity_type: event.entityType,
    input_entity_id: event.entityId ?? null,
    input_metadata: sanitizeAuditMetadata(event.metadata ?? {}),
  });

  if (error) {
    // Do not include metadata or identifiers that could be sensitive.
    console.error(`audit_event_failed action=${event.action}`);
  }
}
