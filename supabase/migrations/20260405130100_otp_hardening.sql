-- LB-11: OTP brute-force hardening.
--
-- Adds `locked_at` to `otp_codes` so verify-otp / reset-password routes can
-- hard-lock a code row once failed_attempts crosses the threshold.
-- `failed_attempts` already exists (added by 20260331_impersonation_logs.sql
-- and 20260331_security_hardening.sql) but is re-declared here with
-- IF NOT EXISTS for safety across environments that might have skipped one
-- of those files.
--
-- HOW TO APPLY: `supabase db push` once reviewed. Idempotent.

ALTER TABLE otp_codes
  ADD COLUMN IF NOT EXISTS failed_attempts integer NOT NULL DEFAULT 0;

ALTER TABLE otp_codes
  ADD COLUMN IF NOT EXISTS locked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_otp_codes_email_latest
  ON otp_codes (email, created_at DESC)
  WHERE used = false;
