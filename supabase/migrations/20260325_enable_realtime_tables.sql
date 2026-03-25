-- Enable Supabase Realtime for tables that need real-time updates
-- This allows postgres_changes subscriptions to work for these tables

DO $$
BEGIN
  -- Core user data tables
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE leads;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- User/Profile tables
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- Admin tables
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE businesses;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE do_not_rent_list;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE custom_domains;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- CRM tables
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE crm_leads;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE crm_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE crm_notes;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- Payment tables
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE payment_links;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- Settings tables
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE ai_settings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE deposit_portal_config;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
