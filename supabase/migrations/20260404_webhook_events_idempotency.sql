-- Webhook idempotency ledger.
--
-- Every inbound webhook (Stripe events, Twilio inbound SMS, Instagram events)
-- inserts a row here keyed on (source, event_id). The UNIQUE constraint makes
-- a second delivery of the same event fail the insert, at which point the
-- handler short-circuits and returns 200 without re-running side effects.
--
-- This is the single source of truth for "have we processed this yet?" and
-- replaces any ad-hoc dedupe scattered across route handlers.

CREATE TABLE IF NOT EXISTS webhook_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source       text NOT NULL,            -- 'stripe', 'twilio', 'instagram', ...
  event_id     text NOT NULL,            -- provider-supplied unique id
  event_type   text,                     -- e.g. 'checkout.session.completed'
  received_at  timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,              -- set when handler finishes successfully
  status       text NOT NULL DEFAULT 'received'
               CHECK (status IN ('received', 'processed', 'failed')),
  error        text,
  CONSTRAINT webhook_events_source_event_id_key UNIQUE (source, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at
  ON webhook_events (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_source_type
  ON webhook_events (source, event_type);

-- RLS: webhook_events is written only by service role code. No client should
-- ever read or write it, so enable RLS with no policies (deny by default).
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE webhook_events IS
  'Idempotency ledger for inbound webhooks. UNIQUE (source, event_id) prevents double-processing of provider retries.';
