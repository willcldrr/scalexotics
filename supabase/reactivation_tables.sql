-- Reactivation Feature Tables
-- Run this migration in your Supabase SQL editor

-- 1. Reactivation Contacts - Stores imported past customers
CREATE TABLE IF NOT EXISTS reactivation_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contact Information
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),

  -- Import Metadata
  import_source VARCHAR(100) DEFAULT 'csv_import',
  import_batch_id UUID,
  original_lead_id UUID,
  original_booking_id UUID,

  -- Segmentation Fields
  last_rental_date DATE,
  total_spend DECIMAL(10,2) DEFAULT 0,
  rental_count INTEGER DEFAULT 0,
  preferred_vehicle_type VARCHAR(100),
  preferred_vehicle_ids UUID[],
  birthday DATE,
  anniversary_date DATE,

  -- Communication Preferences
  sms_opted_in BOOLEAN DEFAULT true,
  email_opted_in BOOLEAN DEFAULT true,
  opted_out_at TIMESTAMP WITH TIME ZONE,
  opt_out_reason VARCHAR(255),

  -- Engagement Tracking
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  last_responded_at TIMESTAMP WITH TIME ZONE,
  total_messages_sent INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'active',
  tags TEXT[],
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reactivation_contacts
CREATE INDEX IF NOT EXISTS idx_reactivation_contacts_user ON reactivation_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_reactivation_contacts_status ON reactivation_contacts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reactivation_contacts_last_rental ON reactivation_contacts(user_id, last_rental_date);
CREATE INDEX IF NOT EXISTS idx_reactivation_contacts_email ON reactivation_contacts(email);
CREATE INDEX IF NOT EXISTS idx_reactivation_contacts_phone ON reactivation_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_reactivation_contacts_batch ON reactivation_contacts(import_batch_id);

-- 2. Reactivation Templates - Reusable message templates
CREATE TABLE IF NOT EXISTS reactivation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Template Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(50),
  channel VARCHAR(20) NOT NULL,

  -- Content
  subject VARCHAR(255),
  content TEXT NOT NULL,
  html_content TEXT,

  -- Personalization Variables
  available_variables TEXT[],

  -- AI Settings
  ai_generated BOOLEAN DEFAULT false,
  ai_tone VARCHAR(50),
  ai_prompt TEXT,

  -- System Templates
  is_system_template BOOLEAN DEFAULT false,

  -- Stats
  times_used INTEGER DEFAULT 0,
  avg_response_rate DECIMAL(5,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reactivation_templates
CREATE INDEX IF NOT EXISTS idx_reactivation_templates_user ON reactivation_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_reactivation_templates_type ON reactivation_templates(user_id, template_type, channel);

-- 3. Reactivation Campaigns - Campaign configuration
CREATE TABLE IF NOT EXISTS reactivation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Campaign Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50) NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'draft',

  -- Scheduling
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,

  -- Trigger Settings
  trigger_type VARCHAR(50),
  trigger_conditions JSONB,

  -- Target Audience
  target_segments JSONB,
  contact_ids UUID[],

  -- Channel Settings
  channels TEXT[] DEFAULT ARRAY['sms'],

  -- AI Settings
  ai_enabled BOOLEAN DEFAULT true,
  ai_tone VARCHAR(50) DEFAULT 'friendly',
  ai_instructions TEXT,

  -- Frequency Limits
  max_messages_per_contact INTEGER DEFAULT 3,
  min_days_between_messages INTEGER DEFAULT 7,

  -- Do Not Disturb
  dnd_start_time TIME DEFAULT '21:00',
  dnd_end_time TIME DEFAULT '09:00',
  dnd_days INTEGER[] DEFAULT ARRAY[0],

  -- Template
  template_id UUID REFERENCES reactivation_templates(id) ON DELETE SET NULL,

  -- Metrics
  total_contacts INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  responses INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  opt_outs INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reactivation_campaigns
CREATE INDEX IF NOT EXISTS idx_reactivation_campaigns_user ON reactivation_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_reactivation_campaigns_status ON reactivation_campaigns(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reactivation_campaigns_type ON reactivation_campaigns(user_id, campaign_type);

-- 4. Reactivation Campaign Messages - Message history and tracking
CREATE TABLE IF NOT EXISTS reactivation_campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES reactivation_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES reactivation_contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Message Details
  channel VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  subject VARCHAR(255),

  -- AI Generation
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt_used TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,

  -- Engagement Tracking
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  click_count INTEGER DEFAULT 0,
  response_received_at TIMESTAMP WITH TIME ZONE,
  response_content TEXT,

  -- External IDs
  twilio_message_sid VARCHAR(100),
  email_message_id VARCHAR(255),

  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Personalization Data
  personalization_data JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reactivation_campaign_messages
CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign ON reactivation_campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_contact ON reactivation_campaign_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_status ON reactivation_campaign_messages(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_sent ON reactivation_campaign_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_user ON reactivation_campaign_messages(user_id);

-- 5. Reactivation Settings - Global settings per user
CREATE TABLE IF NOT EXISTS reactivation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Global AI Settings
  ai_enabled BOOLEAN DEFAULT true,
  default_ai_tone VARCHAR(50) DEFAULT 'friendly',

  -- Global Frequency Limits
  max_messages_per_contact_per_month INTEGER DEFAULT 8,
  min_days_between_any_message INTEGER DEFAULT 3,

  -- Do Not Disturb (Global)
  global_dnd_enabled BOOLEAN DEFAULT true,
  dnd_start_time TIME DEFAULT '21:00',
  dnd_end_time TIME DEFAULT '09:00',
  dnd_days INTEGER[] DEFAULT ARRAY[0],

  -- Unsubscribe Settings
  auto_unsubscribe_after_opt_out BOOLEAN DEFAULT true,
  unsubscribe_confirmation_message TEXT,

  -- Email Settings
  email_from_name VARCHAR(255),
  email_reply_to VARCHAR(255),
  email_provider VARCHAR(50) DEFAULT 'resend',
  email_api_key_encrypted TEXT,

  -- Tracking Settings
  track_opens BOOLEAN DEFAULT true,
  track_clicks BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE reactivation_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactivation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactivation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactivation_campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactivation_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reactivation_contacts
CREATE POLICY "Users can view own contacts" ON reactivation_contacts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" ON reactivation_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON reactivation_contacts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contacts" ON reactivation_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reactivation_templates
CREATE POLICY "Users can view own templates" ON reactivation_templates
  FOR SELECT USING (auth.uid() = user_id OR is_system_template = true);
CREATE POLICY "Users can insert own templates" ON reactivation_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON reactivation_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON reactivation_templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reactivation_campaigns
CREATE POLICY "Users can view own campaigns" ON reactivation_campaigns
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON reactivation_campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON reactivation_campaigns
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON reactivation_campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reactivation_campaign_messages
CREATE POLICY "Users can view own messages" ON reactivation_campaign_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON reactivation_campaign_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own messages" ON reactivation_campaign_messages
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON reactivation_campaign_messages
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reactivation_settings
CREATE POLICY "Users can view own settings" ON reactivation_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON reactivation_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON reactivation_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_reactivation_contacts_updated_at
  BEFORE UPDATE ON reactivation_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reactivation_templates_updated_at
  BEFORE UPDATE ON reactivation_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reactivation_campaigns_updated_at
  BEFORE UPDATE ON reactivation_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reactivation_campaign_messages_updated_at
  BEFORE UPDATE ON reactivation_campaign_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reactivation_settings_updated_at
  BEFORE UPDATE ON reactivation_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
