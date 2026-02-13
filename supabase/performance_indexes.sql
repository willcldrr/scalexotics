-- Performance Indexes for Dashboard Speed Optimization
-- Run this in Supabase SQL Editor to significantly improve query performance

-- ============================================
-- MESSAGES TABLE INDEXES
-- ============================================
-- Critical for leads page - fetches last message per lead
CREATE INDEX IF NOT EXISTS idx_messages_lead_id_created_at
ON messages(lead_id, created_at DESC);

-- ============================================
-- BOOKINGS TABLE INDEXES
-- ============================================
-- Critical for customers page - fetches bookings by customer phone
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone
ON bookings(customer_phone);

-- For filtering bookings by status
CREATE INDEX IF NOT EXISTS idx_bookings_user_id_status
ON bookings(user_id, status);

-- For vehicle performance queries
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id
ON bookings(vehicle_id);

-- For date range queries on bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user_id_created_at
ON bookings(user_id, created_at DESC);

-- ============================================
-- LEADS TABLE INDEXES
-- ============================================
-- For filtering and sorting leads
CREATE INDEX IF NOT EXISTS idx_leads_user_id_created_at
ON leads(user_id, created_at DESC);

-- For filtering by status
CREATE INDEX IF NOT EXISTS idx_leads_user_id_status
ON leads(user_id, status);

-- ============================================
-- VEHICLES TABLE INDEXES
-- ============================================
-- For vehicle lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id
ON vehicles(user_id);

-- ============================================
-- VERIFY INDEXES WERE CREATED
-- ============================================
-- Run this to see all indexes:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
