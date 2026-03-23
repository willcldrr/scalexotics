-- Data Deletion Requests Table
-- Stores user requests to delete their data (CCPA/GDPR compliance)

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deletion_type TEXT NOT NULL CHECK (deletion_type IN ('account', 'instagram', 'leads', 'messages', 'all')),
  additional_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookup by email and status
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_email ON data_deletion_requests(email);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);

-- RLS policies
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Only admins can view deletion requests
CREATE POLICY "Admins can view all deletion requests"
  ON data_deletion_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Anyone can insert a deletion request (public endpoint)
CREATE POLICY "Anyone can create deletion requests"
  ON data_deletion_requests FOR INSERT
  WITH CHECK (true);

-- Only admins can update deletion requests
CREATE POLICY "Admins can update deletion requests"
  ON data_deletion_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Add deletion_requested_at column to instagram_connections if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instagram_connections'
    AND column_name = 'deletion_requested_at'
  ) THEN
    ALTER TABLE instagram_connections ADD COLUMN deletion_requested_at TIMESTAMPTZ;
  END IF;
END $$;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_data_deletion_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS data_deletion_requests_updated_at ON data_deletion_requests;
CREATE TRIGGER data_deletion_requests_updated_at
  BEFORE UPDATE ON data_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_data_deletion_requests_updated_at();

COMMENT ON TABLE data_deletion_requests IS 'Stores user requests to delete their personal data per CCPA/GDPR requirements';
