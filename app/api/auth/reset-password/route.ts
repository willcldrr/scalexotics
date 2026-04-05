import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { applyRateLimit } from "@/lib/api-rate-limit"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, { limit: 5, window: 60 })
  if (limited) return limited

  try {
    const { email, code, password } = await request.json()

    if (!email || !code || !password) {
      return NextResponse.json(
        { error: "Email, code, and new password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one letter and one number" },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Find valid OTP
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_codes")
      .select("id, user_id, expires_at")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      )
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase
        .from("otp_codes")
        .update({ used: true })
        .eq("id", otpRecord.id)

      return NextResponse.json(
        { error: "Code has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Mark OTP as used
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("id", otpRecord.id)

    // Update the user's password via admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      otpRecord.user_id,
      { password }
    )

    if (updateError) {
      console.error("Failed to update password:", updateError)
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
