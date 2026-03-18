-- Create payment_links table for short URL payment tokens
CREATE TABLE IF NOT EXISTS payment_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  short_token VARCHAR(21) UNIQUE NOT NULL, -- Format: XXXXXXX-XXXXXXX-XXXXX
  vehicle_id VARCHAR(255) NOT NULL,
  vehicle_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_rate DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  business_name VARCHAR(255) DEFAULT 'Velocity Exotics',
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_payment_links_short_token ON payment_links(short_token);

-- Index for cleanup of expired links
CREATE INDEX IF NOT EXISTS idx_payment_links_expires_at ON payment_links(expires_at);

-- Enable RLS
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for API operations)
CREATE POLICY "Service role has full access to payment_links"
  ON payment_links
  FOR ALL
  USING (true)
  WITH CHECK (true);
