-- Fix missing RLS policies for businesses table
-- Issue: Owners can only SELECT and INSERT, but not UPDATE or DELETE their own business

-- Drop existing policies to recreate cleanly
DROP POLICY IF EXISTS "Owners can update their business" ON businesses;
DROP POLICY IF EXISTS "Owners can delete their business" ON businesses;

-- Add UPDATE policy for business owners
CREATE POLICY "Owners can update their business" ON businesses
  FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Add DELETE policy for business owners
CREATE POLICY "Owners can delete their business" ON businesses
  FOR DELETE
  USING (owner_user_id = auth.uid());

-- Also ensure profiles table has proper INSERT policy for signup
-- (Profiles are created during auth signup via trigger, but backup policy needed)
DROP POLICY IF EXISTS "Users can insert own profile during signup" ON profiles;
CREATE POLICY "Users can insert own profile during signup" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Ensure profiles UPDATE works for users
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
