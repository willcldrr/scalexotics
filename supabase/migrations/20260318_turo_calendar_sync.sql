-- Add Turo iCal URL field to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS turo_ical_url TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_turo_sync TIMESTAMPTZ;

-- Create calendar_syncs table to track sync history and external bookings
CREATE TABLE IF NOT EXISTS calendar_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL DEFAULT 'turo', -- turo, getaround, etc.
  external_id VARCHAR(255), -- External booking ID from iCal UID
  event_summary TEXT, -- Event title from iCal
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint to prevent duplicate imports
  UNIQUE(vehicle_id, source, external_id)
);

-- Enable RLS on calendar_syncs
ALTER TABLE calendar_syncs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_syncs
DROP POLICY IF EXISTS "Users can view their own synced events" ON calendar_syncs;
CREATE POLICY "Users can view their own synced events"
  ON calendar_syncs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own synced events" ON calendar_syncs;
CREATE POLICY "Users can insert their own synced events"
  ON calendar_syncs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own synced events" ON calendar_syncs;
CREATE POLICY "Users can delete their own synced events"
  ON calendar_syncs FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_vehicle ON calendar_syncs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_dates ON calendar_syncs(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_vehicles_turo_ical ON vehicles(turo_ical_url) WHERE turo_ical_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON TABLE calendar_syncs IS 'Stores synced events from external calendars like Turo iCal feeds';
COMMENT ON COLUMN vehicles.turo_ical_url IS 'Turo iCal URL for automatic booking sync';
