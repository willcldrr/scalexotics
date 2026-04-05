#!/usr/bin/env node
/**
 * Verification script for the two production-readiness migrations.
 *
 * Run with:   node scripts/verify-migrations.mjs
 *
 * Migration 1 (webhook_events_idempotency):
 *   - Inserts a synthetic event, expects success.
 *   - Inserts the same (source, event_id) again, expects a 23505 unique
 *     violation. This proves the UNIQUE constraint is actually enforcing
 *     idempotency.
 *   - Reads the row back.
 *   - Cleans up.
 *
 * Migration 2 (performance_indexes):
 *   - Runs a benign SELECT matching each index's leading columns on the
 *     corresponding table. A missing table, missing column, or broken RLS
 *     would surface here. This doesn't prove the planner actually uses the
 *     index (that requires EXPLAIN), but it proves the schema the indexes
 *     were built on exists and is queryable end-to-end.
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

// Tiny .env loader so we don't add dotenv just for this script.
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, "..", ".env")
try {
  const envText = readFileSync(envPath, "utf8")
  for (const line of envText.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  }
} catch {
  // no .env, rely on ambient
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(2)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

let passed = 0
let failed = 0

function report(name, ok, detail) {
  if (ok) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.log(`  FAIL  ${name}${detail ? `  — ${detail}` : ""}`)
  }
}

// ────────────────────────────────────────────────────────────────────────
// Migration 1 — webhook_events
// ────────────────────────────────────────────────────────────────────────
console.log("\nMigration 1: webhook_events idempotency ledger")

const testEventId = `verify-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const testRow = {
  source: "stripe",
  event_id: testEventId,
  event_type: "verify.test",
  status: "received",
}

// 1a. first insert should succeed
const firstInsert = await supabase
  .from("webhook_events")
  .insert(testRow)
  .select("id")
  .single()

const firstOk = !firstInsert.error && firstInsert.data?.id
report(
  "webhook_events table exists and accepts inserts",
  firstOk,
  firstInsert.error?.message
)

// 1b. duplicate insert should fail with 23505
const dupInsert = await supabase.from("webhook_events").insert(testRow)
const dupOk = dupInsert.error && dupInsert.error.code === "23505"
report(
  "UNIQUE (source, event_id) constraint blocks duplicate",
  dupOk,
  dupInsert.error
    ? `expected code 23505, got ${dupInsert.error.code}`
    : "duplicate insert unexpectedly succeeded"
)

// 1c. readback confirms status default + timestamp
const readback = await supabase
  .from("webhook_events")
  .select("id, source, event_id, status, received_at")
  .eq("event_id", testEventId)
  .single()

const readOk =
  !readback.error &&
  readback.data?.source === "stripe" &&
  readback.data?.status === "received" &&
  readback.data?.received_at

report(
  "row reads back with defaults applied",
  readOk,
  readback.error?.message
)

// 1d. cleanup
if (firstInsert.data?.id) {
  await supabase.from("webhook_events").delete().eq("id", firstInsert.data.id)
}

// ────────────────────────────────────────────────────────────────────────
// Migration 2 — performance indexes (schema probes)
// ────────────────────────────────────────────────────────────────────────
console.log("\nMigration 2: performance index schema probes")

// messages(lead_id, created_at DESC)
const msgs = await supabase
  .from("messages")
  .select("id, lead_id, created_at")
  .order("created_at", { ascending: false })
  .limit(1)
report(
  "messages(lead_id, created_at) queryable",
  !msgs.error,
  msgs.error?.message
)

// bookings(user_id, status, start_date DESC)
const bookings = await supabase
  .from("bookings")
  .select("id, user_id, status, start_date")
  .order("start_date", { ascending: false })
  .limit(1)
report(
  "bookings(user_id, status, start_date) queryable",
  !bookings.error,
  bookings.error?.message
)

// leads(user_id, status, created_at DESC)
const leads = await supabase
  .from("leads")
  .select("id, user_id, status, created_at")
  .order("created_at", { ascending: false })
  .limit(1)
report(
  "leads(user_id, status, created_at) queryable",
  !leads.error,
  leads.error?.message
)

// bookings partial index (user_id, end_date) WHERE status IN ('confirmed','pending')
const partial = await supabase
  .from("bookings")
  .select("id, end_date")
  .in("status", ["confirmed", "pending"])
  .limit(1)
report(
  "bookings partial-index filter (confirmed/pending) queryable",
  !partial.error,
  partial.error?.message
)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
