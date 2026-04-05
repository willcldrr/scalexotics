# Testing & Quality Audit — Velocity Labs

**Auditor:** Testing & Quality
**Scope:** `/var/www/velocity` (Next.js 16 + React 19 + Vitest)
**Date:** 2026-04-05
**Mode:** Read-only

---

## Executive summary

- **Estimated coverage: < 1 %** of production code.
- **Top 3 untested critical paths:**
  1. Stripe webhooks (`app/api/stripe-webhook/route.ts`, `app/api/payments/webhook/route.ts`) — money movement, amount-mismatch checks, idempotency.
  2. SMS AI engine (`lib/sms-ai.ts`, 703 lines) — extraction, state mutation, payment-link auto-send.
  3. Lead capture & conversion (`app/api/leads/capture/route.ts`, 359 lines) — zod validation, CORS, duplicate-merge, A2P bypass branch.
- **Biggest testing risk:** the entire money path (checkout → Stripe webhook → booking + lead mutation) has **zero automated test coverage** and relies on environment-dependent assertions (amount comparison, duplicate delivery, amount mismatch in multi-currency app hardcoded to `usd`). A single refactor regression silently issues wrong bookings or double-charges customers.

---

## Coverage estimate & method

| Metric | Count |
|---|---|
| Test files (`tests/**/*.test.ts`) | **2** |
| Production source files (`app/**`, `lib/**`, `components/**`, `.ts`/`.tsx`, excluding tests) | **225** (`lib/app` only; 282 including `components/`) |
| API route handlers (`app/api/**/route.ts`) | **62** |
| `lib/` modules | **25** |
| Lines in 4 largest lib files alone (`sms-ai`, `telegram-bot-ai`, `payment-link`, `anthropic`) | **2,009** |

**Method:** file-ratio estimate. Only two test files exist — `tests/ai/personalities.test.ts` and `tests/ai/guardrails.test.ts` — both of which exercise a single module each (`lib/ai/personalities.ts` at 133 LOC and `lib/ai/guardrails.ts` at 71 LOC). They are **structural string-match assertions**, not behavioral tests (see finding T-03). That is roughly 204 LOC of tested surface area out of ~15,000 LOC in `app/api` + `lib`, i.e. **~1.3 % by LOC, effectively < 1 % when weighted by behavioral value**. There is no component test (JSDOM not even configured — `vitest.config.ts:12` hard-codes `environment: "node"`), no integration test, no e2e runner (no Playwright/Cypress present), and no contract tests. `vitest.config.ts:13-16` configures coverage reporters but no threshold, so `npm run test:coverage` will always succeed regardless of numbers.

---

## Findings

### T-01 🔴 Stripe webhook has zero tests despite handling money, idempotency, amount validation, and multi-path state mutation
- **File:** `app/api/stripe-webhook/route.ts` (170 lines), `app/api/payments/webhook/route.ts` (341 lines)
- **Evidence:** Both files compute `expectedAmountCents = Math.round(X * 100)` and short-circuit with `return NextResponse.json({ received: true })` on mismatch (`stripe-webhook/route.ts:66,110,143`; `payments/webhook/route.ts:203`). On mismatch the handler returns **200** and leaves `markWebhookEventProcessed` uncalled — the idempotency row stays in `received` state forever. No test pins this behavior. Additionally, `payments/webhook/route.ts:329-334` calls `markWebhookEventProcessed(..., "failed")` inside the catch but the outer `try` covers only the booking-create branch; signature-verification / lookup errors silently succeed.
- **Fix (1 line):** add `tests/api/stripe-webhook.test.ts` that mocks `stripe.webhooks.constructEvent` + a supabase double and asserts on: duplicate claim, amount mismatch, `dashboard_invoices` vs `client_invoices` path selection, and booking-deposit path.

### T-02 🔴 `lib/sms-ai.ts` (703 LOC) — core AI orchestration — has no tests at all
- **File:** `lib/sms-ai.ts`
- **Evidence:** Functions under test: `generateAIResponse` (247 lines of imperative state mutation, `lib/sms-ai.ts:104-351`), `parseAIResponseForData` (87 lines, regex + JSON.parse of model output, `lib/sms-ai.ts:487-574`), `generatePaymentLink` (retry loop with `safeFetch`, `lib/sms-ai.ts:576-642`), `findOrCreateLead` (`:644`), `buildChatMessages` (`:458`), `sanitizeCustomerMessage` (`:14`). Every one of these is a mutation path (DB writes, Stripe-link generation, lead-status progression) and none of them is exercised by any test file. `parseAIResponseForData` silently swallows `JSON.parse` failures (`:544 console.error("Failed to parse extracted data:", e)`) — a malformed `[EXTRACTED]` block from the LLM makes `cleanResponse` = the raw response including the literal `[EXTRACTED]…[/EXTRACTED]` markup, which is then sent to customers.
- **Fix:** add `tests/lib/sms-ai.test.ts` exercising `parseAIResponseForData` with golden-file LLM outputs (well-formed, malformed JSON, missing block, partial fields), and `sanitizeCustomerMessage` with attack strings.

### T-03 🟠 Existing `tests/ai/*` tests are structural, not behavioral — false sense of coverage
- **File:** `tests/ai/guardrails.test.ts:11-67`, `tests/ai/personalities.test.ts:16-51`
- **Evidence:** Every assertion is either `expect(GUARDRAILS_BLOCK).toContain("STRING")` or `expect(buildPersonalityBlock(x)).toContain("y")`. The comment at `guardrails.test.ts:4-9` is explicit: *"These don't validate model behavior … they just make sure the block can't be accidentally gutted."* They are a **string-regression tripwire**, not a test of the module's job (which is to block prompt injection). If the guardrail text is semantically neutered but keeps the required keywords, every test passes. `personalities.test.ts:28-32` tests voice distinctness by *string hash*; two voices that differ by one whitespace character pass. No adversarial input is fed, no LLM round-trip is mocked or asserted.
- **Fix:** rename file to `guardrails.strings.test.ts`, add a separate `guardrails.behavior.test.ts` that mocks `generateResponse` with adversarial prompts and asserts the model-instruction scaffolding routes them through the refusal branch.

### T-04 🔴 No idempotency on Telegram webhook — duplicate `update_id` will be processed twice
- **File:** `app/api/telegram/webhook/route.ts:77-144`
- **Evidence:** The handler reads `update.update_id` (schema at `:27`) but **never calls `claimWebhookEvent`**. By contrast, `stripe-webhook/route.ts:41` and `sms/webhook/route.ts:111` both gate on idempotency. Telegram retries on any non-200 response for 24 h; any transient supabase blip causes duplicate `create_booking` / `update_vehicle_status` tool executions. Also — no tests.
- **Fix:** call `claimWebhookEvent("telegram", String(update.update_id), "message")` before `processMessage`.

### T-05 🔴 No idempotency on Instagram webhook either
- **File:** `app/api/instagram/webhook/route.ts:111-142`
- **Evidence:** POST handler has signature verify + async `processInstagramMessage` dispatch, but no `claimWebhookEvent` call anywhere in the file (grep: `claimWebhookEvent` absent). Meta retries aggressively; the async dispatch at `:131` means the response goes out before processing, so any double delivery re-runs the whole AI / payment-link flow. `parseInstagramWebhook` result has no `message.mid` idempotency key captured.
- **Fix:** claim on `message.mid` (Instagram message id) before `saveMessage`.

### T-06 🔴 Bulk SMS and bulk bookings have no tests; bulk SMS can partial-fail silently with wrong error attribution
- **File:** `app/api/sms/bulk/route.ts:60-83`, `app/api/bookings/bulk/route.ts:50-83`
- **Evidence:** `sms/bulk/route.ts:77-80` pushes `{ recipient: "unknown", error: ... }` — the audit log loses *which phone number failed* because the error loop doesn't carry the original index. No test covers a 100-recipient batch or partial-failure semantics. Bulk bookings (`bookings/bulk/route.ts`) computes `failureCount = bookingIds.length - successCount` from `data?.length ?? 0`, which silently masks RLS-filtered rows as "failures" indistinguishable from DB errors.
- **Fix:** change `errors.push({ recipient: recipients[i], … })` using index; add a `tests/api/bulk.test.ts` with 3-recipient partial-fail fixture.

### T-07 🔴 Admin impersonation has no tests — security-critical auth bypass path
- **File:** `app/api/admin/impersonate/route.ts:19-114`
- **Evidence:** The route validates a Bearer token, checks `profiles.is_admin`, and then calls `supabase.auth.admin.generateLink` + `verifyOtp` to mint a full session for another user (`:68-83`). It then returns `access_token` + `refresh_token` in JSON (`:101-109`). A single regression (e.g. moving the admin check below the parse, or accepting `userId` = self — only a string-equality check at `:56`) silently issues admin sessions. The audit log write is in a `try { … } catch {}` that swallows all errors (`:92-99`), so a failed insert produces no signal. Zero tests. Also, rate-limit is `limit: 10, window: 60` (`:20`) which is high for a privileged endpoint.
- **Fix:** add `tests/api/admin-impersonate.test.ts`: (a) non-admin → 403, (b) missing Bearer → 401, (c) self-impersonation → 400, (d) happy path emits audit row. Tighten rate-limit to `limit: 3, window: 300`.

### T-08 🟠 Domain verification has no tests and mixes three code paths with no unified return shape
- **File:** `app/api/domain/verify/route.ts:9-160`
- **Evidence:** Three unrelated strategies (Vercel API → DNS CNAME → DNS A record) each return a slightly different JSON shape (`verified`, `vercelStatus`, `verification`, `records`, `notInVercel`, `message`). Any consumer switching on this shape is untested. Null-input handling: `domain = undefined` returns a 400 at `:18`, but whitespace-only `"  "` passes the check and ships `""` into `dns.google/resolve?name=` (`:78`). Vercel IP allowlist is hardcoded (`:117 vercelIPs = ['76.76.21.21', '76.76.21.22', '76.76.21.123']`) and will silently break when Vercel rotates IPs.
- **Fix:** add integration tests mocking `fetch`; trim and re-validate `cleanDomain` (`.length > 0`) after the `.replace` chain; move Vercel IPs to env var.

### T-09 🔴 Multi-currency app hardcodes `currency: "usd"` in every checkout route
- **Files & lines:**
  - `app/api/bookings/checkout/route.ts:57`
  - `app/api/payments/create-checkout/route.ts:150`
  - `app/api/checkout/create/route.ts:115`
  - `app/api/create-checkout/route.ts:64`
- **Evidence:** `lib/currency.ts:8-14` defines 5 currencies and `convertCurrency` (`:40-61`) exists, yet not one Stripe checkout route reads from it — every session is created in USD regardless of the business's configured currency. Also, no test covers `convertCurrency` (throws on missing rate at `:55`), `formatCurrency` (depends on `Intl.NumberFormat` locale behavior), or rounding drift from the `toISOString` + `* 100` conversion. Cross-currency bookings will produce Stripe sessions in USD while the UI and invoices show EUR/GBP — a guaranteed revenue-loss or refund-dispute bug.
- **Fix:** thread `currency` from the business settings row through every checkout route, and add `tests/lib/currency.test.ts` covering `formatCurrency(0)`, `convertCurrency(100, "EUR", "EUR", {})` (same-currency short-circuit at `:49`), and missing-rate throw path.

### T-10 🟠 Date arithmetic uses `new Date("YYYY-MM-DD")` — UTC-midnight parse, off-by-one in negative TZ
- **Files & lines:** `lib/sms-ai.ts:593-595`, `lib/telegram-bot-ai.ts:273-274`, `app/api/payments/create-checkout/route.ts:114-115`, `app/api/chatbot-test/route.ts:215-216`
- **Evidence:** All four call sites do `new Date(startDate)` where `startDate` is `"YYYY-MM-DD"`, then `Math.ceil((end - start) / 86400000)`. JavaScript parses bare date strings as **UTC midnight**, so a business in America/Los_Angeles that shows "March 3 → March 4" will see the wrong day count near DST boundaries and near midnight inputs. No test asserts day-count across DST (e.g. Mar 8–Mar 9 in US/Pacific) or February-29 transitions.
- **Fix:** use `date-fns` (already a dependency per `package.json:59`) — `differenceInCalendarDays(parseISO(end), parseISO(start))` — and add a boundary test case.

### T-11 🔴 In-memory rate limiter is documented as single-instance but used on serverless endpoints
- **File:** `lib/rate-limit.ts:9-26`, consumed by `lib/api-rate-limit.ts` and every route via `applyRateLimit`
- **Evidence:** `lib/rate-limit.ts:16 const rateLimitStore = new Map<string, RateLimitEntry>()` plus `setInterval(..., 60000)` at `:19`. The header comment at `:4-8` explicitly says *"For production with multiple instances, use Redis-based rate limiting"* — yet this is a Vercel-deployed Next.js 16 app where every route is a separate serverless function whose memory is per-instance and short-lived. **Rate limiting is effectively off in production.** Worse: the `setInterval` prevents the node process from being GC'd by the edge/Lambda runtime (though Next wrappers usually unref). Zero tests cover the sliding-window logic; no integration test demonstrates the limiter actually blocks on the 61st request.
- **Fix:** replace with `@upstash/ratelimit` (or accept the risk and document it loudly) AND add `tests/lib/rate-limit.test.ts` with `vi.useFakeTimers()` to advance the clock and assert reset-at semantics.

### T-12 🟠 `lib/webhook-idempotency.ts` has a silent "fail-open" branch that is untested
- **File:** `lib/webhook-idempotency.ts:85-93`
- **Evidence:** `if (error && error.code === "23505") { … duplicate }` — any other error (network, connection refused, invalid SQL) falls through to `return { claimed: true, reason: "error" }`, which the caller treats as "proceed". The accompanying comment at `:89-91` says this is intentional ("rather risk a rare double-process than silently drop a legitimate event"). That tradeoff is defensible but **must** be tested, and the `"error"` reason should be observable — right now no caller inspects `claim.reason`. Additionally `cachedClient` at `:35-44` is module-level state that will be retained across cold-start lifetimes and leak env-var changes.
- **Fix:** add `tests/lib/webhook-idempotency.test.ts` with three paths: successful claim, 23505 duplicate, and arbitrary error fail-open. Callers should log a warning when `reason === "error"`.

### T-13 🟠 Duplicate Supabase service-role client construction in 47+ files — concentrated tech debt
- **Evidence:** `function getSupabase()` pattern found in **47 files** (41 route files + 6 lib files via grep on `SUPABASE_SERVICE_ROLE_KEY`). Every one of them re-implements:
  ```
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  ```
  Two of them — `app/api/stripe-webhook/route.ts:11` and `app/api/bookings/checkout/route.ts:10` — do it at **module top-level** instead of inside a function, which means they run at import time and will crash cold-start if env vars load late. The rest lazy-initialize but do not cache. `lib/webhook-idempotency.ts:35` is the one place that correctly caches.
- **Fix:** extract a single `lib/supabase/service.ts` exporting `getServiceClient()` with module-level cache; replace all 47 call sites.

### T-14 🟠 Complexity hotspots (>50 lines or deeply nested)
| File | LOC | Notes |
|---|---|---|
| `lib/sms-ai.ts` | 703 | `generateAIResponse` is a 247-line imperative function with 6 levels of nesting |
| `lib/telegram-bot-ai.ts` | 620 | Tool-dispatch switch with DB writes interleaved; 8 exported functions |
| `lib/payment-link.ts` | 387 | 11 exported functions, token generation + DB I/O mixed |
| `app/api/leads/capture/route.ts` | 359 | 2 separate auth branches (A2P / survey), body parsed twice (`:71` and dead comment at `:134`) |
| `app/api/payments/webhook/route.ts` | 341 | `POST` alone is 254 lines; nested `try` inside `try` |
| `lib/anthropic.ts` | 299 | 7 functions, model-selection heuristics inline |
| `app/api/cron/follow-up-leads/route.ts` | 300 | Unchecked — likely similar pattern |
| `app/api/chatbot-test/route.ts` | 294 | Largest non-webhook route |

None of these are tested. `lib/sms-ai.ts:104-351` alone contains a decision tree for vehicle extraction, language detection, status progression, ready-for-payment gating, and payment-link injection that is impossible to refactor safely without coverage.

### T-15 🟡 `lib/leads/capture/route.ts` has dead code — second validation of already-parsed body
- **File:** `app/api/leads/capture/route.ts:133-142`
- **Evidence:** Lines 133-134 are a commented-out `const { name, email, phone, vehicle_interest, notes, source } = body`. The loop then does a second `if (!name || !phone)` validation (`:137-142`) on values that were already validated by the Zod schema at `:74-80` which requires them. This is a **dead branch**; zod already guarantees `name.min(1)` and `phone.min(10)`.
- **Fix:** delete lines 133-142.

### T-16 🟡 A2P branch in lead capture is a no-op but returns `{success: true}`
- **File:** `app/api/leads/capture/route.ts:85-119`
- **Evidence:** The `source === "lead-capture-a2p"` short-circuit performs phone cleaning then `return NextResponse.json({ success: true, ... })` **without inserting into any table**. The comment at `:108-109` says *"For A2P compliance, just return success - actual lead handling can be configured separately"*. This means a form submission labeled `lead-capture-a2p` silently drops user data while reporting success. No test verifies this is intentional vs a regression.
- **Fix:** either delete the branch or persist to an `a2p_leads` table as the comment implies. Add a test asserting the chosen behavior.

### T-17 🟠 Contract / payload-shape tests missing for every external integration
- **Evidence:** Stripe, Twilio, Instagram (Meta Graph), Telegram Bot API, and Anthropic SDK all have their payload shapes inlined into route handlers as TypeScript types (e.g. `app/api/telegram/webhook/route.ts:27-45` defines `TelegramUpdate` by hand) or cast as `any` (`app/api/instagram/webhook/route.ts:147 webhookBody: any`). When the provider adds a field or renames one, the type compiles fine and the handler reads `undefined`. No JSON-schema or Zod contract test locks these shapes down.
- **Fix:** add `tests/contracts/` with fixtures captured from each provider's docs/sandbox, parse them through a Zod schema, and re-use the same schema in the handler.

### T-18 🟠 No load / stress tests for high-traffic endpoints
- **Evidence:** `app/api/sms/bulk/route.ts` caps at 100 recipients per request (`:7`) and uses `Promise.allSettled` with no concurrency limit — 100 simultaneous Twilio API calls from a single serverless function can saturate the socket pool and exceed Twilio's 1 req/s default for A2P. `app/api/bookings/bulk/route.ts` has no cap at all on `bookingIds.length` (the zod min is 1, no max), so a client can send 10k UUIDs and trigger a single `UPDATE … IN (...)` that may time out at the Supabase pooler. No k6/artillery script exists.
- **Fix:** add `bookingIds.max(500)` in the zod schema; add a `pnpm load` k6 script and a README note that bulk endpoints are rate-limited client-side.

### T-19 🟡 Test environment has no fixtures, no supabase mock, no env parity
- **Evidence:** `vitest.config.ts` hard-codes `environment: "node"` with **no `setupFiles`**, no `.env.test`, no supabase mock. When the first DB-touching test lands, contributors will face the choice between (a) spinning up a real Supabase instance, (b) writing ad-hoc `vi.mock("@supabase/supabase-js")` in every file. Both will diverge. `lib/sms-ai.ts`, `lib/telegram-bot-ai.ts` and `lib/webhook-idempotency.ts` all create service clients at module scope or on first call, making per-test isolation hard. There is no `MSW` / `nock` / `undici` interceptor configured for the many `fetch` calls (e.g. `lib/safe-fetch.ts`, `lib/instagram.ts`, `lib/crm/google-calendar.ts`).
- **Fix:** add `tests/setup.ts` with `vi.mock("@supabase/supabase-js")` factory, a `createTestClient()` helper, and load `.env.test`. Wire via `test.setupFiles` in `vitest.config.ts`.

### T-20 🟡 No coverage threshold configured — `test:coverage` script is cosmetic
- **File:** `vitest.config.ts:13-16`, `package.json` `scripts.test:coverage`
- **Evidence:** Coverage block defines provider + reporters but no `thresholds`. `pnpm test:coverage` will pass at 0 %.
- **Fix:** add `coverage.thresholds: { lines: 40, branches: 30 }` as a floor and raise it incrementally.

### T-21 🟡 `sanitizeCustomerMessage` is a security boundary with no tests
- **File:** `lib/sms-ai.ts:14-21`
- **Evidence:** This function strips `[SEND_PAYMENT_LINK]` and `[EXTRACTED]…[/EXTRACTED]` from inbound customer messages to block prompt-injection via echoed markers. It is applied inside `buildChatMessages` at `:464,470`. The regex uses `\[SEND_PAYMENT_LINK\]/gi` (safe) and `\[EXTRACTED\][\s\S]*?\[\/EXTRACTED\]/gi` — but the non-greedy match will not handle nested or malformed blocks, and **there is no test** demonstrating that a customer can't bypass it with `[ EXTRACTED ]` (whitespace), unicode-lookalikes, or zero-width-joiner insertions. Given the guardrails test file spends 67 lines asserting the prompt *forbids* marker emission, the absence of a test on the actual runtime stripper is a gap.
- **Fix:** add property-based tests with fuzzed whitespace/unicode.

### T-22 🟡 `lib/ical-parser.ts` has 7 `new Date(...)` calls and zero tests
- **File:** `lib/ical-parser.ts` (155 LOC)
- **Evidence:** iCal date parsing is notoriously timezone-sensitive (`DTSTART;TZID=America/New_York:...` vs floating time vs UTC Zulu). Grep shows 7 Date constructions and zero test file. This module feeds `app/api/cron/calendar-sync/route.ts` which writes to bookings — a parse bug directly corrupts availability.
- **Fix:** add fixture-driven tests with real-world ICS exports from Google Calendar, Outlook, and Apple Calendar.

---

## Summary table

| ID | Sev | Area | File(s) |
|---|---|---|---|
| T-01 | 🔴 | Stripe webhook coverage | `app/api/stripe-webhook/route.ts`, `app/api/payments/webhook/route.ts` |
| T-02 | 🔴 | SMS AI engine coverage | `lib/sms-ai.ts` |
| T-03 | 🟠 | Over-trivial existing tests | `tests/ai/*.test.ts` |
| T-04 | 🔴 | Telegram idempotency | `app/api/telegram/webhook/route.ts` |
| T-05 | 🔴 | Instagram idempotency | `app/api/instagram/webhook/route.ts` |
| T-06 | 🔴 | Bulk endpoint coverage | `app/api/sms/bulk/route.ts`, `app/api/bookings/bulk/route.ts` |
| T-07 | 🔴 | Admin impersonation | `app/api/admin/impersonate/route.ts` |
| T-08 | 🟠 | Domain verify branches | `app/api/domain/verify/route.ts` |
| T-09 | 🔴 | Hardcoded USD | 4 checkout routes |
| T-10 | 🟠 | Date/TZ parsing | 4 sites |
| T-11 | 🔴 | In-memory rate limiter | `lib/rate-limit.ts` |
| T-12 | 🟠 | Idempotency fail-open | `lib/webhook-idempotency.ts` |
| T-13 | 🟠 | Duplicate supabase clients | 47 files |
| T-14 | 🟠 | Complexity hotspots | 8 files |
| T-15 | 🟡 | Dead code | `app/api/leads/capture/route.ts:133-142` |
| T-16 | 🟡 | Silent A2P drop | `app/api/leads/capture/route.ts:85-119` |
| T-17 | 🟠 | No contract tests | external integrations |
| T-18 | 🟠 | No load tests | bulk endpoints |
| T-19 | 🟡 | No test setup/fixtures | `vitest.config.ts` |
| T-20 | 🟡 | No coverage threshold | `vitest.config.ts` |
| T-21 | 🟡 | Sanitizer untested | `lib/sms-ai.ts:14` |
| T-22 | 🟡 | iCal parser untested | `lib/ical-parser.ts` |

**Totals:** 🔴 8 · 🟠 8 · 🟡 6 · 🟢 0
