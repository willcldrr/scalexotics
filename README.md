# Velocity Labs

Velocity Labs is a multi-tenant car-rental SaaS platform built on Next.js 16 / React 19. It combines a Supabase (Postgres + RLS) data layer, Stripe payments, Twilio SMS (with A2P 10DLC), Anthropic Claude for conversational AI, Resend for transactional email, and inbound messaging bridges for Instagram DMs and Telegram. Operators run their rental business end-to-end — bookings, leads, reactivation, calendar sync, client portal — through a single dashboard.

## Stack

- **Runtime**: Next.js `^16.0.7`, React `^19.2.1`, TypeScript `^5`
- **Database / auth**: `@supabase/ssr` + `@supabase/supabase-js`
- **Payments**: `stripe` `^20.1.2`
- **SMS**: `twilio` `^5.11.2`
- **AI**: `@anthropic-ai/sdk` `^0.78.0`
- **Email**: `resend` `^6.9.4`
- **UI**: Radix UI primitives, Tailwind CSS v4, `lucide-react`, `recharts`
- **Data fetching**: `@tanstack/react-query`, `@tanstack/react-table`
- **Observability**: `@sentry/nextjs` `^10.47.0`
- **Rate limiter (LB-10)**: Upstash Redis REST (no SDK dep; see `lib/rate-limit.ts`)
- **Testing**: `vitest` `^4.1.2` + `@vitest/coverage-v8`

## Prerequisites

- **Node 20+** (no `.nvmrc` or `engines` field present; CI pins `20`)
- **npm** (repo ships `package-lock.json`)
- A **Supabase** project (Postgres + auth)
- A **Stripe** account (test keys are enough for local dev)
- Optional for full feature parity: Twilio, Anthropic, Resend, Meta (Instagram), Telegram bot token, Upstash Redis

## Local setup

```bash
cp .env.example .env.local
```

Fill in the required variables. The short list (see `.env.example` for the full catalogue and per-var notes):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server) |
| `ANTHROPIC_API_KEY` | Claude API key for SMS/IG/TG bots |
| `STRIPE_SECRET_KEY` | Stripe server key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | Outbound + inbound SMS |
| `INSTAGRAM_APP_SECRET` / `INSTAGRAM_VERIFY_TOKEN` | Meta webhook verification |
| `RESEND_API_KEY` | Transactional email |
| `CRON_SECRET` | Bearer token Vercel cron sends to `/api/cron/*` |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (also used by self-callbacks) |

New variables introduced by the production-readiness remediation — **required before deploying the corresponding app code**:

- `ENCRYPTION_KEY` — 32-byte hex master key used by `lib/crypto.ts` to encrypt per-tenant Stripe secret keys and Instagram long-lived tokens at rest (LB-6). Generate with:
  ```bash
  openssl rand -hex 32
  ```
  Rotating this key without a backfill script breaks decryption of existing encrypted rows.
- `ENABLE_SESSION_RESTORE` — kill switch for `/api/admin/restore-session` (LB-2). Leave `false` unless impersonation is in use.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — shared rate-limiter backend (LB-10). In dev either/both may be unset (the limiter falls back to an in-process `Map`); in production both must be set or rate limits are effectively off.

Install dependencies and start the dev server:

```bash
npm ci --legacy-peer-deps
npm run dev
```

Note: `--legacy-peer-deps` is currently required because of a peer-dependency conflict between some Radix/React 19/Next 16 versions. The audit flagged this as DevOps M4 — it masks conflicts rather than fixing them, and is tracked as a backlog hygiene item. Do not remove the flag without resolving the underlying peer conflict.

## Database setup

Apply migrations with the Supabase CLI, in order:

```bash
supabase db push
```

Migrations under `supabase/migrations/` timestamped `20260405*` are part of the production-readiness remediation (encryption at rest, booking-overlap EXCLUDE constraint, retroactive promotion of ad-hoc SQL, audit logs, OTP hardening, booking-confirmation RPC, currency column, etc.). **They must be applied before deploying the corresponding app code** — several routes assume new columns or the `confirm_booking_and_lead` RPC exists.

## Testing

```bash
npm run test           # watch mode
npm run test:ci        # single run
npm run test:coverage  # with coverage
```

Wave 3-A added a Vitest regression floor in `vitest.config.ts` scoped to the files touched in Waves 1–2 of the remediation: **40% line / 30% branch / 40% function / 40% statement**. Current coverage on those paths is ~71% lines. Do not lower the floor without a reason recorded in `.audit/remediation-status.md`.

## Deployment

Vercel is the canonical deploy target. See [`vercel.json`](./vercel.json) for cron schedules and per-route function timeouts (AI / webhook / cron routes have elevated `maxDuration`).

An `ecosystem.config.js` (PM2) also exists in the repo. The audit flagged its presence as ambiguous (DevOps H4): either the self-hosted PM2 deploy is live in parallel to Vercel, in which case env/secret propagation has two surfaces, or it is historical and should be removed. Resolving this is a backlog item — treat PM2 as unsupported until then.

## Operational docs

- Runbook: [`docs/RUNBOOK.md`](./docs/RUNBOOK.md) — on-call, health checks, rollback, webhook failures, secret rotation.
- Production-readiness audit: [`.audit/PRODUCTION-READINESS-REPORT.md`](./.audit/PRODUCTION-READINESS-REPORT.md)
- Remediation status ledger: [`.audit/remediation-status.md`](./.audit/remediation-status.md)

## Project history

`AI_AGENT_AUDIT.md`, `VELOCITY_LABS_PROJECT_REPORT.md`, and everything under `.audit/` are historical artifacts kept for traceability; they are point-in-time documents and are not authoritative for current onboarding — use this README and the runbook instead.
