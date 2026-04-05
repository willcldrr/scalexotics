# Velocity Labs — Operational Runbook

Last updated as part of the production-readiness remediation (Wave 3-B).
This document is authoritative for incident response. Keep it terse; link out to dashboards rather than copying screenshots.

---

## 1. On-call contacts & escalation

- **Primary on-call**: `<FILL IN: primary on-call name + phone/Slack>`
- **Secondary on-call**: `<FILL IN: secondary on-call>`
- **Escalation manager**: `<FILL IN: engineering manager / owner>`
- **Pager**: `<FILL IN: PagerDuty / Opsgenie schedule URL>`
- **Incident channel**: `<FILL IN: Slack / Discord channel>`

Escalation policy: page primary first; if no ack in 10 minutes, page secondary; escalation manager gets paged after 20 minutes or on any Sev-1.

---

## 2. Health checks

### `GET /api/health`
Implemented in `app/api/health/route.ts`. Runs a bounded (`AbortSignal.timeout(3000)`) `count` query against `webhook_events` using the service-role client.

Response shape (stable — do not add fields without a version bump):

```json
{
  "status": "ok" | "degraded",
  "checks": { "database": "ok" | "unconfigured" | "error" | "unreachable" },
  "elapsed_ms": <number>
}
```

HTTP status codes:
- `200` — `status: "ok"`, database reachable.
- `503` — `status: "degraded"`, one of: env vars unset (`unconfigured`), Supabase returned an error (`error`), or the probe threw (`unreachable`, usually a timeout or network failure).

The endpoint has no auth, no rate limit, and no side effects — safe for 30s uptime pings.

### Dashboards

- **Vercel project**: `<FILL IN: https://vercel.com/<org>/<project>>`
- **Sentry**: `<FILL IN: https://sentry.io/organizations/<org>/projects/<project>/>`
- **Supabase project**: `<FILL IN: https://supabase.com/dashboard/project/<ref>>`
- **Upstash (rate limiter)**: `<FILL IN: Upstash console URL>`
- **Stripe dashboard (webhooks)**: `<FILL IN: https://dashboard.stripe.com/webhooks>`
- **Twilio console**: `<FILL IN>`
- **Meta app dashboard (Instagram)**: `<FILL IN>`

Vercel region pin: **not set in `vercel.json`** — depends on Supabase project region, `<FILL IN: Supabase region>`. When known, set `"regions": ["<iad1|sfo1|fra1|...>"]` in `vercel.json` to avoid cross-region round trips.

---

## 3. Rollback procedure

### Application (Vercel)

Vercel keeps an immutable history of every deployment — rollback is non-destructive.

```bash
vercel rollback <deployment-url>
```

Or, via the dashboard: **Deployments → select a known-good previous deployment → Promote to Production**. The previous deployment is live within ~30 seconds. No rebuild, no cold start penalty for warmed routes.

Identify a known-good deployment by checking `/api/health` response on its preview URL before promoting.

### Database

The production-readiness migrations (`supabase/migrations/20260405*`) are intentionally **additive** — they add columns, tables, and constraints but do not drop or rewrite existing data. There are no `*.down.sql` files (DevOps H2, deferred). Rolling back requires manual `DROP` / `ALTER ... DROP COLUMN` statements against Supabase.

Objects created by the remediation migrations (for targeted rollback):

- `20260405120000_encrypt_secrets_at_rest.sql` — ciphertext columns on `businesses` (Stripe key), `instagram_accounts` (access tokens), and `api_keys` hash columns.
- `20260405120100_booking_overlap_constraint.sql` — `EXCLUDE USING gist` constraint on `bookings` (vehicle × daterange).
- `20260405120200..20260405120220_retroactive_*.sql` — 21 retroactively tracked files that were previously applied by hand via the Supabase SQL Editor; dropping these would drop real production tables — **do not roll back these blindly**.
- `20260405130000_audit_logs.sql` — `audit_logs` table.
- `20260405130100_otp_hardening.sql` — `failed_attempts`, `locked_until`, composite key on `otp_codes`.
- `20260405140000_confirm_booking_rpc.sql` — `confirm_booking_and_lead(...)` RPC used by the payments webhook (LB-5b).
- `20260405140100_businesses_currency.sql` — `currency` column on `businesses` and `bookings` with ISO-4217 CHECK.

For a full DR event, use Supabase Point-In-Time Recovery (see §9) rather than hand-reversing migrations.

---

## 4. Stripe webhook failures

**Symptom**: spike in 500s on `/api/stripe-webhook` or `/api/payments/webhook` in Sentry, or the Stripe dashboard shows `Events: Failed`.

**Diagnose**:
1. Sentry — filter on tag `route:/api/stripe-webhook` or `route:/api/payments/webhook`; look for `[stripe-webhook] internal error` messages captured via `log.error` (LB-7 / LB-8).
2. Supabase — `SELECT * FROM webhook_events WHERE status = 'failed' ORDER BY created_at DESC LIMIT 50;` to find which events the idempotency layer marked failed.
3. Stripe dashboard → Developers → Webhooks → the endpoint → recent delivery attempts.

**Mitigate**:
- Stripe dashboard → Developers → Webhooks → select the failed event → **Resend**. LB-4 namespaced the idempotency sources (`stripe:bookings` for `/api/stripe-webhook`, `stripe:payments` for `/api/payments/webhook`), so replaying an event to each endpoint is safe: each namespace has its own `webhook_events` row and the handler is idempotent within the namespace.
- If both endpoints are subscribed to `checkout.session.completed` in Stripe (required — see remediation-status.md), resends will fan out to both and each runs its own half of the business logic (booking deposit vs IG/SMS flow).

**Kill switch**: there is no dedicated feature flag for the Stripe webhooks themselves. `ENABLE_SESSION_RESTORE` is referenced here only as an example of the kill-switch pattern used elsewhere in the codebase (it gates `/api/admin/restore-session`, not this endpoint). Adding a Stripe-webhook feature flag is tracked as backlog item HP-18.

---

## 5. Anthropic / AI cost spike

**Symptom**: `ANTHROPIC_API_KEY` spend dashboard climbing faster than usual; 429s from Anthropic; bot latency rising.

**Quick mitigation** (no deploy needed if Upstash is wired):
- Lower the per-minute `limit` argument on `applyRateLimit` calls in `/api/sms/webhook` and `/api/cron/follow-up-leads`. Requires a redeploy unless a live config mechanism is in place — currently **there isn't one**; limits are hardcoded in the route handlers.

**Nuclear kill switch**: `<FILL IN: env var name for AI feature flag>` — **not implemented**. The audit flagged the absence of any Anthropic kill switch as backlog item HP-18 and it is explicitly not in the launch-blocker remediation scope. Until HP-18 ships, the only way to stop Anthropic spend immediately is to rotate `ANTHROPIC_API_KEY` in the Vercel env and redeploy, which will surface as AI replies failing across SMS/IG/TG — expect customer-visible impact.

**Longer term**: check `messages` table / Sentry for the top offending lead IDs (prompt injection, runaway loops) and add them to a blocklist.

---

## 6. Supabase unreachable

**Symptom**: `/api/health` returns 503 with `checks.database: "unreachable"` or `"error"`; app-wide 500s.

**Check**:
- Supabase status page: `<FILL IN: https://status.supabase.com/ — confirm incident URL for the region>`
- Your project dashboard for database CPU / connection pool saturation.

**Important**: the shared rate limiter (`lib/rate-limit.ts`) automatically falls back to an in-memory `Map` on any Upstash REST error (LB-10). The app does **not** fail closed — a Supabase outage will not take the rate limiter with it, but it also means rate limits during an outage are only enforced per-lambda-instance. This is intentional; trading strict rate limiting for availability.

If Supabase is down, there is nothing app-side to do other than surface a status banner and wait for Supabase to recover. After recovery, watch for stuck connection pools — a rolling redeploy clears them.

---

## 7. Twilio SMS failures

**Symptom**: spike in `[sms.webhook] twilio error` log events in Sentry, or customer reports of SMS delivery issues.

**Check**:
- Twilio console → Monitor → Logs → Errors.
- Twilio A2P 10DLC registration status — if the campaign or brand registration lapses, outbound is throttled or blocked.
- Twilio status page.

**Known limitation**: outbound SMS failures in the current code are **silent** — there is no retry loop and no `pending_notifications` queue. HP-7 / HP-2 in the remediation backlog track adding retry with exponential backoff and a persistent pending queue; these are **not shipped**. Until then, a Twilio outage results in lost outbound SMS with no automatic replay.

---

## 8. Meta long-lived token expiration

**Symptom**: Instagram inbound messages stop flowing in; `cron/refresh-instagram-tokens` job is failing or marking tokens expired.

**Check**: Sentry for `[cron.refresh-instagram-tokens]` errors; `SELECT id, business_id, expires_at FROM instagram_accounts WHERE expires_at < now() + interval '7 days';`

**Manual refresh**:
- Meta app dashboard: `<FILL IN: https://developers.facebook.com/apps/<app-id>/>`
- Have the tenant re-authorize via the OAuth flow (`/api/instagram/callback`, LB-3 fixes apply). This will mint a fresh long-lived token, which `lib/crypto.ts` will encrypt at rest before storing.

---

## 9. Database backup & restore

Supabase Point-In-Time Recovery:

- Retention window: `<FILL IN: 7 days / 14 days / 30 days depending on plan>`
- Restore: Supabase dashboard → Database → Backups → **Restore to point-in-time**.

**This is disruptive.** A PITR restore rewinds the entire database; every write made after the restore point is lost. Procedure:

1. Declare an incident and lock writes if possible (put the app in maintenance mode via Vercel's deployment protection or by pointing the domain at a static 503 page).
2. Pick the restore timestamp — err on the side of a few minutes earlier than the suspected corruption.
3. Start the restore from the dashboard.
4. Once complete, validate with spot-checks on recent bookings, payments, and `webhook_events`.
5. Release the write lock and monitor `/api/health` + Sentry for an hour.

Backups are **not** test-restored on a schedule. DevOps C2 backlog item: add a quarterly dry-run restore into a throwaway project.

---

## 10. Rotation of secrets

### `ENCRYPTION_KEY` (LB-6)

- **Rotating this key requires a backfill script.** No such script exists yet (backlog). Rotating the key without re-encrypting every encrypted row will break decryption of existing `businesses.stripe_secret_key_ciphertext`, `instagram_accounts.access_token_ciphertext`, and any other column that uses `lib/crypto.ts`.
- Procedure when the backfill script lands: (1) add the new key as `ENCRYPTION_KEY_NEXT`, (2) run the backfill script in a transaction per tenant, (3) promote `ENCRYPTION_KEY_NEXT` → `ENCRYPTION_KEY`, (4) redeploy.
- Do NOT rotate casually.

### Stripe / Twilio / Anthropic / Resend / Meta secrets

Standard provider rotation:

1. Generate a new key in the provider's dashboard.
2. Update the corresponding env var in Vercel project settings (all environments: production, preview, development as applicable).
3. Redeploy production.
4. Revoke the old key in the provider's dashboard.
5. Watch Sentry for a 10-minute window for auth failures.

### `CRON_SECRET`

1. Generate a new 32+ char secret (`openssl rand -hex 32`).
2. Update in Vercel env.
3. Redeploy. Vercel's next cron invocation will send the new value.

### `STRIPE_WEBHOOK_SECRET`

Stripe supports multiple active signing secrets during rotation — add the new one, deploy, then remove the old one from Stripe's dashboard.

---

## 11. Emergency vendor contacts

- **Stripe support**: `<FILL IN: support URL or account manager email>`
- **Twilio support**: `<FILL IN>`
- **Supabase support**: `<FILL IN: support@supabase.com or enterprise contact>`
- **Anthropic support**: `<FILL IN: support@anthropic.com or account manager>`
- **Resend support**: `<FILL IN>`
- **Meta / Instagram developer support**: `<FILL IN>`
- **Upstash support**: `<FILL IN>`
- **Vercel support**: `<FILL IN: account-tier support channel>`
