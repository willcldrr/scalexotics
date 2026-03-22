import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  verifyWebhookSignature,
  parseInstagramWebhook,
  sendInstagramMessage,
  getInstagramUserInfo,
  markMessageSeen,
  sendTypingIndicator,
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

// Look up user by their configured Instagram account ID
async function getUserIdByInstagramAccount(instagramAccountId: string): Promise<string | null> {
  const supabase = getSupabase()

  // Look up in ai_settings by instagram_account_id or check user_settings
  const { data: settings } = await supabase
    .from("ai_settings")
    .select("user_id")
    .eq("instagram_enabled", true)

  // For now, if Instagram is enabled for a user, route to them
  // In production, you'd want a mapping table for Instagram account -> user
  if (settings && settings.length > 0) {
    // If only one user has Instagram enabled, use them
    if (settings.length === 1) {
      return settings[0].user_id
    }
    // TODO: Add instagram_account_id to ai_settings for proper multi-tenant
    // For now, return the first one
    return settings[0].user_id
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

  // Skip if no text content (e.g., media-only message)
  if (!message.text) {
    await sendInstagramMessage(
      message.senderId,
      "Thanks for reaching out! Feel free to send me a text message and I'll help you book an exotic car rental."
    )
    return
  }

  // Mark message as seen
  await markMessageSeen(message.senderId)

  // Look up user by Instagram account (multi-tenant support)
  const recipientId = message.recipientId || process.env.INSTAGRAM_ACCOUNT_ID
  const userId = await getUserIdByInstagramAccount(recipientId || "")
  if (!userId) {
    console.error("[Instagram] No user configured for this Instagram account")
    return
  }

  // Get Instagram user info for better lead creation
  const userInfo = await getInstagramUserInfo(message.senderId)

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
  await sendTypingIndicator(message.senderId, true)

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
    await sendTypingIndicator(message.senderId, false)

    // Save the outgoing message
    await saveMessage(userId, lead.id, aiResult.response, "outbound")

    // Send the response via Instagram
    const sendResult = await sendInstagramMessage(message.senderId, aiResult.response)

    if (!sendResult.success) {
      console.error("[Instagram] Failed to send response")
    }
  } catch (error) {
    console.error("[Instagram] AI response error")
    await sendTypingIndicator(message.senderId, false)

    // Send fallback message
    await sendInstagramMessage(
      message.senderId,
      "Thanks for your message! One of our team members will get back to you shortly."
    )
  }
}
