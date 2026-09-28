-- Invitation lifecycle foundation for invite-only onboarding.
-- Additive migration: creates a new table, enum, RPCs, and policies.
-- No existing users, memberships, organizations, or business records are modified.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_status') THEN
    CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'revoked', 'expired', 'failed');
  END IF;
END$$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL,
  status public.invitation_status DEFAULT 'pending' NOT NULL,
  invited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  invited_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  correlation_id uuid DEFAULT gen_random_uuid() NOT NULL,
  failure_code text,
  send_count integer DEFAULT 0 NOT NULL,
  last_sent_at timestamptz,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT organization_invitations_expiry_valid CHECK (expires_at > created_at)
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS organization_invitations_org_email_idx ON public.organization_invitations (organization_id, email);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS organization_invitations_org_status_idx ON public.organization_invitations (organization_id, status);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS organization_invitations_one_pending ON public.organization_invitations (organization_id, email) WHERE status = 'pending';--> statement-breakpoint

CREATE TRIGGER organization_invitations_set_updated_at BEFORE UPDATE ON public.organization_invitations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Admins may read invitations in their own organization. Writes go through
-- SECURITY DEFINER RPCs only; no direct authenticated INSERT/UPDATE/DELETE grant.
CREATE POLICY "admins_can_read_invitations" ON public.organization_invitations
  FOR SELECT TO authenticated
  USING (public.has_organization_role(organization_id, ARRAY['super_admin','admin']::public.app_role[]));--> statement-breakpoint

GRANT SELECT ON public.organization_invitations TO authenticated;--> statement-breakpoint

-- Reserve or reuse a pending invitation idempotently. Authorizes the caller,
-- prevents cross-org and super_admin escalation, and returns the invitation id.
CREATE OR REPLACE FUNCTION public.reserve_organization_invitation(
  input_organization_id uuid,
  input_email text,
  input_role public.app_role,
  input_expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  normalized_email text := lower(trim(input_email));
  caller_is_super_admin boolean;
  existing_invitation public.organization_invitations%ROWTYPE;
  invitation_id uuid;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  IF NOT public.has_organization_role(input_organization_id, ARRAY['super_admin','admin']::public.app_role[]) THEN
    RAISE EXCEPTION 'You do not have permission to invite members';
  END IF;

  IF normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  caller_is_super_admin := public.has_organization_role(input_organization_id, ARRAY['super_admin']::public.app_role[]);

  IF input_role = 'super_admin' AND NOT caller_is_super_admin THEN
    RAISE EXCEPTION 'Only a super admin may assign the super admin role';
  END IF;

  IF input_expires_at <= now() THEN
    RAISE EXCEPTION 'Invitation expiry must be in the future';
  END IF;

  -- Reuse an existing pending invitation (idempotent retry).
  SELECT * INTO existing_invitation
  FROM public.organization_invitations
  WHERE organization_id = input_organization_id
    AND email = normalized_email
    AND status = 'pending'
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.organization_invitations
    SET role = input_role,
        expires_at = input_expires_at,
        failure_code = NULL,
        updated_at = now()
    WHERE id = existing_invitation.id;
    RETURN existing_invitation.id;
  END IF;

  INSERT INTO public.organization_invitations (organization_id, email, role, status, invited_by, expires_at)
  VALUES (input_organization_id, normalized_email, input_role, 'pending', current_user_id, input_expires_at)
  RETURNING id INTO invitation_id;

  INSERT INTO public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (input_organization_id, current_user_id, 'security.invitation.created', 'invitation', invitation_id,
          jsonb_build_object('role', input_role));

  RETURN invitation_id;
END;
$$;--> statement-breakpoint

-- Record invitation send outcome (called by trusted server code after Auth Admin).
CREATE OR REPLACE FUNCTION public.record_invitation_outcome(
  input_invitation_id uuid,
  input_organization_id uuid,
  input_invited_user_id uuid,
  input_failure_code text
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

  IF NOT public.has_organization_role(input_organization_id, ARRAY['super_admin','admin']::public.app_role[]) THEN
    RAISE EXCEPTION 'You do not have permission to manage invitations';
  END IF;

  UPDATE public.organization_invitations
  SET invited_user_id = COALESCE(input_invited_user_id, invited_user_id),
      failure_code = input_failure_code,
      status = CASE WHEN input_failure_code IS NULL THEN 'pending' ELSE 'failed' END,
      send_count = send_count + 1,
      last_sent_at = now(),
      updated_at = now()
  WHERE id = input_invitation_id
    AND organization_id = input_organization_id;

  INSERT INTO public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    input_organization_id,
    current_user_id,
    CASE WHEN input_failure_code IS NULL THEN 'security.invitation.resent' ELSE 'security.invitation.failed' END,
    'invitation',
    input_invitation_id,
    CASE WHEN input_failure_code IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('failure_code', input_failure_code) END
  );
END;
$$;--> statement-breakpoint

-- Accept an invitation for the authenticated, email-matched user. Idempotent and
-- safe against replay, expiry, revocation, and cross-organization acceptance.
-- Accepts the caller's own pending invitation. The caller passes no invitation
-- id; the function resolves it from the authenticated user's email so a
-- not-yet-member user need not read the invitations table directly.
CREATE OR REPLACE FUNCTION public.accept_organization_invitation()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_email text;
  invitation public.organization_invitations%ROWTYPE;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  SELECT lower(trim(email)) INTO current_email FROM public.users WHERE id = current_user_id;
  IF current_email IS NULL THEN
    RAISE EXCEPTION 'User profile is not available';
  END IF;

  SELECT * INTO invitation
  FROM public.organization_invitations
  WHERE email = current_email
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    -- No pending invitation; treat as a no-op so acceptance is idempotent.
    RETURN NULL;
  END IF;

  -- Idempotent success if already accepted by this user's active membership.
  IF invitation.status = 'accepted' THEN
    RETURN invitation.organization_id;
  END IF;

  IF invitation.status <> 'pending' THEN
    RAISE EXCEPTION 'This invitation is no longer valid';
  END IF;

  IF invitation.expires_at <= now() THEN
    UPDATE public.organization_invitations SET status = 'expired', updated_at = now() WHERE id = invitation.id;
    RAISE EXCEPTION 'This invitation has expired';
  END IF;

  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (invitation.organization_id, current_user_id, invitation.role, 'active')
  ON CONFLICT (organization_id, user_id)
  DO UPDATE SET role = EXCLUDED.role, status = 'active', updated_at = now();

  UPDATE public.organization_invitations
  SET status = 'accepted', invited_user_id = current_user_id, accepted_at = now(), updated_at = now()
  WHERE id = invitation.id;

  INSERT INTO public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (invitation.organization_id, current_user_id, 'security.invitation.accepted', 'invitation', invitation.id,
          jsonb_build_object('role', invitation.role));

  RETURN invitation.organization_id;
END;
$$;--> statement-breakpoint

-- Revoke a pending invitation.
CREATE OR REPLACE FUNCTION public.revoke_organization_invitation(
  input_invitation_id uuid,
  input_organization_id uuid
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

  IF NOT public.has_organization_role(input_organization_id, ARRAY['super_admin','admin']::public.app_role[]) THEN
    RAISE EXCEPTION 'You do not have permission to manage invitations';
  END IF;

  UPDATE public.organization_invitations
  SET status = 'revoked', revoked_at = now(), updated_at = now()
  WHERE id = input_invitation_id
    AND organization_id = input_organization_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or no longer pending';
  END IF;

  INSERT INTO public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (input_organization_id, current_user_id, 'security.invitation.revoked', 'invitation', input_invitation_id, '{}'::jsonb);
END;
$$;--> statement-breakpoint

REVOKE EXECUTE ON FUNCTION public.reserve_organization_invitation(uuid, text, public.app_role, timestamptz) FROM PUBLIC, anon;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.record_invitation_outcome(uuid, uuid, uuid, text) FROM PUBLIC, anon;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.accept_organization_invitation() FROM PUBLIC, anon;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.revoke_organization_invitation(uuid, uuid) FROM PUBLIC, anon;--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.reserve_organization_invitation(uuid, text, public.app_role, timestamptz) TO authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.record_invitation_outcome(uuid, uuid, uuid, text) TO authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.accept_organization_invitation() TO authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.revoke_organization_invitation(uuid, uuid) TO authenticated;--> statement-breakpoint

NOTIFY pgrst, 'reload schema';
