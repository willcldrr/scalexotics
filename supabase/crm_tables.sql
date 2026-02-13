-- Admin CRM Tables for Scale Exotics
-- Run this migration in your Supabase SQL editor
-- These tables are for managing B2B leads (potential Scale Exotics customers)

-- 1. CRM Leads - B2B Lead Management
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- Admin who created this lead

  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  website VARCHAR(500),
  fleet_size INTEGER, -- Estimated number of vehicles
  location VARCHAR(255), -- City/State

  -- Contact Information
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_title VARCHAR(100), -- e.g., "Owner", "Fleet Manager"

  -- Lead Details
  source VARCHAR(100), -- How they found Scale Exotics (e.g., "Referral", "Cold Outreach", "Inbound")
  status VARCHAR(50) NOT NULL DEFAULT 'not_contacted',
  -- Statuses: not_contacted, contacted, interested, not_interested, demo_scheduled, closed_won, closed_lost

  lead_score INTEGER DEFAULT 0, -- 0-100 score
  assigned_to UUID REFERENCES auth.users(id), -- Admin assigned to this lead

  -- Timing
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  next_follow_up TIMESTAMP WITH TIME ZONE,

  -- Value
  estimated_value DECIMAL(10,2), -- Estimated contract value

  -- Metadata
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for crm_leads
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to ON crm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON crm_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_company ON crm_leads(company_name);
CREATE INDEX IF NOT EXISTS idx_crm_leads_next_follow_up ON crm_leads(next_follow_up);

-- Enable RLS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can access CRM leads
CREATE POLICY "Admins can view CRM leads" ON crm_leads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert CRM leads" ON crm_leads
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update CRM leads" ON crm_leads
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete CRM leads" ON crm_leads
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 2. CRM Notes - Lead Notes & Activity Log
CREATE TABLE IF NOT EXISTS crm_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id), -- Admin who added the note

  content TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'note', -- note, call, email, meeting, status_change

  -- For status change tracking
  old_status VARCHAR(50),
  new_status VARCHAR(50),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for crm_notes
CREATE INDEX IF NOT EXISTS idx_crm_notes_lead_id ON crm_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_notes_created_at ON crm_notes(lead_id, created_at DESC);

-- Enable RLS
ALTER TABLE crm_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage CRM notes" ON crm_notes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 3. CRM Events - Calendar Events
CREATE TABLE IF NOT EXISTS crm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- Admin who owns this event
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL, -- Optional link to lead

  -- Event Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_all_day BOOLEAN DEFAULT FALSE,

  -- Event Type
  event_type VARCHAR(50) DEFAULT 'meeting', -- meeting, demo, call, follow_up, other

  -- Location & Meeting
  location VARCHAR(500), -- Physical address
  meeting_link VARCHAR(500), -- Google Meet link
  meeting_provider VARCHAR(50) DEFAULT 'google_meet', -- google_meet
  meeting_id VARCHAR(255), -- Google Meet ID

  -- Google Calendar Sync
  google_event_id VARCHAR(255),
  google_calendar_id VARCHAR(255),

  -- Attendees
  attendees JSONB DEFAULT '[]', -- [{email, name, response_status}]

  -- Reminders
  reminder_minutes INTEGER DEFAULT 30,
  reminder_sent BOOLEAN DEFAULT FALSE,

  -- Recurrence (future use)
  recurrence_rule TEXT, -- RRULE format

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for crm_events
CREATE INDEX IF NOT EXISTS idx_crm_events_user_id ON crm_events(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_events_lead_id ON crm_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_events_start_time ON crm_events(start_time);
CREATE INDEX IF NOT EXISTS idx_crm_events_google_event ON crm_events(google_event_id);

-- Enable RLS
ALTER TABLE crm_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage CRM events" ON crm_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 4. CRM OAuth Tokens - OAuth Credentials Storage
CREATE TABLE IF NOT EXISTS crm_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  provider VARCHAR(50) NOT NULL, -- google, zoom
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,

  -- Provider-specific data
  provider_user_id VARCHAR(255),
  provider_email VARCHAR(255),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE crm_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own OAuth tokens" ON crm_oauth_tokens
  FOR ALL USING (auth.uid() = user_id);

-- 5. CRM Activity Log - Comprehensive Activity Tracking
CREATE TABLE IF NOT EXISTS crm_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- Admin who performed the action
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,

  action VARCHAR(100) NOT NULL,
  -- Actions: lead_created, lead_updated, status_changed, note_added,
  --          meeting_scheduled, email_sent, call_logged, etc.

  details JSONB DEFAULT '{}', -- Additional context

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for crm_activity_log
CREATE INDEX IF NOT EXISTS idx_crm_activity_lead_id ON crm_activity_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activity_created_at ON crm_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activity_user_id ON crm_activity_log(user_id);

-- Enable RLS
ALTER TABLE crm_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view CRM activity log" ON crm_activity_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert CRM activity log" ON crm_activity_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_crm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crm_leads_updated_at
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

CREATE TRIGGER crm_events_updated_at
  BEFORE UPDATE ON crm_events
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

CREATE TRIGGER crm_oauth_tokens_updated_at
  BEFORE UPDATE ON crm_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();
