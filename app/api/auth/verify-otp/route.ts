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
  const limited = applyRateLimit(request, { limit: 10, window: 60 })
  if (limited) return limited

  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Find valid OTP
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_codes")
      .select("id, user_id, expires_at, failed_attempts")
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

    // Check if too many failed attempts
    if ((otpRecord.failed_attempts || 0) >= 5) {
      await supabase
        .from("otp_codes")
        .update({ used: true })
        .eq("id", otpRecord.id)

      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new code." },
        { status: 400 }
      )
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      // Mark as used
      await supabase
        .from("otp_codes")
        .update({ used: true })
        .eq("id", otpRecord.id)

      // On failure, increment attempts
      await supabase.from("otp_codes").update({
        failed_attempts: (otpRecord.failed_attempts || 0) + 1
      }).eq("id", otpRecord.id)

      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Mark OTP as used
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("id", otpRecord.id)

    // Confirm the user's email via admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      otpRecord.user_id,
      { email_confirm: true }
    )

    if (updateError) {
      console.error("Failed to confirm user:", updateError)
      return NextResponse.json(
        { error: "Failed to verify email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Verify OTP API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
