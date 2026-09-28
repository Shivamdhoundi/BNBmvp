import "server-only";

import { createClient } from "@/lib/supabase/server";
import { sanitizeAuditMetadata } from "@/server/audit/sanitize";
import type { OrganizationContext } from "@/server/auth/context";

export { sanitizeAuditMetadata } from "@/server/audit/sanitize";

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
