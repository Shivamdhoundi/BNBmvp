-- Team & Security membership mutation RPCs.
-- Transactional, authorization-checked, with last-super-admin protection and audit.
-- Additive: no existing memberships are modified by this migration itself.

-- Change a member's role within the caller's organization.
CREATE OR REPLACE FUNCTION public.change_member_role(
  input_organization_id uuid,
  input_target_user_id uuid,
  input_new_role public.app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  caller_is_super_admin boolean;
  target public.organization_members%ROWTYPE;
  remaining_super_admins integer;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  IF NOT public.has_organization_role(input_organization_id, ARRAY['super_admin','admin']::public.app_role[]) THEN
    RAISE EXCEPTION 'You do not have permission to change roles';
  END IF;

  caller_is_super_admin := public.has_organization_role(input_organization_id, ARRAY['super_admin']::public.app_role[]);

  SELECT * INTO target
  FROM public.organization_members
  WHERE organization_id = input_organization_id AND user_id = input_target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found in this organization';
  END IF;

  -- Only a super_admin may grant or remove the super_admin role.
  IF (input_new_role = 'super_admin' OR target.role = 'super_admin') AND NOT caller_is_super_admin THEN
    RAISE EXCEPTION 'Only a super admin may modify the super admin role';
  END IF;

  -- Protect the last active super_admin from demotion.
  IF target.role = 'super_admin' AND input_new_role <> 'super_admin' THEN
    SELECT count(*) INTO remaining_super_admins
    FROM public.organization_members
    WHERE organization_id = input_organization_id AND role = 'super_admin' AND status = 'active';
    IF remaining_super_admins <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last active super admin';
    END IF;
  END IF;

  IF target.role = input_new_role THEN
    RETURN;
  END IF;

  UPDATE public.organization_members
  SET role = input_new_role, updated_at = now()
  WHERE organization_id = input_organization_id AND user_id = input_target_user_id;

  INSERT INTO public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (input_organization_id, current_user_id, 'security.member.role_changed', 'membership', target.id,
          jsonb_build_object('target_user_id', input_target_user_id, 'from_role', target.role, 'to_role', input_new_role));
END;
$$;--> statement-breakpoint

-- Change a member's status (suspend / restore) within the caller's organization.
CREATE OR REPLACE FUNCTION public.change_member_status(
  input_organization_id uuid,
  input_target_user_id uuid,
  input_new_status public.member_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  caller_is_super_admin boolean;
  target public.organization_members%ROWTYPE;
  remaining_super_admins integer;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  IF NOT public.has_organization_role(input_organization_id, ARRAY['super_admin','admin']::public.app_role[]) THEN
    RAISE EXCEPTION 'You do not have permission to change member status';
  END IF;

  IF input_new_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'Unsupported member status';
  END IF;

  caller_is_super_admin := public.has_organization_role(input_organization_id, ARRAY['super_admin']::public.app_role[]);

  SELECT * INTO target
  FROM public.organization_members
  WHERE organization_id = input_organization_id AND user_id = input_target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found in this organization';
  END IF;

  -- Prevent self-lockout.
  IF input_target_user_id = current_user_id AND input_new_status = 'suspended' THEN
    RAISE EXCEPTION 'You cannot suspend your own access';
  END IF;

  -- Only a super_admin may change a super_admin's status.
  IF target.role = 'super_admin' AND NOT caller_is_super_admin THEN
    RAISE EXCEPTION 'Only a super admin may modify a super admin';
  END IF;

  -- Protect the last active super_admin from suspension.
  IF target.role = 'super_admin' AND input_new_status = 'suspended' THEN
    SELECT count(*) INTO remaining_super_admins
    FROM public.organization_members
    WHERE organization_id = input_organization_id AND role = 'super_admin' AND status = 'active';
    IF remaining_super_admins <= 1 THEN
      RAISE EXCEPTION 'Cannot suspend the last active super admin';
    END IF;
  END IF;

  IF target.status = input_new_status THEN
    RETURN;
  END IF;

  UPDATE public.organization_members
  SET status = input_new_status, updated_at = now()
  WHERE organization_id = input_organization_id AND user_id = input_target_user_id;

  INSERT INTO public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    input_organization_id,
    current_user_id,
    CASE WHEN input_new_status = 'suspended' THEN 'security.member.suspended' ELSE 'security.member.restored' END,
    'membership',
    target.id,
    jsonb_build_object('target_user_id', input_target_user_id, 'from_status', target.status, 'to_status', input_new_status)
  );
END;
$$;--> statement-breakpoint

REVOKE EXECUTE ON FUNCTION public.change_member_role(uuid, uuid, public.app_role) FROM PUBLIC, anon;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.change_member_status(uuid, uuid, public.member_status) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.change_member_role(uuid, uuid, public.app_role) TO authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.change_member_status(uuid, uuid, public.member_status) TO authenticated;--> statement-breakpoint

NOTIFY pgrst, 'reload schema';
