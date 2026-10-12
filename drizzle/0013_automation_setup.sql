CREATE TABLE "automation_drafts" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"whatsapp_requested" boolean DEFAULT false NOT NULL,
	"airbnb_requested" boolean DEFAULT false NOT NULL,
	"booking_com_requested" boolean DEFAULT false NOT NULL,
	"confirmation_requested" boolean DEFAULT false NOT NULL,
	"reminder_requested" boolean DEFAULT false NOT NULL,
	"reminder_hours" integer DEFAULT 24 NOT NULL,
	"confirmation_text" text DEFAULT '' NOT NULL,
	"reminder_text" text DEFAULT '' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "automation_drafts_reminder_hours_valid" CHECK (reminder_hours between 1 and 168),
	CONSTRAINT "automation_drafts_text_valid" CHECK (length(confirmation_text) <= 1000 and length(reminder_text) <= 1000),
	CONSTRAINT "automation_drafts_version_valid" CHECK (version > 0),
	CONSTRAINT "automation_drafts_messages_valid" CHECK ((not confirmation_requested or (whatsapp_requested and length(trim(confirmation_text)) > 0)) and (not reminder_requested or (whatsapp_requested and length(trim(reminder_text)) > 0)))
);
--> statement-breakpoint
ALTER TABLE "automation_drafts" ADD CONSTRAINT "automation_drafts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE public.automation_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.automation_drafts FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.automation_drafts TO authenticated;
GRANT INSERT (organization_id,whatsapp_requested,airbnb_requested,booking_com_requested,confirmation_requested,reminder_requested,reminder_hours,confirmation_text,reminder_text,version)
  ON public.automation_drafts TO authenticated;
GRANT UPDATE (whatsapp_requested,airbnb_requested,booking_com_requested,confirmation_requested,reminder_requested,reminder_hours,confirmation_text,reminder_text,version)
  ON public.automation_drafts TO authenticated;

CREATE POLICY automation_drafts_read ON public.automation_drafts FOR SELECT TO authenticated USING (
  public.has_organization_role(organization_id, ARRAY['super_admin','admin']::public.app_role[])
);
CREATE POLICY automation_drafts_insert ON public.automation_drafts FOR INSERT TO authenticated WITH CHECK (
  public.has_organization_role(organization_id, ARRAY['super_admin','admin']::public.app_role[])
);
CREATE POLICY automation_drafts_update ON public.automation_drafts FOR UPDATE TO authenticated USING (
  public.has_organization_role(organization_id, ARRAY['super_admin','admin']::public.app_role[])
) WITH CHECK (
  public.has_organization_role(organization_id, ARRAY['super_admin','admin']::public.app_role[])
);
--> statement-breakpoint
-- Restricted trigger privileges allow an atomic audit without granting clients
-- unrestricted audit inserts. It is not exposed as a callable public RPC.
CREATE FUNCTION private.guard_automation_draft() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_organization_role(NEW.organization_id, ARRAY['super_admin','admin']::public.app_role[])
    THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.version <> 1 THEN RAISE EXCEPTION 'Invalid draft version'; END IF;
  ELSE
    IF NEW.organization_id <> OLD.organization_id OR NEW.version <> OLD.version + 1
      THEN RAISE EXCEPTION 'Invalid draft version'; END IF;
  END IF;
  NEW.updated_at := now();
  INSERT INTO public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,metadata)
    VALUES(NEW.organization_id,auth.uid(),'automation.draft_saved','automation_draft',NEW.organization_id,
      jsonb_build_object('version',NEW.version));
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_automation_draft() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER automation_drafts_guard BEFORE INSERT OR UPDATE ON public.automation_drafts
  FOR EACH ROW EXECUTE FUNCTION private.guard_automation_draft();
NOTIFY pgrst, 'reload schema';
