-- =============================================================================
-- SECURITY HARDENING MIGRATION - 2026-03-31
-- Fully idempotent — safe to run multiple times.
-- Every CREATE POLICY has a preceding DROP POLICY IF EXISTS.
-- Every function uses CREATE OR REPLACE.
-- Token comparisons use token::text to avoid uuid cast errors.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. DEPOSIT PORTAL CONFIG — Remove public SELECT, add safe function
-- =============================================================================

DROP POLICY IF EXISTS "Public can view deposit config" ON deposit_portal_config;

CREATE OR REPLACE FUNCTION get_public_deposit_config(p_user_id UUID)
RETURNS TABLE (
  id UUID, user_id UUID,
  default_deposit_type VARCHAR(20), default_deposit_value DECIMAL(10,2),
  min_deposit_amount DECIMAL(10,2), max_deposit_amount DECIMAL(10,2),
  portal_title VARCHAR(255), portal_subtitle TEXT,
  logo_url TEXT, accent_color VARCHAR(7),
  terms_enabled BOOLEAN, terms_text TEXT,
  success_message TEXT, success_redirect_url TEXT,
  require_id_upload BOOLEAN, require_insurance_upload BOOLEAN,
  stripe_publishable_key TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.user_id, d.default_deposit_type, d.default_deposit_value,
    d.min_deposit_amount, d.max_deposit_amount, d.portal_title, d.portal_subtitle,
    d.logo_url, d.accent_color, d.terms_enabled, d.terms_text,
    d.success_message, d.success_redirect_url,
    d.require_id_upload, d.require_insurance_upload, d.stripe_publishable_key
  FROM deposit_portal_config d WHERE d.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- 2. PAYMENT LINKS — Owner/admin policy + safe token lookup function
-- =============================================================================

DROP POLICY IF EXISTS "Public can view payment_links by token" ON payment_links;
DROP POLICY IF EXISTS "Owners can view own payment_links" ON payment_links;

CREATE POLICY "Owners can view own payment_links"
  ON payment_links FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE OR REPLACE FUNCTION get_payment_link_by_token(p_token VARCHAR)
RETURNS TABLE (
  id UUID, short_token VARCHAR(21),
  vehicle_name VARCHAR(255), start_date DATE, end_date DATE,
  daily_rate DECIMAL(10,2), total_amount DECIMAL(10,2), deposit_amount DECIMAL(10,2),
  customer_name VARCHAR(255), business_name VARCHAR(255),
  expires_at TIMESTAMPTZ, used_at TIMESTAMPTZ, stripe_publishable_key TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT pl.id, pl.short_token, pl.vehicle_name, pl.start_date, pl.end_date,
    pl.daily_rate, pl.total_amount, pl.deposit_amount,
    pl.customer_name, pl.business_name, pl.expires_at, pl.used_at, pl.stripe_publishable_key
  FROM payment_links pl
  WHERE pl.short_token = p_token AND pl.expires_at > NOW() AND pl.used_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- 3. INSPECTIONS — Token-scoped UPDATE (signature fields only) + SELECT
-- =============================================================================

DROP POLICY IF EXISTS "Public can sign inspection via token" ON inspections;
DROP POLICY IF EXISTS "Public can view inspection by token" ON inspections;

CREATE POLICY "Public can view inspection by token"
  ON inspections FOR SELECT
  USING (token::text = coalesce(current_setting('request.header.x-inspection-token', true), ''));

CREATE POLICY "Public can sign inspection via token"
  ON inspections FOR UPDATE
  USING (token::text = coalesce(current_setting('request.header.x-inspection-token', true), ''))
  WITH CHECK (
    token::text = coalesce(current_setting('request.header.x-inspection-token', true), '')
    AND user_id = (SELECT i.user_id FROM inspections i WHERE i.id = inspections.id)
    AND vehicle_id = (SELECT i.vehicle_id FROM inspections i WHERE i.id = inspections.id)
    AND booking_id IS NOT DISTINCT FROM (SELECT i.booking_id FROM inspections i WHERE i.id = inspections.id)
    AND type = (SELECT i.type FROM inspections i WHERE i.id = inspections.id)
    AND inspector_name = (SELECT i.inspector_name FROM inspections i WHERE i.id = inspections.id)
    AND customer_name = (SELECT i.customer_name FROM inspections i WHERE i.id = inspections.id)
    AND mileage = (SELECT i.mileage FROM inspections i WHERE i.id = inspections.id)
    AND fuel_level = (SELECT i.fuel_level FROM inspections i WHERE i.id = inspections.id)
    AND exterior_condition = (SELECT i.exterior_condition FROM inspections i WHERE i.id = inspections.id)
    AND interior_condition = (SELECT i.interior_condition FROM inspections i WHERE i.id = inspections.id)
    AND notes IS NOT DISTINCT FROM (SELECT i.notes FROM inspections i WHERE i.id = inspections.id)
    AND damage_notes IS NOT DISTINCT FROM (SELECT i.damage_notes FROM inspections i WHERE i.id = inspections.id)
    AND photos = (SELECT i.photos FROM inspections i WHERE i.id = inspections.id)
    AND token = (SELECT i.token FROM inspections i WHERE i.id = inspections.id)
  );


-- =============================================================================
-- 4. AGREEMENTS — Token-scoped UPDATE (signature fields only) + SELECT
-- =============================================================================

DROP POLICY IF EXISTS "Public can sign agreement via token" ON agreements;
DROP POLICY IF EXISTS "Public can view agreement by token" ON agreements;

CREATE POLICY "Public can view agreement by token"
  ON agreements FOR SELECT
  USING (token = coalesce(current_setting('request.header.x-agreement-token', true), ''));

CREATE POLICY "Public can sign agreement via token"
  ON agreements FOR UPDATE
  USING (token = coalesce(current_setting('request.header.x-agreement-token', true), ''))
  WITH CHECK (
    token = coalesce(current_setting('request.header.x-agreement-token', true), '')
    AND user_id = (SELECT a.user_id FROM agreements a WHERE a.id = agreements.id)
    AND customer_name = (SELECT a.customer_name FROM agreements a WHERE a.id = agreements.id)
    AND customer_email IS NOT DISTINCT FROM (SELECT a.customer_email FROM agreements a WHERE a.id = agreements.id)
    AND customer_phone = (SELECT a.customer_phone FROM agreements a WHERE a.id = agreements.id)
    AND vehicle_info = (SELECT a.vehicle_info FROM agreements a WHERE a.id = agreements.id)
    AND start_date = (SELECT a.start_date FROM agreements a WHERE a.id = agreements.id)
    AND end_date = (SELECT a.end_date FROM agreements a WHERE a.id = agreements.id)
    AND total_amount IS NOT DISTINCT FROM (SELECT a.total_amount FROM agreements a WHERE a.id = agreements.id)
    AND deposit_amount IS NOT DISTINCT FROM (SELECT a.deposit_amount FROM agreements a WHERE a.id = agreements.id)
    AND booking_id IS NOT DISTINCT FROM (SELECT a.booking_id FROM agreements a WHERE a.id = agreements.id)
    AND token = (SELECT a.token FROM agreements a WHERE a.id = agreements.id)
  );


-- =============================================================================
-- 5. PROFILES — Consolidate UPDATE policies, protect is_admin
-- =============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile (except admin field)" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile except admin field" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile during signup" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can update own profile except admin field" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      is_admin = (SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid())
      OR (SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid()) = true
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- =============================================================================
-- 6. CLIENT INVOICES — Admin-only SELECT
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can view client_invoice by id" ON client_invoices;
DROP POLICY IF EXISTS "Anyone can view client_invoices" ON client_invoices;
DROP POLICY IF EXISTS "Admins can view all invoices" ON client_invoices;

CREATE POLICY "Admins can view all invoices" ON client_invoices
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));


-- =============================================================================
-- 7. CUSTOM DOMAINS — Secure lookup function
-- =============================================================================

DROP POLICY IF EXISTS "Public can lookup domains" ON custom_domains;

CREATE OR REPLACE FUNCTION lookup_custom_domain(p_domain TEXT)
RETURNS TABLE (domain VARCHAR(255), user_id UUID, verified BOOLEAN) AS $$
BEGIN
  RETURN QUERY SELECT cd.domain, cd.user_id, cd.verified FROM custom_domains cd WHERE cd.domain = p_domain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- 8. ACCESS CODES — Remove public enumeration, add verify function
-- =============================================================================

DROP POLICY IF EXISTS "Allow public to verify codes" ON access_codes;

CREATE OR REPLACE FUNCTION verify_access_code(p_code VARCHAR)
RETURNS TABLE (id UUID, code VARCHAR(20), is_valid BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT ac.id, ac.code,
    (ac.is_active = true
      AND (ac.expires_at IS NULL OR ac.expires_at > NOW())
      AND (ac.max_uses IS NULL OR ac.use_count < ac.max_uses)
    ) AS is_valid
  FROM access_codes ac WHERE ac.code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- 9. CHECK_DO_NOT_RENT — Restrict to authenticated only
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_do_not_rent') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION check_do_not_rent FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION check_do_not_rent FROM anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION check_do_not_rent TO authenticated';
  END IF;
END $$;


-- =============================================================================
-- 10. BUSINESSES — Safe read functions (no stripe_secret_key)
-- =============================================================================

DROP POLICY IF EXISTS "Owners can view their business" ON businesses;
DROP POLICY IF EXISTS "Owners can view own business" ON businesses;

CREATE POLICY "Owners can view own business" ON businesses
  FOR SELECT USING (owner_user_id = auth.uid());

CREATE OR REPLACE FUNCTION get_business_safe(p_business_id UUID)
RETURNS TABLE (
  id UUID, name TEXT, slug TEXT, owner_user_id UUID,
  payment_domain TEXT, domain_status TEXT,
  stripe_publishable_key TEXT, stripe_connected BOOLEAN,
  logo_url TEXT, primary_color TEXT, secondary_color TEXT,
  phone TEXT, email TEXT, address TEXT, business_hours TEXT,
  deposit_percentage INTEGER, status TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.name, b.slug, b.owner_user_id,
    b.payment_domain, b.domain_status, b.stripe_publishable_key, b.stripe_connected,
    b.logo_url, b.primary_color, b.secondary_color,
    b.phone, b.email, b.address, b.business_hours,
    b.deposit_percentage, b.status, b.created_at, b.updated_at
  FROM businesses b
  WHERE b.id = p_business_id
    AND (b.owner_user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_business_public(p_slug TEXT)
RETURNS TABLE (
  name TEXT, slug TEXT, logo_url TEXT,
  primary_color TEXT, secondary_color TEXT,
  stripe_publishable_key TEXT, deposit_percentage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.name, b.slug, b.logo_url, b.primary_color, b.secondary_color,
    b.stripe_publishable_key, b.deposit_percentage
  FROM businesses b WHERE b.slug = p_slug AND b.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- 11. IMPERSONATION LOGS + OTP HARDENING
-- =============================================================================

CREATE TABLE IF NOT EXISTS impersonation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE impersonation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view impersonation logs" ON impersonation_logs;
CREATE POLICY "Only admins can view impersonation logs" ON impersonation_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;


COMMIT;
