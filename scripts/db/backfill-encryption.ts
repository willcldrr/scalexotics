/**
 * Encryption backfill for LB-6 — writes ciphertext into the encrypted_*
 * columns added by supabase/migrations/20260405120000_encrypt_secrets_at_rest.sql.
 *
 * Target tables and columns (declared in TABLE_CONFIGS below):
 *   - businesses.stripe_secret_key              -> encrypted_stripe_secret_key / stripe_secret_key_iv / stripe_secret_key_tag
 *   - deposit_portal_config.stripe_secret_key   -> encrypted_stripe_secret_key / stripe_secret_key_iv / stripe_secret_key_tag
 *   - instagram_connections.access_token        -> encrypted_access_token     / access_token_iv      / access_token_tag
 *
 * Resumability:
 *   Rows where the encrypted column is already populated are skipped silently.
 *   Rows where the plaintext column is NULL are skipped silently. Re-running
 *   the script is therefore safe — it only does work on rows where the
 *   encrypted trio is missing AND the plaintext value exists.
 *
 * Dry-run:
 *   --dry-run performs every step EXCEPT the UPDATE, so operators can preview
 *   exactly how many rows would change before committing. Real writes are the
 *   DEFAULT so accidents require an explicit flag to SKIP writes, not to
 *   perform them.
 *
 * Environment:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ENCRYPTION_KEY
 *   must all be set before invocation. This script does NOT read .env
 *   directly — load env via the shell, `dotenv -e .env.local --`, or your
 *   deployment platform's secret manager before calling it.
 *
 * Usage:
 *   npx tsx scripts/db/backfill-encryption.ts [--dry-run] \
 *     [--table=businesses|deposit_portal_config|instagram_connections|all] \
 *     [--batch-size=100]
 *
 * Exit codes: 0 success, 1 runtime errors, 2 missing env vars.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { encrypt } from "@/lib/crypto"
import { log } from "@/lib/log"

// ---------- Types ----------

interface TableConfig {
  table: string
  idCol: string
  plaintextCol: string
  encryptedCol: string
  ivCol: string
  tagCol: string
}

interface TableSummary {
  table: string
  totalRows: number
  encrypted: number
  skippedAlreadyEncrypted: number
  skippedNoPlaintext: number
  errors: number
  dryRun: boolean
}

interface CliArgs {
  dryRun: boolean
  table: "all" | string
  batchSize: number
  help: boolean
}

// ---------- Configuration ----------

const TABLE_CONFIGS: Record<string, TableConfig> = {
  businesses: {
    table: "businesses",
    idCol: "id",
    plaintextCol: "stripe_secret_key",
    encryptedCol: "encrypted_stripe_secret_key",
    ivCol: "stripe_secret_key_iv",
    tagCol: "stripe_secret_key_tag",
  },
  deposit_portal_config: {
    table: "deposit_portal_config",
    idCol: "id",
    plaintextCol: "stripe_secret_key",
    encryptedCol: "encrypted_stripe_secret_key",
    ivCol: "stripe_secret_key_iv",
    tagCol: "stripe_secret_key_tag",
  },
  instagram_connections: {
    table: "instagram_connections",
    idCol: "id",
    plaintextCol: "access_token",
    encryptedCol: "encrypted_access_token",
    ivCol: "access_token_iv",
    tagCol: "access_token_tag",
  },
}

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ENCRYPTION_KEY",
] as const

// ---------- Arg parsing ----------

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    dryRun: false,
    table: "all",
    batchSize: 100,
    help: false,
  }
  for (const a of argv) {
    if (a === "--help" || a === "-h") {
      args.help = true
    } else if (a === "--dry-run") {
      args.dryRun = true
    } else if (a.startsWith("--table=")) {
      args.table = a.slice("--table=".length)
    } else if (a.startsWith("--batch-size=")) {
      const n = Number.parseInt(a.slice("--batch-size=".length), 10)
      if (!Number.isFinite(n) || n <= 0) {
        throw new Error(`invalid --batch-size: ${a}`)
      }
      args.batchSize = n
    } else {
      throw new Error(`unknown argument: ${a}`)
    }
  }
  return args
}

function printHelp(): void {
  process.stdout.write(
    `Usage: npx tsx scripts/db/backfill-encryption.ts [options]

Options:
  --dry-run                         Preview only; no writes.
  --table=<name>                    One of: businesses, deposit_portal_config,
                                    instagram_connections, all  (default: all)
  --batch-size=<n>                  Page size for SELECT (default: 100)
  -h, --help                        Show this help and exit.

Required env vars: ${REQUIRED_ENV.join(", ")}

Exit codes:
  0 — success
  1 — one or more row-level errors
  2 — missing env vars or invalid arguments
`
  )
}

// ---------- Env check ----------

function assertEnv(): { url: string; key: string } {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k])
  if (missing.length > 0) {
    process.stderr.write(
      `[backfill-encryption] missing required env vars: ${missing.join(", ")}\n` +
        `Load them via your shell, 'dotenv -e .env.local --', or your deployment platform before invoking this script.\n`
    )
    process.exit(2)
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  }
}

// ---------- Per-row processing ----------

interface RowShape {
  [k: string]: unknown
}

async function processRow(
  client: SupabaseClient,
  cfg: TableConfig,
  row: RowShape,
  summary: TableSummary,
  dryRun: boolean
): Promise<void> {
  const id = row[cfg.idCol] as string
  const existingEncrypted = row[cfg.encryptedCol]
  const plaintext = row[cfg.plaintextCol]

  if (existingEncrypted != null && existingEncrypted !== "") {
    summary.skippedAlreadyEncrypted++
    log.info("[backfill-encryption] row processed", {
      table: cfg.table,
      id,
      action: "skipped_already_encrypted",
      dryRun,
    })
    return
  }

  if (plaintext == null || plaintext === "") {
    summary.skippedNoPlaintext++
    log.info("[backfill-encryption] row processed", {
      table: cfg.table,
      id,
      action: "skipped_no_plaintext",
      dryRun,
    })
    return
  }

  try {
    const payload = encrypt(String(plaintext))
    if (dryRun) {
      summary.encrypted++
      log.info("[backfill-encryption] row processed", {
        table: cfg.table,
        id,
        action: "would_encrypt",
        dryRun,
      })
      return
    }
    const { error } = await client
      .from(cfg.table)
      .update({
        [cfg.encryptedCol]: payload.ciphertext,
        [cfg.ivCol]: payload.iv,
        [cfg.tagCol]: payload.tag,
      })
      .eq(cfg.idCol, id)
    if (error) {
      summary.errors++
      log.error("[backfill-encryption] update failed", error, {
        table: cfg.table,
        id,
      })
      return
    }
    summary.encrypted++
    log.info("[backfill-encryption] row processed", {
      table: cfg.table,
      id,
      action: "encrypted",
      dryRun,
    })
  } catch (err) {
    summary.errors++
    log.error("[backfill-encryption] row error", err, {
      table: cfg.table,
      id,
    })
  }
}

// ---------- Per-table loop ----------

async function backfillTable(
  client: SupabaseClient,
  cfg: TableConfig,
  batchSize: number,
  dryRun: boolean
): Promise<TableSummary> {
  const summary: TableSummary = {
    table: cfg.table,
    totalRows: 0,
    encrypted: 0,
    skippedAlreadyEncrypted: 0,
    skippedNoPlaintext: 0,
    errors: 0,
    dryRun,
  }

  const columns = [cfg.idCol, cfg.plaintextCol, cfg.encryptedCol].join(", ")
  let start = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const end = start + batchSize - 1
    const { data, error } = await client
      .from(cfg.table)
      .select(columns)
      .order(cfg.idCol, { ascending: true })
      .range(start, end)

    if (error) {
      summary.errors++
      log.error("[backfill-encryption] select failed", error, {
        table: cfg.table,
        start,
        end,
      })
      break
    }

    const rows = (data ?? []) as unknown as RowShape[]
    if (rows.length === 0) break

    for (const row of rows) {
      summary.totalRows++
      await processRow(client, cfg, row, summary, dryRun)
    }

    if (rows.length < batchSize) break
    start += batchSize
  }

  return summary
}

// ---------- Main ----------

async function main(): Promise<void> {
  let args: CliArgs
  try {
    args = parseArgs(process.argv.slice(2))
  } catch (err) {
    process.stderr.write(`[backfill-encryption] ${(err as Error).message}\n`)
    printHelp()
    process.exit(2)
  }

  if (args.help) {
    printHelp()
    process.exit(0)
  }

  const { url, key } = assertEnv()

  const selectedTables =
    args.table === "all"
      ? Object.keys(TABLE_CONFIGS)
      : [args.table].filter((t) => {
          if (!(t in TABLE_CONFIGS)) {
            process.stderr.write(
              `[backfill-encryption] unknown table '${t}'. Valid: ${Object.keys(TABLE_CONFIGS).join(", ")}, all\n`
            )
            process.exit(2)
          }
          return true
        })

  const client = createClient(url, key, { auth: { persistSession: false } })

  log.info("[backfill-encryption] starting", {
    tables: selectedTables,
    batchSize: args.batchSize,
    dryRun: args.dryRun,
  })

  const summaries: TableSummary[] = []
  for (const name of selectedTables) {
    const cfg = TABLE_CONFIGS[name]
    const summary = await backfillTable(client, cfg, args.batchSize, args.dryRun)
    log.info("[backfill-encryption] summary", { ...summary })
    summaries.push(summary)
  }

  const combined = summaries.reduce(
    (acc, s) => ({
      totalRows: acc.totalRows + s.totalRows,
      encrypted: acc.encrypted + s.encrypted,
      skippedAlreadyEncrypted: acc.skippedAlreadyEncrypted + s.skippedAlreadyEncrypted,
      skippedNoPlaintext: acc.skippedNoPlaintext + s.skippedNoPlaintext,
      errors: acc.errors + s.errors,
    }),
    { totalRows: 0, encrypted: 0, skippedAlreadyEncrypted: 0, skippedNoPlaintext: 0, errors: 0 }
  )

  log.info("[backfill-encryption] combined summary", {
    ...combined,
    dryRun: args.dryRun,
    tables: selectedTables,
  })

  process.exit(combined.errors > 0 ? 1 : 0)
}

main().catch((err) => {
  log.error("[backfill-encryption] fatal", err)
  process.exit(1)
})
