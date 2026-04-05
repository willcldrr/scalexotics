-- Add Stripe payment columns to bookings table
-- Run this migration in your Supabase SQL editor

-- Add Stripe checkout session ID column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- Add Stripe payment intent ID column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Create index for faster lookups by checkout session
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_checkout_session
ON bookings(stripe_checkout_session_id)
WHERE stripe_checkout_session_id IS NOT NULL;

-- Create index for faster lookups by payment intent
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent
ON bookings(stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;
