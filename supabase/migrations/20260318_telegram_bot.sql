-- Telegram Bot Integration for Dashboard Management
-- Allows users to manage their dashboard via Telegram chat

-- Add Telegram fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ;

-- Index for fast lookup by telegram_chat_id
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id
  ON profiles(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

-- Table for temporary link codes (used to verify Telegram accounts)
CREATE TABLE IF NOT EXISTS telegram_link_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes'),
  used_at TIMESTAMPTZ,

  UNIQUE(code)
);

-- Index for code lookup
CREATE INDEX IF NOT EXISTS idx_telegram_link_codes_code ON telegram_link_codes(code);

-- RLS for telegram_link_codes
ALTER TABLE telegram_link_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own link codes
CREATE POLICY "Users can view own link codes" ON telegram_link_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own link codes" ON telegram_link_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Table for logging Telegram bot interactions (useful for debugging)
CREATE TABLE IF NOT EXISTS telegram_bot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  chat_id TEXT NOT NULL,
  message_text TEXT,
  bot_response TEXT,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_telegram_bot_logs_user ON telegram_bot_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_bot_logs_created ON telegram_bot_logs(created_at DESC);

-- RLS for telegram_bot_logs
ALTER TABLE telegram_bot_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bot logs" ON telegram_bot_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all logs
CREATE POLICY "Admins can view all bot logs" ON telegram_bot_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
