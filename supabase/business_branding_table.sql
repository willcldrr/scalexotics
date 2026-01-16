-- Create business_branding table for white-label customer-facing pages
-- Run this migration in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS business_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Company identity
  company_name VARCHAR(255) NOT NULL,
  logo_url TEXT,

  -- Colors
  primary_color VARCHAR(7) DEFAULT '#375DEE',
  background_color VARCHAR(7) DEFAULT '#000000',

  -- Contact info (shown on customer-facing pages)
  support_email VARCHAR(255),
  support_phone VARCHAR(50),
  website_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_business_branding_user_id ON business_branding(user_id);

-- Enable RLS
ALTER TABLE business_branding ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own branding
CREATE POLICY "Users can view own branding"
  ON business_branding FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their branding
CREATE POLICY "Users can create branding"
  ON business_branding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own branding
CREATE POLICY "Users can update own branding"
  ON business_branding FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Public can view branding (for customer-facing pages)
-- This allows invoice pages, booking portals, etc. to fetch branding without auth
CREATE POLICY "Public can view branding"
  ON business_branding FOR SELECT
  USING (true);
