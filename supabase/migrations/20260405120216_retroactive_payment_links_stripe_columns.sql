-- Retroactively added to migration pipeline from ad-hoc SQL.
-- Original path: supabase/payment_links_stripe_columns.sql
-- NOTE: if this DDL has already been applied to production by hand, the
--       new pipeline apply will no-op (IF NOT EXISTS) or fail loudly on
--       re-apply. Review before running.

-- Add Stripe keys and custom domain to payment_links table for multi-tenant support
-- Each payment link can have its own Stripe credentials and domain

ALTER TABLE payment_links
ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT,
ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT,
ADD COLUMN IF NOT EXISTS payment_domain TEXT;

-- Add comment for documentation
COMMENT ON COLUMN payment_links.stripe_publishable_key IS 'Stripe publishable key for multi-tenant checkout';
COMMENT ON COLUMN payment_links.stripe_secret_key IS 'Stripe secret key for multi-tenant checkout (encrypted at rest by Supabase)';
COMMENT ON COLUMN payment_links.payment_domain IS 'Custom domain for payment links (e.g., exoticrentals.com). Defaults to rentalcapture.xyz if null';
