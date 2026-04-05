import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { applyRateLimit } from "@/lib/api-rate-limit"

const restoreSessionSchema = z.object({
  adminUserId: z.string().uuid("Invalid admin user ID format"),
})

export const dynamic = "force-dynamic"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Generate a fresh session for the admin user after exiting impersonation.
 * Uses the admin user ID (stored in sessionStorage) to create a new magic link session.
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, { limit: 10, window: 60 })
  if (limited) return limited

  try {
    const supabase = getSupabase()

    const parsed = restoreSessionSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const { adminUserId } = parsed.data

    // Verify this user is actually an admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", adminUserId)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Not an admin" }, { status: 403 })
    }

    // Get the admin user's email
    const { data: adminUser, error: userError } = await supabase.auth.admin.getUserById(adminUserId)

    if (userError || !adminUser.user?.email) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
    }

    // Generate a fresh session via magic link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: adminUser.user.email,
    })

    if (linkError || !linkData) {
      return NextResponse.json({ error: "Failed to generate session" }, { status: 500 })
    }

    const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: linkData.properties.hashed_token,
    })

    if (verifyError || !sessionData.session) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    return NextResponse.json({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    })
  } catch (error) {
    console.error("[Restore Admin Session] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
