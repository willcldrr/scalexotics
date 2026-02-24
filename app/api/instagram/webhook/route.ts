import { NextRequest, NextResponse } from "next/server"
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
  getDefaultUserId,
} from "@/lib/sms-ai"
import { findOrCreateInstagramLead } from "@/lib/instagram-leads"

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
    console.log("Instagram webhook verified successfully")
    return new NextResponse(challenge, { status: 200 })
  }

  console.error("Instagram webhook verification failed")
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

    // Verify the request is from Meta (optional but recommended in production)
    if (process.env.NODE_ENV === "production") {
      if (!verifyWebhookSignature(signature, rawBody)) {
        console.error("Instagram webhook signature verification failed")
        return new NextResponse("Invalid signature", { status: 401 })
      }
    }

    // Parse the webhook payload
    const body = JSON.parse(rawBody)

    // Meta expects a 200 OK response quickly to avoid retries
    // Process the message asynchronously
    processInstagramMessage(body).catch((error) => {
      console.error("Error processing Instagram message:", error)
    })

    // Return 200 immediately (Meta best practice)
    return new NextResponse("EVENT_RECEIVED", { status: 200 })
  } catch (error) {
    console.error("Instagram webhook error:", error)
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
    console.log("No valid message in webhook payload (might be echo or other event)")
    return
  }

  // Skip if no text content (e.g., media-only message)
  if (!message.text) {
    console.log("Received non-text message, sending fallback response")
    await sendInstagramMessage(
      message.senderId,
      "Thanks for reaching out! Feel free to send me a text message and I'll help you book an exotic car rental."
    )
    return
  }

  console.log(`Instagram DM from ${message.senderId}: ${message.text}`)

  // Mark message as seen
  await markMessageSeen(message.senderId)

  // Get user ID (in production, map Instagram account to user)
  const userId = await getDefaultUserId()
  if (!userId) {
    console.error("No user found for Instagram webhook")
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
    console.error("Could not find or create Instagram lead")
    return
  }

  // Save the incoming message
  await saveMessage(userId, lead.id, message.text, "inbound")

  // Show typing indicator while generating response
  await sendTypingIndicator(message.senderId, true)

  try {
    // Generate AI response using the existing AI engine
    // Pass "instagram" as channel for channel-specific prompt adjustments
    const aiResponse = await generateAIResponse(
      userId,
      lead.id,
      message.text,
      lead.name,
      "instagram"
    )

    // Turn off typing indicator
    await sendTypingIndicator(message.senderId, false)

    // Save the outgoing message
    await saveMessage(userId, lead.id, aiResponse, "outbound")

    // Send the response via Instagram
    const sendResult = await sendInstagramMessage(message.senderId, aiResponse)

    if (sendResult.success) {
      console.log(`Sent Instagram response to ${message.senderId}: ${aiResponse}`)
    } else {
      console.error(`Failed to send Instagram response: ${sendResult.error}`)
    }
  } catch (error) {
    console.error("Error generating/sending AI response:", error)
    await sendTypingIndicator(message.senderId, false)

    // Send fallback message
    await sendInstagramMessage(
      message.senderId,
      "Thanks for your message! One of our team members will get back to you shortly."
    )
  }
}
