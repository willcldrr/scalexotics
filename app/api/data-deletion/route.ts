import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

const deletionRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  confirmEmail: z.string().email("Invalid email address"),
  deletionType: z.enum(["account", "instagram", "leads", "messages", "all"]),
  additionalInfo: z.string().optional(),
  acknowledged: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge the deletion terms" }),
  }),
})

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = deletionRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, confirmEmail, deletionType, additionalInfo } = validationResult.data

    // Verify emails match
    if (email !== confirmEmail) {
      return NextResponse.json(
        { error: "Email addresses do not match" },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Check if user exists
    const { data: users } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .limit(1)

    // Also check auth.users
    const { data: authUser } = await supabase.auth.admin.listUsers()
    const matchingAuthUser = authUser?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    // Store the deletion request
    const { error: insertError } = await supabase.from("data_deletion_requests").insert({
      email: email.toLowerCase(),
      user_id: users?.[0]?.id || matchingAuthUser?.id || null,
      deletion_type: deletionType,
      additional_info: additionalInfo || null,
      status: "pending",
      requested_at: new Date().toISOString(),
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      user_agent: request.headers.get("user-agent") || null,
    })

    if (insertError) {
      // If table doesn't exist, log the request anyway
      console.log("[Data Deletion Request]", {
        email: email.toLowerCase(),
        deletionType,
        additionalInfo,
        timestamp: new Date().toISOString(),
      })
    }

    // Log for compliance tracking
    console.log(`[GDPR/CCPA] Data deletion request received for: ${email}`)

    return NextResponse.json({
      success: true,
      message: "Your deletion request has been submitted and will be processed within 30 days.",
    })
  } catch (error) {
    console.error("[Data Deletion] Error processing request:", error)
    return NextResponse.json(
      { error: "Failed to process deletion request. Please try again." },
      { status: 500 }
    )
  }
}

// Meta requires a callback URL for data deletion requests
// This handles the Meta Data Deletion Callback
export async function GET(request: Request) {
  const url = new URL(request.url)
  const signedRequest = url.searchParams.get("signed_request")

  if (!signedRequest) {
    return NextResponse.json(
      { error: "Missing signed_request parameter" },
      { status: 400 }
    )
  }

  try {
    // Parse the signed request from Meta
    const [encodedSig, payload] = signedRequest.split(".")

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid signed_request format" },
        { status: 400 }
      )
    }

    // Decode the payload
    const decodedPayload = JSON.parse(
      Buffer.from(payload, "base64").toString("utf-8")
    )

    const userId = decodedPayload.user_id

    // Log the deletion request
    console.log(`[Meta Data Deletion] Request for user_id: ${userId}`)

    const supabase = getSupabase()

    // Find and mark Instagram connection for deletion
    if (userId) {
      await supabase
        .from("instagram_connections")
        .update({ is_active: false, deletion_requested_at: new Date().toISOString() })
        .eq("instagram_account_id", userId)
    }

    // Generate confirmation code
    const confirmationCode = `DEL-${Date.now().toString(36).toUpperCase()}`

    // Meta expects a specific response format
    return NextResponse.json({
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://velocitylabs.io"}/data-deletion?confirmation=${confirmationCode}`,
      confirmation_code: confirmationCode,
    })
  } catch (error) {
    console.error("[Meta Data Deletion] Error:", error)
    return NextResponse.json(
      { error: "Failed to process deletion request" },
      { status: 500 }
    )
  }
}
