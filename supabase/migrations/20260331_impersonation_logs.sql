CREATE TABLE IF NOT EXISTS impersonation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE impersonation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view impersonation logs" ON impersonation_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Add failed_attempts column to otp_codes if it doesn't exist
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;
