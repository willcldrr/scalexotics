-- Retroactively added to migration pipeline from ad-hoc SQL.
-- Original path: supabase/otp_codes.sql
-- NOTE: if this DDL has already been applied to production by hand, the
--       new pipeline apply will no-op (IF NOT EXISTS) or fail loudly on
--       re-apply. Review before running.

-- OTP codes table for custom email verification
CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_code ON otp_codes (email, code) WHERE used = false;

-- Auto-cleanup expired codes (optional, can also be done via cron)
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON otp_codes (expires_at);

-- RLS: only service role should access this table
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
-- No policies = no access via anon/authenticated, only service role can read/write
