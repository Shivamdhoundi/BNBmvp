-- Disable self-service workspace provisioning. Workspace membership is now invite/admin managed.
REVOKE EXECUTE ON FUNCTION public.create_organization_with_owner(text, text) FROM PUBLIC, anon, authenticated;

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
      AND owner.organization_id = target_organization_id
      AND owner.user_id = auth.uid()
      AND owner.is_active = true
  );
$$;

-- Match database enforcement to the application role model.
DROP POLICY IF EXISTS "members_can_read_guests" ON public.guests;
DROP POLICY IF EXISTS "members_can_insert_guests" ON public.guests;
DROP POLICY IF EXISTS "members_can_update_guests" ON public.guests;
DROP POLICY IF EXISTS "members_can_delete_guests" ON public.guests;
CREATE POLICY "authorized_roles_can_read_guests" ON public.guests FOR SELECT TO authenticated USING (public.has_organization_role(organization_id, ARRAY['super_admin','admin','operations']::public.app_role[]));
CREATE POLICY "authorized_roles_can_insert_guests" ON public.guests FOR INSERT TO authenticated WITH CHECK (public.has_organization_role(organization_id, ARRAY['super_admin','admin','operations']::public.app_role[]));
CREATE POLICY "authorized_roles_can_update_guests" ON public.guests FOR UPDATE TO authenticated USING (public.has_organization_role(organization_id, ARRAY['super_admin','admin','operations']::public.app_role[])) WITH CHECK (public.has_organization_role(organization_id, ARRAY['super_admin','admin','operations']::public.app_role[]));

DROP POLICY IF EXISTS "members_can_read_bookings" ON public.bookings;
DROP POLICY IF EXISTS "members_can_insert_bookings" ON public.bookings;
DROP POLICY IF EXISTS "members_can_update_bookings" ON public.bookings;
DROP POLICY IF EXISTS "members_can_delete_bookings" ON public.bookings;
CREATE POLICY "authorized_roles_can_read_bookings" ON public.bookings FOR SELECT TO authenticated USING (public.has_organization_role(organization_id, ARRAY['super_admin','admin','operations','owner']::public.app_role[]));
CREATE POLICY "authorized_roles_can_insert_bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (
  public.has_organization_role(bookings.organization_id, ARRAY['super_admin','admin','operations']::public.app_role[])
  AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id = bookings.property_id AND p.organization_id = bookings.organization_id)
  AND EXISTS (SELECT 1 FROM public.guests g WHERE g.id = bookings.guest_id AND g.organization_id = bookings.organization_id)
);
CREATE POLICY "authorized_roles_can_update_bookings" ON public.bookings FOR UPDATE TO authenticated USING (public.has_organization_role(bookings.organization_id, ARRAY['super_admin','admin','operations']::public.app_role[])) WITH CHECK (
  public.has_organization_role(bookings.organization_id, ARRAY['super_admin','admin','operations']::public.app_role[])
  AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id = bookings.property_id AND p.organization_id = bookings.organization_id)
  AND EXISTS (SELECT 1 FROM public.guests g WHERE g.id = bookings.guest_id AND g.organization_id = bookings.organization_id)
);

DROP POLICY IF EXISTS "admins_can_update_properties" ON public.properties;
CREATE POLICY "admins_can_update_properties" ON public.properties FOR UPDATE TO authenticated USING (public.has_organization_role(properties.organization_id, ARRAY['super_admin','admin']::public.app_role[])) WITH CHECK (
  public.has_organization_role(properties.organization_id, ARRAY['super_admin','admin']::public.app_role[])
  AND (properties.owner_id IS NULL OR EXISTS (SELECT 1 FROM public.owners o WHERE o.id = properties.owner_id AND o.organization_id = properties.organization_id))
);

DROP POLICY IF EXISTS "admins_can_insert_property_amenities" ON public.property_amenities;
DROP POLICY IF EXISTS "admins_can_delete_property_amenities" ON public.property_amenities;
CREATE POLICY "admins_can_insert_property_amenities" ON public.property_amenities FOR INSERT TO authenticated WITH CHECK (public.has_organization_role(property_amenities.organization_id, ARRAY['super_admin','admin']::public.app_role[]) AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_amenities.property_id AND p.organization_id = property_amenities.organization_id));
CREATE POLICY "admins_can_delete_property_amenities" ON public.property_amenities FOR DELETE TO authenticated USING (public.has_organization_role(property_amenities.organization_id, ARRAY['super_admin','admin']::public.app_role[]));

NOTIFY pgrst, 'reload schema';
