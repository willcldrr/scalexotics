-- Fix profiles RLS to allow admins to view all profiles
-- Run this in your Supabase SQL Editor

-- First, check if profiles has RLS enabled
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles';

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing select policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow admins to view ALL profiles (required for admin dashboard)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS admin_check
      WHERE admin_check.id = auth.uid()
      AND admin_check.is_admin = true
    )
  );

-- Allow users to insert their own profile (needed for signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to update any profile (for toggling is_admin, etc.)
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS admin_check
      WHERE admin_check.id = auth.uid()
      AND admin_check.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles AS admin_check
      WHERE admin_check.id = auth.uid()
      AND admin_check.is_admin = true
    )
  );

-- Allow admins to delete profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS admin_check
      WHERE admin_check.id = auth.uid()
      AND admin_check.is_admin = true
    )
  );

-- Verify the policies are in place
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
