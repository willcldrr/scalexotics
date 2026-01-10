import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import {
  generateAIResponse,
  findOrCreateLead,
  saveMessage,
  getDefaultUserId,
} from "@/lib/sms-ai"

function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
}

export async function POST(request: NextRequest) {
  try {
    const twilioClient = getTwilioClient()
    const formData = await request.formData()

    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const body = formData.get("Body") as string

    console.log(`Incoming SMS from ${from}: ${body}`)

    if (!from || !body) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Get the user ID (in production, map Twilio number to user)
    const userId = await getDefaultUserId()
    if (!userId) {
      console.error("No user found")
      return new NextResponse("No user configured", { status: 500 })
    }

    // Find or create the lead
    const lead = await findOrCreateLead(userId, from)
    if (!lead) {
      console.error("Could not find or create lead")
      return new NextResponse("Lead error", { status: 500 })
    }

    // Save the incoming message
    await saveMessage(userId, lead.id, body, "inbound")

    // Generate AI response
    const aiResponse = await generateAIResponse(userId, lead.id, body, lead.name)

    // Save the outgoing message
    await saveMessage(userId, lead.id, aiResponse, "outbound")

    // Send the SMS response via Twilio
    await twilioClient.messages.create({
      body: aiResponse,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: from,
    })

    console.log(`Sent response to ${from}: ${aiResponse}`)

    // Return TwiML response (Twilio expects this)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("SMS webhook error:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// Handle GET for webhook verification
export async function GET() {
  return new NextResponse("SMS webhook is active", { status: 200 })
}
