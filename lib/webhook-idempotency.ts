/**
 * Webhook idempotency helper.
 *
 * Every inbound webhook (Stripe, Twilio, Instagram) must call claimWebhookEvent
 * BEFORE running any side effect. The helper attempts to insert a row into the
 * webhook_events ledger keyed on (source, event_id). If the insert succeeds,
 * this delivery is new and the handler should proceed. If the insert fails due
 * to the UNIQUE (source, event_id) constraint, a previous delivery already
 * claimed it and the handler must short-circuit with a 200 response so the
 * provider stops retrying.
 *
 * Once the handler finishes its side effects, it should call markWebhookEventProcessed
 * so ops can tell "received but failed" apart from "received and succeeded".
 *
 * This module uses the service role client directly; it must only be imported
 * from server code.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export type WebhookSource = "stripe" | "twilio" | "instagram" | "telegram"

export interface ClaimResult {
  /** True if THIS delivery won the race and should process the event. */
  claimed: boolean
  /** The row id in webhook_events; useful for follow-up updates. */
  rowId?: string
  /**
   * When claimed === false, indicates why. Currently always "duplicate",
   * but future values may include "error" for unexpected insert failures.
   */
  reason?: "duplicate" | "error"
}

let cachedClient: SupabaseClient | null = null

function getServiceClient(): SupabaseClient {
  if (cachedClient) return cachedClient
  cachedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  return cachedClient
}

/**
 * Attempt to claim an inbound webhook event as "first delivery". Returns
 * { claimed: true, rowId } on a fresh event, { claimed: false, reason: "duplicate" }
 * on a retry the ledger has already seen.
 *
 * Callers should treat any non-claimed result as "already handled" and return
 * a 2xx response so the provider stops retrying.
 */
export async function claimWebhookEvent(
  source: WebhookSource,
  eventId: string,
  eventType?: string
): Promise<ClaimResult> {
  if (!eventId) {
    // No provider id = we cannot dedupe. Fail safe by treating as claimed and
    // log loudly so ops can investigate why an event arrived without an id.
    console.warn(`[webhook-idempotency] ${source} event arrived without event_id; cannot dedupe`)
    return { claimed: true }
  }

  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("webhook_events")
    .insert({
      source,
      event_id: eventId,
      event_type: eventType ?? null,
      status: "received",
    })
    .select("id")
    .single()

  if (!error && data) {
    return { claimed: true, rowId: data.id as string }
  }

  // Postgres unique violation = duplicate delivery. PostgREST surfaces this as
  // error.code "23505".
  if (error && (error as { code?: string }).code === "23505") {
    return { claimed: false, reason: "duplicate" }
  }

  // Any other error is unexpected. Log it and let the handler proceed — we'd
  // rather risk a rare double-process than silently drop a legitimate event.
  console.error(`[webhook-idempotency] unexpected insert error for ${source}/${eventId}:`, error)
  return { claimed: true, reason: "error" }
}

/**
 * Mark a previously-claimed event as processed. Failure here is non-fatal for
 * the webhook response — the side effects have already succeeded, this is
 * just bookkeeping.
 */
export async function markWebhookEventProcessed(
  rowId: string | undefined,
  outcome: "processed" | "failed",
  errorMessage?: string
): Promise<void> {
  if (!rowId) return
  const supabase = getServiceClient()
  await supabase
    .from("webhook_events")
    .update({
      status: outcome,
      processed_at: new Date().toISOString(),
      error: errorMessage ?? null,
    })
    .eq("id", rowId)
}
