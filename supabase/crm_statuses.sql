-- CRM Custom Statuses Table
-- Run this migration in your Supabase SQL editor
-- Allows admins to customize lead statuses

-- Create the crm_statuses table
CREATE TABLE IF NOT EXISTS crm_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Status key (used in database, e.g., "not_contacted", "demo_scheduled")
  value VARCHAR(100) NOT NULL UNIQUE,

  -- Display label (shown in UI, e.g., "Not Contacted", "Demo Scheduled")
  label VARCHAR(100) NOT NULL,

  -- Description (tooltip/help text)
  description TEXT,

  -- Colors (Tailwind classes)
  color VARCHAR(100) NOT NULL DEFAULT 'text-white/60',
  bg_color VARCHAR(100) NOT NULL DEFAULT 'bg-white/10',

  -- Ordering (lower = appears first)
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Status groups
  is_active BOOLEAN DEFAULT TRUE, -- Active in pipeline (not closed)
  is_won BOOLEAN DEFAULT FALSE, -- Counts as won deal
  is_lost BOOLEAN DEFAULT FALSE, -- Counts as lost deal
  show_in_pipeline BOOLEAN DEFAULT TRUE, -- Show in kanban view

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_crm_statuses_sort_order ON crm_statuses(sort_order);

-- Enable RLS
ALTER TABLE crm_statuses ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage statuses
CREATE POLICY "Admins can view CRM statuses" ON crm_statuses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert CRM statuses" ON crm_statuses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update CRM statuses" ON crm_statuses
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete CRM statuses" ON crm_statuses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER crm_statuses_updated_at
  BEFORE UPDATE ON crm_statuses
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

-- Insert default statuses
INSERT INTO crm_statuses (value, label, description, color, bg_color, sort_order, is_active, is_won, is_lost, show_in_pipeline) VALUES
  ('not_contacted', 'Not Contacted', 'New lead, no outreach yet', 'text-white/60', 'bg-white/10', 1, true, false, false, true),
  ('contacted', 'Contacted', 'Initial contact made', 'text-[#375DEE]', 'bg-[#375DEE]/15', 2, true, false, false, true),
  ('interested', 'Interested', 'Showed interest in Scale Exotics', 'text-[#5a7df4]', 'bg-[#375DEE]/25', 3, true, false, false, true),
  ('not_interested', 'Not Interested', 'Declined to proceed', 'text-white/40', 'bg-white/5', 4, false, false, true, false),
  ('demo_scheduled', 'Demo Scheduled', 'Demo or call scheduled', 'text-[#7b9af7]', 'bg-[#375DEE]/35', 5, true, false, false, true),
  ('closed_won', 'Closed Won', 'Signed up as customer', 'text-white', 'bg-[#375DEE]', 6, false, true, false, true),
  ('closed_lost', 'Closed Lost', 'Deal lost', 'text-white/50', 'bg-white/10', 7, false, false, true, true),
  ('bounced', 'Bounced', 'Invalid contact info or email bounced', 'text-white/40', 'bg-white/5', 8, false, false, true, false)
ON CONFLICT (value) DO NOTHING;
