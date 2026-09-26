CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE TYPE "public"."app_role" AS ENUM('super_admin', 'admin', 'operations', 'owner', 'vendor');--> statement-breakpoint
CREATE TYPE "public"."document_visibility" AS ENUM('internal', 'owner');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('invited', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('draft', 'onboarding', 'active', 'paused', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('apartment', 'house', 'villa', 'studio', 'serviced_apartment', 'other');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "app_role" DEFAULT 'operations' NOT NULL,
	"status" "member_status" DEFAULT 'invited' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(80) NOT NULL,
	"default_currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"country_code" varchar(2) DEFAULT 'IN' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"legal_name" text NOT NULL,
	"email" text,
	"phone" text,
	"payout_notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"owner_id" uuid,
	"name" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"property_type" "property_type" NOT NULL,
	"status" "property_status" DEFAULT 'draft' NOT NULL,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" text DEFAULT 'Gurugram' NOT NULL,
	"state" text DEFAULT 'Haryana' NOT NULL,
	"postal_code" text,
	"country_code" varchar(2) DEFAULT 'IN' NOT NULL,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"check_in_time" time DEFAULT '15:00' NOT NULL,
	"check_out_time" time DEFAULT '11:00' NOT NULL,
	"description" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_amenities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"unit_id" uuid,
	"amenity_key" varchar(100) NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text,
	"visibility" "document_visibility" DEFAULT 'internal' NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"name" text DEFAULT 'Main unit' NOT NULL,
	"bedrooms" numeric(3, 1) DEFAULT '1' NOT NULL,
	"bathrooms" numeric(3, 1) DEFAULT '1' NOT NULL,
	"max_guests" integer DEFAULT 2 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "property_units_max_guests_positive" CHECK (max_guests > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"email" text NOT NULL,
	"phone" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owners" ADD CONSTRAINT "owners_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owners" ADD CONSTRAINT "owners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_unit_id_property_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."property_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_units" ADD CONSTRAINT "property_units_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_units" ADD CONSTRAINT "property_units_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_org_created_idx" ON "audit_logs" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_members_org_user_unique" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "organization_members_user_status_idx" ON "organization_members" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_unique" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "owners_organization_active_idx" ON "owners" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "properties_org_slug_unique" ON "properties" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "properties_org_status_idx" ON "properties" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "properties_org_owner_idx" ON "properties" USING btree ("organization_id","owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "property_amenities_unique" ON "property_amenities" USING btree ("property_id","unit_id","amenity_key");--> statement-breakpoint
CREATE INDEX "property_amenities_org_property_idx" ON "property_amenities" USING btree ("organization_id","property_id");--> statement-breakpoint
CREATE INDEX "property_documents_org_property_idx" ON "property_documents" USING btree ("organization_id","property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "property_units_property_name_unique" ON "property_units" USING btree ("property_id","name");--> statement-breakpoint
CREATE INDEX "property_units_org_property_idx" ON "property_units" USING btree ("organization_id","property_id");
--> statement-breakpoint
ALTER TABLE "public"."users" ADD CONSTRAINT "users_id_auth_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'), ''),
    NULLIF(NEW.raw_user_meta_data ->> 'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;--> statement-breakpoint

INSERT INTO public.users (id, email, full_name, avatar_url)
SELECT
  id,
  COALESCE(email, ''),
  NULLIF(COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'), ''),
  NULLIF(raw_user_meta_data ->> 'avatar_url', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();--> statement-breakpoint

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER organizations_set_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER organization_members_set_updated_at BEFORE UPDATE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER owners_set_updated_at BEFORE UPDATE ON public.owners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER properties_set_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER property_units_set_updated_at BEFORE UPDATE ON public.property_units FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER property_amenities_set_updated_at BEFORE UPDATE ON public.property_amenities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER property_documents_set_updated_at BEFORE UPDATE ON public.property_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.is_organization_member(target_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members membership
    WHERE membership.organization_id = target_organization_id
      AND membership.user_id = auth.uid()
      AND membership.status = 'active'
  );
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.has_organization_role(target_organization_id uuid, permitted_roles public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members membership
    WHERE membership.organization_id = target_organization_id
      AND membership.user_id = auth.uid()
      AND membership.status = 'active'
      AND membership.role = ANY(permitted_roles)
  );
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.can_read_property(target_organization_id uuid, target_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.has_organization_role(
    target_organization_id,
    ARRAY['super_admin', 'admin', 'operations']::public.app_role[]
  )
  OR EXISTS (
    SELECT 1
    FROM public.properties property
    JOIN public.owners owner ON owner.id = property.owner_id
    WHERE property.id = target_property_id
      AND property.organization_id = target_organization_id
      AND owner.user_id = auth.uid()
      AND owner.is_active = true
  );
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.create_organization_with_owner(input_name text, input_slug text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  new_organization_id uuid;
  normalized_slug text := lower(trim(input_slug));
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  IF char_length(trim(input_name)) < 2 OR char_length(trim(input_name)) > 120 THEN
    RAISE EXCEPTION 'Organization name must be between 2 and 120 characters';
  END IF;

  IF normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Organization URL must use lowercase letters, numbers, and hyphens only';
  END IF;

  INSERT INTO public.organizations (name, slug, created_by)
  VALUES (trim(input_name), normalized_slug, current_user_id)
  RETURNING id INTO new_organization_id;

  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (new_organization_id, current_user_id, 'super_admin', 'active');

  INSERT INTO public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (new_organization_id, current_user_id, 'organization.created', 'organization', new_organization_id, '{}'::jsonb);

  RETURN new_organization_id;
END;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.create_property_with_unit(
  input_organization_id uuid,
  input_name text,
  input_slug text,
  input_property_type public.property_type,
  input_address_line_1 text,
  input_address_line_2 text,
  input_city text,
  input_state text,
  input_postal_code text,
  input_description text,
  input_bedrooms numeric,
  input_bathrooms numeric,
  input_max_guests integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  new_property_id uuid;
  normalized_slug text := lower(trim(input_slug));
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  IF NOT public.has_organization_role(input_organization_id, ARRAY['super_admin', 'admin']::public.app_role[]) THEN
    RAISE EXCEPTION 'You do not have permission to create properties';
  END IF;

  IF char_length(trim(input_name)) < 2 OR char_length(trim(input_name)) > 160 THEN
    RAISE EXCEPTION 'Property name must be between 2 and 160 characters';
  END IF;

  IF normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Property URL must use lowercase letters, numbers, and hyphens only';
  END IF;

  IF char_length(trim(input_address_line_1)) < 4 THEN
    RAISE EXCEPTION 'A complete property address is required';
  END IF;

  IF input_bedrooms < 0 OR input_bathrooms <= 0 OR input_max_guests < 1 THEN
    RAISE EXCEPTION 'Unit capacity values are invalid';
  END IF;

  INSERT INTO public.properties (
    organization_id, name, slug, property_type, address_line_1, address_line_2,
    city, state, postal_code, description, created_by
  ) VALUES (
    input_organization_id, trim(input_name), normalized_slug, input_property_type,
    trim(input_address_line_1), NULLIF(trim(input_address_line_2), ''),
    COALESCE(NULLIF(trim(input_city), ''), 'Gurugram'),
    COALESCE(NULLIF(trim(input_state), ''), 'Haryana'),
    NULLIF(trim(input_postal_code), ''), NULLIF(trim(input_description), ''), current_user_id
  ) RETURNING id INTO new_property_id;

  INSERT INTO public.property_units (organization_id, property_id, bedrooms, bathrooms, max_guests)
  VALUES (input_organization_id, new_property_id, input_bedrooms, input_bathrooms, input_max_guests);

  INSERT INTO public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    input_organization_id,
    current_user_id,
    'property.created',
    'property',
    new_property_id,
    jsonb_build_object('name', trim(input_name), 'property_type', input_property_type)
  );

  RETURN new_property_id;
END;
$$;--> statement-breakpoint

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.property_units ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.property_amenities ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "users_can_read_own_profile" ON public.users FOR SELECT TO authenticated USING (id = auth.uid());--> statement-breakpoint
CREATE POLICY "organization_members_can_read_organization" ON public.organizations FOR SELECT TO authenticated USING (public.is_organization_member(id));--> statement-breakpoint
CREATE POLICY "organization_members_can_update_organization" ON public.organizations FOR UPDATE TO authenticated USING (public.has_organization_role(id, ARRAY['super_admin', 'admin']::public.app_role[])) WITH CHECK (public.has_organization_role(id, ARRAY['super_admin', 'admin']::public.app_role[]));--> statement-breakpoint
CREATE POLICY "members_can_read_membership" ON public.organization_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_organization_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[]));--> statement-breakpoint
CREATE POLICY "admins_can_read_owners" ON public.owners FOR SELECT TO authenticated USING (public.has_organization_role(organization_id, ARRAY['super_admin', 'admin', 'operations']::public.app_role[]));--> statement-breakpoint
CREATE POLICY "admins_can_manage_owners" ON public.owners FOR ALL TO authenticated USING (public.has_organization_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[])) WITH CHECK (public.has_organization_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[]));--> statement-breakpoint
CREATE POLICY "members_can_read_properties" ON public.properties FOR SELECT TO authenticated USING (public.can_read_property(organization_id, id));--> statement-breakpoint
CREATE POLICY "admins_can_update_properties" ON public.properties FOR UPDATE TO authenticated USING (public.has_organization_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[])) WITH CHECK (public.has_organization_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[]));--> statement-breakpoint
CREATE POLICY "members_can_read_property_units" ON public.property_units FOR SELECT TO authenticated USING (public.can_read_property(organization_id, property_id));--> statement-breakpoint
CREATE POLICY "members_can_read_property_amenities" ON public.property_amenities FOR SELECT TO authenticated USING (public.can_read_property(organization_id, property_id));--> statement-breakpoint
CREATE POLICY "members_can_read_property_documents" ON public.property_documents FOR SELECT TO authenticated USING (public.can_read_property(organization_id, property_id));--> statement-breakpoint
CREATE POLICY "admins_can_read_audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_organization_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[]));--> statement-breakpoint

GRANT USAGE ON SCHEMA public TO authenticated;--> statement-breakpoint
GRANT SELECT ON public.users, public.organizations, public.organization_members, public.owners, public.properties, public.property_units, public.property_amenities, public.property_documents, public.audit_logs TO authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.create_organization_with_owner(text, text) TO authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.create_property_with_unit(uuid, text, text, public.property_type, text, text, text, text, text, text, numeric, numeric, integer) TO authenticated;--> statement-breakpoint
NOTIFY pgrst, 'reload schema';
