# Reliability & Error-Handling Audit — Velocity Labs

Auditor: Reliability & Error-Handling Lead
Scope: webhooks, booking/payment path, external integrations, DB atomicity, retries, timeouts, idempotency, data validation.
Methodology: read-only review of `app/api/**`, `lib/**`, `supabase/migrations/**`. Dynamic behaviour not exercised.

Severity legend:
- 🔴 Critical — data-integrity or revenue loss risk, or cascades under partial outage
- 🟠 High — reliability hole that will bite under normal incident conditions
- 🟡 Medium — degraded UX / operational blind spot
- 🟢 Low — polish / defence in depth

---

## 🔴 R-1. Two Stripe webhook endpoints race on the same event, with divergent idempotency ledgers

**Files:** `app/api/stripe-webhook/route.ts:41`, `app/api/payments/webhook/route.ts:116`

Both routes are registered for Stripe webhooks (both call `stripe.webhooks.constructEvent` and both call `claimWebhookEvent("stripe", event.id, …)`), and both react to `checkout.session.completed`. `stripe-webhook/route.ts` handles `source === "booking_deposit"` / `source === "dashboard_invoices"` / legacy `client_invoices`. `payments/webhook/route.ts` handles the Instagram+phone checkout flow by creating a fresh `bookings` row and sending AI confirmation SMS/DM.

The idempotency ledger is keyed on `(source, event_id)`. If Stripe is configured to deliver the same event to both endpoints (the only way both halves of the logic run today), whichever endpoint claims first wins and the other short-circuits silently — so in production *exactly one of the two handlers runs per event*. Which one depends on network timing. Concretely:
- A legitimate `booking_deposit` event that gets claimed by `payments/webhook` first → we fall through because `metadata.vehicle_id/start_date/end_date` may not be the same shape, we create a **second** booking row with `stripe_session_id` pointing at the same session, and the original booking is never marked `deposit_paid`.
- An Instagram-flow event that gets claimed by `stripe-webhook` first → we look up `booking.deposit_amount` by an ID that doesn't exist and silently return 200 (`if (booking)` guard at `stripe-webhook/route.ts:62`), so the booking row is never created and the customer is never texted.

**Evidence:** both files import and call `claimWebhookEvent("stripe", event.id, …)`; there is no per-route namespacing. Double-registration is the only configuration that makes both endpoints useful; single-registration means one entire branch of business logic is dead.

**Fix:** collapse to a single Stripe webhook route that dispatches on `metadata.source`, or namespace the ledger claim as `("stripe:bookings", event.id)` vs `("stripe:payments", event.id)` and confirm Stripe is actually sending to both URLs. Add an integration test that fires each metadata shape.

---

## 🔴 R-2. Instagram webhook has no idempotency claim; Meta retries double-post replies and double-create leads

**File:** `app/api/instagram/webhook/route.ts:111-142`

The handler verifies the signature, responds 200 immediately, and fires `processInstagramMessage(body)` in the background via a dangling `.catch(() => {})`. `claimWebhookEvent` is never called. Meta retries on non-2xx *and* on timeout; because the work is detached from the response, an upstream hiccup causes Meta to redeliver while the original background task is still running. `processInstagramMessage` then:
- calls `findOrCreateInstagramLead` twice in parallel → duplicate lead rows (no unique constraint on `(user_id, instagram_user_id)` enforced at app layer here — a race),
- calls `saveMessage` twice → duplicate inbound `messages` rows,
- calls `generateAIResponse` twice → 2× Anthropic cost,
- calls `sendInstagramMessage` twice → customer sees duplicate replies.

Additionally, the background promise is orphaned with `.catch((error) => { console.error(...) })` at `route.ts:131` — unhandled rejections inside that chain (e.g. `parseInstagramWebhook` throwing on a malformed payload) are swallowed with no Sentry hook.

**Fix:** call `claimWebhookEvent("instagram", message.messageId, "dm.inbound")` (the `mid` from the parsed payload is globally unique for Instagram messaging) at the top of `processInstagramMessage`, and short-circuit on `!claimed`. Forward the background promise to `Sentry.captureException` on rejection, or await it before returning — `processInstagramMessage` is 5–20s of work and detaching it is what originally motivated the skip, so idempotency is the right fix, not awaiting.

---

## 🔴 R-3. Telegram webhook has no idempotency and no secret backfill fallback

**File:** `app/api/telegram/webhook/route.ts:77-144`

No `claimWebhookEvent` call. Telegram's `update_id` is monotonically increasing and unique per bot, so dedupe is trivial to add; without it, Telegram's retry-on-timeout behaviour causes duplicate AI actions. `processMessage` at `lib/telegram-bot-ai.ts:467` invokes tool-calling that mutates data (`update_vehicle_status`, `create_booking` at `lib/telegram-bot-ai.ts:249`). A duplicate delivery can:
- create the same booking twice (no conflict check in `create_booking` either — see R-4),
- flip a vehicle status twice,
- double-charge Anthropic tokens.

**Fix:** at the top of `POST`, after verifying the secret, call `claimWebhookEvent("telegram", String(update.update_id), update.message ? "message" : "other")`. `webhook-idempotency.ts` already has `"telegram"` in its `WebhookSource` union but nothing uses it.

---

## 🔴 R-4. Concurrent booking of the same vehicle is not prevented at the database layer

**Files:**
- `app/api/payments/create-checkout/route.ts:97-111` (conflict check in app)
- `lib/telegram-bot-ai.ts:249-303` (no conflict check at all)
- `app/api/payments/webhook/route.ts:219` (webhook creates booking blind)
- `supabase/migrations/*` — no `EXCLUDE USING gist` / `tstzrange` constraint on `bookings(vehicle_id, [start_date,end_date])` (grep confirmed: zero migrations mention `EXCLUDE`, `tsrange`, or an overlap check)

The check in `create-checkout` queries `bookings` and then creates a Stripe session; a second request arriving between the SELECT and any subsequent INSERT wins the same slot. The Stripe webhook at `payments/webhook/route.ts:219` then inserts bookings with no conflict check at all — whatever the customer paid for, we create. The Telegram `create_booking` tool inserts bookings with no availability check whatsoever (`lib/telegram-bot-ai.ts:278`). Two concurrent Telegram messages, or a Telegram booking racing a checkout payment, will happily create overlapping confirmed bookings on the same vehicle.

**Fix:** add a Postgres exclusion constraint:
```sql
ALTER TABLE bookings ADD CONSTRAINT no_vehicle_overlap
EXCLUDE USING gist (
  vehicle_id WITH =,
  daterange(start_date, end_date, '[]') WITH &&
) WHERE (status IN ('confirmed','pending'));
```
and have every insert path handle the `23P01` exclusion violation by returning a 409 / user-facing "already booked" message. This closes both the app-race and the cross-path race.

---

## 🔴 R-5. Stripe webhook "multi-step mutation" assumes atomicity it does not have

**File:** `app/api/payments/webhook/route.ts:207-322`

Inside one handler we:
1. `update leads` → `status: 'booked'`, notes (line 209)
2. `insert bookings` (line 219)
3. `insert messages` outbound confirmation (line 315)
4. `update leads` → `status: 'new'` (elsewhere via sms-ai if this re-triggers)

Supabase-js has no multi-statement transactions. If step 2 fails (e.g. RLS, unique key violation once R-4 is fixed, timeout), step 1 has already run and the lead is marked `booked` with no backing booking row. If step 3 fails after step 2 succeeds the customer gets charged but receives no SMS and the CRM shows no confirmation message. There is no compensating rollback. `stripe-webhook/route.ts:71-91` has the same shape (booking update + lead update).

**Fix:** move the multi-step mutation to a Postgres function (`supabase.rpc("confirm_booking_and_lead", {...})`) so it runs in one transaction. At minimum, reverse the order — do the booking insert first, then the lead status update, so a failure leaves the lead in a state that ops can re-trigger on.

---

## 🔴 R-6. `lib/ical-parser.ts` `fetchAndParseIcal` has no timeout; cron can hang a whole run on one dead feed

**File:** `lib/ical-parser.ts:129-142`, called from `app/api/cron/calendar-sync/route.ts:59`

Raw `fetch(url, { headers })` with no `AbortSignal.timeout`. Turo's iCal export is an anonymous user-supplied URL — a malicious, slow-loris, or just overloaded endpoint will keep the fetch pending until the serverless function hits its hard timeout. Because `calendar-sync/route.ts` iterates vehicles sequentially (`for (const vehicle of vehicles)`), one stalled feed starves every vehicle behind it in the list.

**Fix:** replace with `safeFetch(url, { timeoutMs: 15_000, headers })`. `safe-fetch.ts` already exists for this. Also wrap in `Promise.allSettled` so one failing feed does not kill the whole run.

---

## 🟠 R-7. Raw `fetch` without timeout across Instagram/Telegram/domain/OAuth routes

**Files with raw `fetch(` and no `safeFetch`:**
- `app/api/telegram/webhook/route.ts:55` (`sendTelegramMessage` → api.telegram.org)
- `app/api/instagram/callback/route.ts:68,89,111,137,149`
- `app/api/instagram/connect-manual/route.ts:42,68,92,113,151,168`
- `app/api/instagram/status/route.ts:41`
- `app/api/instagram/debug/route.ts:38,59`
- `app/api/cron/refresh-instagram-tokens/route.ts:58`
- `app/api/domain/verify/route.ts:36,78,110`
- `app/api/domain/add/route.ts:46`
- `app/api/admin/domains/route.ts:129,219`
- `app/api/admin/crm/oauth/google/callback/route.ts:75,101`
- `lib/crm/google-calendar.ts:70,142`

Any stall in Facebook Graph, Vercel API, Google OAuth, or Telegram Bot API will consume the full function budget. Node 20 `fetch` has no default request timeout.

**Fix:** replace each with `safeFetch` (already imported in `lib/instagram.ts` — precedent exists). Set `timeoutMs` per call path: 10s for hot webhooks, 30s for OAuth exchanges.

---

## 🟠 R-8. `app/api/auth/signup` — Resend email send is un-try/caught; user created but stuck

**File:** `app/api/auth/signup/route.ts:103-132`

`sendOtpEmail` is called with no `try/catch`. If Resend throws (rate limit, invalid API key, upstream 5xx), the outer catch at line 106 returns 500 to the client, but the user and OTP row have already been created. The next signup attempt returns "Verification code sent" (the "already exists" branch at line 60) without actually resending, leaving the account permanently unverifiable from that UX.

`sendOtpEmail` also has no retry, no timeout, no bounce handling, and hardcodes the Resend client at module load (`new Resend(process.env.RESEND_API_KEY)` at line 7) — a missing env var crashes at import instead of returning a clean error.

**Fix:** wrap `sendOtpEmail` in try/catch; on failure, delete the just-inserted OTP row and return 503 "please retry" to the client; retry Resend up to 2× with backoff. Lazy-init the Resend client.

---

## 🟠 R-9. Webhook handlers return 200 with `{ received: true }` on internal errors, masking failures from Stripe retry

**Files:**
- `app/api/stripe-webhook/route.ts:67,82-84,111,126-128,159-161,168`
- `app/api/payments/webhook/route.ts:130,146,194,204,241,294,325,335`

Pattern: after a failing Supabase write or unexpected state, the handler logs `console.error(...)` and returns `NextResponse.json({ received: true })`, which tells Stripe "processed successfully, stop retrying". For transient Supabase errors (network blip, pgbouncer hiccup) this permanently drops the event — Stripe will not redeliver. `markWebhookEventProcessed(..., "processed")` then runs at the bottom, ledgering it as successful. The only signal is a console.error that is not sent to Sentry (grep: zero `Sentry.captureException` calls in `app/`).

**Fix:** on recoverable errors (Supabase network failures, 5xx from downstream), return `500` so Stripe retries, and call `markWebhookEventProcessed(..., "failed", errorMessage)`. Only return 200 for terminal states (amount mismatch, unknown metadata). Add `Sentry.captureException(err)` in each catch.

---

## 🟠 R-10. `create-checkout` race: availability check then Stripe call then `claimPaymentLinkForCheckout` is not atomic

**File:** `app/api/checkout/create/route.ts:97-158`

The flow is:
1. Parse token
2. Look up payment data
3. Create Stripe session
4. Claim the payment link (`claimPaymentLinkForCheckout(token, session.id)`)

If two browser tabs POST the same token concurrently, both create Stripe sessions and only one claims. The losing tab returns a generic "already used" error, but its Stripe session is orphaned (no charge, but clutters the dashboard and may still be paid via raw session URL outside the app flow, giving a customer a way to pay against an already-used link).

**Fix:** claim the link *before* creating the Stripe session. If the claim fails, return early. If Stripe session creation fails afterwards, `UPDATE payment_links SET used_at = NULL, stripe_session_id = NULL WHERE id = ?` (compensating rollback).

---

## 🟠 R-11. No retry-with-backoff or circuit breaker on Twilio, Resend, Supabase, Instagram Graph, Telegram Bot API

**Evidence:** grep for `retry`, `backoff`, `CircuitBreaker`:
- `lib/anthropic.ts` sets `maxRetries: 2` via the SDK option (good, the only provider that does)
- `lib/sms-ai.ts:608-636` has hand-rolled 3× retry on payment-link internal HTTP (good but scoped to one call)
- Twilio: no retry anywhere. `twilioClient.messages.create` is called raw in 6 places (`app/api/payments/webhook/route.ts:304`, `app/api/leads/capture/route.ts:264`, `app/api/sms/webhook/route.ts:156`, `app/api/sms/send/route.ts:55`, `app/api/sms/bulk/route.ts`, `app/api/sms/test/route.ts`). A Twilio 5xx during an SMS webhook response path aborts the whole request.
- Resend: no retry (`app/api/auth/signup/route.ts:116`, `app/api/auth/forgot-password/route.ts`, `app/api/auth/resend-otp/route.ts`, `app/api/admin/users/reset-password/route.ts`).
- Instagram Graph: no retry in `lib/instagram.ts`.
- Supabase: no retry on any call — a transient 502 from PostgREST surfaces as a silent `{ data: null, error }` which most callers treat as "not found".
- **No circuit breaker anywhere.** A sustained Twilio or Anthropic outage will stall every inbound SMS/DM until provider recovers; there's no fallback or fast-fail to "we'll get back to you".

**Fix:** add a tiny `withRetry(fn, { attempts: 3, baseDelayMs: 250, retryOn: (e) => e.status >= 500 || e.code === 'ETIMEDOUT' })` helper next to `safe-fetch.ts` and wrap all external SDK calls. For circuit breaking, a simple in-memory state (per-provider failure-count within 60s window) that short-circuits to a fallback message is enough for single-region deploys.

---

## 🟠 R-12. Graceful degradation is missing for AI-down path on the payment confirmation send

**File:** `app/api/payments/webhook/route.ts:247-326`

Post-payment confirmation flow calls `generateDepositConfirmationResponse` → Anthropic. The function has a try/catch and returns a hard-coded fallback (line 81), which is good. But the surrounding flow then calls Twilio/Instagram, and if *those* fail (line 290-311) the confirmation is silently dropped — the customer's money is taken, a booking is created, and they never hear back. There is no queued retry, no "failed confirmation" flag on the booking row, no alert.

**Fix:** when the confirmation send fails, write a row to a `pending_notifications` table (or set `booking.confirmation_sent_at = null`) and retry from a cron. Emit a Sentry event so ops sees the failure immediately.

---

## 🟠 R-13. `lib/sms-ai.ts` silently downgrades to a fallback on AI failure but leaves lead state inconsistent

**File:** `lib/sms-ai.ts:195-212`

On Anthropic failure: lead status is updated to `"followup"` and a hard-coded fallback message is returned. The caller then `saveMessage` the fallback and sends it via Twilio. But because the AI call failed, no data extraction runs, no `[SEND_PAYMENT_LINK]` handling runs, and the lead is never advanced — yet `status` has already been set to `followup`, overwriting whatever state the lead was in (e.g. `qualified`). For a lead that was one message away from `[SEND_PAYMENT_LINK]`, a single Anthropic hiccup reverts their status and leaves the business owner to chase manually.

**Fix:** don't overwrite status on AI failure — just notify the owner via a separate `ai_failures` table or Slack hook. Preserve the lead's prior state.

---

## 🟠 R-14. `findOrCreateLead` / `findOrCreateInstagramLead` have no unique constraint to back the "find or create" contract

**Files:** `lib/sms-ai.ts:644-678`, `lib/instagram-leads.ts` (by reference from `app/api/instagram/webhook/route.ts:190`)

Pattern: `SELECT` by phone/instagram_user_id, if not found `INSERT`. Two concurrent SMS messages from the same number (or, much more common per R-2, two concurrent Instagram deliveries of the same webhook) produce two SELECTs that both miss, two INSERTs that both succeed, two lead rows for the same customer. No unique constraint on `(user_id, phone)` or `(user_id, instagram_user_id)` — confirmed by scanning migrations, nothing enforces it.

**Fix:** add Postgres unique partial indexes:
```sql
CREATE UNIQUE INDEX leads_user_phone_unique ON leads (user_id, regexp_replace(phone, '\D', '', 'g')) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX leads_user_instagram_unique ON leads (user_id, instagram_user_id) WHERE instagram_user_id IS NOT NULL;
```
and use `.upsert({...}, { onConflict: '...', ignoreDuplicates: false })` instead of select-then-insert.

---

## 🟠 R-15. Webhook event-id fallback treats missing id as "process anyway" — duplicates Anthropic cost on every retry

**File:** `lib/webhook-idempotency.ts:59-64`

```ts
if (!eventId) {
  console.warn(...)
  return { claimed: true }
}
```

The SMS webhook passes `params.MessageSid` which is always present, so Twilio is safe. But R-2/R-3 illustrate future sources (Instagram `messaging.mid` could be absent on some edge payloads — unlinked attachments, reactions). The "fail open" choice means any delivery with no id double-processes on Meta's retries.

**Fix:** when no event_id, fall back to a hash of `(source, request_body)` with a TTL of 10 minutes in the ledger. That closes the gap without risking legitimate drops.

---

## 🟡 R-16. Data validation gaps: several write-boundary routes accept unvalidated JSON

**Files:**
- `app/api/bookings/checkout/route.ts:20` — `const { bookingId, vehicleName, startDate, endDate, customerEmail } = await request.json()` with no zod
- `app/api/instagram/send/route.ts:33` — `const { leadId, message } = await request.json()` with no zod (no length bound on `message`)
- `app/api/stripe-webhook/route.ts` — trusts `session.metadata.booking_id` / `invoice_id` without validating shape; an attacker who can inject Stripe metadata (e.g. via a compromised self-hosted Stripe key path) can write arbitrary strings into the `.eq("id", bookingId)` filter (PostgREST will reject non-UUIDs, but it's worth being explicit)
- `app/api/payments/webhook/route.ts:127-141` — metadata parsed with `parseFloat(metadata.total_amount || "0")`. If the AI flow writes a bad string, we silently use `0`, compare to `amount_total`, find a mismatch, and return 200 — good for safety here, but the `0` could also pass through to `bookings.total_amount = 0`.

**Fix:** add a zod schema for every `request.json()` call; parse Stripe metadata through a zod schema as well so malformed metadata fails loud.

---

## 🟡 R-17. Service-role Supabase client cached at module load across routes — env misconfiguration crashes at import time

**Files:** `app/api/stripe-webhook/route.ts:11`, `app/api/bookings/checkout/route.ts:10`, `app/api/cron/calendar-sync/route.ts:7`, `lib/telegram-bot-ai.ts:5`, `lib/webhook-idempotency.ts:36`

`createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)` at module scope. If the env var is missing in a preview deploy, the entire route throws at import, and Next.js serves a 500 with no structured error — and, for webhooks, Stripe/Twilio see a 500 and retry forever.

**Fix:** lazy-init, as already done in `app/api/payments/webhook/route.ts:16-21`. Make that pattern uniform.

---

## 🟡 R-18. `pageIdCache` in `lib/instagram.ts` is a per-instance Map with no eviction on failure

**File:** `lib/instagram.ts:8-27`

`resolvePageId` caches the page id for 1 hour. If Facebook returns a different page id after a token refresh (common on long-lived token rotation), we will keep sending to the stale page id until the cache expires, bounce every message, and never invalidate the cache. On serverless this is minor (cold starts re-init), but on long-lived Node processes it's a multi-hour outage for that user.

**Fix:** invalidate the cache when `sendInstagramMessage` returns a 4xx from Graph. Add a negative TTL (don't cache empty string).

---

## 🟡 R-19. `parseInstagramWebhook` swallows errors, returns null, and handler silently drops

**File:** `lib/instagram.ts:185-218`

Try-catch wraps the parse and returns `null` on any exception with a `console.error`. The caller in `processInstagramMessage` logs nothing extra and returns. A malformed payload from Meta (schema change, new message type, attachment-only message) results in zero visibility in Sentry and zero reply to the customer.

**Fix:** `throw` instead of returning null, let the outer `.catch` in the webhook route `Sentry.captureException`, and continue returning 200 to Meta separately.

---

## 🟡 R-20. `lib/sms-ai.ts` `saveMessage` swallows errors silently

**File:** `lib/sms-ai.ts:680-692`

```ts
if (error) {
  console.error("Error saving message:", error)
}
```

No throw, no retry, no Sentry hook. This is called on both inbound and outbound SMS. A Supabase write failure causes the message to be missing from CRM, but the SMS was actually sent — owners cannot see what the AI replied to the customer.

**Fix:** throw on insert error; let the outer handler decide to 500 so Twilio retries.

---

## 🟡 R-21. Cron `calendar-sync` inserts sequentially and upserts serially — one slow feed × N events burns the whole cron window

**File:** `app/api/cron/calendar-sync/route.ts:56-92`

Nested `for` with sequential `await supabase.upsert(...)` per event per vehicle. With N vehicles × M events, at 50-150ms per PostgREST round-trip, 100 vehicles × 20 events = 2000 round-trips, well over Vercel's 10s hobby function timeout. The outer try/catch only protects one vehicle at a time, so later vehicles silently never sync if the cron is killed mid-iteration.

**Fix:** batch upserts per vehicle (`supabase.upsert(arrayOfEvents)`). Run vehicle syncs in `Promise.allSettled` with a concurrency cap (e.g. 5). Add per-vehicle timeout.

---

## 🟡 R-22. `api-rate-limit.ts` is in-memory per-instance, so rate limits are effectively per-lambda-cold-start

Not directly reliability but feeds into R-11: under sustained load, bursts can exceed the advertised limits, causing downstream Twilio/Anthropic rate limit errors that the app has no retry for. (Files: every route calls `applyRateLimit` but the storage is an in-process Map.)

**Fix:** move to Upstash Redis or Supabase-backed counter. Pair with R-11 retry logic.

---

## 🟡 R-23. No Sentry capture calls in application code

**Evidence:** `Sentry.captureException` / `Sentry.setUser` — zero matches in `app/`. `sentry.server.config.ts` only does passive auto-instrumentation, which catches thrown errors in the Next.js request pipeline, but the many routes that catch-and-return-200 never emit events.

**Fix:** wrap each `console.error` in critical paths with `Sentry.captureException(err, { tags: { route: '...' } })`. At minimum, every webhook error and every payment-path error.

---

## 🟢 R-24. Twilio `fetch` of account in `app/api/sms/test/route.ts:32` has no timeout

Minor — it's a test endpoint. Same fix as R-7.

---

## 🟢 R-25. `parseIcal` does no sanity check on event counts — a feed returning 100k events will OOM the function

**File:** `lib/ical-parser.ts:63-124`

Defensive cap worth adding: `if (events.length > 5000) throw`.

---

# Top 3 Findings Summary

1. **🔴 R-1 Duplicate Stripe webhook endpoints share the same idempotency namespace** (`app/api/stripe-webhook/route.ts` + `app/api/payments/webhook/route.ts`). Whichever claims first wins the event, silently starving the other handler's business logic. Either the booking-deposit path or the Instagram-flow booking-creation path is running to partial completion on any given event, depending on timing.
2. **🔴 R-2 & R-3 Instagram and Telegram webhooks have no idempotency at all.** Meta and Telegram both retry on timeout; `processInstagramMessage` is deliberately detached from the response so retries overlap the original run, producing duplicate leads, duplicate AI spend, duplicate customer replies. Telegram `create_booking` + `update_vehicle_status` tool calls will execute twice on every retry.
3. **🔴 R-4 No database-level protection against concurrent booking of the same vehicle.** The app-layer conflict check in `payments/create-checkout` is not atomic with the insert, the Stripe webhook inserts blind, and the Telegram `create_booking` tool does no check whatsoever. Combined with no multi-step transactionality (R-5), the booking/payment path can land a paid customer on a vehicle that is already confirmed to someone else, or mark a lead `booked` without a backing row.

All three are fixable with small, contained changes: namespace the webhook ledger, add two `claimWebhookEvent` calls, and ship one Postgres exclusion constraint migration plus an `upsert/onConflict` RPC for the Stripe webhook's multi-step mutation.
