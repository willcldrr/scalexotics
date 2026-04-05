# Performance & Scalability Audit — Velocity Labs

Audit date: 2026-04-05
Scope: Next.js 16 App Router + Supabase + Stripe + Twilio + Anthropic
Severity: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

---

## Executive summary — top 3

1. **🔴 Dashboard pages poll every 5s fetching ALL bookings/leads/vehicles with no `.limit()` and no diffing.** `app/dashboard/page.tsx:463-488` and `app/dashboard/leads/pipeline/page.tsx:49-67` run full‑table scans per tenant every few seconds on top of already‑subscribed realtime channels. For a tenant with thousands of leads/bookings, one open tab is 12 unbounded queries/minute; ten concurrent dashboards will saturate Postgres and the Supabase connection pool.
2. **🔴 Bulk lead delete / status update do N sequential round‑trips instead of one `.in()` call.** `app/dashboard/leads/page.tsx:797-815` loops `await supabase.from("leads").delete().eq("id", id)` for every selected row. Selecting 200 leads = 200 serial RTTs from the browser. Same anti‑pattern in `app/api/cron/calendar-sync/route.ts:56-92` (per‑vehicle upsert loop) and `app/dashboard/admin/page.tsx:461-494` (admin poll every 3s calling `/api/admin/users` which itself does `auth.admin.listUsers({ perPage: 1000 })`).
3. **🔴 Bulk SMS and long AI operations run inline in the request path with no background queue.** `app/api/sms/bulk/route.ts:60-107` fans out up to 100 Twilio calls inside the POST handler, then does a serial per‑recipient Supabase lookup+insert loop (classic N+1). `app/api/cron/follow-up-leads/route.ts:121-287` processes every stale lead sequentially with Anthropic + Instagram send inline — a 500‑lead backlog will blow past serverless timeouts.

Fix direction: paginate/gate list endpoints, replace loops with `.in()` / `Promise.all`, move bulk fanout and AI follow‑ups to a background worker (Supabase queue, QStash, or Inngest).

---

## 🔴 Critical

### 1. Unbounded polling of full tenant data on main dashboard
- **File:** `app/dashboard/page.tsx:463-488`
- **Evidence:** `setInterval(() => fetchData(), 5000)` triggers 8 parallel Supabase queries including `.from("bookings").select("*, vehicles(*)")` and `.from("leads").select("*")` with no `.limit()` and no `.order()+.range()`. Runs every 5s while tab visible.
- **Fix:** Drop the 5s poll, rely on existing realtime subscriptions in `lib/dashboard-cache.tsx` (already handling inserts/updates/deletes). If polling is kept, cap at 30s and add `.limit(200)` / `.range()`.

### 2. Pipeline page unbounded poll + unfiltered realtime
- **File:** `app/dashboard/leads/pipeline/page.tsx:37-67`
- **Evidence:** `channel("pipeline-leads").on("postgres_changes", { event: "*", schema: "public", table: "leads" }, fetchLeads)` with no `filter:` argument, plus a 5s `setInterval` that refetches all leads with no limit. On any lead change anywhere, every connected client refetches its entire lead list.
- **Fix:** Add `filter: \`user_id=eq.${userId}\`` to the channel, drop the 5s interval (or move to 60s), and add `.limit(500)` to `fetchLeads`.

### 3. Leads page bulk delete / bulk status — N sequential queries
- **File:** `app/dashboard/leads/page.tsx:797-815`
- **Evidence:**
  ```
  for (const id of ids) {
    await supabase.from("leads").delete().eq("id", id)
  }
  ```
  and the same loop for `update({ status })`. Browser → Supabase RTT × N.
- **Fix:** Replace with `supabase.from("leads").delete().in("id", ids)` and `update({ status }).in("id", ids)` — single round trip.

### 4. Leads page: unbounded leads+messages join fetch
- **File:** `app/dashboard/leads/page.tsx:364-400`
- **Evidence:** `supabase.from("leads").select("*").eq("user_id", user.id)` with no `.limit()`, then `supabase.from("messages").select("lead_id, content, created_at, direction").in("lead_id", leadIds).order("created_at", { ascending: false })` — also no limit. For a tenant with 10k leads and 200k messages this pulls the entire message history to compute "last message per lead" client‑side.
- **Fix:** Create a `leads_with_last_message` view or RPC using `DISTINCT ON (lead_id)` server‑side, and paginate the leads list. At minimum: `.limit(500)` on leads and `.limit(2000)` on messages.

### 5. Bulk SMS: inline Twilio fanout + per‑recipient Supabase N+1
- **File:** `app/api/sms/bulk/route.ts:60-107`
- **Evidence:** `Promise.allSettled(recipients.map(...twilioClient.messages.create...))` inside the request (OK), then a serial `for (let i=0; i<results.length; i++)` doing `await supabase.from("leads").select("id").or(...).maybeSingle()` + `await supabase.from("messages").insert(...)` for each of up to 100 recipients. Twilio timeouts alone can exceed serverless limits.
- **Fix:** Enqueue the send job (QStash/Inngest/Supabase pg_net) and return 202; inside the worker, batch the lead lookup with a single `.in("phone", phones)` query and do a single `messages` bulk insert.

### 6. Follow‑up cron: serial AI+network calls, no batching
- **File:** `app/api/cron/follow-up-leads/route.ts:121-287`
- **Evidence:** `for (const lead of staleLeads) { ... await generateResponse(...); await sendInstagramMessage(...); await supabase.from("messages").insert(...); await supabase.from("leads").update(...) }` — no concurrency, no batching. Also fetches `instagram_connections` per lead (N+1) when the same owner typically has one connection.
- **Fix:** Prefetch connections with `.in("user_id", ownerIds)`, process leads in `Promise.allSettled` chunks (e.g. 10 concurrent), and cap work per invocation (e.g. 100 leads) so long backlogs don't time out.

### 7. Admin dashboard polls full users list every 3 seconds
- **File:** `app/dashboard/admin/page.tsx:463-491`
- **Evidence:** `setInterval(async () => { fetch("/api/admin/users") ... }, 3000)` — and `/api/admin/users/route.ts:39-48` calls `serviceSupabase.auth.admin.listUsers({ perPage: 1000 })` plus full `profiles` + `businesses` selects on every hit. One admin tab = 1,200 full‑table scans per hour.
- **Fix:** Drop the 3s poll (realtime channels for profiles/businesses already exist at `app/dashboard/admin/page.tsx:380-427`). If a safety poll is needed use 60s and add `?since=<timestamp>` filtering.

---

## 🟠 High

### 8. `getUserIdByPhoneNumber` scans entire `ai_settings` table per inbound SMS
- **File:** `app/api/sms/webhook/route.ts:59-78`
- **Evidence:** `supabase.from("ai_settings").select("user_id, business_phone")` with no filter, then JS loop matching on last 10 digits. Every inbound SMS triggers a full table scan.
- **Fix:** Add a generated column `business_phone_last10` with an index, query with `.eq("business_phone_last10", last10).maybeSingle()`.

### 9. `findOrCreateLead` uses `.ilike('%last10')` — cannot use an index
- **File:** `lib/sms-ai.ts:644-678` and `app/api/leads/capture/route.ts:158-164`
- **Evidence:** `supabase.from("leads").select("id, name").eq("user_id", userId).ilike("phone", \`%${last10}\`)` — trailing wildcard makes `phone` lookup a sequential scan per SMS / lead capture.
- **Fix:** Store normalized E.164 in a `phone_e164` column with `UNIQUE(user_id, phone_e164)` index, lookup by exact equality.

### 10. `generateAIResponse` fires 4 serial queries + full bookings scan per inbound message
- **File:** `lib/sms-ai.ts:117-152`
- **Evidence:** Four independent `await` calls (`ai_settings`, `vehicles`, `bookings`, `leads`, `messages`) that should be `Promise.all`. Also `.from("bookings").select("vehicle_id, start_date, end_date").eq("user_id", userId).in("status", ...)` has no date filter — returns all historical bookings forever.
- **Fix:** Wrap in `Promise.all`; add `.gte("end_date", today)` so only future/current bookings ship to the model.

### 11. Calendar sync cron — per‑vehicle serial upsert and update
- **File:** `app/api/cron/calendar-sync/route.ts:56-92`
- **Evidence:** Outer `for (const vehicle of vehicles)` and inner `for (const event of relevantEvents) { await supabase.from("calendar_syncs").upsert(...) }` — serial, with a second `await supabase.from("vehicles").update(...)` per vehicle.
- **Fix:** Build a single array of rows and call `.upsert(rows, { onConflict })` once per vehicle (or once per cron run). Process vehicles in `Promise.allSettled` chunks of 5–10.

### 12. `/api/analytics` returns unbounded booking/lead history
- **File:** `app/api/analytics/route.ts:42-114`
- **Evidence:** `serviceSupabase.from("bookings").select("id, ...").eq("user_id", user.id).order("created_at", ...)` with optional `from`/`to` but no hard cap. If no date range is passed, the entire tenant history is serialized, and the CSV/PDF path then iterates it in‑memory in the route handler.
- **Fix:** Require a date range or apply a default 12‑month window; cap with `.limit(10_000)` and stream CSV rather than building it in memory.

### 13. DNR CSV import in the request path
- **File:** `app/dashboard/admin/page.tsx:1039-1077`
- **Evidence:** Runs `supabase.from("do_not_rent_list").insert(batch)` serially in chunks of 50. For a 20k‑row import this is ~400 sequential inserts blocking the browser tab.
- **Fix:** Move to an API route + background worker; or at minimum parallelize batches with `Promise.all`.

### 14. `/api/admin/crm/leads` — `.select("*", { count: "exact" })` + broad `ilike`
- **File:** `app/api/admin/crm/leads/route.ts:59-76`
- **Evidence:** `count: "exact"` forces a `COUNT(*)` on every page request. The search filter uses `ilike '%search%'` on four columns without trigram indexes.
- **Fix:** Use `count: "estimated"` (or omit), and add a `pg_trgm` GIN index on `crm_leads` (`company_name`, `contact_name`, `contact_email`).

### 15. In‑memory rate limiter is not horizontal‑scale safe
- **File:** `lib/rate-limit.ts:11-26`
- **Evidence:** `const rateLimitStore = new Map<string, RateLimitEntry>()` plus a `setInterval` cleaner. On Vercel (multiple lambda instances or regions) each instance has its own bucket, so effective limits are `limit × instanceCount`. Also leaks to multiple timers if the route handler hot‑reloads.
- **Fix:** Move to Upstash Redis (`@upstash/ratelimit`) as the file's own comment acknowledges. Until then, document that limits are per‑instance and add a shared sliding window for the critical endpoints (`/api/leads/capture`, `/api/sms/webhook`).

### 16. `app/dashboard/leads/page.tsx` client component is 2,553 lines, no code splitting
- **File:** `app/dashboard/leads/page.tsx:1-50`
- **Evidence:** Single `"use client"` module with all modals, CSV import, SMS UI, pipeline card grid — loaded on first route hit. Same for `app/dashboard/admin/page.tsx` (2,691 lines) and `app/dashboard/bookings/page.tsx` (1,116 lines).
- **Fix:** Split heavy modals/panels behind `next/dynamic(() => import(...), { ssr: false })`, move non‑interactive chunks to server components.

---

## 🟡 Medium

### 17. `@tanstack/react-query` is in `package.json` but never imported
- **Evidence:** `Grep "react-query|tanstack/react-query"` across `app/` returns zero matches; it ships in the client bundle if anything transitively imports it.
- **Fix:** Remove the dependency or actually use it (it would solve several of the polling/caching issues above).

### 18. `lib/dashboard-cache.tsx` uses `JSON.stringify` on full arrays for change detection
- **File:** `lib/dashboard-cache.tsx:192-194`
- **Evidence:** `JSON.stringify(prev.leads.map(l => l.id + l.status))` runs on every poll over up to 500 leads, 500 bookings, and all vehicles. O(n) CPU per 30s tick per open tab, and the ref equality still breaks when anything changes causing a full re‑render cascade.
- **Fix:** Compare lengths + a cheap hash (max `updated_at`) rather than stringifying arrays.

### 19. `lib/dashboard-cache.tsx` hosts three effects that each call `supabase.auth.getUser()`
- **File:** `lib/dashboard-cache.tsx:146, 258, 319, 326, 333`
- **Evidence:** `fetchAllData`, the realtime setup, and each of `refreshLeads/Vehicles/Bookings` call `auth.getUser()` again. `getUser()` hits the Supabase auth server (not just the local session) so every poll is an extra HTTP round trip.
- **Fix:** Cache `user.id` in state/ref and reuse.

### 20. Dashboard pages instantiate Supabase client at module scope for service role
- **Files:** `app/api/analytics/route.ts:6-9`, `app/api/admin/businesses/route.ts:7-10`, `app/api/admin/crm/leads/route.ts:7-10`, `app/api/admin/domains/route.ts:5-8`, `app/api/stripe-webhook/route.ts:11-14`, `app/api/payments/webhook/route.ts` (via `getSupabase()`), `app/api/cron/calendar-sync/route.ts:7-10`.
- **Evidence:** Module‑level `createClient(url, serviceKey)`. On Vercel this is fine once warm, but it reads env vars at import time — any route that imports these modules pays the init cost on cold start, and a missing env var throws during module load (502 instead of 500). Mixed pattern across codebase (some use `getSupabase()` factories) makes behavior inconsistent.
- **Fix:** Standardize on lazy `getSupabase()` factory inside handlers.

### 21. `/api/availability` and `/api/vehicles/public` forget `.limit()`
- **Files:** `app/api/availability/route.ts:59-70`, `app/api/vehicles/public/route.ts:55-61`
- **Evidence:** Public API, protected only by `X-API-Key`. A compromised/leaked key can pull every historical booking for a tenant in one call.
- **Fix:** Add `.limit(1000)` + pagination cursor; already caches for 30–60s via `Cache-Control`.

### 22. Sessions endpoint lists all sessions without pagination
- **File:** `app/api/sessions/route.ts:68-73`
- **Evidence:** `from("user_sessions").select("*").eq("user_id", user.id).order("last_active", ...)` — an abusive device cycler could pile up thousands.
- **Fix:** `.limit(100)` and expire old rows via a scheduled cleanup.

### 23. `lib/sms-ai.ts` re‑creates Supabase client on every call
- **File:** `lib/sms-ai.ts:23-28, 115, 587, 645, 681, 695`
- **Evidence:** Every public helper calls `getSupabase()` which calls `createClient(...)`. Not catastrophic (SDK caches fetch agents) but allocates per request.
- **Fix:** Memoize the service client at module scope.

### 24. Currency rates endpoint returns hardcoded data but re‑parses per request
- **File:** `app/api/currency/rates/route.ts:8-25`
- **Evidence:** Handler rebuilds the JSON on every call; no `Cache-Control` header, no `revalidate`.
- **Fix:** Add `export const revalidate = 3600` and `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.

### 25. `admin/page.tsx` subscribes to 5 realtime channels + polls + mounts 2,691‑line component
- **File:** `app/dashboard/admin/page.tsx:380-445, 461-494`
- **Evidence:** `profilesChannel`, `businessesChannel`, `dnrChannel`, `invoicesChannel`, `domainsChannel` all on one page, each without a `filter`, each handling INSERT/UPDATE/DELETE separately. Plus the 3s poll. Each realtime channel is a websocket subscription — 5 channels × each open admin tab.
- **Fix:** Collapse into one channel with multiple `postgres_changes` handlers (Supabase supports this) and drop the polling.

### 26. `app/dashboard/leads/components/lead-detail-modal.tsx` fetches messages unbounded
- **File:** `app/dashboard/leads/page.tsx:432-441`, mirrored in `app/dashboard/bookings/page.tsx:228-238`
- **Evidence:** `from("messages").select("*").eq("lead_id", leadId).order("created_at", { ascending: true })` — no limit. A long SMS conversation could be thousands of messages.
- **Fix:** `.limit(200)` + "load older" pagination.

### 27. Missing indexes suggested by current migration file
  The existing `20260404_performance_indexes.sql` adds composite indexes for `(user_id, status, created_at)` on leads and `(user_id, status, start_date)` on bookings, plus `(lead_id, created_at)` on messages — good. But the hot query paths observed here would benefit from additional indexes:
  - `ai_settings (business_phone_last10)` — for SMS webhook owner lookup (see #8).
  - `leads (user_id, phone_e164)` — for SMS inbound and lead capture dedupe (see #9).
  - `leads (ai_disabled, status, last_message_time)` partial index where `instagram_user_id IS NOT NULL` — for `cron/follow-up-leads` query at `route.ts:98-104`.
  - `user_sessions (user_id, last_active DESC)` — for `GET /api/sessions`.
  - `crm_leads` pg_trgm GIN on `(company_name, contact_name, contact_email)` for the admin CRM search (see #14).

---

## 🟢 Low

### 28. `next.config.mjs` has `optimizePackageImports: ['recharts', ...]` but recharts is still imported from client pages without `next/dynamic`
- **Files:** `app/dashboard/velocity-ai/page.tsx`, `app/dashboard/analytics/page.tsx`, `app/dashboard/dashboard-shell.tsx`, `app/dashboard/admin/crm/page.tsx`
- **Fix:** Wrap chart widgets with `const Chart = dynamic(() => import("./Chart"), { ssr: false })` to shave the shared chunk.

### 29. Cron routes use `applyRateLimit` (limit 10/min) — cron endpoints shouldn't be rate‑limited
- **Files:** `app/api/cron/calendar-sync/route.ts:18`, `app/api/cron/follow-up-leads/route.ts:46`, `app/api/cron/refresh-instagram-tokens/route.ts:20`
- **Evidence:** `applyRateLimit(request, { limit: 10, window: 60 })` — if the scheduler retries or multiple schedules overlap, legitimate cron runs can be 429'd.
- **Fix:** Remove rate limiting for cron routes (they're already gated by `CRON_SECRET`).

### 30. `sms-ai.ts` fallback uses `process.env.NEXT_PUBLIC_APP_URL` to call itself
- **File:** `lib/sms-ai.ts:601-637`
- **Evidence:** `safeFetch(\`${baseUrl}/api/payments/create-checkout\`, ...)` — extra HTTP hop from one lambda to another, plus a 3‑attempt retry loop with 1s sleeps. For the SMS webhook path this adds up to 30s of latency on the slow path.
- **Fix:** Extract the checkout-creation logic to a shared library function and call directly.

### 31. `app/api/leads/capture` — `.or(...single())` can throw on multiple matches
- **File:** `app/api/leads/capture/route.ts:158-164`
- **Evidence:** `.single()` with `.or(...)` returning two rows throws PGRST116 and is silently swallowed; a duplicate lead is then created. Not strictly a perf issue but causes unbounded growth.
- **Fix:** Use `.maybeSingle()` and `.limit(1)`.

### 32. `app/dashboard/admin/page.tsx:995` — nested `for (const v of variations)` inside CSV parser
- **Evidence:** O(headers × variations) per row on every import — fine for a few hundred rows, quadratic for large files.
- **Fix:** Pre‑build a lookup map once.

### 33. `app/api/sessions/route.ts` — `user_sessions` upsert takes 4 sequential awaits on write path
- **File:** `app/api/sessions/route.ts:117-170`
- **Evidence:** Lookup → update or insert, with an extra lookup when no token is provided. Not perf‑critical but wastes Supabase calls on every page load (dashboard‑shell records session on mount).
- **Fix:** Replace with a single `upsert` on `(user_id, browser, os, ip_address)`.

---

## Horizontal scaling blockers summary

- **In‑process rate limit** (`lib/rate-limit.ts`) — finding #15.
- **In‑process dashboard cache** (`lib/dashboard-cache.tsx`) — per‑tab memory; fine in isolation but the JSON.stringify diffing and double‑fetching pattern (finding #18/#19) amplifies under load.
- **Module‑scope Supabase clients** (finding #20) — not strictly a blocker but couples cold‑start to env config.
- **No background job queue** — every expensive operation (bulk SMS, AI follow‑ups, CSV imports, calendar sync) runs inline in a request/cron handler. Without a queue, Vercel function timeouts become the effective SLA cap.

## Quick wins (sorted by effort ÷ impact)

1. `from("leads").delete().in("id", ids)` in leads page bulk actions (finding #3) — 5 min, huge.
2. Delete the 5s polls on `app/dashboard/page.tsx`, `app/dashboard/leads/pipeline/page.tsx`, `app/dashboard/admin/page.tsx` (findings #1, #2, #7) — 10 min.
3. Add `.limit()` to every dashboard query that touches `leads`, `bookings`, `messages`, `vehicles` (findings #4, #21, #22, #26) — 30 min.
4. `Promise.all` the 5 serial queries in `lib/sms-ai.ts:generateAIResponse` (finding #10) — 5 min, cuts SMS response latency noticeably.
5. Drop `applyRateLimit` from cron routes (finding #29) — 2 min.
6. Add `export const revalidate = 3600` to `/api/currency/rates` (finding #24) — 1 min.
