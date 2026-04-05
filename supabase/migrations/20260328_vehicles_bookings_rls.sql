-- RLS policies for vehicles table
-- Enables users to manage their own vehicles

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can view all vehicles" ON vehicles;

-- Users can view their own vehicles
CREATE POLICY "Users can view own vehicles" ON vehicles
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own vehicles
CREATE POLICY "Users can insert own vehicles" ON vehicles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own vehicles
CREATE POLICY "Users can update own vehicles" ON vehicles
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Users can delete their own vehicles
CREATE POLICY "Users can delete own vehicles" ON vehicles
  FOR DELETE USING (user_id = auth.uid());

-- Admins can view all vehicles
CREATE POLICY "Admins can view all vehicles" ON vehicles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );


-- RLS policies for bookings table
-- Enables users to manage their own bookings

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own bookings
CREATE POLICY "Users can insert own bookings" ON bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Users can delete their own bookings
CREATE POLICY "Users can delete own bookings" ON bookings
  FOR DELETE USING (user_id = auth.uid());

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
