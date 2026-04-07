-- Enterprise sessions upgrade: add session_token, user_agent, is_active columns
-- and auto-cleanup function for stale sessions (>30 days inactive)

-- Add missing columns
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS session_token TEXT;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS location TEXT;

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON user_sessions(last_active);

-- Index for active session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = true;

-- Function to clean up stale sessions (inactive > 30 days)
CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM user_sessions
  WHERE last_active < NOW() - INTERVAL '30 days'
  RETURNING * INTO deleted_count;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Clean up any existing sessions without tokens (legacy rows)
DELETE FROM user_sessions WHERE session_token IS NULL;
