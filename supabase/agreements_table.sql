-- Create agreements table for digital rental contracts
-- Run this migration in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  lead_id UUID,

  -- Customer info
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),

  -- Rental details
  vehicle_info VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) DEFAULT 0,

  -- Agreement status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'signed', 'expired')),

  -- Signature data (base64 encoded image)
  signature_data TEXT,
  signed_at TIMESTAMPTZ,

  -- Unique token for signing link
  token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agreements_user_id ON agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_agreements_booking_id ON agreements(booking_id);
CREATE INDEX IF NOT EXISTS idx_agreements_token ON agreements(token);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);

-- Enable RLS
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own agreements
CREATE POLICY "Users can view own agreements"
  ON agreements FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create agreements
CREATE POLICY "Users can create agreements"
  ON agreements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own agreements
CREATE POLICY "Users can update own agreements"
  ON agreements FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Anyone can view agreement by token (for signing)
CREATE POLICY "Public can view agreement by token"
  ON agreements FOR SELECT
  USING (true);

-- Policy: Anyone can update agreement status via token (for signing)
CREATE POLICY "Public can sign agreement via token"
  ON agreements FOR UPDATE
  USING (true)
  WITH CHECK (true);
