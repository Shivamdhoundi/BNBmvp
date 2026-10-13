-- Do not depend on Supabase's historical broad default table grants.
-- Existing RLS policies remain responsible for tenant, role and MFA checks.
REVOKE ALL ON public.guests, public.bookings, public.owners, public.properties,
  public.property_units, public.property_amenities FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.guests, public.bookings, public.owners,
  public.properties, public.property_units, public.property_amenities FROM authenticated;
GRANT SELECT ON public.guests, public.bookings, public.owners, public.properties,
  public.property_units, public.property_amenities TO authenticated;

GRANT INSERT (organization_id,first_name,last_name,email,phone,identity_verified)
  ON public.guests TO authenticated;
GRANT UPDATE (first_name,last_name,email,phone,identity_verified,archived_at)
  ON public.guests TO authenticated;

GRANT INSERT (organization_id,legal_name,email,phone,is_active)
  ON public.owners TO authenticated;
GRANT UPDATE (legal_name,email,phone,is_active,archived_at)
  ON public.owners TO authenticated;

-- Changes/cancellations still go through the audited booking RPCs.
GRANT INSERT (organization_id,property_id,guest_id,check_in_date,check_out_date,
  status,total_guests,total_price,booking_source) ON public.bookings TO authenticated;

-- Creation still goes through create_property_complete, not direct INSERT.
GRANT UPDATE (name,slug,property_type,status,address_line_1,address_line_2,city,state,
  postal_code,base_price,cleaning_fee,security_deposit,check_in_time,check_out_time,
  description,house_rules,owner_id,management_commission_percent,latitude,longitude,archived_at)
  ON public.properties TO authenticated;
GRANT UPDATE (bedrooms,bathrooms,max_guests) ON public.property_units TO authenticated;
GRANT INSERT (organization_id,property_id,amenity_key,details) ON public.property_amenities TO authenticated;
GRANT DELETE ON public.property_amenities TO authenticated;

-- The protected health endpoint uses a server client, never public table access.
GRANT SELECT (id) ON public.organizations TO service_role;
NOTIFY pgrst, 'reload schema';
