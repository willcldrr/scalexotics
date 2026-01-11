-- Access Codes Table
-- Run this in your Supabase SQL Editor

CREATE TABLE access_codes (
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
CREATE INDEX idx_access_codes_code ON access_codes(code);
CREATE INDEX idx_access_codes_active ON access_codes(is_active);

-- RLS Policies
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Only allow reading codes for verification (public read for active codes)
CREATE POLICY "Allow public to verify codes" ON access_codes
  FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to manage codes (you'll want to restrict this to admins later)
CREATE POLICY "Allow authenticated to manage codes" ON access_codes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
