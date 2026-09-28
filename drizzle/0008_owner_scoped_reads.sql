-- Scope owner-role read access to their linked properties for bookings and
-- property settings. Admin/operations retain organization-wide read access.
-- Tightening only; no data is modified.

-- Bookings: admins/operations see all; owners see only bookings for properties
-- linked to their active owner record.
DROP POLICY IF EXISTS "authorized_roles_can_read_bookings" ON public.bookings;--> statement-breakpoint
CREATE POLICY "authorized_roles_can_read_bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    public.has_organization_role(organization_id, ARRAY['super_admin','admin','operations']::public.app_role[])
    OR EXISTS (
      SELECT 1
      FROM public.properties p
      JOIN public.owners o ON o.id = p.owner_id
      WHERE p.id = bookings.property_id
        AND p.organization_id = bookings.organization_id
        AND o.organization_id = bookings.organization_id
        AND o.user_id = auth.uid()
        AND o.is_active = true
    )
  );--> statement-breakpoint

-- Property settings: replace generic membership read with property-scoped read
-- so owners only see settings for their linked properties.
DROP POLICY IF EXISTS "members_can_read_property_settings" ON public.property_settings;--> statement-breakpoint
CREATE POLICY "members_can_read_property_settings" ON public.property_settings
  FOR SELECT TO authenticated
  USING (public.can_read_property(organization_id, property_id));--> statement-breakpoint

NOTIFY pgrst, 'reload schema';
