-- Add ai_disabled flag to leads table
-- When a business owner manually sends a message, AI auto-responses are disabled for that lead
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_disabled BOOLEAN DEFAULT false;
