-- Security Fixes for Scale Exotics Admin Dashboard
-- Run these in your Supabase SQL Editor
-- IMPORTANT: Run these in order

-- ============================================
-- FIX 1: Protect profiles.is_admin field
-- ============================================

-- First, drop any existing permissive update policies on profiles
-- (Run SELECT * FROM pg_policies WHERE tablename = 'profiles' to see existing policies)

-- Create a restrictive update policy that prevents users from modifying is_admin
-- This assumes there's already a policy allowing users to update their own profile
-- We need to modify it to exclude is_admin

-- Option A: If you have a simple "users can update own profile" policy, replace it with:
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile (except admin field)" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent changing is_admin unless you're already an admin
    AND (
      is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())
      OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
    )
  );

-- ============================================
-- FIX 2: Restrict access_codes to admins only
-- ============================================

-- Drop the vulnerable policy
DROP POLICY IF EXISTS "Allow authenticated to manage codes" ON access_codes;

-- Create admin-only management policy
CREATE POLICY "Only admins can manage access codes" ON access_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Keep the public verification policy (needed for users to verify codes)
-- This only allows reading active codes, not modifying them

-- ============================================
-- FIX 3: Restrict client_invoices read access
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view client_invoice by id" ON client_invoices;

-- Create admin-only read policy
-- NOTE: Public invoice viewing for payments is handled by
-- /app/api/invoices/[id]/route.ts using service role key
-- This is more secure as it:
-- 1. Only exposes specific fields (not notes, stripe IDs, etc.)
-- 2. Validates UUID format
-- 3. Doesn't allow listing all invoices, only lookup by specific ID
CREATE POLICY "Admins can view all invoices" ON client_invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- FIX 4: Add RLS to custom_domains for admin viewing
-- ============================================

-- Allow admins to view all domains (for admin management)
CREATE POLICY "Admins can view all domains" ON custom_domains
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow admins to manage all domains
CREATE POLICY "Admins can manage all domains" ON custom_domains
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify the fixes are in place:

-- Check all policies on profiles table
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check all policies on access_codes table
-- SELECT * FROM pg_policies WHERE tablename = 'access_codes';

-- Check all policies on client_invoices table
-- SELECT * FROM pg_policies WHERE tablename = 'client_invoices';

-- Test as a non-admin user (should fail):
-- SELECT * FROM access_codes; -- Should return empty or error
-- UPDATE profiles SET is_admin = true WHERE id = auth.uid(); -- Should fail
