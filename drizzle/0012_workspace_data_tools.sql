-- No currency relabeling: historical amounts use the workspace base currency.
REVOKE UPDATE ON public.organizations FROM authenticated;
GRANT UPDATE (name, timezone) ON public.organizations TO authenticated;

CREATE FUNCTION private.guard_workspace_settings() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF length(trim(NEW.name)) NOT BETWEEN 1 AND 120 OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name=NEW.timezone
  ) THEN RAISE EXCEPTION 'Invalid workspace settings'; END IF;
  IF auth.uid() IS NOT NULL AND (NEW.name,NEW.timezone) IS DISTINCT FROM (OLD.name,OLD.timezone) THEN
    IF NOT public.has_organization_role(OLD.id, ARRAY['super_admin','admin']::public.app_role[])
      THEN RAISE EXCEPTION 'Not authorized'; END IF;
    INSERT INTO public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,metadata)
    VALUES(OLD.id,auth.uid(),'settings.updated','organization',OLD.id,'{}');
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_workspace_settings() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER workspace_settings_guard BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION private.guard_workspace_settings();
--> statement-breakpoint
-- Vendors receive only the name of properties with their own assigned tasks.
CREATE FUNCTION public.task_property_names(input_organization_id uuid)
RETURNS TABLE(id uuid,name text) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.has_organization_role(input_organization_id, ARRAY['vendor']::public.app_role[])
    THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY SELECT p.id,p.name FROM public.properties p
    WHERE p.organization_id=input_organization_id AND EXISTS (
      SELECT 1 FROM public.operation_tasks t WHERE t.property_id=p.id
        AND t.organization_id=input_organization_id AND t.assigned_to=auth.uid()
    ) ORDER BY p.name,p.id;
END $$;
REVOKE ALL ON FUNCTION public.task_property_names(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.task_property_names(uuid) TO authenticated;
--> statement-breakpoint
CREATE TABLE private.guest_import_batches (
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  content_hash text NOT NULL,
  imported integer NOT NULL,
  skipped integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,content_hash)
);
ALTER TABLE private.guest_import_batches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.guest_import_batches FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.import_guests(input_organization_id uuid, input_rows jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE item jsonb; fingerprint text; result jsonb; imported_count integer := 0; skipped_count integer := 0;
  first_name_value text; last_name_value text; email_value text; phone_value text;
BEGIN
  IF NOT public.has_organization_role(input_organization_id, ARRAY['super_admin','admin']::public.app_role[])
    THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF input_rows IS NULL OR jsonb_typeof(input_rows) <> 'array' OR octet_length(input_rows::text)>131072
    THEN RAISE EXCEPTION 'Invalid import'; END IF;
  IF jsonb_array_length(input_rows) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Import 1 to 200 guests'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(input_organization_id::text,48));
  fingerprint := encode(sha256(convert_to(input_rows::text,'UTF8')),'hex');
  SELECT jsonb_build_object('imported',b.imported,'skipped',b.skipped,'already_imported',true) INTO result
    FROM private.guest_import_batches b WHERE b.organization_id=input_organization_id AND b.content_hash=fingerprint;
  IF result IS NOT NULL THEN RETURN result; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(input_rows) LOOP
    IF jsonb_typeof(item)<>'object' OR jsonb_typeof(item->'first_name') IS DISTINCT FROM 'string'
      OR jsonb_typeof(item->'last_name') IS DISTINCT FROM 'string'
      OR jsonb_typeof(item->'email') IS DISTINCT FROM 'string'
      OR jsonb_typeof(item->'phone') IS DISTINCT FROM 'string'
      OR (item - ARRAY['first_name','last_name','email','phone']) <> '{}'::jsonb
      THEN RAISE EXCEPTION 'Invalid guest fields'; END IF;
    first_name_value := trim(item->>'first_name'); last_name_value := trim(item->>'last_name');
    email_value := nullif(lower(trim(item->>'email')),''); phone_value := nullif(trim(item->>'phone'),'');
    IF length(first_name_value) NOT BETWEEN 1 AND 120 OR length(last_name_value) NOT BETWEEN 1 AND 120
      OR length(coalesce(email_value,''))>240 OR length(coalesce(phone_value,''))>30
      OR (email_value IS NOT NULL AND email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
      THEN RAISE EXCEPTION 'Invalid guest data'; END IF;
    IF email_value IS NOT NULL AND EXISTS(SELECT 1 FROM public.guests g WHERE g.organization_id=input_organization_id AND lower(g.email)=email_value) THEN
      skipped_count := skipped_count+1;
    ELSE
      INSERT INTO public.guests(organization_id,first_name,last_name,email,phone,identity_verified)
      VALUES(input_organization_id,first_name_value,last_name_value,email_value,phone_value,false);
      imported_count := imported_count+1;
    END IF;
  END LOOP;
  INSERT INTO private.guest_import_batches(organization_id,content_hash,imported,skipped)
    VALUES(input_organization_id,fingerprint,imported_count,skipped_count);
  INSERT INTO public.audit_logs(organization_id,actor_user_id,action,entity_type,metadata)
    VALUES(input_organization_id,auth.uid(),'guests.imported','guest',jsonb_build_object('imported',imported_count,'skipped',skipped_count));
  RETURN jsonb_build_object('imported',imported_count,'skipped',skipped_count,'already_imported',false);
END $$;
REVOKE ALL ON FUNCTION public.import_guests(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_guests(uuid,jsonb) TO authenticated;
NOTIFY pgrst, 'reload schema';
