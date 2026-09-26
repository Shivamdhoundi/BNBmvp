CREATE TABLE "property_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "property_settings" ADD CONSTRAINT "property_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_settings" ADD CONSTRAINT "property_settings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_settings" ADD CONSTRAINT "property_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "property_settings_property_unique" ON "property_settings" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "property_settings_org_idx" ON "property_settings" USING btree ("organization_id");
--> statement-breakpoint

-- Enable RLS for phase 1 tables that were missing it
ALTER TABLE "guests" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "property_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Guests Policies
CREATE POLICY "members_can_read_guests" ON "public"."guests" FOR SELECT TO authenticated USING (public.is_organization_member(organization_id));
--> statement-breakpoint
CREATE POLICY "members_can_insert_guests" ON "public"."guests" FOR INSERT TO authenticated WITH CHECK (public.is_organization_member(organization_id));
--> statement-breakpoint
CREATE POLICY "members_can_update_guests" ON "public"."guests" FOR UPDATE TO authenticated USING (public.is_organization_member(organization_id)) WITH CHECK (public.is_organization_member(organization_id));
--> statement-breakpoint
CREATE POLICY "members_can_delete_guests" ON "public"."guests" FOR DELETE TO authenticated USING (public.is_organization_member(organization_id));
--> statement-breakpoint

-- Bookings Policies
CREATE POLICY "members_can_read_bookings" ON "public"."bookings" FOR SELECT TO authenticated USING (public.is_organization_member(organization_id));
--> statement-breakpoint
CREATE POLICY "members_can_insert_bookings" ON "public"."bookings" FOR INSERT TO authenticated WITH CHECK (public.is_organization_member(organization_id));
--> statement-breakpoint
CREATE POLICY "members_can_update_bookings" ON "public"."bookings" FOR UPDATE TO authenticated USING (public.is_organization_member(organization_id)) WITH CHECK (public.is_organization_member(organization_id));
--> statement-breakpoint
CREATE POLICY "members_can_delete_bookings" ON "public"."bookings" FOR DELETE TO authenticated USING (public.is_organization_member(organization_id));
--> statement-breakpoint

-- Property Settings Policies
CREATE POLICY "members_can_read_property_settings" ON "public"."property_settings" FOR SELECT TO authenticated USING (public.is_organization_member(organization_id));
--> statement-breakpoint
CREATE POLICY "admins_can_insert_property_settings" ON "public"."property_settings" FOR INSERT TO authenticated WITH CHECK (public.has_organization_role(organization_id, ARRAY['super_admin', 'admin', 'operations']::public.app_role[]));
--> statement-breakpoint
CREATE POLICY "admins_can_update_property_settings" ON "public"."property_settings" FOR UPDATE TO authenticated USING (public.has_organization_role(organization_id, ARRAY['super_admin', 'admin', 'operations']::public.app_role[])) WITH CHECK (public.has_organization_role(organization_id, ARRAY['super_admin', 'admin', 'operations']::public.app_role[]));
--> statement-breakpoint
CREATE POLICY "admins_can_delete_property_settings" ON "public"."property_settings" FOR DELETE TO authenticated USING (public.has_organization_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[]));