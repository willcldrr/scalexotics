-- Add stripe_session_id column to payment_links table
-- This allows looking up the correct Stripe account when verifying payments

ALTER TABLE payment_links
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Create index for fast lookups by session ID
CREATE INDEX IF NOT EXISTS idx_payment_links_stripe_session_id
ON payment_links(stripe_session_id)
WHERE stripe_session_id IS NOT NULL;
