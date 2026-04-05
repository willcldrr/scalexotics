# Observability & Ops Audit — Velocity Labs

Scope: Next.js 16 + React 19 SaaS at `/var/www/velocity`. Read-only audit of logging, tracing, Sentry config, health checks, metrics, alerting, runbooks, and feature flags.

Severity legend: 🔴 critical / 🟠 high / 🟡 medium / 🟢 info

---

## Top 3 findings (summary)

1. 🔴 **Sentry is initialized but never invoked.** Zero `Sentry.captureException` / `captureMessage` / `setUser` / `setTag` calls exist in `app/**` or `lib/**`. Every catch block uses `console.error` only, so nothing from payments, webhooks, AI, or cron ever reaches Sentry. The SDK is running dead weight.
2. 🔴 **`console.log` leaks tokens, PII, and raw payloads on hot paths.** Notably `app/api/admin/impersonate/route.ts:84` logs refresh-token presence alongside verify result, `app/api/instagram/connect-manual/route.ts:76,97,111,119,127` dumps Meta/Facebook API bodies (which contain page/IG account IDs and error tokens), `app/api/chatbot-test/route.ts:151,183,184,192` logs `extractedData` and `leadData` (customer name/email/phone by the type definition), and `app/api/payments/webhook/route.ts:285,292` logs full SMS/Instagram confirmation bodies that include customer names and booking details.
3. 🔴 **No structured logger, no correlation IDs, no metrics, no runbook, no feature flags.** 245 `console.*` calls across 63 files and not a single JSON logger, request ID, custom metric, kill switch, or `RUNBOOK.md`. A payment webhook failure at 3 a.m. has no traceable breadcrumb trail, no alert, no documented response.

---

## 1. Sentry configuration

### 🔴 F-1 Sentry SDK is initialized but never used as an error sink
- Evidence: `Sentry.captureException|captureMessage|setUser|setTag|addBreadcrumb` → 1 hit, and that hit is `sentry.server.config.ts` itself (the `beforeSend` definition line, not a call site). Every one of the 245 `console.error` sites does not escalate to Sentry.
- File: repository-wide; see e.g. `app/api/payments/webhook/route.ts:329`, `app/api/stripe-webhook/route.ts:83`, `lib/sms-ai.ts:196`, `lib/anthropic.ts:269`.
- Fix: add a thin wrapper `lib/log.ts` that calls both `console.error` and `Sentry.captureException(err, { tags: {...}, extra: {...} })` and replace `console.error` at error sites, or rely on Sentry's `console` integration with an explicit `captureException` on catch blocks for payments/webhooks/AI.

### 🟠 F-2 `beforeSend` PII scrub is regex-based and brittle
- File: `sentry.server.config.ts:26-36`
- Evidence: `JSON.parse(JSON.stringify(event).replace(/email|phone-regex/, "[redacted]"))` — serializes the whole event to a string, regex-scrubs, re-parses. Misses names, addresses, Stripe customer IDs, Supabase JWTs, access tokens, payment link tokens. Also double-encodes unicode/escaped characters so a JSON-escaped email inside a stack frame may slip through.
- Fix: use Sentry's official `denyUrls` + `scrub`/`EventProcessor` helpers and an allowlist approach; add regex for Stripe `sk_`/`pk_` keys, JWTs (`eyJ...`), phone E.164, and Supabase service role prefixes.

### 🟠 F-3 `beforeSend` missing on client and edge configs
- Files: `sentry.client.config.ts:13-22`, `sentry.edge.config.ts:13-20`
- Evidence: only `sentry.server.config.ts` defines `beforeSend`. Browser events and edge-runtime events (middleware.ts errors) are shipped with no PII filter.
- Fix: extract the scrubber into a shared module and apply it in all three configs.

### 🟡 F-4 No `release` tagging, no `dist` tagging
- Files: all three `sentry.*.config.ts`
- Evidence: `Sentry.init` has no `release` field. Without release tagging, regression tracking, "resolved in next release", and source-map upload association all break.
- Fix: add `release: process.env.VERCEL_GIT_COMMIT_SHA` (or `NEXT_PUBLIC_...` on client) to each init; wire Sentry Vercel integration for source maps.

### 🟡 F-5 `tracesSampleRate: 0.1` on low-traffic routes misses slow requests
- Files: `sentry.*.config.ts` (all three)
- Evidence: uniform 10% sampling. Payment-webhook and Stripe-webhook volume is low; at 10% you rarely capture the one trace that matters.
- Fix: use `tracesSampler` to sample webhooks/payments/AI at 1.0 and dashboard reads at 0.05.

### 🟡 F-6 `environment` uses `NEXT_PUBLIC_VERCEL_ENV || "development"` only on client
- File: `sentry.client.config.ts:16`
- Evidence: server uses `VERCEL_ENV || NODE_ENV || "development"`. Mismatch means a preview deploy's client events are tagged `development` if `NEXT_PUBLIC_VERCEL_ENV` isn't exposed.
- Fix: align the env resolution chain across all three configs.

---

## 2. Console logging — security & PII leaks

### 🔴 F-7 Refresh-token presence logged during admin impersonation
- File: `app/api/admin/impersonate/route.ts:84`
- Evidence: `console.log("[Impersonate] verifyOtp result - error:", verifyError, "session:", !!sessionData.session, "refresh_token:", !!sessionData.session?.refresh_token)` — while only a boolean, it logs alongside `verifyError` which on failure frequently contains the raw OTP hash or magiclink URL. Combined with the impersonation audit trail, this is PCI/SOC2-audit fodder.
- Fix: delete the line; the successful-path log is already covered by the impersonation_logs insert right below.

### 🔴 F-8 Instagram/Meta API bodies dumped to logs (tokens + account IDs)
- File: `app/api/instagram/connect-manual/route.ts:76, 97, 111, 119, 127`
- Evidence: `console.log("[IG Connect] User token — found", pages.length, "pages:", JSON.stringify(pages.map(...)))`, `console.log("[IG Connect] me/accounts failed:", JSON.stringify(pagesErrBody))`, `console.log("[IG Connect] me?fields also failed:", JSON.stringify(err))`. Meta error bodies routinely echo back the access token in the `fbtrace_id` context and include `user_access_token_source`. The `pages` object mapping strips access_token in the map callback but the error branches dump the raw FB error payload including any echoed auth params.
- Fix: strip to `console.log("[IG Connect] pages found:", pages.length)`; never `JSON.stringify` a third-party error body.

### 🔴 F-9 Chatbot test route logs extracted PII (name/email/phone) and lead data
- File: `app/api/chatbot-test/route.ts:151, 183, 184`
- Evidence: `console.log("[Chatbot Test] Parsed extractedData:", JSON.stringify(extractedData, null, 2))` — `extractedData` type (line 127-135) includes `name`, `email`, `phone`. Line 184 logs `leadData` which per the `LeadData` type carries `collected_name`, `collected_phone`, `collected_email`.
- Fix: remove or reduce to `hasName: !!extractedData.name, hasEmail: !!extractedData.email` booleans.

### 🔴 F-10 Payments webhook logs full confirmation message bodies
- File: `app/api/payments/webhook/route.ts:285, 292, 310, 321`
- Evidence: `console.log(`Sending ${channel} confirmation:`, confirmationMessage)` — `confirmationMessage` is an AI-generated string containing customer name, vehicle, dates, and deposit amount. Also line 197 `console.log("Creating booking with userId:", userId, "vehicleId:", vehicleId)` logs user ids to stdout (retained by Vercel log drain indefinitely).
- Fix: log `{ bookingId, channel, model }` only, no rendered bodies.

### 🟠 F-11 Chatbot AI raw response logged (first 500 chars)
- File: `app/api/chatbot-test/route.ts:124`
- Evidence: `console.log("[Chatbot Test] Raw AI response:", aiResponse.substring(0, 500))` — contains `[EXTRACTED]{...email, phone...}[/EXTRACTED]` blocks inside the first 500 chars.
- Fix: remove, or log only the length and model.

### 🟠 F-12 SMS webhook logs rejected phone numbers
- File: `app/api/sms/webhook/route.ts:120`
- Evidence: `console.error(\`No user configured for phone number: ${to}\`)` — logs plaintext E.164 into Vercel log drain.
- Fix: log a hash/suffix: `to.slice(-4)`.

### 🟠 F-13 `velocity-ai` route returns raw error message to client
- File: `app/api/velocity-ai/route.ts:56-60`
- Evidence: `return NextResponse.json({ error: "Internal server error", details: error?.message }, { status: 500 })` — Anthropic API errors include request IDs, model IDs, and sometimes prompt excerpts. Not a console-log finding but an observability-adjacent info disclosure.
- Fix: drop `details` field; log server-side via Sentry with the error and return a stable error code.

### 🟡 F-14 OTP insert failures logged with Supabase error objects
- Files: `app/api/auth/signup/route.ts:95`, `app/api/auth/forgot-password/route.ts:67`, `app/api/auth/resend-otp/route.ts:67`, `app/api/auth/verify-otp/route.ts:91`
- Evidence: `console.error("Failed to store OTP:", insertError)` — Supabase errors include the failing SQL hint which on unique-violation echoes the email column value.
- Fix: log only `insertError.code` and `insertError.hint`; never the whole error object.

### 🟡 F-15 Google OAuth callback logs `errorData` from token exchange
- File: `app/api/admin/crm/oauth/google/callback/route.ts:91, 111`
- Evidence: Google token-exchange failures return `error_description` that may contain the authorization code fragment.
- Fix: log only `error` code field.

### 🟡 F-16 Telegram webhook logs full Telegram API error bodies
- File: `app/api/telegram/webhook/route.ts:70`
- Evidence: `console.error("Telegram API error:", error)` where `error` is the parsed Telegram response, potentially containing chat ids / usernames.
- Fix: redact before logging.

### 🟡 F-17 SMS cost logging reveals spend per message
- File: `app/api/sms/webhook/route.ts:163`
- Evidence: not PII but exposes unit economics to anyone with Vercel log access. Minor.
- Fix: move to a metrics counter instead of a log line.

---

## 3. Structured logging

### 🔴 F-18 No structured logger anywhere in the codebase
- Evidence: grep for `pino|winston|bunyan|logger\.(info|error|warn|debug)` across `app/**`, `lib/**` → zero source hits. 245 `console.*` calls in 63 files.
- Files: entire `app/api/**`, `lib/**`. Examples: `app/api/payments/webhook/route.ts` has 17 `console.*` lines, `lib/payment-link.ts` has 11, `lib/instagram.ts` has 11, `lib/sms-ai.ts` has 8.
- Impact: cannot query logs by `userId`, `route`, `bookingId`, or `level`. Alerting on "payment webhook error rate > 1%" is impossible without structured fields.
- Fix: introduce `lib/log.ts` exporting `log.info/warn/error(msg, ctx)` that emits single-line JSON (`{level, ts, msg, route, requestId, ...ctx}`) to stdout (Vercel picks it up) and also calls `Sentry.captureException` on error. Replace console.* progressively, starting with payments/webhooks/AI.

---

## 4. Distributed tracing & correlation IDs

### 🔴 F-19 No request IDs, no correlation propagation
- Evidence: grep for `x-request-id|correlation|requestId|traceId` across source → 2 source hits (`app/dashboard/dashboard-shell.tsx`, `lib/crm/google-calendar.ts`, both for Google Calendar's own trace field, not an HTTP request id).
- File: `middleware.ts:1-20` — middleware does auth only, does not inject or read `x-request-id`.
- Impact: when Stripe webhook → Supabase insert → Twilio send chain fails, you cannot correlate the three log entries. Sentry tracing is at 10% so usually absent.
- Fix: in `middleware.ts` generate `crypto.randomUUID()` into `request.headers['x-request-id']` if absent, set it on response, pass via AsyncLocalStorage to downstream calls, attach as Sentry tag.

### 🟠 F-20 No trace propagation into Supabase/Stripe/Anthropic/Twilio clients
- Evidence: `lib/anthropic.ts`, `lib/payment-link.ts`, `lib/instagram.ts` — none attach a `X-Request-Id` or Sentry span to outbound fetches.
- Fix: wrap external clients with a fetch interceptor that injects the current request id from AsyncLocalStorage and creates a Sentry span.

---

## 5. Health checks

### 🟢 F-21 `/api/health` is actually reasonable
- File: `app/api/health/route.ts:1-78`
- Evidence: checks Supabase env vars, performs bounded `head: true` count query on `webhook_events` with 3 s timeout, returns 503 on failure, structured `{ status, checks, elapsed_ms }` response. No auth, no side effects. Good.
- No action required.

### 🟡 F-22 Health check does not probe Stripe, Twilio, Anthropic, or Instagram
- File: `app/api/health/route.ts:20-78`
- Evidence: only Supabase is probed. A failed Stripe key rotation or expired Meta long-lived token will not surface until the first user-impacting request.
- Fix: add a `/api/health/deps` endpoint that probes Stripe `balance.retrieve`, Twilio `accounts.fetch`, Anthropic with a 1-token ping (or cached reachability), Meta `/me`. Keep the cheap `/api/health` unchanged for the fast loop, add the deeper one for a 5-minute cadence.

### 🟡 F-23 No `/live` / `/ready` split
- Evidence: only `app/api/health/route.ts` exists.
- Impact: container orchestrators (if this migrates off Vercel) can't distinguish "process up" from "dependencies healthy". Not a blocker on Vercel.
- Fix: add `/api/live` returning 200 unconditionally and keep `/api/health` as readiness.

---

## 6. Application metrics

### 🔴 F-24 No custom metrics — request rate, error rate, p95/p99 all invisible
- Evidence: grep for `metrics|statsd|prometheus|histogram|counter\.inc` → 0 source hits (dashboard UI strings and `.next` artifacts only).
- Impact: you cannot answer "what is the p99 latency of `/api/payments/webhook`?" or "did the error rate of `/api/velocity-ai` spike after the last deploy?" without adding this from scratch during the incident.
- Fix: enable Vercel Analytics Speed Insights (already have `@vercel/analytics`) plus Sentry performance monitoring with higher sample rate on critical routes, or emit Sentry metrics (`Sentry.metrics.increment('payment.webhook.success')`). Add a minimum set: `payment.webhook.{success,error,amount_mismatch}`, `ai.request.{success,error,cost_usd}`, `sms.send.{success,error}`.

### 🟠 F-25 Vercel Analytics is client-side page-view only
- Evidence: `package.json` includes `@vercel/analytics` but no `@vercel/speed-insights` or server-side instrumentation.
- Fix: add `@vercel/speed-insights/next` to capture real-user Core Web Vitals, and Vercel Log Drains to a hosted log backend (Datadog/Axiom/Logtail).

---

## 7. Alerting hooks

### 🔴 F-26 No alerting configuration visible in repo
- Evidence: no `sentry.yml`, no `alertmanager.yml`, no PagerDuty / Opsgenie integration file. `vercel.json` has two cron entries only, no monitor config.
- Impact: unknown whether any Sentry alerts exist — absent code evidence, assume none.
- Fix: document the Sentry alert rules out-of-band in `docs/ops/ALERTS.md`, set at minimum: (a) any unhandled server exception on `/api/payments/webhook`, `/api/stripe-webhook`, `/api/instagram/webhook`, `/api/telegram/webhook`; (b) error rate > 2% over 5 min on any route; (c) health-check 503 for > 3 min (external uptime monitor — see F-27).

### 🟠 F-27 No external uptime monitor configuration committed
- Evidence: no BetterUptime / UptimeRobot / Checkly config.
- Fix: add a Checkly check-as-code file or document the external monitor hitting `/api/health` every 30 s with a 2-failure alert threshold.

---

## 8. Runbooks & incident docs

### 🔴 F-28 No runbook, no incident playbook, no ops docs
- Evidence: repo root contains `AI_AGENT_AUDIT.md`, `VELOCITY_LABS_PROJECT_REPORT.md`, `theme.md`. No `RUNBOOK.md`, `INCIDENT.md`, `docs/ops/`, `docs/runbooks/`. The `README` is absent (not found in root).
- Impact: on-call has no documented procedure for "Stripe webhook backlog", "Supabase down", "Anthropic rate limit", "Meta long-lived token expired", "Twilio A2P 10DLC block".
- Fix: create `docs/ops/RUNBOOK.md` with one section per external dependency: symptoms → diagnosis commands → rollback/mitigation → escalation.

---

## 9. Feature flags / kill switches

### 🔴 F-29 No feature flag or kill-switch infrastructure
- Evidence: grep for `featureFlag|feature_flag|kill.?switch|unleash|launchdarkly|posthog.isFeatureEnabled` across source → 0 hits.
- Impact: a misbehaving AI model (`/api/velocity-ai`, `/api/chatbot-test`, `/api/cron/follow-up-leads`), a runaway SMS bulk send (`/api/sms/bulk`), or a bot loop on Instagram/Telegram cannot be disabled without a code deploy. The follow-up-leads cron in particular calls Anthropic inside a loop (`app/api/cron/follow-up-leads/route.ts:208`) — an Anthropic price spike has no circuit breaker.
- Fix: add a minimal env-var-backed `lib/flags.ts` with `FEATURE_AI_SMS`, `FEATURE_AI_FOLLOWUP`, `FEATURE_INSTAGRAM_BOT`, `FEATURE_TELEGRAM_BOT`, `FEATURE_BULK_SMS`, each defaulting on; gate the relevant route entrypoints. Graduate to a proper flag service (PostHog, Statsig) later.

### 🟠 F-30 Follow-up leads cron has no per-run spend cap
- File: `app/api/cron/follow-up-leads/route.ts:107-294`
- Evidence: iterates leads, calls Anthropic once per lead, catches individual errors but has no maximum-lead-count or maximum-cost-per-run guard.
- Fix: add `MAX_LEADS_PER_RUN` env var, sum `aiResult.cost.totalCost` across iterations, abort if it exceeds `MAX_COST_USD_PER_RUN`.

---

## Appendix: file-by-file console counts (source only)

```
app/api/admin/users/delete/route.ts      24
app/api/chatbot-test/route.ts            20
app/api/payments/webhook/route.ts        17
app/api/stripe-webhook/route.ts          10
app/api/cron/follow-up-leads/route.ts    10
app/api/instagram/webhook/route.ts        8
app/api/instagram/callback/route.ts       6
app/api/instagram/connect-manual/route.ts 7
app/api/telegram/webhook/route.ts         6
app/api/sms/webhook/route.ts              7
lib/payment-link.ts                      11
lib/instagram.ts                         11
lib/sms-ai.ts                             8
lib/telegram-bot-ai.ts                    3
```
245 total across 63 source files.

## Appendix: Sentry call-site audit

```
grep Sentry.(captureException|captureMessage|setUser|setTag|addBreadcrumb) → 1 file
  sentry.server.config.ts  (init only, no runtime calls)
```
Zero application-level Sentry usage.
