import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendInstagramMessage, InstagramCredentials } from "@/lib/instagram"
import { applyRateLimit } from "@/lib/api-rate-limit"

export const dynamic = "force-dynamic"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, { limit: 30, window: 60 })
  if (limited) return limited

  try {
    const supabase = getSupabase()

    // Verify authenticated user
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { leadId, message } = await request.json()

    if (!leadId || !message) {
      return NextResponse.json({ error: "leadId and message are required" }, { status: 400 })
    }

    // Get the lead to find Instagram user ID
    const { data: lead } = await supabase
      .from("leads")
      .select("instagram_user_id, user_id")
      .eq("id", leadId)
      .single()

    if (!lead || !lead.instagram_user_id) {
      return NextResponse.json({ error: "Lead has no Instagram account linked" }, { status: 400 })
    }

    // Verify the lead belongs to this user
    if (lead.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get Instagram credentials for this user
    const { data: connection } = await supabase
      .from("instagram_connections")
      .select("access_token, instagram_account_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    let credentials: InstagramCredentials | undefined

    if (connection) {
      credentials = {
        accessToken: connection.access_token,
        accountId: connection.instagram_account_id,
      }
    }

    // Send via Instagram
    const result = await sendInstagramMessage(lead.instagram_user_id, message, credentials)

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send Instagram message" }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error("[Instagram Send] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
