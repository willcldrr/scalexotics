import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: "Access code is required" },
        { status: 400 }
      )
    }

    const submittedCode = code.trim().toUpperCase()

    // Master code that always works (for admin access)
    const MASTER_CODE = "FORTUNE1"
    if (submittedCode === MASTER_CODE) {
      return NextResponse.json({ success: true })
    }

    // Create Supabase client with service role for database access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // First, check the database for valid codes
    const { data: dbCode, error: dbError } = await supabase
      .from("access_codes")
      .select("*")
      .eq("code", submittedCode)
      .eq("is_active", true)
      .single()

    if (dbCode && !dbError) {
      // Found a code in the database - validate it
      const now = new Date()

      // Check if expired
      if (dbCode.expires_at && new Date(dbCode.expires_at) < now) {
        return NextResponse.json(
          { error: "This access code has expired" },
          { status: 401 }
        )
      }

      // Check if max uses exceeded
      if (dbCode.use_count >= dbCode.max_uses) {
        return NextResponse.json(
          { error: "This access code has already been used" },
          { status: 401 }
        )
      }

      // Code is valid - update usage stats
      await supabase
        .from("access_codes")
        .update({
          use_count: dbCode.use_count + 1,
          used_at: now.toISOString(),
          used_by: userId || null,
        })
        .eq("id", dbCode.id)

      return NextResponse.json({ success: true })
    }

    // Fallback: Check environment variables (for backwards compatibility)
    const validCodes = process.env.ACCESS_CODES?.split(",").map(c => c.trim().toUpperCase()) || []
    const singleCode = process.env.ACCESS_CODE?.trim().toUpperCase()
    if (singleCode) {
      validCodes.push(singleCode)
    }

    if (validCodes.includes(submittedCode)) {
      return NextResponse.json({ success: true })
    }

    // No valid code found
    return NextResponse.json(
      { error: "Invalid access code" },
      { status: 401 }
    )
  } catch (error) {
    console.error("Error verifying access code:", error)
    return NextResponse.json(
      { error: "Failed to verify access code" },
      { status: 500 }
    )
  }
}
