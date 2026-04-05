-- Deposit Portal Configuration
-- Stores settings for the customer-facing deposit payment portal

CREATE TABLE IF NOT EXISTS deposit_portal_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Stripe Configuration
  stripe_publishable_key TEXT,
  stripe_secret_key TEXT,

  -- Deposit Settings
  default_deposit_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage' or 'fixed'
  default_deposit_value DECIMAL(10,2) DEFAULT 25, -- 25% or $25 depending on type
  min_deposit_amount DECIMAL(10,2) DEFAULT 100,
  max_deposit_amount DECIMAL(10,2),

  -- Portal Branding (overrides business_branding if set)
  portal_title VARCHAR(255) DEFAULT 'Secure Deposit',
  portal_subtitle TEXT DEFAULT 'Complete your rental deposit to confirm your booking',
  logo_url TEXT,
  accent_color VARCHAR(7) DEFAULT '#FFFFFF',

  -- Terms & Legal
  terms_enabled BOOLEAN DEFAULT true,
  terms_text TEXT DEFAULT 'I agree to the rental terms and conditions and understand that this deposit is non-refundable within 48 hours of the rental start date.',

  -- Success/Failure Config
  success_message TEXT DEFAULT 'Your deposit has been received! You will receive a confirmation via SMS shortly.',
  success_redirect_url TEXT,

  -- SMS Notifications
  send_confirmation_sms BOOLEAN DEFAULT true,
  confirmation_sms_template TEXT DEFAULT 'Your deposit of {amount} for {vehicle} has been confirmed! Rental dates: {dates}. We will contact you with pickup details.',

  -- Security
  require_id_upload BOOLEAN DEFAULT false,
  require_insurance_upload BOOLEAN DEFAULT false,

  -- Domain
  custom_domain TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deposit_portal_user_id ON deposit_portal_config(user_id);

-- Enable RLS
ALTER TABLE deposit_portal_config ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own config
CREATE POLICY "Users can view own deposit config"
  ON deposit_portal_config FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their config
CREATE POLICY "Users can create deposit config"
  ON deposit_portal_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own config
CREATE POLICY "Users can update own deposit config"
  ON deposit_portal_config FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Public can view config (for customer-facing portal)
-- Only expose non-sensitive fields via API
CREATE POLICY "Public can view deposit config"
  ON deposit_portal_config FOR SELECT
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_deposit_portal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deposit_portal_config_updated_at
  BEFORE UPDATE ON deposit_portal_config
  FOR EACH ROW EXECUTE FUNCTION update_deposit_portal_updated_at();

-- Add comment
COMMENT ON TABLE deposit_portal_config IS 'Configuration for customer-facing deposit payment portal';
