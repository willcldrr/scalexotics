-- Client Invoices table for Scale Exotics billing
-- Run this in your Supabase SQL Editor

CREATE TABLE client_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(20) UNIQUE NOT NULL,

  -- Invoice type: 'retainer' or 'booking'
  type VARCHAR(20) NOT NULL CHECK (type IN ('retainer', 'booking')),

  -- Amounts
  base_amount DECIMAL(10,2) NOT NULL,  -- $1500 for retainer, or booking amount
  ad_spend_rate DECIMAL(10,2),          -- Daily rate: 20, 35, or 50
  ad_spend_days INTEGER,                 -- Number of days
  ad_spend_total DECIMAL(10,2),          -- Calculated: rate * days
  total_amount DECIMAL(10,2) NOT NULL,   -- base + ad_spend_total

  -- Booking details (for booking type)
  booking_description TEXT,

  -- Client info
  client_name VARCHAR(100) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(20),

  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,

  -- Stripe integration
  stripe_payment_intent_id VARCHAR(255),
  stripe_checkout_session_id VARCHAR(255),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Create index for faster lookups
CREATE INDEX idx_client_invoices_status ON client_invoices(status);
CREATE INDEX idx_client_invoices_invoice_number ON client_invoices(invoice_number);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_client_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YY');

  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 4) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM client_invoices
  WHERE invoice_number LIKE 'SE' || year_part || '%';

  new_number := 'SE' || year_part || LPAD(seq_num::TEXT, 4, '0');
  NEW.invoice_number := new_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice number
CREATE TRIGGER set_client_invoice_number
  BEFORE INSERT ON client_invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION generate_client_invoice_number();

-- Enable RLS
ALTER TABLE client_invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage client_invoices" ON client_invoices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policy: Anyone can read invoice by id (for payment page)
CREATE POLICY "Anyone can view client_invoice by id" ON client_invoices
  FOR SELECT
  USING (true);
