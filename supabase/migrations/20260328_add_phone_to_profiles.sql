-- Add phone column to profiles table for phone number validation during signup

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add index for phone lookups (optional but useful)
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON profiles (phone) WHERE phone IS NOT NULL;
