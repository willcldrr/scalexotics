-- Instagram OAuth Connections
-- Stores Instagram Business Account credentials for each user

CREATE TABLE IF NOT EXISTS instagram_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_account_id TEXT NOT NULL,
  instagram_username TEXT,
  page_name TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,

  -- Each user can have one Instagram connection
  UNIQUE(user_id)
);

-- Index for looking up by Instagram account ID (for webhook routing)
CREATE INDEX IF NOT EXISTS idx_instagram_connections_account_id
  ON instagram_connections(instagram_account_id) WHERE is_active = true;

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_instagram_connections_user
  ON instagram_connections(user_id) WHERE is_active = true;

-- RLS policies
ALTER TABLE instagram_connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own connections
CREATE POLICY "Users can view own instagram connection" ON instagram_connections
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own connections
CREATE POLICY "Users can create own instagram connection" ON instagram_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own connections
CREATE POLICY "Users can update own instagram connection" ON instagram_connections
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own connections
CREATE POLICY "Users can delete own instagram connection" ON instagram_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE instagram_connections IS 'Stores Instagram OAuth credentials for DM integration';
COMMENT ON COLUMN instagram_connections.instagram_account_id IS 'Instagram Business Account ID from Meta API';
COMMENT ON COLUMN instagram_connections.access_token IS 'Long-lived page access token for sending messages';
COMMENT ON COLUMN instagram_connections.token_expires_at IS 'When the access token expires (60 days from issue)';
