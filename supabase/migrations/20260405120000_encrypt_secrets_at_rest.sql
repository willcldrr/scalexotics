-- HOW TO APPLY: review, then `supabase db push` or paste into SQL editor.
-- Adds encrypted_* columns alongside existing plaintext columns.
-- Plaintext columns are intentionally NOT dropped here — a follow-up
-- migration after a verified backfill will remove them.
--
-- Part of LB-6: encrypt per-tenant secrets at rest. Application code
-- (see lib/crypto.ts) writes AES-256-GCM ciphertext + IV + auth tag into
-- the three columns per secret, and dual-reads plaintext while the
-- backfill runs. After backfill verification, a later migration will:
--   1. drop the plaintext columns
--   2. enforce NOT NULL on the encrypted trios where applicable

-- Per-tenant Stripe secret keys stored on businesses
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS encrypted_stripe_secret_key TEXT,
  ADD COLUMN IF NOT EXISTS stripe_secret_key_iv TEXT,
  ADD COLUMN IF NOT EXISTS stripe_secret_key_tag TEXT;

-- Per-tenant Stripe secret keys stored on deposit_portal_config
ALTER TABLE deposit_portal_config
  ADD COLUMN IF NOT EXISTS encrypted_stripe_secret_key TEXT,
  ADD COLUMN IF NOT EXISTS stripe_secret_key_iv TEXT,
  ADD COLUMN IF NOT EXISTS stripe_secret_key_tag TEXT;

-- Long-lived Meta page access tokens on instagram_connections
ALTER TABLE instagram_connections
  ADD COLUMN IF NOT EXISTS encrypted_access_token TEXT,
  ADD COLUMN IF NOT EXISTS access_token_iv TEXT,
  ADD COLUMN IF NOT EXISTS access_token_tag TEXT;

-- SHA-256 hash column for widget api_keys. The plaintext `key` column
-- remains populated during dual-write cutover; a later migration will
-- drop it.
ALTER TABLE api_keys
  ADD COLUMN IF NOT EXISTS key_hash TEXT;

CREATE INDEX IF NOT EXISTS api_keys_key_hash_idx ON api_keys (key_hash);
