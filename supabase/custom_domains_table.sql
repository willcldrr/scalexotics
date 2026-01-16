-- Custom domains table for white-label customer-facing pages
-- Run this migration in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Domain configuration
  domain VARCHAR(255) NOT NULL UNIQUE,

  -- Verification status
  verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(64),
  verified_at TIMESTAMPTZ,

  -- SSL status (managed by Vercel)
  ssl_status VARCHAR(20) DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_domains_user_id ON custom_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);

-- Enable RLS
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own domains
CREATE POLICY "Users can view own domains"
  ON custom_domains FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create domains
CREATE POLICY "Users can create domains"
  ON custom_domains FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own domains
CREATE POLICY "Users can update own domains"
  ON custom_domains FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own domains
CREATE POLICY "Users can delete own domains"
  ON custom_domains FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Public can look up domains (for middleware)
CREATE POLICY "Public can lookup domains"
  ON custom_domains FOR SELECT
  USING (true);

-- Function to generate verification token
CREATE OR REPLACE FUNCTION generate_domain_verification_token()
RETURNS TRIGGER AS $$
BEGIN
  NEW.verification_token := encode(gen_random_bytes(32), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate verification token
DROP TRIGGER IF EXISTS set_domain_verification_token ON custom_domains;
CREATE TRIGGER set_domain_verification_token
  BEFORE INSERT ON custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION generate_domain_verification_token();
