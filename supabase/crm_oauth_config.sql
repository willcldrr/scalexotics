-- CRM OAuth App Configuration
-- Run this migration in your Supabase SQL editor
-- This table stores OAuth app credentials configured through the admin dashboard

-- OAuth App Configuration (stores client credentials)
CREATE TABLE IF NOT EXISTS crm_oauth_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL UNIQUE, -- 'google'
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  redirect_uri TEXT,
  scopes TEXT DEFAULT 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE crm_oauth_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage OAuth config
CREATE POLICY "Admins can view OAuth config" ON crm_oauth_config
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert OAuth config" ON crm_oauth_config
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update OAuth config" ON crm_oauth_config
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete OAuth config" ON crm_oauth_config
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER crm_oauth_config_updated_at
  BEFORE UPDATE ON crm_oauth_config
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

-- Add meeting_provider column to crm_events if it doesn't exist with correct default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_events' AND column_name = 'meeting_provider'
  ) THEN
    ALTER TABLE crm_events ADD COLUMN meeting_provider VARCHAR(50) DEFAULT 'google_meet';
  END IF;
END $$;
