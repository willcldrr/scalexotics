-- Add company_slug column to deposit_portal_config
-- This allows users to customize their URL path when using rentalcapture.xyz

ALTER TABLE deposit_portal_config
ADD COLUMN IF NOT EXISTS company_slug VARCHAR(100);

-- Add unique constraint to prevent duplicate slugs
CREATE UNIQUE INDEX IF NOT EXISTS idx_deposit_portal_company_slug
ON deposit_portal_config(company_slug)
WHERE company_slug IS NOT NULL;

-- Add company_slug column to payment_links for link tracking
ALTER TABLE payment_links
ADD COLUMN IF NOT EXISTS company_slug VARCHAR(100);

-- Add index for looking up payment links by slug
CREATE INDEX IF NOT EXISTS idx_payment_links_company_slug
ON payment_links(company_slug)
WHERE company_slug IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN deposit_portal_config.company_slug IS 'URL slug for default domain (e.g., rentalcapture.xyz/{slug}/checkout/{token})';
COMMENT ON COLUMN payment_links.company_slug IS 'Company slug stored with payment link for URL reconstruction';
