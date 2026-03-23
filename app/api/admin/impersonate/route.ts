import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

    // Get target user's email from auth
    const { data: targetUser, error: targetError } = await supabase.auth.admin.getUserById(userId)

    if (targetError || !targetUser.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate a magic link for the target user
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.user.email!,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
      },
    })

    if (linkError || !linkData) {
      console.error("Failed to generate magic link:", linkError)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    // Extract the token from the magic link
    // The link format is: {baseUrl}/auth/v1/verify?token={token}&type=magiclink&...
    const url = new URL(linkData.properties.action_link)
    const tokenHash = url.searchParams.get("token")

    if (!tokenHash) {
      return NextResponse.json({ error: "Failed to extract session token" }, { status: 500 })
    }

    // Verify the OTP to get a session
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    })

    if (sessionError || !sessionData.session) {
      console.error("Failed to verify OTP:", sessionError)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    return NextResponse.json({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      user: {
        id: sessionData.user?.id,
        email: sessionData.user?.email,
      },
    })
  } catch (error) {
    console.error("Impersonation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
