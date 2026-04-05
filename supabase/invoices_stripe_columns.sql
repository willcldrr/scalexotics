-- Add Stripe payment columns to invoices table
-- Run this migration in your Supabase SQL editor

-- Add Stripe checkout session ID column
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- Add Stripe payment intent ID column
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Create index for faster lookups by checkout session
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_checkout_session
ON invoices(stripe_checkout_session_id)
WHERE stripe_checkout_session_id IS NOT NULL;

-- Create index for faster lookups by payment intent
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_payment_intent
ON invoices(stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;

-- Update RLS policies to include new columns (they inherit from existing table policies)
-- No additional policy changes needed as these columns follow the same user_id ownership pattern
