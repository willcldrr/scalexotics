-- HOW TO APPLY: review, then `supabase db push` or paste into SQL editor.
-- Prevents two confirmed/pending bookings from overlapping on the same vehicle.
-- Uses btree_gist so we can combine a scalar (vehicle_id) and a range (dates)
-- in one EXCLUDE constraint.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Drop any prior partial index that conflicts (idempotent — only if a previous
-- half-applied attempt left one behind). Safe no-op otherwise.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_vehicle_overlap'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_no_vehicle_overlap;
  END IF;
END$$;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_vehicle_overlap
  EXCLUDE USING gist (
    vehicle_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'rejected'));

-- Application code should catch SQLSTATE 23P01 (exclusion_violation) and
-- surface a 409 "vehicle already booked for those dates" to the user.
COMMENT ON CONSTRAINT bookings_no_vehicle_overlap ON bookings IS
  'LB-5a: prevents double-booking of the same vehicle. Catch 23P01 in app code.';
