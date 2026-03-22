import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  verifyWebhookSignature,
  parseInstagramWebhook,
  sendInstagramMessage,
  getInstagramUserInfo,
  markMessageSeen,
  sendTypingIndicator,
  InstagramCredentials,
} from "@/lib/instagram"
import {
  generateAIResponse,
  saveMessage,
} from "@/lib/sms-ai"
import { findOrCreateInstagramLead } from "@/lib/instagram-leads"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface InstagramConnection {
  user_id: string
  instagram_account_id: string
  access_token: string
  is_active: boolean
}

// Look up user and credentials by their Instagram account ID
async function getConnectionByInstagramAccount(instagramAccountId: string): Promise<{
  userId: string
  credentials: InstagramCredentials
} | null> {
  const supabase = getSupabase()

  // First, try to look up in instagram_connections table (OAuth-based connections)
  const { data: connection } = await supabase
    .from("instagram_connections")
    .select("user_id, instagram_account_id, access_token")
    .eq("instagram_account_id", instagramAccountId)
    .eq("is_active", true)
    .single()

  if (connection) {
    return {
      userId: connection.user_id,
      credentials: {
        accessToken: connection.access_token,
        accountId: connection.instagram_account_id,
      },
    }
  }

  // Fall back to env vars if no OAuth connection found
  // This supports legacy single-tenant setup
  if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_ACCOUNT_ID) {
    // Look up a user with instagram_enabled in ai_settings
    const { data: settings } = await supabase
      .from("ai_settings")
      .select("user_id")
      .eq("instagram_enabled", true)
      .limit(1)
      .single()

    if (settings) {
      return {
        userId: settings.user_id,
        credentials: {
          accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
          accountId: process.env.INSTAGRAM_ACCOUNT_ID,
        },
      }
    }
  }

  return null
}

/**
 * GET handler for webhook verification
 * Meta sends a verification request when you configure the webhook
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN

  // Verify the webhook subscription
  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse("Verification failed", { status: 403 })
}

/**
 * POST handler for incoming Instagram messages
 * Meta sends webhook events here when users message the Instagram account
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get("x-hub-signature-256")

    // Always verify the request is from Meta
    if (!verifyWebhookSignature(signature, rawBody)) {
      console.error("[Instagram Webhook] Signature verification failed")
      return new NextResponse("Invalid signature", { status: 401 })
    }

    // Parse the webhook payload
    const body = JSON.parse(rawBody)

    // Meta expects a 200 OK response quickly to avoid retries
    // Process the message asynchronously
    processInstagramMessage(body).catch((error) => {
      console.error("[Instagram Webhook] Processing error")
    })

    // Return 200 immediately (Meta best practice)
    return new NextResponse("EVENT_RECEIVED", { status: 200 })
  } catch (error) {
    console.error("[Instagram Webhook] Error")
    // Still return 200 to prevent Meta retries
    return new NextResponse("EVENT_RECEIVED", { status: 200 })
  }
}

/**
 * Process incoming Instagram message asynchronously
 */
async function processInstagramMessage(webhookBody: any): Promise<void> {
  // Parse the Instagram message from webhook payload
  const message = parseInstagramWebhook(webhookBody)

  if (!message) {
    return
  }

  // Look up user and credentials by Instagram account (multi-tenant support)
  const recipientId = message.recipientId || process.env.INSTAGRAM_ACCOUNT_ID
  const connection = await getConnectionByInstagramAccount(recipientId || "")

  if (!connection) {
    console.error("[Instagram] No user configured for this Instagram account")
    return
  }

  const { userId, credentials } = connection

  // Skip if no text content (e.g., media-only message)
  if (!message.text) {
    await sendInstagramMessage(
      message.senderId,
      "Thanks for reaching out! Feel free to send me a text message and I'll help you book an exotic car rental.",
      credentials
    )
    return
  }

  // Mark message as seen
  await markMessageSeen(message.senderId, credentials)

  // Get Instagram user info for better lead creation
  const userInfo = await getInstagramUserInfo(message.senderId, credentials)

  // Find or create lead for this Instagram user
  const lead = await findOrCreateInstagramLead(
    userId,
    message.senderId,
    userInfo?.username,
    userInfo?.name
  )

  if (!lead) {
    console.error("[Instagram] Could not find or create lead")
    return
  }

  // Save the incoming message
  await saveMessage(userId, lead.id, message.text, "inbound")

  // Show typing indicator while generating response
  await sendTypingIndicator(message.senderId, true, credentials)

  try {
    // Generate AI response using the existing AI engine
    // Pass "instagram" as channel for channel-specific prompt adjustments
    const aiResult = await generateAIResponse(
      userId,
      lead.id,
      message.text,
      lead.name,
      "instagram"
    )

    // Turn off typing indicator
    await sendTypingIndicator(message.senderId, false, credentials)

    // Save the outgoing message
    await saveMessage(userId, lead.id, aiResult.response, "outbound")

    // Send the response via Instagram
    const sendResult = await sendInstagramMessage(message.senderId, aiResult.response, credentials)

    if (!sendResult.success) {
      console.error("[Instagram] Failed to send response")
    }
  } catch (error) {
    console.error("[Instagram] AI response error")
    await sendTypingIndicator(message.senderId, false, credentials)

    // Send fallback message
    await sendInstagramMessage(
      message.senderId,
      "Thanks for your message! One of our team members will get back to you shortly.",
      credentials
    )
  }
}
