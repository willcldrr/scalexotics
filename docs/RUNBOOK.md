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

---

## 12. Pre-deploy checklist — manual steps required before first deploy of the remediation branch

These are the items that **cannot** be landed from code and must be done by a human in a dashboard. Do them in order. Each section tells you exactly what to click and what to paste.

### 12.1 — `ENCRYPTION_KEY` (LB-6) — REQUIRED

The AES-256-GCM key used by `lib/crypto.ts` for encryption-at-rest. A value has already been generated for local development and written to `/var/www/velocity/.env.local` (gitignored). You can re-use the same value for Vercel, or generate a fresh one.

**To get the current local value** (safe to paste into Vercel — it is not sensitive until it protects live ciphertext):

```bash
grep '^ENCRYPTION_KEY=' /var/www/velocity/.env.local | cut -d= -f2
```

**To generate a fresh one**:

```bash
openssl rand -hex 32
```

**Paste into Vercel**:

1. Vercel dashboard → your project → **Settings** → **Environment Variables**.
2. Click **Add New**.
3. **Key**: `ENCRYPTION_KEY`
4. **Value**: the 64-character hex string from above.
5. **Environment**: tick **Production**, **Preview**, and **Development**.
6. **Save**.
7. Redeploy production (Deployments → three-dot menu on latest → **Redeploy**) so the new env var is picked up.

**Critical**: if you change this value later, every row with an `encrypted_*` column becomes undecryptable. Rotation requires a backfill script (see §10). Do **not** rotate without the backfill.

### 12.2 — `ENABLE_SESSION_RESTORE` (LB-2) — REQUIRED

LB-2 ships `/api/admin/restore-session` behind an env-gated kill switch. The endpoint is currently **off** in local dev (`.env.local` sets `ENABLE_SESSION_RESTORE=false`).

**Paste into Vercel**:

1. Vercel → Settings → Environment Variables → **Add New**.
2. **Key**: `ENABLE_SESSION_RESTORE`
3. **Value**: `false`
4. **Environment**: tick **Production**, **Preview**, **Development**.
5. **Save**.

Only set to `true` if admin tooling actively invokes this endpoint. The audit (C2) flagged it as a lateral takeover primitive — default off is the right posture. If you need to turn it on, do so in Preview first, exercise it once, and confirm the `audit_logs` row appears before promoting.

### 12.3 — `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (LB-10) — STRONGLY RECOMMENDED

Without these, the rate limiter falls back to per-lambda in-memory state — effectively off across Vercel cold starts. System works, but LB-10 is not mitigated in production.

**Sign up**:

1. Go to https://console.upstash.com/ → **Create Database**.
2. **Name**: `velocity-ratelimit` (or similar).
3. **Type**: **Regional** (cheapest, lowest latency for a single region).
4. **Region**: pick the one closest to your Vercel serverless region. If Vercel is `iad1` (default), pick `us-east-1`. Match your Supabase region if you know it.
5. **TLS/Eviction**: defaults are fine.
6. Click **Create**.

**Copy credentials**:

1. In the new database view, scroll to **REST API**.
2. Copy **UPSTASH_REDIS_REST_URL** — a `https://<slug>.upstash.io` URL.
3. Copy **UPSTASH_REDIS_REST_TOKEN** — a long opaque string.

**Paste into Vercel**:

1. Vercel → Settings → Environment Variables → **Add New**, twice:
   - **Key**: `UPSTASH_REDIS_REST_URL` — **Value**: the URL above — **Environment**: Production + Preview + Development.
   - **Key**: `UPSTASH_REDIS_REST_TOKEN` — **Value**: the token above — **Environment**: Production + Preview + Development.
2. Redeploy production. On the next request, `lib/rate-limit.ts` will log `{level:"info", msg:"[rate-limit] backend selected", backend:"upstash"}` on stdout once per process — confirm in Vercel → Logs that the backend switched.
3. If Upstash is ever unreachable, the rate limiter logs `[rate-limit] backend error, falling back to in-memory` and degrades gracefully — it does not fail closed.

### 12.4 — Stripe webhook dual-delivery verification (LB-4) — REQUIRED

LB-4 namespaced the idempotency ledger between `stripe:bookings` (handled by `/api/stripe-webhook`) and `stripe:payments` (handled by `/api/payments/webhook`). **Both endpoints must be subscribed to `checkout.session.completed` in Stripe** or one half of the business logic is dead.

**Verify**:

1. Stripe dashboard → **Developers** → **Webhooks**.
2. You should see **two endpoints** pointing at your production domain:
   - `https://<your-domain>/api/stripe-webhook`
   - `https://<your-domain>/api/payments/webhook`
3. Click each one → **Events to send**.
4. Confirm that **both** have `checkout.session.completed` listed. (The first endpoint also handles `invoice.*` events for the dashboard-invoice flow; the second handles the IG/SMS booking-deposit flow.)
5. If either endpoint is missing, click **Add endpoint** → paste the URL → select the events → **Add endpoint**. Stripe will show a new signing secret — **paste it** into the corresponding Vercel env var (`STRIPE_WEBHOOK_SECRET` for `/api/stripe-webhook`, or a second var if you decide to separate them; the current code reads one shared secret, so if you add a second endpoint use the same secret).

**Test replay**:

1. In Stripe → Webhooks → select an endpoint → **Send test webhook** → `checkout.session.completed`.
2. Watch Vercel logs for `[stripe-webhook] event claimed` with the expected namespace (`stripe:bookings` or `stripe:payments`).
3. Send the same event again — confirm the second delivery is deduped (`[webhook-idempotency] duplicate, skipping`).

### 12.5 — GitHub branch protection (DevOps C1) — REQUIRED

The new CI pipeline adds `no-console`, `test`, and `audit` as required checks, but nothing in-repo enforces that merges to `main` wait for them. This must be configured on GitHub itself.

**Configure**:

1. GitHub → your repo → **Settings** → **Branches**.
2. Under **Branch protection rules**, click **Add rule** (or edit the existing rule for `main`).
3. **Branch name pattern**: `main`
4. Tick:
   - ☑ **Require a pull request before merging**
   - ☑ **Require approvals**: 1 (or your team's standard)
   - ☑ **Require status checks to pass before merging**
   - ☑ **Require branches to be up to date before merging**
5. In the **Status checks** search box, add (one at a time — they must have run at least once before GitHub will autocomplete them, so push this branch first, let CI run, then come back):
   - `Lint`
   - `Typecheck`
   - `Test`
   - `Dependency audit` (or whatever the `audit` job is named in `.github/workflows/ci.yml`)
   - `No console.* in server code` (the new `no-console` job)
   - `Build`
6. Optional but recommended: ☑ **Do not allow bypassing the above settings** (enforce for admins too).
7. **Save changes**.

After this, merging `fix/prod-readiness-remediation` → `main` will be blocked until all six checks are green.

### 12.6 — Final pre-deploy sanity pass

After 12.1 through 12.5 are done:

1. In Vercel, trigger a redeploy of the latest commit on `fix/prod-readiness-remediation` (or your PR preview).
2. Hit the preview URL's `/api/health` — expect 200 with `checks.database: "ok"`.
3. Tail Vercel logs during the first 30 seconds — look for `[rate-limit] backend selected` with `backend:"upstash"` (confirms 12.3), and absence of any `ENCRYPTION_KEY must be set` errors (confirms 12.1).
4. Fire a Stripe test webhook (12.4) — confirm idempotent replay.
5. If all four pass, you are safe to merge and promote to production.

### 12.7 — Items still deferred (not in this checklist)

These require additional work beyond manual dashboard steps and are tracked in `.audit/REMEDIATION-COMPLETE.md`:

- **Encryption backfill** — script lives at `scripts/db/backfill-encryption.ts`; run-order documented in §13 below. Until it runs, encrypted columns are empty and the dual-read path falls back to plaintext. Required before you can drop the plaintext columns.
- **Migration apply** — the new `supabase/migrations/20260405*` files have not been applied to any database from this session. The 15 retroactive files that were previously non-idempotent have been patched to add `IF NOT EXISTS` / `DROP ... IF EXISTS` guards; see §13 for the apply order.
- **`<FILL IN:>` placeholders in §1, §2, §9, §11** — on-call contacts, dashboard URLs, PITR window, vendor contacts.

---

## 13. Apply remediation migrations and encryption backfill

Run this checklist once, in order, when you are ready to promote the
`fix/prod-readiness-remediation` branch from code-only to deployed.
Each step has a clear success signal and a clear failure mode.

### 13.0 — Prerequisites

- `ENCRYPTION_KEY` is set in the target environment AND matches the value on
  the host that will run the backfill script. If they diverge, decryption
  breaks for every row touched.
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` point at the
  **target** database. Do staging first, prod second — there is no automatic
  environment guard in the script.
- The 15 patched retroactive files are committed on your working branch.
  Confirm with:

  ```bash
  git log --oneline fix/prod-readiness-remediation | head -20
  ```

  Look for a commit whose subject mentions "Option Z" / "idempotency" /
  "retroactive guards" — it touches the 15 files listed at the top of this
  section and adds `scripts/db/backfill-encryption.ts` plus this §13.

- `psql` installed locally (for the per-file fallback path) or the
  `supabase` CLI linked to your project (for the `db push` path).

### 13.1 — Apply schema migrations in timestamp order

Preferred:

```bash
supabase db push --linked
```

`supabase db push` wraps each file in a transaction automatically — no
explicit `BEGIN/COMMIT` in the migration bodies.

Fallback (SQL editor or manual psql): apply files in the order below.
**Do not** reorder; `20260405120219_retroactive_security_fixes.sql`
depends on policies created by earlier retroactive files.

Non-retroactive remediation migrations (apply first in this sub-block):

1. `20260405120000_encrypt_secrets_at_rest.sql` — adds `encrypted_*` / `*_iv` / `*_tag` columns on `businesses`, `deposit_portal_config`, `instagram_connections`, plus `api_keys.key_hash`.
2. `20260405120100_booking_overlap_constraint.sql` — `EXCLUDE USING gist` on `bookings`.
3. `20260405130000_audit_logs.sql` — `audit_logs` table.
4. `20260405130100_otp_hardening.sql` — `failed_attempts`, `locked_until`, composite key on `otp_codes`.
5. `20260405140000_confirm_booking_rpc.sql` — `confirm_booking_and_lead(...)` RPC.
6. `20260405140100_businesses_currency.sql` — `currency` column on `businesses` and `bookings` (ISO-4217 CHECK).

Retroactive files (apply after the six above, in timestamp order):

```
20260405120200_retroactive_access_codes.sql
20260405120201_retroactive_add_admin_field.sql
20260405120202_retroactive_agreements_table.sql
20260405120203_retroactive_bookings_stripe_columns.sql
20260405120204_retroactive_business_branding_table.sql
20260405120205_retroactive_client_invoices.sql
20260405120206_retroactive_crm_oauth_config.sql
20260405120207_retroactive_crm_statuses.sql
20260405120208_retroactive_crm_tables.sql
20260405120209_retroactive_custom_domains_table.sql
20260405120210_retroactive_deliveries_table.sql
20260405120211_retroactive_fix_profiles_rls.sql
20260405120212_retroactive_inspections_table.sql
20260405120213_retroactive_integration_requests.sql
20260405120214_retroactive_invoices_stripe_columns.sql
20260405120215_retroactive_otp_codes.sql
20260405120216_retroactive_payment_links_stripe_columns.sql
20260405120217_retroactive_performance_indexes.sql
20260405120218_retroactive_reactivation_tables.sql
20260405120219_retroactive_security_fixes.sql
20260405120220_retroactive_user_sessions.sql
```

Per-file fallback (if `supabase db push` is not available):

```bash
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/<file>.sql
```

**Expected success output:**

- First-time apply on a fresh clone: `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, `CREATE POLICY`, `CREATE TRIGGER`, `CREATE FUNCTION`.
- Re-apply against a database where the object already exists (retroactive files only): `NOTICE: relation "<name>" already exists, skipping` for tables/indexes. Policies and triggers are re-created silently because every `CREATE POLICY` / `CREATE TRIGGER` is now preceded by a `DROP ... IF EXISTS`.

**Expected failure output and what it means:**

- `ERROR: relation "bookings" does not exist` — baseline schema is older than expected. Re-run earlier migrations (`20260319_bookings_lead_id.sql`, `20260405120203_retroactive_bookings_stripe_columns.sql`) first.
- `ERROR: could not create exclusion constraint "bookings_no_vehicle_overlap" ... conflicting key value violates exclusion constraint` — `bookings` already contains overlapping rows for the same vehicle. LB-5a cannot land until they are reconciled. Find the offenders by hand:

  ```sql
  SELECT vehicle_id, count(*)
  FROM bookings
  WHERE status NOT IN ('cancelled', 'rejected')
  GROUP BY 1
  HAVING count(*) > 1;
  ```

  Resolve (cancel one side, adjust dates, or split rows) then re-run the migration.

- `ERROR: function update_crm_updated_at() does not exist` on `20260405120206` or `20260405120207` — the CRM trigger function is defined in `20260405120208`. Apply `20260405120208` first, or re-order locally. (This is a pre-existing ordering wart in the retroactive set; not introduced by Option Z.)

### 13.2 — Run the encryption backfill in DRY-RUN mode

Load env vars from `.env.local` (or your secret manager) into the current shell first. Example using `dotenv-cli` if installed, else `export` them by hand:

```bash
set -a; source .env.local; set +a
npx tsx scripts/db/backfill-encryption.ts --dry-run --table=all --batch-size=100
```

**Successful dry-run output:**

- One JSON log line per row with `"action":"would_encrypt"`, `"skipped_already_encrypted"`, or `"skipped_no_plaintext"`.
- A per-table `[backfill-encryption] summary` line with `dryRun:true` and `errors:0`.
- A final `[backfill-encryption] combined summary` line.

**Failed dry-run:** `[backfill-encryption] missing required env vars: ...` (exit 2) or `[backfill-encryption] select failed` with a Supabase error payload (exit 1). Dry-run performs no writes, so retries are free — fix the env or network issue and re-run.

### 13.3 — Run the encryption backfill for real

```bash
npx tsx scripts/db/backfill-encryption.ts --table=all --batch-size=100
```

**Successful output:** every row processed ends in `"action":"encrypted"` or `"action":"skipped_*"`, and the combined summary shows `"errors": 0`. Exit code 0.

**Failed output:** one or more `log.error` lines during the run (stderr JSON with an `err` field) AND `errors > 0` in the summary. Exit code 1.

The script is **resumable**: rows whose `encrypted_*` column is already populated are skipped on subsequent runs. If some rows failed (e.g., transient 5xx from Supabase), simply re-run the same command — it will retry only the rows that still have NULL ciphertext.

### 13.4 — Verify backfill landed and code path switches to ciphertext

Paste into the Supabase SQL editor (one query per table):

```sql
SELECT
  count(*) FILTER (WHERE encrypted_stripe_secret_key IS NOT NULL) AS encrypted,
  count(*) FILTER (WHERE encrypted_stripe_secret_key IS NULL AND stripe_secret_key IS NOT NULL) AS remaining
FROM businesses;

SELECT
  count(*) FILTER (WHERE encrypted_stripe_secret_key IS NOT NULL) AS encrypted,
  count(*) FILTER (WHERE encrypted_stripe_secret_key IS NULL AND stripe_secret_key IS NOT NULL) AS remaining
FROM deposit_portal_config;

SELECT
  count(*) FILTER (WHERE encrypted_access_token IS NOT NULL) AS encrypted,
  count(*) FILTER (WHERE encrypted_access_token IS NULL AND access_token IS NOT NULL) AS remaining
FROM instagram_connections;
```

**Expected:** `remaining = 0` for all three. If non-zero, re-run §13.3.

Application-level verification:

1. `curl https://<target-domain>/api/health` — expect HTTP 200 and `"status":"ok"`.
2. Trigger a Stripe checkout on a test tenant. Confirm no `decrypt()` errors in Sentry (`tag:lib/crypto` or message `decrypt() requires`).
3. Send a test Instagram DM to a connected tenant. Confirm the webhook handler resolves the access token from ciphertext without falling back to plaintext.

### 13.5 — Rollback procedures per step

**Migration rollback (per file — all additive, no data destroyed):**

```sql
-- 20260405120000_encrypt_secrets_at_rest.sql
ALTER TABLE businesses
  DROP COLUMN IF EXISTS encrypted_stripe_secret_key,
  DROP COLUMN IF EXISTS stripe_secret_key_iv,
  DROP COLUMN IF EXISTS stripe_secret_key_tag;
ALTER TABLE deposit_portal_config
  DROP COLUMN IF EXISTS encrypted_stripe_secret_key,
  DROP COLUMN IF EXISTS stripe_secret_key_iv,
  DROP COLUMN IF EXISTS stripe_secret_key_tag;
ALTER TABLE instagram_connections
  DROP COLUMN IF EXISTS encrypted_access_token,
  DROP COLUMN IF EXISTS access_token_iv,
  DROP COLUMN IF EXISTS access_token_tag;
DROP INDEX IF EXISTS api_keys_key_hash_idx;
ALTER TABLE api_keys DROP COLUMN IF EXISTS key_hash;

-- 20260405120100_booking_overlap_constraint.sql
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_vehicle_overlap;

-- 20260405130000_audit_logs.sql
DROP TABLE IF EXISTS audit_logs;

-- 20260405130100_otp_hardening.sql
ALTER TABLE otp_codes
  DROP COLUMN IF EXISTS failed_attempts,
  DROP COLUMN IF EXISTS locked_until;
-- (composite key drop is manual — inspect pg_indexes first)

-- 20260405140000_confirm_booking_rpc.sql
DROP FUNCTION IF EXISTS confirm_booking_and_lead;

-- 20260405140100_businesses_currency.sql
ALTER TABLE businesses DROP COLUMN IF EXISTS currency;
ALTER TABLE bookings DROP COLUMN IF EXISTS currency;
```

Retroactive files intentionally have **no rollback** — dropping their
tables would drop real production data.

**Backfill rollback (wrong `ENCRYPTION_KEY`):**

If the backfill ran with the wrong key, the ciphertext is garbage but
the plaintext columns are still present (LB-6 deferred their drop). To
clear the encrypted trio and re-run:

```sql
UPDATE businesses
   SET encrypted_stripe_secret_key = NULL,
       stripe_secret_key_iv        = NULL,
       stripe_secret_key_tag       = NULL
 WHERE encrypted_stripe_secret_key IS NOT NULL;

UPDATE deposit_portal_config
   SET encrypted_stripe_secret_key = NULL,
       stripe_secret_key_iv        = NULL,
       stripe_secret_key_tag       = NULL
 WHERE encrypted_stripe_secret_key IS NOT NULL;

UPDATE instagram_connections
   SET encrypted_access_token = NULL,
       access_token_iv        = NULL,
       access_token_tag       = NULL
 WHERE encrypted_access_token IS NOT NULL;
```

Then fix `ENCRYPTION_KEY` in the target environment and re-run §13.3. The dual-read path in `lib/crypto.ts` callers keeps the app serving from plaintext while the encrypted columns are NULL.
