-- Performance indexes for hot query paths.
--
-- Added in response to the enterprise-readiness audit finding that dashboard
-- queries on messages / bookings / leads were doing sequential scans under
-- load. Each index backs a specific query pattern observed in the codebase.
-- All are created IF NOT EXISTS so this migration is safe to re-run.

-- messages: every lead detail view fetches the full conversation ordered by
-- time. Composite (lead_id, created_at DESC) lets Postgres satisfy both the
-- filter and the ORDER BY from the index alone.
CREATE INDEX IF NOT EXISTS idx_messages_lead_created
  ON messages (lead_id, created_at DESC);

-- bookings: dashboard filters by user, then by status, then orders by date.
-- Composite (user_id, status, start_date DESC) serves the dashboard list and
-- any "upcoming bookings" widgets in one index.
CREATE INDEX IF NOT EXISTS idx_bookings_user_status_start
  ON bookings (user_id, status, start_date DESC);

-- leads: pipeline view queries by owner and status, sorted by recency.
CREATE INDEX IF NOT EXISTS idx_leads_user_status_created
  ON leads (user_id, status, created_at DESC);

-- bookings availability checks filter on end_date across all users for a
-- given user_id. A separate index helps the availability public endpoint.
CREATE INDEX IF NOT EXISTS idx_bookings_user_end_date
  ON bookings (user_id, end_date)
  WHERE status IN ('confirmed', 'pending');
