-- Create deliveries table for scheduling vehicle deliveries and pickups
-- Run this migration in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,

  -- Delivery type
  type VARCHAR(20) NOT NULL CHECK (type IN ('pickup', 'delivery', 'return')),

  -- Customer info
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,

  -- Location
  address TEXT NOT NULL,
  city VARCHAR(255) NOT NULL,

  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_transit', 'completed', 'cancelled')),

  -- Driver info
  driver_name VARCHAR(255),
  driver_phone VARCHAR(50),

  -- Notes
  notes TEXT,

  -- Timestamps
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deliveries_user_id ON deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_booking_id ON deliveries(booking_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_vehicle_id ON deliveries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_scheduled_date ON deliveries(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

-- Enable RLS
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own deliveries
CREATE POLICY "Users can view own deliveries"
  ON deliveries FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create deliveries
CREATE POLICY "Users can create deliveries"
  ON deliveries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own deliveries
CREATE POLICY "Users can update own deliveries"
  ON deliveries FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own deliveries
CREATE POLICY "Users can delete own deliveries"
  ON deliveries FOR DELETE
  USING (auth.uid() = user_id);
