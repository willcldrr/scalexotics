import { NextResponse } from "next/server"
import { sendInstagramMessage } from "@/lib/instagram"

/**
 * Debug endpoint to test Instagram setup
 * GET /api/instagram/debug - Check configuration
 * POST /api/instagram/debug - Send test message (provide recipientId in body)
 */
export async function GET() {
  const config = {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN ? "SET (" + process.env.INSTAGRAM_ACCESS_TOKEN.substring(0, 10) + "...)" : "NOT SET",
    accountId: process.env.INSTAGRAM_ACCOUNT_ID || "NOT SET",
    verifyToken: process.env.INSTAGRAM_VERIFY_TOKEN ? "SET" : "NOT SET",
    appSecret: process.env.INSTAGRAM_APP_SECRET ? "SET" : "NOT SET",
  }

  // Test API connection
  let apiTest = { success: false, error: "", data: null as any }

  if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_ACCOUNT_ID) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${process.env.INSTAGRAM_ACCOUNT_ID}?fields=id,username,name&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`
      )
      const data = await response.json()

      if (response.ok) {
        apiTest = { success: true, error: "", data }
      } else {
        apiTest = { success: false, error: data.error?.message || "Unknown error", data }
      }
    } catch (error) {
      apiTest = { success: false, error: String(error), data: null }
    }
  }

  // Check webhook subscriptions
  let webhookTest = { success: false, error: "", data: null as any }

  if (process.env.INSTAGRAM_ACCESS_TOKEN) {
    try {
      // This requires app access token, not page token - may not work
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${process.env.INSTAGRAM_ACCOUNT_ID}/subscribed_apps?access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`
      )
      const data = await response.json()
      webhookTest = { success: response.ok, error: data.error?.message || "", data }
    } catch (error) {
      webhookTest = { success: false, error: String(error), data: null }
    }
  }

  return NextResponse.json({
    status: "Debug info for Instagram integration",
    timestamp: new Date().toISOString(),
    configuration: config,
    apiConnectionTest: apiTest,
    webhookSubscription: webhookTest,
    checklist: {
      "1_env_vars_set": !!(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_ACCOUNT_ID && process.env.INSTAGRAM_VERIFY_TOKEN && process.env.INSTAGRAM_APP_SECRET),
      "2_api_connection_works": apiTest.success,
      "3_webhook_url": "https://YOUR_DOMAIN/api/instagram/webhook",
      "4_required_permissions": ["instagram_manage_messages", "instagram_basic", "pages_messaging", "pages_manage_metadata"],
      "5_app_mode": "Must be in LIVE mode (not development) for production webhooks",
    },
    troubleshooting: [
      "1. Check if app is in LIVE mode in Meta Developer Console",
      "2. Verify webhook is subscribed to 'messages' field for Instagram",
      "3. Ensure Instagram account is linked to a Facebook Page",
      "4. Check that Page Access Token has correct permissions",
      "5. Verify webhook URL is publicly accessible (not localhost)",
      "6. Check Vercel/server logs for incoming webhook requests",
    ]
  }, { status: 200 })
}

/**
 * POST - Send a test message to verify sending works
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { recipientId, message } = body

    if (!recipientId) {
      return NextResponse.json({
        error: "recipientId is required",
        hint: "You need the Instagram-scoped user ID (IGSID) of someone who has messaged your account"
      }, { status: 400 })
    }

    const testMessage = message || "This is a test message from the Velocity Labs AI Assistant!"

    console.log(`[Debug] Sending test message to ${recipientId}: ${testMessage}`)

    const result = await sendInstagramMessage(recipientId, testMessage)

    return NextResponse.json({
      success: result.success,
      result,
      note: "If this failed, check that the recipientId has messaged your Instagram account within the last 24 hours (Meta's messaging window policy)"
    })
  } catch (error) {
    return NextResponse.json({
      error: String(error)
    }, { status: 500 })
  }
}
