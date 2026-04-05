/**
 * Health probe for uptime monitors and load balancers.
 *
 * Returns 200 with { status: "ok" } when the app can reach Supabase, 503 if
 * the database dependency is unreachable. Deliberately minimal — no auth,
 * no rate limiting, no side effects — so external pingers can call it on a
 * short interval without cost.
 *
 * Response shape is stable; do not add fields without a version bump.
 */

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const HEALTH_TIMEOUT_MS = 3_000

export async function GET() {
  const startedAt = Date.now()

  // Only check dependencies that are declared required. If Supabase env vars
  // aren't configured, report degraded so ops sees the misconfig immediately.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        status: "degraded",
        checks: { database: "unconfigured" },
        elapsed_ms: Date.now() - startedAt,
      },
      { status: 503 }
    )
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    )

    // Cheap round-trip: a count on a small always-present table.
    // Bounded with AbortSignal.timeout so a stuck connection can't hang the probe.
    const probe = supabase
      .from("webhook_events")
      .select("id", { count: "exact", head: true })
      .abortSignal(AbortSignal.timeout(HEALTH_TIMEOUT_MS))

    const { error } = await probe

    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          checks: { database: "error" },
          elapsed_ms: Date.now() - startedAt,
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: "ok",
      checks: { database: "ok" },
      elapsed_ms: Date.now() - startedAt,
    })
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        checks: { database: "unreachable" },
        elapsed_ms: Date.now() - startedAt,
      },
      { status: 503 }
    )
  }
}
