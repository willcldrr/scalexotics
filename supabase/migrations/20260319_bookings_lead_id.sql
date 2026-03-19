-- Add lead_id to bookings table if not exists
-- This links bookings to their originating lead for tracking and conversation continuity

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

-- Add Stripe columns if not exists
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;

-- Index for fast lead lookups
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON bookings(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session ON bookings(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN bookings.lead_id IS 'Reference to the lead that this booking originated from';
COMMENT ON COLUMN bookings.stripe_session_id IS 'Stripe Checkout Session ID for payment tracking';
COMMENT ON COLUMN bookings.stripe_payment_intent IS 'Stripe Payment Intent ID for refunds/disputes';
