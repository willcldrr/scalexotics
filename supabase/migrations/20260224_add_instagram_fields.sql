-- Add Instagram-specific fields to leads table for DM integration
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram_user_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram_username TEXT;

-- Index for fast lookups by Instagram user ID
CREATE INDEX IF NOT EXISTS idx_leads_instagram_user_id
  ON leads(instagram_user_id) WHERE instagram_user_id IS NOT NULL;

-- Add Instagram settings to ai_settings table
ALTER TABLE ai_settings ADD COLUMN IF NOT EXISTS instagram_enabled BOOLEAN DEFAULT false;
ALTER TABLE ai_settings ADD COLUMN IF NOT EXISTS instagram_greeting TEXT;

-- Comment for documentation
COMMENT ON COLUMN leads.instagram_user_id IS 'Instagram user ID for DM conversations (IGSID format)';
COMMENT ON COLUMN leads.instagram_username IS 'Instagram username for display purposes';
COMMENT ON COLUMN ai_settings.instagram_enabled IS 'Whether AI auto-responses are enabled for Instagram DMs';
COMMENT ON COLUMN ai_settings.instagram_greeting IS 'Custom greeting message for Instagram conversations';
