-- Integration Requests Table
-- Tracks user requests for early access to integrations

CREATE TABLE IF NOT EXISTS integration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_integration_requests_user_id ON integration_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_requests_provider ON integration_requests(provider);

-- Enable Row Level Security
ALTER TABLE integration_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create an integration request (even unauthenticated for lead capture)
CREATE POLICY "Anyone can create integration requests"
  ON integration_requests FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own integration requests"
  ON integration_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all integration requests"
  ON integration_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
