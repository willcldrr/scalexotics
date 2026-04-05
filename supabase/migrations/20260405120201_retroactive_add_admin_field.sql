-- Retroactively added to migration pipeline from ad-hoc SQL.
-- Original path: supabase/add_admin_field.sql
-- NOTE: if this DDL has already been applied to production by hand, the
--       new pipeline apply will no-op (IF NOT EXISTS) or fail loudly on
--       re-apply. Review before running.

-- Add is_admin field to profiles
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Set yourself as admin (replace with your user ID or email)
-- Option 1: By email
UPDATE profiles SET is_admin = TRUE WHERE email = 'YOUR_EMAIL_HERE';

-- Option 2: By user ID
-- UPDATE profiles SET is_admin = TRUE WHERE id = 'your-user-uuid-here';
