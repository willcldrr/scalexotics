# Velocity Labs — Production Readiness Report

**Audit date:** 2026-04-05
**Scope:** Full-stack read-only audit of `/var/www/velocity` (Next.js 16 + React 19 + Supabase + Stripe + Twilio + Anthropic + Resend + Meta/Instagram + Telegram).
**Team:** 6 parallel specialists — Security · Performance · Reliability · Testing · Observability · DevOps. Findings files in `.audit/*-findings.md`.

---

## Executive Summary

**Verdict: NOT PRODUCTION-READY. Do not ship to paying customers in current state.**

The application is functionally broad and the happy paths work, but the audit uncovered **three classes of launch-blocking issues** that each independently would be disqualifying:

1. **The secret surface is compromised today.** Live `sk_live_` Stripe, Supabase `service_role` JWT, Twilio, Anthropic, Resend, Meta and `CRON_SECRET` values are sitting in plaintext at `/var/www/velocity/.env` on the audit host — every one must be treated as leaked and rotated before anything else. Per-tenant Stripe *secret* keys are additionally stored in plaintext in Postgres (`businesses.stripe_secret_key`, `deposit_portal_config.stripe_secret_key`), turning any RLS or service-role bypass into a multi-tenant payment-processor takeover.
2. **The money path is unsafe under concurrency.** Two Stripe webhook endpoints share one idempotency namespace and silently starve each other (R-1); Instagram and Telegram webhooks have no idempotency at all, so provider retries duplicate AI spend, duplicate customer replies, and (for Telegram) double-execute `create_booking` tool calls (R-2/R-3); there is **no database constraint preventing two customers from booking the same vehicle on overlapping dates** (R-4); the post-payment flow is a multi-step mutation across `leads`, `bookings`, and `messages` with no transaction (R-5); and every Stripe checkout route hardcodes `currency: "usd"` despite a 5-currency `lib/currency.ts` (T-09).
3. **There is no safety net.** Sentry is initialized but never called (`Sentry.captureException` count in `app/` + `lib/` = **0**). 245 `console.*` statements are the only error sink, and many of them leak refresh-token presence, customer PII, AI-rendered SMS bodies, and plaintext phone numbers into the Vercel log drain (F-7–F-12). The in-memory rate limiter is bypassed by design on every cold start on serverless (H7/#15/T-11), meaning OTP brute force (H6), bulk SMS abuse, and Anthropic cost runaway (F-30) are effectively unthrottled. Test coverage is **<1 %** by LOC — two tests exist, both structural string-matchers on AI prompt files, and `test:coverage` has no threshold so the script passes at 0 % (T-20). There is no `README.md`, no `RUNBOOK.md`, no rollback documentation, and 22 ad-hoc `supabase/*.sql` scripts live outside the migration pipeline (DevOps H1–C3).

Fixing the 12 Launch Blockers below is estimated to retire the acute risk. The High-Priority list covers the work needed to survive the first month in production under real traffic.

---

## Overall Score: **28 / 100**

| Domain | Score | Headline |
|---|---|---|
| Security | **22 / 100** | Live prod secrets on disk; admin lateral takeover; SSRF; plaintext Stripe keys in DB |
| Reliability | **28 / 100** | No webhook idempotency (IG/TG); no DB overlap constraint; multi-step mutations not atomic; no retries/circuit breakers |
| Testing & Quality | **8 / 100** | <1 % coverage; money path entirely untested; existing tests are structural not behavioral |
| Observability | **18 / 100** | Sentry initialized but never invoked; PII/token leaks in `console.log`; no structured logs, request IDs, metrics, runbook, or flags |
| Performance | **42 / 100** | Dashboards poll unbounded queries every 3–5 s; bulk paths do N serial round-trips; no background queue for AI/SMS fan-out |
| Infra & DevOps | **48 / 100** | CI exists but not load-bearing; migrations non-transactional and partially ad-hoc; no README/runbook; PM2-vs-Vercel ambiguity |

Weighted simple average: **(22+28+8+18+42+48)/6 ≈ 27.7 → 28/100**.

---

## 🔴 Launch Blockers (must fix before go-live)

Each blocker is tagged with its source finding(s). File:line citations are in the individual domain reports.

### LB-1 — Rotate every secret in `/var/www/velocity/.env` and remove the file from the host
Source: **Security C1**. `.env` contains live `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` (`sk_live_…`), `STRIPE_WEBHOOK_SECRET`, `TWILIO_AUTH_TOKEN`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `OPENROUTER_API_KEY`, `META_APP_SECRET`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_ACCESS_TOKEN`, `CRON_SECRET`. Rotate all, move to Vercel env vars (or systemd `EnvironmentFile=` with `600`), delete `.env` from the deploy host, audit backups/logs for prior exposure.

### LB-2 — Patch the admin session-restore lateral takeover
Source: **Security C2**, **Testing T-07**. `POST /api/admin/restore-session` issues a full access+refresh token for any `adminUserId` in the body as long as the caller has *some* admin cookie. Add `supabase.auth.getUser()`, require caller == target (or a prior impersonation ledger row), write an `impersonation_logs` entry on every call.

### LB-3 — Fix the Instagram OAuth `state`-as-`userId` hijack
Source: **Security C3**. `state` is both the CSRF token and the attacker-controlled carrier of `userId`. Resolve the user from `supabase.auth.getUser()` inside the callback; treat `state` as a pure random CSRF token compared to the signed cookie.

### LB-4 — Collapse/namespace the two Stripe webhook endpoints and add idempotency to Instagram + Telegram webhooks
Source: **Reliability R-1/R-2/R-3**, **Testing T-04/T-05**. (a) Either merge `/api/stripe-webhook` and `/api/payments/webhook` into one route that dispatches on `metadata.source`, or namespace `claimWebhookEvent("stripe:bookings", …)` vs `stripe:payments`. (b) Call `claimWebhookEvent("instagram", message.mid, …)` inside `processInstagramMessage`. (c) Call `claimWebhookEvent("telegram", String(update.update_id), …)` at the top of the Telegram webhook. All three are already supported by `lib/webhook-idempotency.ts` — just not wired.

### LB-5 — Add a DB-level exclusion constraint against concurrent vehicle bookings, and wrap the post-payment multi-step mutation in a Postgres RPC
Source: **Reliability R-4/R-5**. Add `EXCLUDE USING gist (vehicle_id WITH =, daterange(start_date, end_date, '[]') WITH &&) WHERE status IN ('confirmed','pending')` on `bookings`. Move the `leads update → bookings insert → messages insert` flow in `app/api/payments/webhook/route.ts:207-322` into one `supabase.rpc('confirm_booking_and_lead', …)` so it runs in a single transaction. Same treatment for the Telegram `create_booking` tool and the `app/api/bookings/checkout` availability check.

### LB-6 — Encrypt per-tenant Stripe secret keys and Instagram access tokens at rest; hash `api_keys`
Source: **Security H3/H4/H5**. `businesses.stripe_secret_key`, `deposit_portal_config.stripe_secret_key`, `instagram_connections.access_token`, and `api_keys.key` are all stored as plaintext. Move to `pgsodium`/Supabase Vault or an app-side KMS wrapper; store SHA-256 (or argon2) hashes for `api_keys` and compare with `timingSafeEqual`.

### LB-7 — Stop leaking tokens and customer PII into logs; wire every error path through Sentry
Source: **Observability F-1/F-7/F-8/F-9/F-10**, **Reliability R-23**. Remove/redact the refresh-token log in `admin/impersonate/route.ts:84`, the raw Meta API body dumps in `instagram/connect-manual/*`, `extractedData`/`leadData` logs in `chatbot-test/route.ts`, and the rendered confirmation-body logs in `payments/webhook/route.ts:285-321`. Introduce `lib/log.ts` that calls both stdout (JSON) and `Sentry.captureException`, and replace `console.error` on payments/webhooks/AI paths with it.

### LB-8 — Stop returning 200 on internal errors in Stripe webhooks; drive failure state into Sentry + `webhook_events` ledger
Source: **Reliability R-9**. Transient Supabase errors in webhook handlers currently return `{ received: true }`, telling Stripe to stop retrying and burying the failure. Return 500 on recoverable errors; call `markWebhookEventProcessed(..., "failed", error)`; `Sentry.captureException` with route tags.

### LB-9 — SSRF-harden `safe-fetch` and the `/api/calendar/sync` path; add fetch timeouts everywhere
Source: **Security H1/H2**, **Reliability R-6/R-7**. `lib/safe-fetch.ts` only adds a timeout despite its name — add scheme allowlist + DNS-resolve + private-IP blocking (`127/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, loopback, ULA) and re-validate after redirects. Replace raw `fetch(` with `safeFetch` in the 15+ files under `instagram/*`, `telegram/*`, `domain/*`, `crm/google-calendar.ts`, and `lib/ical-parser.ts`. The iCal parser is the most urgent — an attacker-controlled `turo_ical_url` currently reaches cloud metadata endpoints.

### LB-10 — Replace the in-memory rate limiter with a shared store (Upstash/Supabase) before launch
Source: **Security H7**, **Performance #15**, **Testing T-11**, **Reliability R-22**. `lib/rate-limit.ts` is a per-process `Map`; on Vercel serverless every cold start resets it. OTP brute force (H6), `/api/auth/verify-otp`, `/api/auth/reset-password`, `/api/sms/bulk`, and `/api/leads/capture` are currently unthrottled in practice. Wire `@upstash/ratelimit` before opening signups.

### LB-11 — Fix the OTP brute-force path
Source: **Security H6**. `verify-otp` and `reset-password` only increment `failed_attempts` on expired rows; a 6-digit OTP is brute-forceable in days at ~600 req/hour. Increment on every mismatch, lock the email after N failures, bind rate limits to `email` not just IP, shorten OTP TTL.

### LB-12 — Thread `currency` through every Stripe checkout route
Source: **Testing T-09**. `app/api/bookings/checkout/route.ts:57`, `app/api/payments/create-checkout/route.ts:150`, `app/api/checkout/create/route.ts:115`, `app/api/create-checkout/route.ts:64` hardcode `currency: "usd"`. Multi-currency tenants currently show EUR/GBP in the UI but get charged in USD — refund/dispute risk the moment a non-US business processes a booking. Read `currency` from the business settings row; add a regression test.

---

## 🟠 High Priority (fix within first sprint post-launch)

### Reliability / correctness
- **HP-1** Retry + timeout wrappers on Twilio, Resend, Instagram Graph, Telegram Bot API, Supabase writes. Only Anthropic has `maxRetries`. Add `withRetry` helper and a per-provider circuit breaker. (R-7, R-11)
- **HP-2** Graceful degradation on post-payment confirmation: persist a `pending_notifications` row if Twilio/Instagram send fails so ops/cron can retry. (R-12)
- **HP-3** Stop overwriting `lead.status` to `"followup"` on Anthropic failure — a single hiccup reverts a `qualified` lead. (R-13)
- **HP-4** Add unique partial indexes on `leads(user_id, normalized_phone)` and `leads(user_id, instagram_user_id)` and switch to `upsert({onConflict})` for `findOrCreateLead`. (R-14)
- **HP-5** Replace per-claim select-then-insert in `/api/checkout/create` — claim the payment link *before* creating the Stripe session, compensating-rollback on Stripe failure. (R-10)
- **HP-6** `lib/ical-parser.ts`: bound events to 5 000, timeout via `safeFetch(15_000ms)`, run vehicle syncs in `Promise.allSettled` chunks. (R-6, R-25, perf #11)
- **HP-7** Resend is unwrapped in `/api/auth/signup` — failure orphans the user with an unverifiable account. Wrap in try/catch, delete the OTP row on failure, retry 2×. (R-8)

### Security hardening
- **HP-8** Stop loading `SUPABASE_SERVICE_ROLE_KEY` into the edge middleware bundle. Move admin checks to a Node-runtime server component or use the RLS-aware cookie client. (Security H8)
- **HP-9** Add auth/signed-token to `POST /api/bookings/checkout` (currently anyone with a bookingId can mint Stripe sessions and overwrite `stripe_checkout_session_id`). (Security M3)
- **HP-10** `/api/sms/send` and `/api/sms/bulk`: scope `leadId` and filter construction — current `.or('phone.eq.${phone}')` accepts unsanitized filter fragments; `sms/send` never verifies the lead belongs to the caller. (Security M1/M2)
- **HP-11** Nonce-based CSP; remove `'unsafe-inline'` + `'unsafe-eval'`. (Security M6)
- **HP-12** HTML-escape `fullName` before interpolating into Resend email templates. (Security M7)
- **HP-13** Scope widget `Access-Control-Allow-Origin` to `api_keys.apiKeyDomain` instead of `*`. (Security M8)
- **HP-14** `timingSafeEqual` on cron-secret and access-code compares. (Security M10/M11)

### Observability & ops
- **HP-15** Introduce a structured JSON logger with request IDs threaded via `AsyncLocalStorage`; attach to Sentry breadcrumbs/tags. (F-18/F-19/F-20)
- **HP-16** Set up Sentry alerts: webhook error rate > 2 % over 5 min, health 503 for > 3 min, `payment.webhook.amount_mismatch > 0`. Tag `release: VERCEL_GIT_COMMIT_SHA`. (F-4/F-5/F-26)
- **HP-17** Deeper `/api/health/deps` probing Stripe/Twilio/Anthropic/Meta on a 5-min cadence; keep the cheap `/api/health` for the fast loop. (F-22)
- **HP-18** Feature flags / kill switches for `FEATURE_AI_SMS`, `FEATURE_AI_FOLLOWUP`, `FEATURE_BULK_SMS`, `FEATURE_INSTAGRAM_BOT`, `FEATURE_TELEGRAM_BOT`. Add `MAX_LEADS_PER_RUN` and `MAX_COST_USD_PER_RUN` caps on `cron/follow-up-leads`. (F-29/F-30)
- **HP-19** Write `docs/ops/RUNBOOK.md` covering Vercel rollback, Supabase PITR, Stripe/Twilio/Meta webhook replay, `CRON_SECRET` rotation, on-call. (DevOps C2/F-28)
- **HP-20** Add a real `README.md` and move stale `AI_AGENT_AUDIT.md` / `VELOCITY_LABS_PROJECT_REPORT.md` under `docs/history/`. (DevOps C3)

### Performance blockers visible in production
- **HP-21** Drop the 3–5 s dashboard polls on `app/dashboard/page.tsx`, `leads/pipeline/page.tsx`, `admin/page.tsx` — realtime channels already exist. Add `.limit()` on every list query. (Perf #1/#2/#7, ~10 min fix, massive impact)
- **HP-22** Replace the 200-iteration `for (id of ids) await supabase.from('leads').delete().eq(...)` bulk paths with a single `.in()` call. (Perf #3)
- **HP-23** Move bulk SMS fan-out and `cron/follow-up-leads` AI loop to a background queue (QStash/Inngest/pg-boss). (Perf #5/#6)
- **HP-24** `Promise.all` the 5 serial selects in `lib/sms-ai.ts:generateAIResponse`; add `.gte('end_date', today)` to the bookings select so historic rows stop shipping to Anthropic. (Perf #10)
- **HP-25** Add missing indexes: `ai_settings(business_phone_last10)`, `leads(user_id, phone_e164)`, partial index for `cron/follow-up-leads`, `user_sessions(user_id, last_active desc)`, `pg_trgm` GIN on `crm_leads` search columns. (Perf #27)

### Testing
- **HP-26** Coverage floor: author `tests/api/stripe-webhook.test.ts`, `tests/api/payments-webhook.test.ts`, `tests/lib/sms-ai.test.ts` (parse + sanitize golden-file), `tests/lib/webhook-idempotency.test.ts`, `tests/api/admin-impersonate.test.ts`, `tests/lib/currency.test.ts`. Add `coverage.thresholds: { lines: 40, branches: 30 }` to `vitest.config.ts` to prevent regression. (T-01/T-02/T-07/T-09/T-12/T-20)
- **HP-27** Add `tests/setup.ts` with a Supabase factory mock + `.env.test`; install MSW for fetch mocking. (T-19)
- **HP-28** Contract tests for Stripe/Twilio/Meta/Telegram/Anthropic payloads (Zod schemas re-used in the handlers). (T-17)

### DevOps hygiene
- **HP-29** Promote the 22 ad-hoc `supabase/*.sql` scripts to dated migrations or archive under `supabase/_legacy/`. Enforce "migrations only" in CI. (DevOps H1)
- **HP-30** Wrap every migration in `BEGIN; … COMMIT;` and author `*.down.sql` for destructive changes. Switch to `YYYYMMDDHHMMSS` timestamps. (DevOps H2/H3)
- **HP-31** Enable GitHub branch protection: require `Lint`, `Typecheck`, `Test`, `Audit`, `Build` green before merge. Make `build` depend on `test` + `audit`. (DevOps C1/M3)
- **HP-32** Declare `functions.maxDuration` for AI/webhook routes in `vercel.json`, pin `regions` to the Supabase region. (DevOps H5)
- **HP-33** Resolve PM2-vs-Vercel ambiguity (`ecosystem.config.js`). Pick one, delete the other, or add `instances`/`max_memory_restart`/non-root `user`. (DevOps H4)

---

## 🟡 Backlog Items (important but not blocking)

- In-process `dashboard-cache.tsx` JSON.stringify diffing → cheap hash compare. (Perf #18)
- 2 500-line client components (`leads/page.tsx`, `admin/page.tsx`) → code-split heavy modals via `next/dynamic`. (Perf #16)
- Standardize service-role Supabase client into `lib/supabase/service.ts` (47 duplicated call sites). (T-13)
- Remove dead `@tanstack/react-query` dependency or actually adopt it for the polling paths. (Perf #17)
- `/api/currency/rates` → add `revalidate = 3600`. (Perf #24)
- Date arithmetic with `new Date("YYYY-MM-DD")` → `differenceInCalendarDays(parseISO(x))`. (T-10)
- Dead A2P branch in `/api/leads/capture` that silently returns success without persisting. (T-15/T-16)
- `parseInstagramWebhook` swallows errors → throw and let Sentry capture. (R-19)
- `saveMessage` swallows insert errors. (R-20)
- `pageIdCache` in `lib/instagram.ts` never invalidates on 4xx. (R-18)
- Sentry `beforeSend` only on server; missing on client + edge, uses brittle regex scrub. (F-2/F-3)
- `@vercel/analytics` is page-view only — add `@vercel/speed-insights`, set up log drain to Axiom/Datadog. (F-25)
- Remove `console.log` of AI cost / rejected phone numbers / OTP insert errors. (F-12/F-14/F-17)
- `next.config.mjs` — hardcode `typescript.ignoreBuildErrors: false`. (M1)
- Remove `--legacy-peer-deps` from CI. (DevOps M4)
- Run `scripts/verify-migrations.mjs` against a staging Supabase in CI. (DevOps M2)
- Low-level Security items L1–L7 (lodash override typo, stale build-ignore toggle, etc.).

---

## Cross-Cutting Risk Matrix

Issues flagged by multiple domains — fixing any of these retires several findings at once.

| # | Risk cluster | Domains that flagged it | Compounding effect |
|---|---|---|---|
| **X-1** | **Webhook trust boundary is broken end-to-end** | Reliability R-1/R-2/R-3/R-9 · Testing T-01/T-04/T-05 · Observability F-1 | Duplicate Stripe routes race on the same event; Instagram/Telegram have no idempotency; webhooks return 200 on transient failures so Stripe stops retrying; zero tests to detect regression; Sentry never called, so silent failures are invisible. A single deploy can ship a webhook bug that rolls out silently to every paying customer. |
| **X-2** | **Admin takeover → payment processor takeover in one pivot** | Security C2/H3/H8 · Observability F-7 · Testing T-07 | `/api/admin/restore-session` grants lateral admin access with no audit, per-tenant `sk_live_` keys are plaintext in Postgres, middleware loads the service-role key into the edge bundle, refresh-token presence is logged, and none of it is tested. One stolen admin cookie walks the entire tenant base. |
| **X-3** | **Race conditions in the money path** | Reliability R-4/R-5/R-10/R-14 · Testing T-01/T-09 · DevOps H2 | No DB exclusion constraint on vehicle overlaps, no transaction around leads+bookings+messages, no unique lead index, race between availability check and Stripe session creation, hardcoded USD, no tests. Under any concurrent booking load the system will (a) double-book vehicles, (b) orphan `lead.status='booked'` with no backing row, and (c) charge non-USD tenants in USD. |
| **X-4** | **Rate limiting is theater** | Security H6/H7 · Performance #15 · Reliability R-22 · Testing T-11 | `lib/rate-limit.ts` is an in-process `Map`. Effective limit = `advertised × coldStartCount`. This amplifies OTP brute force, bulk-SMS abuse, and unthrottled Anthropic spend on `cron/follow-up-leads` (which has no cost cap). |
| **X-5** | **Observability blackout on the critical paths** | Observability F-1/F-18/F-19/F-24/F-26/F-28 · Reliability R-9/R-23 · Testing T-20 | Sentry never invoked, 245 `console.*` calls with no structured fields, zero correlation IDs, zero custom metrics, zero alerting rules committed, no runbook. When something breaks at 3 a.m. — and items X-1/X-3 guarantee something will — there is no signal and no playbook. |
| **X-6** | **SSRF / outbound stall amplification** | Security H1/H2 · Reliability R-6/R-7 · Performance #11 | `lib/safe-fetch.ts` doesn't sandbox anything; 15+ routes use raw `fetch` without timeouts; `turo_ical_url` is user-controlled and reaches cloud metadata; serial per-vehicle iCal syncs mean one malicious feed stalls the whole cron. |
| **X-7** | **Dashboard amplification** | Performance #1/#2/#7/#8/#25 · Reliability R-17 · Security M2 | 3–5 s polling on unbounded queries × 5 realtime channels × 2 500-line client components × in-memory cache diffing. One heavy tenant = saturated Supabase pool. Add in the fact that each poll re-calls `supabase.auth.getUser()` and Resend/Anthropic endpoints can stall the same lambda, and a single slow dashboard degrades the whole tenant. |
| **X-8** | **No test safety net anywhere** | Testing T-01–T-22 · Reliability R-1/R-4/R-14 · Security C2/M1 | Coverage <1 %. Every blocker above is silently reversible by the next refactor. `test:coverage` has no threshold. |
| **X-9** | **Migration + backup fragility** | DevOps C2/H1/H2/H3 · Reliability R-17 | 22 ad-hoc `.sql` scripts outside `migrations/`; no transactions; no down migrations; no backup/restore runbook; same-day filename collisions guarantee undefined apply order. A DR scenario today is an open-ended incident. |
| **X-10** | **PII/secret leak surface via logs** | Observability F-7–F-15 · Security C1/M9 | Refresh-token presence, Meta API bodies with echoed auth params, AI-extracted customer PII, full SMS confirmation bodies, and plaintext phone numbers are all in `console.log` today. Vercel log drain persistence makes this a SOC2-blocking finding. |

---

## Recommended Fix Order (sequenced by impact × dependency)

**Day 0 — emergency (do before anything else, ideally today):**
1. Rotate every secret in `.env` (LB-1). Delete the `.env` from the host; move to Vercel env or systemd.
2. Disable `/api/admin/restore-session` behind a feature flag while LB-2 is patched.
3. Add the Postgres exclusion constraint on `bookings` (LB-5, part a) — one migration, zero code changes, immediately prevents double-booking.

**Week 1 — launch blockers:**
4. LB-2, LB-3 (security patches — contained one-file fixes).
5. LB-4 (webhook idempotency — three `claimWebhookEvent` calls + one namespace change).
6. LB-5 (part b — wrap the multi-step mutation in a Postgres RPC).
7. LB-7 (redact console.logs + wire Sentry.captureException into a thin `lib/log.ts`).
8. LB-8 (stop 200-on-error in Stripe webhooks).
9. LB-10 (Upstash rate limiter) + LB-11 (OTP hardening) — unblocks LB-6.
10. LB-6 (encrypt secrets in DB, hash `api_keys`).
11. LB-9 (SSRF harden safe-fetch + calendar sync).
12. LB-12 (currency threading).

**Week 2 — high priority first wave (observability + reliability floor):**
13. HP-15/HP-16/HP-17 (structured logging, Sentry alerts, deeper health probe).
14. HP-18 (feature flags + cost caps).
15. HP-1 (retry+timeout wrappers).
16. HP-21/HP-22 (drop dashboard polls, bulk `.in()` fix) — 30 minutes, huge relief.
17. HP-26 (author the first wave of money-path tests, lock coverage floor).

**Week 3–4 — high priority second wave:**
18. HP-2/HP-3/HP-4/HP-5/HP-6/HP-7 (reliability gaps).
19. HP-8–HP-14 (security hardening).
20. HP-19/HP-20 (runbook + README).
21. HP-23 (background queue for AI/bulk SMS).
22. HP-25 (missing indexes).
23. HP-29/HP-30/HP-31 (migration hygiene + CI gating).

**Backlog** — schedule into normal sprint cadence once the above is green.

---

## Domain-by-Domain Scorecard

### Security — 22 / 100
**Counts:** 3 🔴 · 8 🟠 · 12 🟡 · 7 🟢. `npm audit` is clean, but this is irrelevant next to plaintext live secrets on disk, lateral admin takeover, Instagram OAuth hijack, and plaintext per-tenant Stripe keys in Postgres. Defense-in-depth is absent — `unsafe-inline`+`unsafe-eval` CSP, in-memory rate limit, non-constant-time compares, plaintext access codes.
**Top 3:** C1 (secrets on disk), C2 (admin restore-session), C3 (Instagram state hijack) + SSRF via H1/H2.

### Reliability — 28 / 100
**Counts:** 6 🔴 · 9 🟠 · 8 🟡 · 2 🟢. Webhook layer is the dominant risk (R-1/R-2/R-3), booking concurrency is unprotected at the DB level (R-4), multi-step mutations are not atomic (R-5), no retries/timeouts/circuit breakers, and error paths lean on `console.error` that nobody sees.
**Top 3:** R-1 (duplicate Stripe webhooks race), R-2/R-3 (no IG/TG idempotency), R-4 (no vehicle-overlap constraint).

### Testing & Quality — 8 / 100
**Counts:** 8 🔴 · 8 🟠 · 6 🟡. **<1 % coverage.** Two tests exist and both are structural string-match assertions on AI prompt files. Money path, auth path, webhooks, AI orchestration, and the sanitizer-as-security-boundary are all untested. `test:coverage` has no threshold.
**Top 3:** T-01 (Stripe webhooks untested), T-02 (`lib/sms-ai.ts` untested), T-07 (admin impersonate untested).

### Observability — 18 / 100
**Counts:** 11 🔴 · 9 🟠 · 10 🟡 · 1 🟢. Sentry is dead weight: 245 `console.*` calls, **0** `Sentry.captureException` calls in `app/` or `lib/`. Logs leak tokens, PII, AI-rendered SMS bodies, and plaintext phone numbers. No structured logger, no request IDs, no metrics, no runbook, no feature flags. `/api/health` is the one bright spot (F-21).
**Top 3:** F-1 (Sentry never invoked), F-7–F-10 (PII/token leaks in logs), F-18/F-19/F-24 (no structured logs / correlation IDs / metrics).

### Performance & Scalability — 42 / 100
**Counts:** 7 🔴 · 9 🟠 · 11 🟡 · 6 🟢. Existing `20260404_performance_indexes.sql` is a good start and rules out the worst offenders on the primary tables. But dashboard polling is out of control (3–5 s unbounded queries with no diffing), bulk actions run as N serial round-trips, the in-memory cache's JSON.stringify diffing runs every tick, and every heavy operation (bulk SMS, AI follow-up cron, CSV imports, calendar sync) runs inline in the request path with no background queue. `@tanstack/react-query` is in the bundle but never imported.
**Top 3:** #1/#2/#7 (unbounded 3–5 s dashboard polls), #3 (N-serial bulk actions), #5/#6 (inline AI + SMS fan-out).

### Infrastructure & DevOps — 48 / 100
**Counts:** 3 🔴 · 6 🟠 · 7 🟡 · 7 🟢. `.env.example` is clean, `.gitignore` is correct, `middleware.ts` is not a bypass, `/api/health` is well-built, CSP baseline is solid. But CI is not load-bearing (deploys don't depend on it), 22 `supabase/*.sql` scripts live outside the migration pipeline, migrations are non-transactional with no down scripts and collide on dates, `ecosystem.config.js` implies a parallel PM2 deploy with no resource limits or non-root user, there is no `README.md` or runbook, and `vercel.json` declares no function timeouts or regions.
**Top 3:** C1 (CI not gating deploys), C2 (no runbook/DR docs), H1 (ad-hoc SQL outside migrations).

---

## Methodology & caveats

- **Read-only audit.** No code was modified. No runtime data was inspected.
- **Source of truth is the code as of 2026-04-05.** Findings that depend on out-of-tree state (Stripe webhook URL configuration, GitHub branch protection, Sentry alert rules, Supabase RLS at runtime, backup schedule) are flagged as such.
- **Not exhaustive on RLS correctness.** The audit read the migrations and spot-checked policies, but did not run a per-tenant probe. A dedicated RLS fuzz pass is recommended before launch and is not included in the score.
- **Dynamic behavior unverified.** Webhook race conditions, concurrency gaps, and cron timeouts are diagnosed by reading the code; they should be validated with a load-test harness as part of HP-28.
- **Individual findings files** in `.audit/` contain the complete evidence, severity breakdown, and one-line fixes for every finding cited above.
