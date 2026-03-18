-- Businesses table for multi-tenant payment system
-- Each business gets their own payment domain, Stripe keys, and branding

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier (e.g., "exotic-rentals")
  owner_user_id UUID REFERENCES auth.users(id),

  -- Payment domain (purchased by platform owner)
  payment_domain TEXT UNIQUE, -- e.g., "exoticrentalspayments.com"
  domain_status TEXT DEFAULT 'pending' CHECK (domain_status IN ('pending', 'active', 'suspended')),

  -- Stripe configuration
  stripe_publishable_key TEXT,
  stripe_secret_key TEXT,
  stripe_connected BOOLEAN DEFAULT false,

  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#FFFFFF',
  secondary_color TEXT DEFAULT '#000000',

  -- Business details
  phone TEXT,
  email TEXT,
  address TEXT,
  business_hours TEXT,

  -- Settings
  deposit_percentage INTEGER DEFAULT 25,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- Index for fast domain lookup
CREATE INDEX IF NOT EXISTS idx_businesses_payment_domain ON businesses(payment_domain);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);

-- Update payment_links to reference businesses
ALTER TABLE payment_links
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);

-- Index for business lookup on payment links
CREATE INDEX IF NOT EXISTS idx_payment_links_business ON payment_links(business_id);

-- RLS Policies
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Admins can see all businesses
CREATE POLICY "Admins can manage all businesses" ON businesses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Business owners can see their own business
CREATE POLICY "Owners can view their business" ON businesses
  FOR SELECT USING (owner_user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS businesses_updated_at ON businesses;
CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_businesses_updated_at();
