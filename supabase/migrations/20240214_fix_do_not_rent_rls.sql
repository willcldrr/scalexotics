-- Fix RLS policy for do_not_rent_list to allow inserts
-- The original policy only had USING which doesn't cover INSERT operations

-- Drop the old policy
DROP POLICY IF EXISTS "Admins can manage do_not_rent_list" ON do_not_rent_list;

-- Create a new policy with both USING (for SELECT/UPDATE/DELETE) and WITH CHECK (for INSERT/UPDATE)
CREATE POLICY "Admins can manage do_not_rent_list" ON do_not_rent_list
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Alternative: Create a simpler policy that allows all authenticated users to manage the list
-- Uncomment below if admin check is causing issues

-- DROP POLICY IF EXISTS "Admins can manage do_not_rent_list" ON do_not_rent_list;
-- CREATE POLICY "Authenticated users can manage do_not_rent_list" ON do_not_rent_list
--   FOR ALL
--   USING (auth.uid() IS NOT NULL)
--   WITH CHECK (auth.uid() IS NOT NULL);
