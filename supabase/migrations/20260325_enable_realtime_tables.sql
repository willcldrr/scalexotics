-- Enable Supabase Realtime for tables that need real-time updates
-- This allows postgres_changes subscriptions to work for these tables

-- Drop and re-add to handle idempotency (tables may already exist in publication)
DO $$
BEGIN
  -- Core user data tables
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Table already in publication
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE leads;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- Admin tables
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE businesses;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE do_not_rent_list;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- Note: invoices table may not exist yet - add manually when created
  -- ALTER PUBLICATION supabase_realtime ADD TABLE invoices;

  -- CRM tables (may already be enabled)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE crm_leads;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE crm_events;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
