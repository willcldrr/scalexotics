-- Do Not Rent List table
-- Stores information about individuals who are banned from renting

CREATE TABLE IF NOT EXISTS do_not_rent_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  expiration_date DATE,
  issuing_state TEXT,
  id_number TEXT,
  phone TEXT,
  email TEXT,
  reason TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_do_not_rent_full_name ON do_not_rent_list(LOWER(full_name));
CREATE INDEX IF NOT EXISTS idx_do_not_rent_phone ON do_not_rent_list(phone);
CREATE INDEX IF NOT EXISTS idx_do_not_rent_email ON do_not_rent_list(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_do_not_rent_dob ON do_not_rent_list(date_of_birth);

-- Enable RLS
ALTER TABLE do_not_rent_list ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admins can manage do_not_rent_list" ON do_not_rent_list
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Function to check if a name/phone matches the do not rent list
CREATE OR REPLACE FUNCTION check_do_not_rent(
  check_name TEXT DEFAULT NULL,
  check_phone TEXT DEFAULT NULL,
  check_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  date_of_birth DATE,
  reason TEXT,
  match_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.full_name,
    d.date_of_birth,
    d.reason,
    CASE
      WHEN check_name IS NOT NULL AND LOWER(d.full_name) = LOWER(check_name) THEN 'exact_name'
      WHEN check_name IS NOT NULL AND LOWER(d.full_name) LIKE '%' || LOWER(check_name) || '%' THEN 'partial_name'
      WHEN check_phone IS NOT NULL AND d.phone = check_phone THEN 'phone'
      WHEN check_email IS NOT NULL AND LOWER(d.email) = LOWER(check_email) THEN 'email'
      ELSE 'unknown'
    END as match_type
  FROM do_not_rent_list d
  WHERE
    (check_name IS NOT NULL AND (
      LOWER(d.full_name) = LOWER(check_name) OR
      LOWER(d.full_name) LIKE '%' || LOWER(check_name) || '%' OR
      LOWER(check_name) LIKE '%' || LOWER(d.full_name) || '%'
    ))
    OR (check_phone IS NOT NULL AND d.phone = check_phone)
    OR (check_email IS NOT NULL AND LOWER(d.email) = LOWER(check_email));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
