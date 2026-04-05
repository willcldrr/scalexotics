-- Create inspections table for vehicle condition reports
-- Run this migration in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,

  -- Inspection type
  type VARCHAR(20) NOT NULL CHECK (type IN ('pickup', 'return')),

  -- People
  inspector_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,

  -- Vehicle condition
  mileage INTEGER NOT NULL,
  fuel_level INTEGER DEFAULT 100 CHECK (fuel_level >= 0 AND fuel_level <= 100),
  exterior_condition VARCHAR(20) DEFAULT 'good' CHECK (exterior_condition IN ('excellent', 'good', 'fair', 'poor')),
  interior_condition VARCHAR(20) DEFAULT 'good' CHECK (interior_condition IN ('excellent', 'good', 'fair', 'poor')),

  -- Notes
  notes TEXT,
  damage_notes TEXT,

  -- Photos (array of URLs)
  photos TEXT[] DEFAULT '{}',

  -- Customer signature
  customer_signature TEXT,
  customer_signed_at TIMESTAMPTZ,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),

  -- Unique token for customer signing link
  token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inspections_user_id ON inspections(user_id);
CREATE INDEX IF NOT EXISTS idx_inspections_booking_id ON inspections(booking_id);
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_id ON inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inspections_token ON inspections(token);
CREATE INDEX IF NOT EXISTS idx_inspections_type ON inspections(type);

-- Enable RLS
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own inspections
CREATE POLICY "Users can view own inspections"
  ON inspections FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create inspections
CREATE POLICY "Users can create inspections"
  ON inspections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own inspections
CREATE POLICY "Users can update own inspections"
  ON inspections FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Anyone can view inspection by token (for signing)
CREATE POLICY "Public can view inspection by token"
  ON inspections FOR SELECT
  USING (true);

-- Policy: Anyone can update inspection status via token (for signing)
CREATE POLICY "Public can sign inspection via token"
  ON inspections FOR UPDATE
  USING (true)
  WITH CHECK (true);
