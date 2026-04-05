-- LB-2: Generic audit_logs table for security-sensitive actions.
--
-- `impersonation_logs` already exists with a schema tightly scoped to
-- admin→user impersonation (admin_id/target_user_id columns). That shape
-- doesn't fit a generalised `action`-keyed audit trail, so we create a
-- dedicated table here. Impersonation writes continue to go to
-- `impersonation_logs`; all other security actions (starting with
-- session_restore) write to this table.
--
-- HOW TO APPLY: `supabase db push` once reviewed, or run this SQL against
-- the target project via the SQL editor. Idempotent.

CREATE TABLE IF NOT EXISTS audit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action     text NOT NULL,
  actor_id   uuid,
  target_id  uuid,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created
  ON audit_logs (action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created
  ON audit_logs (actor_id, created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins may read audit logs; writes are service-role only.
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
