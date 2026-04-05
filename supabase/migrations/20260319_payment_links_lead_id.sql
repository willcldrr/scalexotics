-- Add lead_id and user_id to payment_links table for proper tracking
-- This allows the webhook to update the correct lead when payment completes

ALTER TABLE payment_links
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS business_id UUID;

-- Index for fast lead lookups
CREATE INDEX IF NOT EXISTS idx_payment_links_lead_id ON payment_links(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_links_user_id ON payment_links(user_id) WHERE user_id IS NOT NULL;

-- Add Stripe columns if not already present (from payment_links_stripe_columns.sql)
ALTER TABLE payment_links
ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT,
ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT,
ADD COLUMN IF NOT EXISTS payment_domain TEXT;

-- Comments for documentation
COMMENT ON COLUMN payment_links.lead_id IS 'Reference to the lead this payment is for - used by webhook to update lead status';
COMMENT ON COLUMN payment_links.user_id IS 'Business owner who created this payment link';
COMMENT ON COLUMN payment_links.business_id IS 'Business reference for multi-tenant support';
