import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"

// Service role client for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("is_admin, full_name, email")
      .eq("id", adminUser.id)
      .single()

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get target user ID from request
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Don't allow impersonating yourself
    if (userId === adminUser.id) {
      return NextResponse.json({ error: "Cannot impersonate yourself" }, { status: 400 })
    }

    // Get target user from auth
    const { data: targetUser, error: targetError } = await supabase.auth.admin.getUserById(userId)

    if (targetError || !targetUser.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create a custom JWT for impersonation
    // This does NOT invalidate the user's existing sessions
    const jwtSecret = process.env.SUPABASE_JWT_SECRET
    if (!jwtSecret) {
      console.error("SUPABASE_JWT_SECRET not configured")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const now = Math.floor(Date.now() / 1000)
    const expiresIn = 3600 // 1 hour

    // Create access token with same structure as Supabase
    const accessToken = jwt.sign(
      {
        aud: "authenticated",
        exp: now + expiresIn,
        iat: now,
        iss: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
        sub: targetUser.user.id,
        email: targetUser.user.email,
        phone: targetUser.user.phone || "",
        app_metadata: targetUser.user.app_metadata || {},
        user_metadata: targetUser.user.user_metadata || {},
        role: "authenticated",
        aal: "aal1",
        amr: [{ method: "admin_impersonate", timestamp: now }],
        session_id: `impersonate_${adminUser.id}_${Date.now()}`,
      },
      jwtSecret,
      { algorithm: "HS256" }
    )

    // Create a refresh token (simple version for impersonation)
    const refreshToken = jwt.sign(
      {
        aud: "authenticated",
        exp: now + (expiresIn * 24), // 24 hours
        iat: now,
        iss: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
        sub: targetUser.user.id,
        session_id: `impersonate_${adminUser.id}_${Date.now()}`,
      },
      jwtSecret,
      { algorithm: "HS256" }
    )

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: targetUser.user.id,
        email: targetUser.user.email,
      },
    })
  } catch (error) {
    console.error("Impersonation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
