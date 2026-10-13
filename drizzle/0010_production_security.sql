-- Defense in depth for direct PostgREST access as well as Next.js actions.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
CREATE TABLE private.security_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  require_admin_mfa boolean NOT NULL DEFAULT false
);
INSERT INTO private.security_settings DEFAULT VALUES;

-- Enable require_admin_mfa only after administrators have enrolled. Verified
-- factors always require AAL2, independently of the enrollment rollout.
CREATE FUNCTION private.session_is_assured(target_organization_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND (
    COALESCE(auth.jwt()->>'aal', '') = 'aal2'
    OR (
      NOT EXISTS (SELECT 1 FROM auth.mfa_factors WHERE user_id = auth.uid() AND status = 'verified')
      AND NOT EXISTS (
        SELECT 1 FROM public.organization_members m, private.security_settings s
        WHERE m.user_id = auth.uid() AND m.organization_id = target_organization_id
          AND m.role IN ('super_admin','admin') AND s.require_admin_mfa
      )
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.has_organization_role(target_organization_id uuid, permitted_roles public.app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.session_is_assured(target_organization_id) AND EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = target_organization_id AND m.user_id = auth.uid()
      AND m.status = 'active' AND m.role = ANY(permitted_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_read_property(target_organization_id uuid, target_property_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.has_organization_role(target_organization_id, ARRAY['super_admin','admin','operations']::public.app_role[])
  OR (public.has_organization_role(target_organization_id, ARRAY['owner']::public.app_role[])
    AND EXISTS (
      SELECT 1 FROM public.properties p JOIN public.owners o ON o.id = p.owner_id
      WHERE p.id = target_property_id AND p.organization_id = target_organization_id
        AND o.organization_id = target_organization_id AND o.user_id = auth.uid()
        AND o.is_active AND o.archived_at IS NULL
    ));
$$;

DROP POLICY authorized_roles_can_read_bookings ON public.bookings;
CREATE POLICY authorized_roles_can_read_bookings ON public.bookings FOR SELECT TO authenticated
  USING (public.can_read_property(organization_id, property_id));
-- Owners need to read their own linked record for joins, never another owner.
CREATE POLICY owners_can_read_own_record ON public.owners FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND is_active AND archived_at IS NULL
    AND public.has_organization_role(organization_id, ARRAY['owner']::public.app_role[]));
DROP POLICY members_can_read_property_documents ON public.property_documents;
CREATE POLICY members_can_read_property_documents ON public.property_documents FOR SELECT TO authenticated
  USING (public.has_organization_role(organization_id, ARRAY['super_admin','admin','operations']::public.app_role[])
    OR (visibility = 'owner' AND public.can_read_property(organization_id, property_id)));

-- The team join previously exposed only the caller's profile, hiding teammates.
CREATE POLICY admins_can_update_units ON public.property_units FOR UPDATE TO authenticated
  USING (public.has_organization_role(organization_id, ARRAY['super_admin','admin']::public.app_role[]))
  WITH CHECK (public.has_organization_role(organization_id, ARRAY['super_admin','admin']::public.app_role[])
    AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_units.property_id AND p.organization_id = property_units.organization_id));

CREATE POLICY admins_can_read_team_profiles ON public.users FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members m WHERE m.user_id = users.id
    AND public.has_organization_role(m.organization_id, ARRAY['super_admin','admin']::public.app_role[])));

-- Remove anonymous access to privileged helpers and trigger-only functions.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_organization_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_organization_role(uuid, public.app_role[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_read_property(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_property_with_unit(uuid,text,text,public.property_type,text,text,text,text,text,text,numeric,numeric,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_organization_member(uuid), public.has_organization_role(uuid, public.app_role[]), public.can_read_property(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property_with_unit(uuid,text,text,public.property_type,text,text,text,text,text,text,numeric,numeric,integer) TO authenticated;

-- Serialize team mutations per organization before the last-admin check. The
-- original validated implementations become inaccessible private functions.
ALTER FUNCTION public.change_member_role(uuid,uuid,public.app_role) SET SCHEMA private;
ALTER FUNCTION public.change_member_status(uuid,uuid,public.member_status) SET SCHEMA private;
REVOKE ALL ON FUNCTION private.change_member_role(uuid,uuid,public.app_role), private.change_member_status(uuid,uuid,public.member_status) FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.change_member_role(input_organization_id uuid, input_target_user_id uuid, input_new_role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.has_organization_role(input_organization_id, ARRAY['super_admin','admin']::public.app_role[]) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(input_organization_id::text, 0));
  PERFORM private.change_member_role(input_organization_id, input_target_user_id, input_new_role);
END; $$;
CREATE FUNCTION public.change_member_status(input_organization_id uuid, input_target_user_id uuid, input_new_status public.member_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.has_organization_role(input_organization_id, ARRAY['super_admin','admin']::public.app_role[]) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(input_organization_id::text, 0));
  PERFORM private.change_member_status(input_organization_id, input_target_user_id, input_new_status);
END; $$;
REVOKE ALL ON FUNCTION public.change_member_role(uuid,uuid,public.app_role), public.change_member_status(uuid,uuid,public.member_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_member_role(uuid,uuid,public.app_role), public.change_member_status(uuid,uuid,public.member_status) TO authenticated;

-- An old invitation must not restore suspended access or change an existing
-- member's role. Resolve identity from Auth's verified email, not a stale copy.
CREATE OR REPLACE FUNCTION public.accept_organization_invitation()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_email text;
  invitation public.organization_invitations%ROWTYPE;
  existing_status public.member_status;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication is required'; END IF;
  SELECT lower(trim(email)) INTO current_email FROM auth.users
    WHERE id = current_user_id AND email_confirmed_at IS NOT NULL;
  IF current_email IS NULL THEN RAISE EXCEPTION 'Verified email is required'; END IF;
  SELECT * INTO invitation FROM public.organization_invitations
    WHERE email = current_email AND status = 'pending' AND expires_at > now()
      AND (invited_user_id IS NULL OR invited_user_id = current_user_id)
    ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(invitation.organization_id::text, 0));
  SELECT status INTO existing_status FROM public.organization_members
    WHERE organization_id = invitation.organization_id AND user_id = current_user_id FOR UPDATE;
  IF existing_status = 'suspended' THEN RAISE EXCEPTION 'Contact your workspace administrator'; END IF;
  INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (invitation.organization_id, current_user_id, invitation.role, 'active')
    ON CONFLICT (organization_id, user_id) DO UPDATE SET status = 'active'
      WHERE organization_members.status = 'invited';
  UPDATE public.organization_invitations SET status = 'accepted', invited_user_id = current_user_id,
    accepted_at = now() WHERE id = invitation.id;
  INSERT INTO public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    VALUES (invitation.organization_id, current_user_id, 'security.invitation.accepted', 'invitation', invitation.id, '{}'::jsonb);
  RETURN invitation.organization_id;
END; $$;

-- Shared atomic rate limits work across all serverless instances. Only trusted
-- Persist property settings in the same transaction as the property and unit.
CREATE FUNCTION public.create_property_complete(input_organization_id uuid, input jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  property_id uuid;
  v_owner_id uuid := NULLIF(input->>'ownerId','')::uuid;
  v_base_price numeric := COALESCE((input->>'basePrice')::numeric,0);
  v_cleaning_fee numeric := COALESCE((input->>'cleaningFee')::numeric,0);
  deposit numeric := COALESCE((input->>'securityDeposit')::numeric,0);
  commission numeric := COALESCE((input->>'managementCommissionPercent')::numeric,20);
BEGIN
  IF NOT public.has_organization_role(input_organization_id, ARRAY['super_admin','admin']::public.app_role[]) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF v_owner_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.owners o WHERE o.id=v_owner_id
      AND o.organization_id=input_organization_id AND o.is_active AND o.archived_at IS NULL) THEN
    RAISE EXCEPTION 'Select an active owner from this workspace';
  END IF;
  IF v_base_price < 0 OR v_cleaning_fee < 0 OR deposit < 0 OR commission NOT BETWEEN 0 AND 100 THEN
    RAISE EXCEPTION 'Invalid property pricing';
  END IF;
  property_id := public.create_property_with_unit(input_organization_id, input->>'name', input->>'slug',
    (input->>'propertyType')::public.property_type, input->>'addressLine1', input->>'addressLine2',
    input->>'city', input->>'state', input->>'postalCode', input->>'description',
    COALESCE((input->>'bedrooms')::numeric,1), COALESCE((input->>'bathrooms')::numeric,1),
    COALESCE((input->>'maxGuests')::integer,2));
  UPDATE public.properties SET
    status = COALESCE((input->>'status')::public.property_status, 'active'),
    owner_id = v_owner_id,
    base_price = v_base_price,
    cleaning_fee = v_cleaning_fee,
    security_deposit = deposit, management_commission_percent = commission,
    latitude = (input->>'latitude')::numeric, longitude = (input->>'longitude')::numeric,
    house_rules = NULLIF(input->>'houseRules',''),
    check_in_time = COALESCE((input->>'checkInTime')::time,'15:00'),
    check_out_time = COALESCE((input->>'checkOutTime')::time,'11:00')
  WHERE id = property_id;
  RETURN property_id;
END; $$;
REVOKE ALL ON FUNCTION public.create_property_complete(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_property_complete(uuid,jsonb) TO authenticated;

-- Shared atomic rate limits work across all serverless instances. Only trusted
-- server code can choose keys/limits; no client receives this capability.
CREATE TABLE private.request_limits (
  key text PRIMARY KEY,
  attempts integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX request_limits_expiry_idx ON private.request_limits(expires_at);
CREATE FUNCTION public.consume_request_limit(input_key text, input_limit integer, input_window_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE hits integer;
BEGIN
  IF length(input_key) > 160 OR input_limit < 1 OR input_window_seconds NOT BETWEEN 1 AND 86400 THEN
    RAISE EXCEPTION 'Invalid rate limit';
  END IF;
  DELETE FROM private.request_limits WHERE key IN
    (SELECT key FROM private.request_limits WHERE expires_at < now() LIMIT 100);
  INSERT INTO private.request_limits AS r (key, attempts, expires_at)
    VALUES (input_key, 1, now() + make_interval(secs => input_window_seconds))
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN r.expires_at <= now() THEN 1 ELSE least(r.attempts + 1, input_limit + 1) END,
      expires_at = CASE WHEN r.expires_at <= now() THEN EXCLUDED.expires_at ELSE r.expires_at END
    RETURNING attempts INTO hits;
  RETURN hits <= input_limit;
END; $$;
REVOKE ALL ON FUNCTION public.consume_request_limit(text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_request_limit(text,integer,integer) TO service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.session_is_assured(uuid) FROM PUBLIC, anon, authenticated;
NOTIFY pgrst, 'reload schema';
