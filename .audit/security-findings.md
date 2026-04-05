# Velocity Labs — Security Audit Findings

Auditor: Security Auditor (automated review)
Date: 2026-04-05
Scope: `app/`, `lib/`, `middleware.ts`, `next.config.mjs`, `vercel.json`, `supabase/migrations/`, `package.json`, `.env*`
Method: Read-only source review + `npm audit`

Severity key: CRITICAL | HIGH | MEDIUM | LOW
`npm audit` reports 0 known CVEs in the lockfile.

---

## CRITICAL

### C1. Live production secrets checked into the working tree in `.env`
- File: `/var/www/velocity/.env` (lines 1–42)
- Evidence: File contains *live* credentials:
  - `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...` (full JWT, role=service_role)
  - `STRIPE_SECRET_KEY=sk_live_51Rz8ZNQRshBzG2xk...`
  - `STRIPE_WEBHOOK_SECRET=whsec_rIn86FyWg0DxQ2JU4MNzlENeM92UNcsF`
  - `TWILIO_AUTH_TOKEN=c8f1ed46dda383e83321005e947863a8`
  - `ANTHROPIC_API_KEY=sk-ant-api03-A7tb2Ag...`
  - `RESEND_API_KEY=re_2XUsu5Ey_...`
  - `OPENROUTER_API_KEY=sk-or-v1-bc5a0c98...`
  - `META_APP_SECRET`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_ACCESS_TOKEN`, `CRON_SECRET`
- Fix: Immediately rotate every secret above, remove `.env` from the deploy directory, ensure it is listed in `.gitignore`, and move secrets to the hosting provider's secret manager (Vercel env vars). Audit for any prior git/backup exposure.

### C2. Admin session-restore endpoint issues a session for any UUID without verifying the caller
- File: `/var/www/velocity/app/api/admin/restore-session/route.ts` (lines 23–76)
- Evidence: Handler accepts `{ adminUserId }` from the request body and, after confirming that UUID has `is_admin=true` in `profiles`, calls `supabase.auth.admin.generateLink` + `verifyOtp` and returns the resulting `access_token` and `refresh_token`. There is no check that the caller is the same admin — there is no `supabase.auth.getUser()` and no audit log. Although the `/api/admin/*` middleware gate requires *some* admin cookie to hit the route, any admin (or anyone who steals any admin cookie) can submit any other admin's UUID and be handed a full session for that user. This is lateral admin takeover / impersonation without audit trail.
- Fix: Call `supabase.auth.getUser()` first, require the cookie-authenticated user to be the same `adminUserId` (or otherwise tied to a prior impersonation record in `impersonation_logs`), and write an audit-log row on every call.

### C3. Instagram OAuth `state` parameter is an unauthenticated base64 blob carrying `userId`
- File: `/var/www/velocity/app/api/instagram/callback/route.ts` (lines 40–55)
- Evidence:
  ```ts
  const storedState = request.cookies.get("instagram_oauth_state")?.value
  if (state !== storedState) { ... }
  const decoded = JSON.parse(Buffer.from(state, "base64").toString())
  userId = decoded.userId
  ```
  The `state` is both the CSRF token *and* the attacker-controlled carrier of the `userId` that the callback uses to attach the Instagram access token to a Supabase user. An attacker who starts an OAuth flow with their own IG account can craft `state = base64({userId: <victim-uuid>})`, set it as the `instagram_oauth_state` cookie in their own browser (same-site cookie they control), complete the flow, and the callback will persist the attacker's Instagram access token against the victim's account — hijacking the victim's Instagram integration and inbound DMs.
- Fix: Do not derive `userId` from `state`. Resolve the current user via `supabase.auth.getUser()` inside the callback, and use `state` solely as a random CSRF token compared against the signed cookie.

---

## HIGH

### H1. `lib/safe-fetch.ts` is not an SSRF guard despite its name
- File: `/var/www/velocity/lib/safe-fetch.ts` (lines 24–42)
- Evidence: `safeFetch` only adds an `AbortSignal.timeout`; it performs no URL host validation, no scheme allow-list, no private-IP blocking. Current call sites pass fixed Graph API URLs, but the naming is a trap for future callers.
- Fix: Either rename to `timedFetch`, or add host validation that rejects `127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, `::1`, `fc00::/7`, and non-http(s) schemes before calling `fetch`.

### H2. SSRF via `POST /api/calendar/sync` using user-controlled `turo_ical_url`
- File: `/var/www/velocity/app/api/calendar/sync/route.ts` (lines 74–76) + `lib/ical-parser.ts` (lines 129–142)
- Evidence: Authenticated users store `turo_ical_url` on their own `vehicles` rows; `fetchAndParseIcal(vehicle.turo_ical_url)` issues a server-side `fetch()` with no scheme/host validation, letting a tenant point the URL at `http://169.254.169.254/latest/meta-data/`, internal admin hosts, etc. Response body is parsed and stored, and errors may return upstream status text in JSON.
- Fix: Validate `turo_ical_url` on write and before fetch — require `https:`, resolve DNS and reject private/link-local/loopback IPs, and use a blocking HTTP client that re-validates after redirects.

### H3. `deposit_portal_config.stripe_secret_key` and `businesses.stripe_secret_key` stored in plaintext
- Files:
  - `/var/www/velocity/supabase/migrations/20260319_deposit_portal_config.sql:10` — `stripe_secret_key TEXT`
  - `/var/www/velocity/supabase/migrations/20260318_create_businesses.sql:18` — `stripe_secret_key TEXT`
  - Read back at `/var/www/velocity/app/api/payments/create-checkout/route.ts:63` and `/var/www/velocity/app/api/checkout/create/route.ts:32`
- Evidence: Per-tenant Stripe *secret* keys are written to Postgres as unencrypted text and returned to application code on every checkout. Any RLS bypass, backup leak, or service-role key compromise (see C1) leaks every customer's Stripe account.
- Fix: Encrypt at rest using `pgsodium`/Supabase Vault or an app-side KMS wrapper; never select the plaintext column in list/detail admin queries; restrict the column to a secured accessor function.

### H4. `instagram_connections.access_token` stored in plaintext
- File: `/var/www/velocity/supabase/migrations/20260322_instagram_connections.sql:10,49`
- Evidence: Long-lived Meta page access tokens are stored as `TEXT NOT NULL` and read by `/api/instagram/webhook/route.ts` and the token-refresh cron. Same exposure profile as H3.
- Fix: Encrypt via `pgsodium`/Vault; rotate tokens on decrypt failure; never return the column to the browser.

### H5. `api_keys` compared as plaintext → implies plaintext storage of full-access API keys
- File: `/var/www/velocity/lib/survey-auth.ts` (lines 73–85)
- Evidence: `.from("api_keys").select("...").eq("key", apiKey)` — direct equality match on the raw key means the DB holds the plaintext key. A DB snapshot or RLS bypass grants attackers every tenant's public-widget API key.
- Fix: Store only `sha256(key)` (or argon2) in `api_keys`, compare hashes, and show the plaintext key to the user exactly once at creation.

### H6. OTP brute-force: failed attempts are only counted on expiry, and rate limit is shared per-IP
- Files:
  - `/var/www/velocity/app/api/auth/verify-otp/route.ts` (lines 12–82)
  - `/var/www/velocity/app/api/auth/reset-password/route.ts` (lines 12–92)
- Evidence: Both handlers look up the OTP with `.eq("code", code).eq("used", false)`. On an *invalid* code (not found) they return 400 without incrementing `failed_attempts`. The `failed_attempts` increment only runs inside the *expired* branch. The limiter is 10/min per IP for verify-otp and 5/min per IP for reset-password, giving an attacker ~600 guesses/hour against a 1,000,000-space 6-digit code per targeted account — feasible to brute-force over days, especially since the same IP limit is shared across victims and has no per-email binding.
- Fix: Increment `failed_attempts` on every failed match keyed by `(email, latest code row)`; lock the email after N failures; add per-email rate limiting; shorten OTP TTL.

### H7. In-memory rate limiter is bypass-by-design in serverless/multi-instance deployments
- File: `/var/www/velocity/lib/rate-limit.ts` (lines 16, 19–26)
- Evidence: `const rateLimitStore = new Map<string, ...>()` + `setInterval(..., 60000)`. Every serverless cold start (and every parallel Lambda/Edge instance) gets its own map, so attackers can parallelize to evade limits that the code relies on to brake brute-force (H6) and bulk SMS abuse.
- Fix: Back with Upstash Redis / `@upstash/ratelimit` or the Supabase DB; keep the in-memory path only for local dev.

### H8. `/api/admin/*` middleware gate relies on service-role Supabase lookup in the edge runtime
- File: `/var/www/velocity/lib/supabase/middleware.ts` (lines 5–11, 43–62)
- Evidence: The middleware instantiates a `SUPABASE_SERVICE_ROLE_KEY` client and runs it on every request to check `is_admin`. Next.js middleware runs in the edge runtime — the service-role JWT is loaded into the edge bundle and into every edge invocation. A logic bug or edge-runtime bundling regression can ship or log it. Additionally, the service-role key is loaded for *all* requests matched by the middleware config (including `/dashboard/:path*`, `/login`, etc.), multiplying the blast radius.
- Fix: Perform admin checks with the cookie-authenticated `createServerClient` (RLS-aware) instead of service role, or move the admin gate into a Node-runtime server component/handler. Never ship `SUPABASE_SERVICE_ROLE_KEY` to edge bundles.

---

## MEDIUM

### M1. `POST /api/sms/send` lets any authenticated user write messages for arbitrary `leadId`
- File: `/var/www/velocity/app/api/sms/send/route.ts` (lines 52–69)
- Evidence: The handler validates `leadId` is a UUID but never checks that the lead belongs to `user.id` before `insert({ user_id: user.id, lead_id: leadId, ... })`. A tenant can forge outbound-message rows on another tenant's lead if they know the UUID, and send SMS to arbitrary `to` numbers on the platform's Twilio account.
- Fix: `SELECT id FROM leads WHERE id = :leadId AND user_id = :user_id` before insert; cap per-user/day Twilio spend; validate `to` against E.164.

### M2. Supabase filter-string injection in `/api/sms/bulk` `.or()` clause
- File: `/var/www/velocity/app/api/sms/bulk/route.ts` (lines 90–96)
- Evidence: `.or(`phone.eq.${phone},phone.eq.+${phone.replace(/^\+/, "")}`)` — `phone` is user-supplied (only length-validated by zod). A value like `x),is_admin.eq.true,phone.eq.(y` can break out of the intended filter clause in PostgREST. Combined with `user_id` scoping on the query, it likely only returns the attacker's own rows, but it is still an unsafe pattern that has previously led to cross-tenant disclosure in PostgREST.
- Fix: Build the `or` filter with parameterized helpers, or strictly validate phone to `/^\+?[0-9]{10,15}$/` before interpolation. Use `.in('phone', [p1, p2])` instead.

### M3. `POST /api/bookings/checkout` has no authentication or signature on bookingId
- File: `/var/www/velocity/app/api/bookings/checkout/route.ts` (lines 15–88)
- Evidence: Anyone who knows (or guesses) a `bookingId` UUID can create Stripe checkout sessions against the platform Stripe key and trigger `UPDATE bookings SET stripe_checkout_session_id` for any tenant's booking. The amount is still taken from the DB so fraud is bounded, but the endpoint can be used to spam Stripe and to overwrite checkout session IDs on legitimate bookings (denial of payment).
- Fix: Require either a Supabase auth session or a short-lived signed token tied to the bookingId (as `payment-link.ts` already does for other flows).

### M4. `POST /api/admin/users/reset-password` allows admins to set passwords as short as 6 characters
- File: `/var/www/velocity/app/api/admin/users/reset-password/route.ts` (lines 49–56)
- Evidence: `if (newPassword.length < 6)` — 6-character minimum for an admin-driven password set, weaker than the self-service reset flow (8 char + letter + number) in `auth/reset-password/route.ts:26-38`.
- Fix: Enforce the same (or stronger) policy as the user-facing flow; require the target user to re-set on next login.

### M5. Admin can create/update businesses with other tenants' Stripe secret keys via JSON body
- File: `/var/www/velocity/app/api/admin/businesses/route.ts` (lines 84–85, 130–131)
- Evidence: POST and PATCH accept raw `body.stripe_secret_key` with no validation on key format and no encryption before insert. Combined with H3, this means admins routinely handle live `sk_live_...` keys over JSON and log them via the standard Next error/console path.
- Fix: Never send plaintext Stripe keys through this endpoint; proxy through Stripe Connect, or accept a short-lived Stripe restricted-key challenge and write only the hash.

### M6. CSP allows `'unsafe-inline'` and `'unsafe-eval'` in `script-src`
- File: `/var/www/velocity/next.config.mjs` (line 80)
- Evidence: `"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com ..."` — removes most of CSP's XSS mitigation.
- Fix: Migrate to nonce-based CSP (`strict-dynamic` + per-request nonce). Next 16 supports nonces via middleware headers.

### M7. HTML email rendering interpolates user-supplied `fullName` / `name` without escaping
- Files:
  - `/var/www/velocity/app/api/auth/signup/route.ts` (lines 115–131) — `Hi ${name}` directly into HTML
  - `/var/www/velocity/app/api/admin/users/reset-password/route.ts` (lines 95–105) — same pattern
- Evidence: `fullName` is controlled by whoever calls `/api/auth/signup`. A malicious sign-up can inject HTML/links into subsequent Resend emails delivered to that address (self-XSS-in-email, phishing pivot, email reputation abuse).
- Fix: HTML-escape interpolated values (or pass through a template engine that escapes by default). Also validate `fullName` length/charset on signup.

### M8. `lead-capture` CORS is wide open (`Access-Control-Allow-Origin: *`)
- File: `/var/www/velocity/app/api/leads/capture/route.ts` (lines 36–40)
- Evidence: Widget endpoint returns `*`. This is intentional for third-party embeds, but combined with the `X-API-Key` plaintext scheme in H5, any site that loads the widget exposes the key to any origin.
- Fix: Scope CORS to the `apiKeyDomain` column already present in `api_keys`; reject cross-origin requests whose `Origin` header doesn't match the key's registered domain.

### M9. `/api/admin/impersonate` logs refresh-token *presence* and full verifyOtp result object
- File: `/var/www/velocity/app/api/admin/impersonate/route.ts` (line 84)
- Evidence: `console.log("[Impersonate] verifyOtp result - error:", verifyError, "session:", !!sessionData.session, "refresh_token:", !!sessionData.session?.refresh_token)` — not the token value, but leaks sensitive auth flow telemetry to shared log sinks (Sentry, Vercel logs). If the `verifyError` object ever contains the token or hashed link, it lands in logs.
- Fix: Remove the log line or reduce to a boolean success flag.

### M10. `access_codes` lookup uses plain equality (`.eq("code", submittedCode)`)
- File: `/var/www/velocity/app/api/verify-access/route.ts` (lines 34–39)
- Evidence: Access codes are stored as plaintext and compared with non-constant-time equality. Also the fallback path (`validCodes.includes(submittedCode)`) uses `includes`, which is non-constant-time and allows timing distinguishers.
- Fix: Store a hash; compare with `crypto.timingSafeEqual`.

### M11. Cron auth uses non-constant-time string compare
- Files:
  - `/var/www/velocity/app/api/cron/refresh-instagram-tokens/route.ts:30` — `if (authHeader !== \`Bearer ${cronSecret}\`)`
  - `/var/www/velocity/app/api/cron/follow-up-leads/route.ts:56` — same
  - `/var/www/velocity/app/api/cron/calendar-sync/route.ts:24–` (not read fully) — same pattern likely
- Evidence: Timing-exploitable bearer comparison.
- Fix: Use `crypto.timingSafeEqual` on equal-length buffers.

### M12. `AI_AGENT_AUDIT.md` contains documented sample of a live-format Stripe key string
- File: `/var/www/velocity/AI_AGENT_AUDIT.md` (lines 205, 522)
- Evidence: `sk_live_AAA`, `STRIPE_SECRET_KEY=sk_live_...` — only placeholders, not real keys, but the document itself is a developer artifact that should not ship in production builds.
- Fix: Move developer docs out of the deployable tree or exclude via `.vercelignore`.

---

## LOW

### L1. `package.json` `overrides.lodash: ^4.18.1`
- File: `/var/www/velocity/package.json:98–100`
- Evidence: `4.18.1` is not a published lodash version (latest 4.17.x). Override is inert today but could silently fail to pin once a real `4.18.x` ships.
- Fix: Use `^4.17.21` or remove.

### L2. `next.config.mjs` — `ignoreBuildErrors: process.env.NODE_ENV === 'development'`
- File: `/var/www/velocity/next.config.mjs:3–6`
- Evidence: Safe in prod (evaluates to false), but the comment ("Set to false before production to catch type errors") is stale.
- Fix: Remove the toggle entirely; TS errors should always fail the build.

### L3. `console.log` of AI model/cost on SMS webhook path
- File: `/var/www/velocity/app/api/sms/webhook/route.ts:163`
- Evidence: Logs per-message inference cost with enough context to be correlated to a lead. Low severity but noise in Sentry.
- Fix: Move to a structured metric instead of log.

### L4. `/api/signup/business` upsert with `ignoreDuplicates:true` relies on an existing profile row to prevent `is_admin` downgrade races
- File: `/var/www/velocity/app/api/signup/business/route.ts:41–51`
- Evidence: If the DB trigger that creates the `profiles` row on auth user creation ever fails, an authenticated admin calling this endpoint would successfully insert themselves with `is_admin:false`, downgrading their own account. Not exploitable across tenants, but a fragile invariant.
- Fix: Never pass `is_admin` on upsert; rely on DB default/trigger.

### L5. `twilio_webhook_url` derived from env may be set incorrectly → Twilio signature bypass in that environment only
- File: `/var/www/velocity/app/api/sms/webhook/route.ts:46`
- Evidence: `process.env.TWILIO_WEBHOOK_URL || \`${process.env.NEXT_PUBLIC_APP_URL}/api/sms/webhook\`` — if either env is wrong in a given environment, `twilio.validateRequest` silently fails-closed (returns 403), not a bypass. Listed for completeness.
- Fix: Assert both env vars at boot; alert on 403 rate.

### L6. `/api/telegram/webhook` sends AI-generated text with `parse_mode: "Markdown"`
- File: `/var/www/velocity/app/api/telegram/webhook/route.ts:63`
- Evidence: Telegram's legacy `Markdown` parser can fail on unbalanced `*`/`_` and leak content. Not a security issue for the bot owner, but may cause delivery errors → silent drops.
- Fix: Use `MarkdownV2` with explicit escaping, or `HTML`.

### L7. Stripe secret key selected into admin GET list response
- File: `/var/www/velocity/app/api/admin/businesses/route.ts:48–51`
- Evidence: The GET select omits `stripe_secret_key`, which is good — but the PATCH path (lines 107–161) echoes nothing back. No active leak. Noting to ensure future changes don't regress.
- Fix: Add a linter rule / SELECT helper that excludes `stripe_secret_key` columns globally.

---

## Top-3 executive summary

1. **Live production secrets are sitting in `/var/www/velocity/.env`** (C1) — full Supabase service-role JWT, `sk_live_` Stripe key, Twilio auth token, Anthropic key, Meta/Instagram app secret, Resend key, and `CRON_SECRET` are all present in plaintext inside the working directory of a production host. These must be treated as compromised and rotated before anything else.
2. **`/api/admin/restore-session` hands out a valid access+refresh token for any UUID that happens to be flagged `is_admin`** with no check that the caller *is* that admin (C2). The upstream middleware only requires "some admin cookie," so any admin can laterally take over any other admin's account and no audit row is written. Combined with the plaintext Stripe secret keys stored per-tenant (H3), this is the fastest path from a single admin credential to full payment-processor takeover.
3. **The Instagram OAuth callback trusts the `state` parameter as both the CSRF token and the `userId` carrier** (C3), and the `turo_ical_url` calendar-sync endpoint fetches arbitrary URLs server-side with no private-IP filter (H2) — together they mean (a) inbound Instagram DMs and access tokens can be bound to a victim's account by an attacker who completes their own OAuth flow, and (b) any authenticated tenant can pivot the server into the internal network / cloud metadata service. `lib/safe-fetch.ts` (H1) does *not* sandbox these calls despite its name.
