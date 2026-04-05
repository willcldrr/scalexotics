# scripts/db

One-off database maintenance scripts (TypeScript). Each script is invoked
via `npx tsx` and expects required env vars to be loaded by the shell
before invocation — scripts in this directory do not read `.env` files
themselves.

## backfill-encryption.ts

Backfills AES-256-GCM ciphertext into the `encrypted_*` / `*_iv` /
`*_tag` columns added by
`supabase/migrations/20260405120000_encrypt_secrets_at_rest.sql` for
three tables: `businesses`, `deposit_portal_config`, and
`instagram_connections`. Re-runs are safe: rows whose encrypted column
is already populated are skipped silently.

### Required env vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENCRYPTION_KEY`

Load them via your shell, `dotenv -e .env.local --`, or your deployment
platform's secret manager. The script exits with code `2` if any are
missing.

### Dry-run (no writes)

```bash
npx tsx scripts/db/backfill-encryption.ts --dry-run --table=all --batch-size=100
```

Successful dry-run output: one JSON log line per row with
`action:"would_encrypt" | "skipped_already_encrypted" | "skipped_no_plaintext"`,
followed by a per-table `summary` and a `combined summary`.

### Real run (writes ciphertext)

```bash
npx tsx scripts/db/backfill-encryption.ts --table=all --batch-size=100
```

Exit codes: `0` = success, `1` = one or more row-level errors, `2` =
missing env vars or invalid arguments.

See `docs/RUNBOOK.md` §13 for the full run-order checklist (apply
migrations → dry-run → real run → verify → rollback procedures).
