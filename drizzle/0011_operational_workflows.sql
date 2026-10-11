-- Operational data and its grants/policies are installed in one migration transaction.
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"incurred_on" date NOT NULL,
	"status" text DEFAULT 'recorded' NOT NULL,
	"void_reason" text,
	"created_by" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_amount_valid" CHECK (amount > 0 and amount <= 9999999999.99),
	CONSTRAINT "expenses_text_valid" CHECK (length(trim(description)) between 1 and 300),
	CONSTRAINT "expenses_category_valid" CHECK (category in ('cleaning', 'maintenance', 'utilities', 'supplies', 'other')),
	CONSTRAINT "expenses_status_valid" CHECK (status in ('recorded', 'void')),
	CONSTRAINT "expenses_void_valid" CHECK ((status = 'recorded' and void_reason is null) or (status = 'void' and void_reason is not null and length(trim(void_reason)) between 1 and 300))
);
--> statement-breakpoint
CREATE TABLE "operation_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"due_date" date NOT NULL,
	"assigned_to" uuid,
	"created_by" uuid NOT NULL,
	"completed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "operation_tasks_kind_valid" CHECK (kind in ('cleaning', 'maintenance')),
	CONSTRAINT "operation_tasks_status_valid" CHECK (status in ('open', 'in_progress', 'completed', 'cancelled')),
	CONSTRAINT "operation_tasks_priority_valid" CHECK (priority in ('low', 'normal', 'urgent')),
	CONSTRAINT "operation_tasks_text_valid" CHECK (length(trim(title)) between 1 and 160 and length(notes) <= 4000),
	CONSTRAINT "operation_tasks_completion_valid" CHECK ((status = 'completed') = (completed_at is not null))
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operation_tasks" ADD CONSTRAINT "operation_tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operation_tasks" ADD CONSTRAINT "operation_tasks_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operation_tasks" ADD CONSTRAINT "operation_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operation_tasks" ADD CONSTRAINT "operation_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_org_date_idx" ON "expenses" USING btree ("organization_id","incurred_on");--> statement-breakpoint
CREATE INDEX "expenses_property_idx" ON "expenses" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "operation_tasks_org_kind_due_idx" ON "operation_tasks" USING btree ("organization_id","kind","due_date");--> statement-breakpoint
CREATE INDEX "operation_tasks_assignee_idx" ON "operation_tasks" USING btree ("assigned_to","organization_id");--> statement-breakpoint
CREATE INDEX "operation_tasks_property_idx" ON "operation_tasks" USING btree ("property_id");--> statement-breakpoint
--> statement-breakpoint
-- Earlier hand-written migrations already created invitations and archived_at;
-- the new snapshot now includes that history, without recreating those objects.
ALTER TABLE public.operation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.operation_tasks, public.expenses FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.operation_tasks, public.expenses TO authenticated;

CREATE POLICY tasks_read ON public.operation_tasks FOR SELECT TO authenticated USING (
  public.has_organization_role(organization_id, ARRAY['super_admin','admin','operations']::public.app_role[])
  OR (assigned_to = (SELECT auth.uid()) AND public.has_organization_role(organization_id, ARRAY['vendor']::public.app_role[]))
);
CREATE POLICY tasks_insert ON public.operation_tasks FOR INSERT TO authenticated WITH CHECK (
  public.has_organization_role(organization_id, ARRAY['super_admin','admin','operations']::public.app_role[])
);
CREATE POLICY tasks_update ON public.operation_tasks FOR UPDATE TO authenticated USING (
  public.has_organization_role(organization_id, ARRAY['super_admin','admin','operations']::public.app_role[])
  OR (assigned_to = (SELECT auth.uid()) AND public.has_organization_role(organization_id, ARRAY['vendor']::public.app_role[]))
) WITH CHECK (
  public.has_organization_role(organization_id, ARRAY['super_admin','admin','operations']::public.app_role[])
  OR (assigned_to = (SELECT auth.uid()) AND public.has_organization_role(organization_id, ARRAY['vendor']::public.app_role[]))
);
CREATE POLICY expenses_read ON public.expenses FOR SELECT TO authenticated USING (
  public.can_read_property(organization_id, property_id)
);
CREATE POLICY expenses_insert ON public.expenses FOR INSERT TO authenticated WITH CHECK (
  public.has_organization_role(organization_id, ARRAY['super_admin','admin','operations']::public.app_role[])
);
CREATE POLICY expenses_update ON public.expenses FOR UPDATE TO authenticated USING (
  public.has_organization_role(organization_id, ARRAY['super_admin','admin','operations']::public.app_role[])
) WITH CHECK (
  public.has_organization_role(organization_id, ARRAY['super_admin','admin','operations']::public.app_role[])
);
--> statement-breakpoint
CREATE FUNCTION private.guard_operational_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE staff boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  staff := public.has_organization_role(NEW.organization_id, ARRAY['super_admin','admin','operations']::public.app_role[]);
  IF NOT staff AND NOT (
    TG_TABLE_NAME = 'operation_tasks'
    AND public.has_organization_role(NEW.organization_id, ARRAY['vendor']::public.app_role[])
  ) THEN RAISE EXCEPTION 'Not authorized'; END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT staff THEN RAISE EXCEPTION 'Not authorized'; END IF;
    PERFORM 1 FROM public.properties WHERE id = NEW.property_id
      AND organization_id = NEW.organization_id AND archived_at IS NULL FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Invalid property'; END IF;
    NEW.created_by := auth.uid();
    NEW.created_at := now();
    NEW.version := 1;
    IF TG_TABLE_NAME = 'operation_tasks' THEN
      NEW.status := 'open';
      NEW.completed_at := NULL;
    ELSE
      NEW.status := 'recorded';
      NEW.void_reason := NULL;
    END IF;
  ELSE
    IF (NEW.id, NEW.organization_id, NEW.property_id, NEW.created_by, NEW.created_at)
      IS DISTINCT FROM (OLD.id, OLD.organization_id, OLD.property_id, OLD.created_by, OLD.created_at)
    THEN RAISE EXCEPTION 'Record identity is immutable'; END IF;
    IF NEW.version <> OLD.version + 1 THEN RAISE EXCEPTION 'Stale record version'; END IF;
    IF TG_TABLE_NAME = 'operation_tasks' THEN
      IF NEW.kind <> OLD.kind THEN RAISE EXCEPTION 'Task kind is immutable'; END IF;
      IF NOT staff AND (
        OLD.assigned_to IS DISTINCT FROM auth.uid()
        OR (NEW.title,NEW.priority,NEW.due_date,NEW.assigned_to)
          IS DISTINCT FROM (OLD.title,OLD.priority,OLD.due_date,OLD.assigned_to)
        OR NEW.status = 'cancelled' OR OLD.status IN ('completed','cancelled')
      ) THEN RAISE EXCEPTION 'Vendors may only progress their assigned tasks'; END IF;
      NEW.completed_at := CASE WHEN NEW.status = 'completed' THEN coalesce(OLD.completed_at,now()) ELSE NULL END;
    ELSE
      -- Corrections are a void + a new record, preserving the original amount.
      IF OLD.status = 'void' OR NEW.status <> 'void'
        OR (NEW.description,NEW.category,NEW.amount,NEW.incurred_on)
          IS DISTINCT FROM (OLD.description,OLD.category,OLD.amount,OLD.incurred_on)
      THEN RAISE EXCEPTION 'Expenses are immutable; void and replace'; END IF;
    END IF;
  END IF;
  IF TG_TABLE_NAME = 'operation_tasks' THEN
    IF NEW.assigned_to IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to) THEN
      PERFORM 1 FROM public.organization_members WHERE organization_id = NEW.organization_id
        AND user_id = NEW.assigned_to AND status = 'active'
        AND role IN ('super_admin','admin','operations','vendor') FOR SHARE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Invalid assignee'; END IF;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_operational_write() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER tasks_guard BEFORE INSERT OR UPDATE ON public.operation_tasks
  FOR EACH ROW EXECUTE FUNCTION private.guard_operational_write();
CREATE TRIGGER expenses_guard BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION private.guard_operational_write();

CREATE FUNCTION private.audit_operational_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,metadata)
  VALUES(NEW.organization_id,auth.uid(),TG_TABLE_NAME || CASE WHEN TG_OP='INSERT' THEN '.created' ELSE '.updated' END,
    TG_TABLE_NAME,NEW.id,jsonb_build_object('status',NEW.status,'version',NEW.version));
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.audit_operational_write() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER tasks_audit AFTER INSERT OR UPDATE ON public.operation_tasks
  FOR EACH ROW EXECUTE FUNCTION private.audit_operational_write();
CREATE TRIGGER expenses_audit AFTER INSERT OR UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION private.audit_operational_write();
--> statement-breakpoint
-- Narrow, role-checked directory: no emails or other user profile data exposed.
CREATE FUNCTION public.operation_assignees(input_organization_id uuid)
RETURNS TABLE(id uuid, name text) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.has_organization_role(input_organization_id, ARRAY['super_admin','admin','operations']::public.app_role[])
    THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY SELECT u.id, coalesce(nullif(u.full_name,''),'Team member ' || left(u.id::text,8))
    FROM public.users u JOIN public.organization_members m ON m.user_id=u.id
    WHERE m.organization_id=input_organization_id AND m.status='active'
      AND m.role IN ('super_admin','admin','operations','vendor') ORDER BY u.full_name NULLS LAST, u.id;
END $$;
REVOKE ALL ON FUNCTION public.operation_assignees(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.operation_assignees(uuid) TO authenticated;
--> statement-breakpoint
-- Invoker rights retain property/owner isolation and avoid PostgREST row caps.
CREATE FUNCTION public.operating_report(input_organization_id uuid, date_from date, date_to date)
RETURNS TABLE(property_id uuid, property_name text, completed_bookings bigint, booked_revenue text, recorded_expenses text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE zone text;
BEGIN
  IF date_from IS NULL OR date_to IS NULL OR date_to < date_from OR date_to - date_from > 366
    THEN RAISE EXCEPTION 'Choose a date range of at most 367 days'; END IF;
  SELECT timezone INTO zone FROM public.organizations WHERE id=input_organization_id;
  RETURN QUERY
  SELECT p.id,p.name,coalesce(b.n,0),coalesce(b.revenue,0)::text,coalesce(e.cost,0)::text
  FROM public.properties p
  LEFT JOIN (
    SELECT b.property_id,count(*) n,sum(b.total_price) revenue FROM public.bookings b
    WHERE b.organization_id=input_organization_id AND b.status='completed'
      AND (b.check_out_date AT TIME ZONE zone)::date BETWEEN date_from AND date_to
    GROUP BY b.property_id
  ) b ON b.property_id=p.id
  LEFT JOIN (
    SELECT e.property_id,sum(e.amount) cost FROM public.expenses e
    WHERE e.organization_id=input_organization_id AND e.status='recorded'
      AND e.incurred_on BETWEEN date_from AND date_to GROUP BY e.property_id
  ) e ON e.property_id=p.id
  WHERE p.organization_id=input_organization_id ORDER BY p.name,p.id;
END $$;
REVOKE ALL ON FUNCTION public.operating_report(uuid,date,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.operating_report(uuid,date,date) TO authenticated;
