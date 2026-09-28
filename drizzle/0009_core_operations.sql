-- Core Operations: soft-archive for owners/guests/properties, booking overlap
-- prevention at the database level, and booking update/cancel support.
-- Additive and non-destructive. Existing rows are preserved.

CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint

-- Soft-archive columns (nullable; existing rows remain active).
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS archived_at timestamptz;--> statement-breakpoint
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS archived_at timestamptz;--> statement-breakpoint
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS archived_at timestamptz;--> statement-breakpoint

-- Booking overlap prevention.
-- Prevent two ACTIVE (pending/confirmed) bookings for the same property from
-- overlapping on [check_in, check_out). Cancelled/completed bookings are ignored.
-- Enforced at the database level via a GiST exclusion constraint.
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_active_overlap
  EXCLUDE USING gist (
    property_id WITH =,
    tstzrange(check_in_date, check_out_date, '[)') WITH &&
  )
  WHERE (status IN ('pending', 'confirmed'));--> statement-breakpoint

-- Transactional booking update with tenant + relationship validation and audit.
CREATE OR REPLACE FUNCTION public.update_booking(
  input_organization_id uuid,
  input_booking_id uuid,
  input_property_id uuid,
  input_guest_id uuid,
  input_check_in timestamptz,
  input_check_out timestamptz,
  input_status public.booking_status,
  input_total_guests integer,
  input_total_price numeric,
  input_booking_source text
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

  IF NOT public.has_organization_role(input_organization_id, ARRAY['super_admin','admin','operations']::public.app_role[]) THEN
    RAISE EXCEPTION 'You do not have permission to update bookings';
  END IF;

  IF input_check_in >= input_check_out THEN
    RAISE EXCEPTION 'Check-out must be after check-in';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.properties p WHERE p.id = input_property_id AND p.organization_id = input_organization_id) THEN
    RAISE EXCEPTION 'Property not found in this workspace';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.guests g WHERE g.id = input_guest_id AND g.organization_id = input_organization_id) THEN
    RAISE EXCEPTION 'Guest not found in this workspace';
  END IF;

  UPDATE public.bookings
  SET property_id = input_property_id,
      guest_id = input_guest_id,
      check_in_date = input_check_in,
      check_out_date = input_check_out,
      status = input_status,
      total_guests = input_total_guests,
      total_price = input_total_price,
      booking_source = input_booking_source,
      updated_at = now()
  WHERE id = input_booking_id
    AND organization_id = input_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found in this workspace';
  END IF;

  INSERT INTO public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (input_organization_id, current_user_id, 'booking.updated', 'booking', input_booking_id,
          jsonb_build_object('status', input_status));
END;
$$;--> statement-breakpoint

-- Cancel a booking (frees the date range for the overlap constraint).
CREATE OR REPLACE FUNCTION public.cancel_booking(
  input_organization_id uuid,
  input_booking_id uuid
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

  IF NOT public.has_organization_role(input_organization_id, ARRAY['super_admin','admin','operations']::public.app_role[]) THEN
    RAISE EXCEPTION 'You do not have permission to cancel bookings';
  END IF;

  UPDATE public.bookings
  SET status = 'cancelled', updated_at = now()
  WHERE id = input_booking_id
    AND organization_id = input_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found in this workspace';
  END IF;

  INSERT INTO public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (input_organization_id, current_user_id, 'booking.cancelled', 'booking', input_booking_id, '{}'::jsonb);
END;
$$;--> statement-breakpoint

REVOKE EXECUTE ON FUNCTION public.update_booking(uuid, uuid, uuid, uuid, timestamptz, timestamptz, public.booking_status, integer, numeric, text) FROM PUBLIC, anon;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.cancel_booking(uuid, uuid) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.update_booking(uuid, uuid, uuid, uuid, timestamptz, timestamptz, public.booking_status, integer, numeric, text) TO authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid, uuid) TO authenticated;--> statement-breakpoint

NOTIFY pgrst, 'reload schema';
