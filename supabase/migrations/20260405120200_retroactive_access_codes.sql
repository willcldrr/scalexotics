-- Retroactively added to migration pipeline from ad-hoc SQL.
-- Original path: supabase/access_codes.sql
-- NOTE: if this DDL has already been applied to production by hand, the
--       new pipeline apply will no-op (IF NOT EXISTS) or fail loudly on
--       re-apply. Review before running.

-- Access Codes Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS access_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100), -- Optional label like "Miami Client" or "John's Fleet"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL means never expires
  used_at TIMESTAMPTZ, -- When the code was used
  used_by UUID REFERENCES profiles(id), -- Who used the code
  is_active BOOLEAN DEFAULT TRUE,
  max_uses INTEGER DEFAULT 1, -- How many times the code can be used (1 = single use)
  use_count INTEGER DEFAULT 0 -- How many times it's been used
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON access_codes(is_active);

-- RLS Policies
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Only allow reading codes for verification (public read for active codes)
DROP POLICY IF EXISTS "Allow public to verify codes" ON access_codes;
CREATE POLICY "Allow public to verify codes" ON access_codes
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage access codes
DROP POLICY IF EXISTS "Admins can manage codes" ON access_codes;
CREATE POLICY "Admins can manage codes" ON access_codes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
