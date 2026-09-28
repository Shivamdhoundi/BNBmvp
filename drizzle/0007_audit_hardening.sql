-- Audit hardening: append-only, actor-bound, tenant-checked recording.
-- Prevents spoofed actors and forbids UPDATE/DELETE by application roles.

-- Records an audit event for the authenticated caller in their organization.
-- The actor is derived from auth.uid(); callers cannot spoof actor or org access.
CREATE OR REPLACE FUNCTION public.record_audit_event(
  input_organization_id uuid,
  input_action text,
  input_entity_type text,
  input_entity_id uuid,
  input_metadata jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  -- The caller must be an active member of the target organization.
  IF NOT public.is_organization_member(input_organization_id) THEN
    RAISE EXCEPTION 'You do not have access to this organization';
  END IF;

  INSERT INTO public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    input_organization_id,
    current_user_id,
    input_action,
    input_entity_type,
    input_entity_id,
    COALESCE(input_metadata, '{}'::jsonb)
  );
END;
$$;--> statement-breakpoint

REVOKE EXECUTE ON FUNCTION public.record_audit_event(uuid, text, text, uuid, jsonb) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.record_audit_event(uuid, text, text, uuid, jsonb) TO authenticated;--> statement-breakpoint

-- Ensure application roles cannot directly INSERT/UPDATE/DELETE audit rows.
-- No INSERT/UPDATE/DELETE policies exist for audit_logs, so RLS denies direct
-- writes; recording flows exclusively through SECURITY DEFINER functions.
-- Explicitly revoke table-level write privileges as defense in depth.
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM authenticated, anon;--> statement-breakpoint

NOTIFY pgrst, 'reload schema';
