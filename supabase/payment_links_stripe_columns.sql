-- Add Stripe keys to payment_links table for multi-tenant support
-- Each payment link can have its own Stripe credentials

ALTER TABLE payment_links
ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT,
ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT;

-- Add comment for documentation
COMMENT ON COLUMN payment_links.stripe_publishable_key IS 'Stripe publishable key for multi-tenant checkout';
COMMENT ON COLUMN payment_links.stripe_secret_key IS 'Stripe secret key for multi-tenant checkout (encrypted at rest by Supabase)';
