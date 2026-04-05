# Infrastructure & DevOps Audit — Velocity Labs

Scope: env hygiene, CI/CD, rollback, deployment config, migrations, backup/DR, docs, `next.config.mjs`, `middleware.ts`.
Method: read-only inspection of config, workflows, migrations, and referenced env vars.

Severity legend: 🔴 critical · 🟠 high · 🟡 medium · 🟢 low / info

---

## 🔴 Critical

### C1. CI does not run on pull requests — deploy gating is effectively absent
- **File:line:** `.github/workflows/ci.yml:11-15`
- **Evidence:** CI only triggers on `push` to `main` and `pull_request` targeting `main`. There is **no** workflow that calls Vercel, no deploy job, no staging step, and no `deployment_status` / `required_status_checks` enforcement declared in-repo. Vercel's Git integration will build and deploy previews **regardless of whether `lint` / `typecheck` / `test` / `audit` jobs pass**, because those jobs are not declared as required checks anywhere in the repo (branch protection lives on GitHub, outside this tree — cannot verify here, so assume unconfigured).
- **Why it matters:** A failing test or type error on a PR does not block the Vercel preview or the production deploy once merged. The CI exists but is not load-bearing.
- **Fix:** Configure GitHub branch protection on `main` to require `Lint`, `Typecheck`, `Test`, `Dependency audit`, and `Build` as required status checks before merge; document this in the repo.

### C2. No rollback / DR / backup runbook anywhere in the repo
- **File:line:** repo root — no `README.md`, no `RUNBOOK.md`, no `docs/` directory, no `DEPLOY.md`
- **Evidence:** `ls /var/www/velocity/*.md` returns only `AI_AGENT_AUDIT.md`, `VELOCITY_LABS_PROJECT_REPORT.md`, `theme.md`. Neither audit doc describes rollback steps, Supabase PITR window, backup verification, incident response, or on-call.
- **Why it matters:** Vercel offers instant rollback via its dashboard and Supabase offers PITR, but relying on tribal knowledge for those during an incident is a recipe for extended downtime. No evidence backups have ever been test-restored.
- **Fix:** Add `docs/runbook.md` covering (a) Vercel rollback via `vercel rollback` or dashboard, (b) Supabase PITR window + restore procedure, (c) webhook resend procedure (Stripe/Twilio/Meta), (d) cron secret rotation, (e) on-call escalation.

### C3. No real `README.md` at repo root
- **File:line:** repo root
- **Evidence:** `ls` shows no `README.md`. New engineers land on `AI_AGENT_AUDIT.md` (a point-in-time audit, not onboarding) and `VELOCITY_LABS_PROJECT_REPORT.md` (project status). `theme.md` is design tokens.
- **Fix:** Add a minimal `README.md`: stack, local dev steps, env bootstrap (`cp .env.example .env.local`), test/lint/build commands, deploy target, link to runbook.

---

## 🟠 High

### H1. `supabase/*.sql` — 22 ad-hoc SQL files live outside `migrations/`
- **File:line:** `supabase/access_codes.sql`, `supabase/security_fixes.sql`, `supabase/fix_profiles_rls.sql`, `supabase/performance_indexes.sql`, and 18 others
- **Evidence:** `supabase/security_fixes.sql` literally starts with `-- Run these in your Supabase SQL Editor`. `supabase/fix_profiles_rls.sql` says the same. These are **ad-hoc scripts applied by hand**, outside the timestamped migration pipeline. `supabase/performance_indexes.sql` also has a near-duplicate `supabase/migrations/20260404_performance_indexes.sql`.
- **Why it matters:** No source of truth for production schema. A fresh Supabase environment (or DR restore) cannot be rebuilt deterministically. Drift between dev, staging, and prod is guaranteed. Manual "run in SQL Editor" workflows lose audit trails.
- **Fix:** Either promote each `.sql` to a dated migration under `supabase/migrations/` or archive them under `supabase/_legacy/` with a clear note that they were one-time manual scripts. Going forward, enforce "migrations only" via a lint/CI check.

### H2. Migrations are not transactional and have no down scripts
- **File:line:** `supabase/migrations/*.sql`
- **Evidence:** None of the 24 migration files wrap their DDL in `BEGIN; ... COMMIT;`, and there are zero `*.down.sql` or reverse migrations. `20260331_security_hardening.sql` is 13.9 KB of policy DDL that, on partial failure, would leave RLS in an inconsistent state.
- **Why it matters:** A failed apply mid-file leaves the DB in an unknown state; recovery requires manual inspection. No reversible path for a bad migration.
- **Fix:** Wrap each migration in an explicit transaction (`BEGIN; ... COMMIT;`). For destructive changes, write and commit a matching down migration.

### H3. Migration filename collisions / out-of-order dates
- **File:line:** `supabase/migrations/` — four files share `20260318`, three share `20260319`, three share `20260404`, etc. Also `20260224_add_instagram_fields.sql` (Feb 2026) and `20240213_do_not_rent_list.sql` (Feb 2024) coexist — year mismatch suggests a typo.
- **Evidence:**
  ```
  20240213_do_not_rent_list.sql       <- 2024
  20240214_fix_do_not_rent_rls.sql    <- 2024
  20260224_add_instagram_fields.sql   <- 2026 (sus)
  20260318_create_businesses.sql
  20260318_leads_messages_rls.sql
  20260318_telegram_bot.sql
  20260318_turo_calendar_sync.sql
  ```
- **Why it matters:** Supabase/psql applies migrations in lexicographic order. Same-day files have undefined ordering relative to each other — if one depends on another (e.g. RLS migration depends on table migration) the apply order can silently change between environments. The 2024/2026 year mix suggests someone has been hand-rolling timestamps.
- **Fix:** Use full `YYYYMMDDHHMMSS` timestamps (the Supabase CLI default) to enforce total ordering and prevent typos.

### H4. `ecosystem.config.js` exists alongside Vercel config — ambiguous deploy target
- **File:line:** `ecosystem.config.js:1-12`
- **Evidence:**
  ```js
  module.exports = { apps: [{ name: 'velocity', cwd: '/var/www/velocity',
    script: 'node_modules/.bin/next', args: 'start -p 3000',
    kill_timeout: 5000, max_restarts: 3, restart_delay: 2000 }] }
  ```
  No `user:`, no `instances:`, no `max_memory_restart`, no logging config. The working directory is literally this repo path on the audit host. This file implies a self-hosted PM2 deploy running in parallel to (or instead of?) Vercel.
- **Why it matters:** (a) Two prod surfaces means two places to ship env vars, two places to roll back, two places to monitor. (b) PM2 inherits the invoking user's permissions — if systemd starts it as root, the Next.js process runs as root. (c) No resource limits means a memory leak takes the box down. (d) `max_restarts: 3` with `restart_delay: 2000` gives up after ~6 seconds of crash-looping.
- **Fix:** Decide on single source of truth. If Vercel is canonical, delete `ecosystem.config.js`. If PM2 self-host is real, add `instances`, `max_memory_restart: '1G'`, explicit non-root `user`, `error_file`/`out_file`, and document which environments run under which.

### H5. `vercel.json` has zero function/region/timeout config
- **File:line:** `vercel.json:1-12`
- **Evidence:** Only `crons` are declared. No `functions` block (no `maxDuration`, no `memory`), no `regions` pin, no `headers` (those live in `next.config.mjs` instead — fine, but not in vercel.json), no `trailingSlash`, no `cleanUrls`.
- **Why it matters:** AI routes (`lib/anthropic.ts`, `lib/sms-ai.ts`) can easily blow past the default 10s hobby / 15s pro Vercel function timeout without warning. Region defaults to `iad1`; if Supabase project is elsewhere, every query round-trips cross-region.
- **Fix:** Add `"functions": { "app/api/sms/**/*.ts": { "maxDuration": 60 }, "app/api/instagram/**/*.ts": { "maxDuration": 60 }, ... }` and pin `"regions": ["iad1"]` (or wherever Supabase lives).

### H6. No cron-job auth visible in `vercel.json`
- **File:line:** `vercel.json:2-11`
- **Evidence:** Two crons are declared but neither has any protection field — Vercel automatically injects `CRON_SECRET` as `Authorization: Bearer`, and `.env.example` does list `CRON_SECRET`, but there is no assertion here (nor in the workflow) that it is set. Separately, `/api/reactivation/cron/process` and `/api/cron/refresh-instagram-tokens` need to verify that header — this audit did not verify the handlers themselves.
- **Fix:** Ensure both cron handlers reject requests whose `Authorization` header is not `Bearer ${process.env.CRON_SECRET}`. Add a CI check or unit test.

---

## 🟡 Medium

### M1. `next.config.mjs` quietly disables TypeScript build errors in dev
- **File:line:** `next.config.mjs:3-6`
- **Evidence:**
  ```js
  typescript: { ignoreBuildErrors: process.env.NODE_ENV === 'development' }
  ```
  The comment says "Set to false before production to catch type errors" but the condition only false-s it when `NODE_ENV !== 'development'`. Vercel build runs with `NODE_ENV=production` so prod is safe, **but** any CI build that accidentally sets `NODE_ENV=development` (or PM2 self-host running `next build` with the wrong env) would silently ship code with type errors.
- **Fix:** Just hardcode `ignoreBuildErrors: false`. The CI `typecheck` job already catches dev-time issues.

### M2. CI build job uses stub Supabase env vars — real runtime config never validated
- **File:line:** `.github/workflows/ci.yml:84-90`
- **Evidence:** `NEXT_PUBLIC_SUPABASE_URL: https://stub.supabase.co`, `SUPABASE_SERVICE_ROLE_KEY: stub-service-key`. Build passes, but nothing in CI ever touches a real Supabase to confirm schema matches code expectations (`scripts/verify-migrations.mjs` exists but is not wired into CI).
- **Fix:** Add a `schema-verify` CI job that runs `node scripts/verify-migrations.mjs` against a staging Supabase project on every PR to `main`.

### M3. CI does not run the `audit` job as a `needs:` dependency of `build`
- **File:line:** `.github/workflows/ci.yml:71-74`
- **Evidence:** `build` only `needs: [lint, typecheck]`. `test` and `audit` run in parallel but a failing `npm audit` does not block `build`, and CI's overall exit depends on GitHub status checks configuration (which is external).
- **Fix:** `needs: [lint, typecheck, test, audit]` on `build`, so a single green "Build" check is sufficient to gate merge.

### M4. CI uses `--legacy-peer-deps` on every install
- **File:line:** `.github/workflows/ci.yml:30,42,54,66,81`
- **Evidence:** Every `npm ci` carries `--legacy-peer-deps`.
- **Why it matters:** This mask peer-dependency conflicts that may later bite at runtime (React 19 / Next 16 / Radix / Vercel Analytics `1.3.1` is quite old). It's a workaround, not a fix.
- **Fix:** Audit `npm ls` locally, resolve the conflict (usually a single pinned dep), remove the flag.

### M5. Env var referenced in code but not in `.env.example`
- **File:line:** various — `VERCEL_ENV`, `NEXT_PUBLIC_VERCEL_ENV`, `NODE_ENV`
- **Evidence:** `sentry.server.config.ts:21` uses `process.env.VERCEL_ENV`. Several places use `NEXT_PUBLIC_VERCEL_ENV`. These are Vercel-injected and so genuinely not needed in `.env.example`, but any self-hosted PM2 deploy (see H4) will have neither set, so Sentry will report `environment: "production"` regardless of stage.
- **Fix:** If self-hosting, set `VERCEL_ENV` explicitly in `ecosystem.config.js` env block, or read from a different var. Add a note to `.env.example`.

### M6. `middleware.ts` is 419 bytes — verified, it delegates correctly
- **File:line:** `middleware.ts:1-19`
- **Evidence:** Confirmed not a bypass: it imports `updateSession` from `lib/supabase/middleware.ts` (167 lines, real logic). However, `matcher` only covers `/dashboard/:path*`, `/api/admin/:path*`, and auth pages. Public-facing API routes (`/api/sms/*`, `/api/stripe/webhook`, `/api/instagram/webhook`, `/api/cron/*`) are **not** in the matcher and therefore have **no middleware-level gate**. Each route handler is on its own for auth/signature verification.
- **Why it matters:** Not inherently wrong (webhooks need to be reachable), but it means there is zero defense-in-depth at the edge. A route handler that forgets signature verification ships broken.
- **Fix:** Document the matcher policy in a comment; consider a thin middleware pass on `/api/*` that rejects requests with no credentials AND no valid webhook signature header, as a belt-and-suspenders safety net.

### M7. `.env` file exists on disk at `/var/www/velocity/.env` and is used by `scripts/verify-migrations.mjs`
- **File:line:** `.env` (mode `-rw-------`), `scripts/verify-migrations.mjs:30-41`
- **Evidence:** `.gitignore` line 9 explicitly lists `.env`, so it is not committed. Permissions are `600` (owner-only). Not a git repo anyway (`git ls-files` returned "not a git repository"), so committed status is moot for this worktree — BUT the presence of `.env` on a shared server with an `ecosystem.config.js` adjacent is a production secret surface: anyone with shell access to `/var/www/velocity` can read it.
- **Fix:** On self-hosted machines, store secrets in systemd `EnvironmentFile=` with root-only permissions, or a secrets manager, rather than a world-locatable `.env`. Keep the `600` but audit who has `sudo`.

---

## 🟢 Low / Info

### L1. `.env.example` contains **no real secrets** — verified clean
- Checked for `sk_live`, `sk_test`, `pk_live`, JWT prefixes, AWS keys, Slack tokens, GH PATs — none present. All values after `=` are empty.

### L2. `package-lock.json` present (365 KB) — cannot verify tracking (not a git repo in this tree)
- **File:line:** `package-lock.json`
- **Fix:** Confirm `package-lock.json` is committed in the actual origin repo; CI already depends on it for cache keys.

### L3. `.gitignore` covers `.env`, `.env.local`, `.env.production`, `.env*.local`, `.vercel` — good.
- **File:line:** `.gitignore:8-15`

### L4. `AI_AGENT_AUDIT.md` dated (modified Apr 3) and `VELOCITY_LABS_PROJECT_REPORT.md` (Mar 31) — both pre-date the latest migration (`20260404_*`). Treat as stale.
- **Fix:** Either update or move to `docs/history/`.

### L5. Sentry config present and correctly gated on DSN (`sentry.server.config.ts:16-38`) — good. PII scrubbing via regex is clever belt-and-suspenders.

### L6. No Dockerfile present — consistent with Vercel-first deploy, but if self-host is real (H4) a Dockerfile would be an improvement over "PM2 on a bare VM".

### L7. `next.config.mjs` CSP is present with `frame-ancestors 'none'`, HSTS preload, `X-Frame-Options: DENY` — solid baseline. Note `'unsafe-inline'` + `'unsafe-eval'` on `script-src` (acknowledged in a comment); plan to adopt nonce-based CSP is noted but not scheduled.

---

## Summary table (top issues by severity)

| # | Sev | Area | One-line fix |
|---|-----|------|--------------|
| C1 | 🔴 | CI gating | Enable GitHub branch protection with CI jobs as required checks |
| C2 | 🔴 | DR / rollback | Write `docs/runbook.md` covering Vercel rollback + Supabase PITR |
| C3 | 🔴 | Docs | Add a real `README.md` |
| H1 | 🟠 | Migrations | Move/archive 22 ad-hoc `supabase/*.sql` scripts |
| H2 | 🟠 | Migrations | Wrap each migration in `BEGIN;...COMMIT;` and add down scripts |
| H3 | 🟠 | Migrations | Use `YYYYMMDDHHMMSS` timestamps to enforce ordering |
| H4 | 🟠 | Deploy | Resolve PM2-vs-Vercel ambiguity; add resource limits/non-root |
| H5 | 🟠 | Vercel | Declare `functions.maxDuration` for AI routes, pin `regions` |
| H6 | 🟠 | Cron | Verify cron handlers enforce `CRON_SECRET` bearer auth |
| M1 | 🟡 | next.config | Hardcode `ignoreBuildErrors: false` |
| M2 | 🟡 | CI | Run `scripts/verify-migrations.mjs` in CI against staging |
| M3 | 🟡 | CI | Make `build` depend on `test` and `audit` too |
| M4 | 🟡 | CI | Remove `--legacy-peer-deps` once peer conflict is fixed |
| M5 | 🟡 | Env | Add `VERCEL_ENV` handling for self-hosted stage |
| M6 | 🟡 | Middleware | Document matcher policy; consider edge signature check |
| M7 | 🟡 | Secrets | Move self-hosted secrets from `.env` to systemd EnvironmentFile |
