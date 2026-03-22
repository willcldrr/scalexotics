import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { createClient } from "@supabase/supabase-js"
import {
  generateAIResponse,
  findOrCreateLead,
  saveMessage,
} from "@/lib/sms-ai"

function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Look up user by their configured Twilio phone number
async function getUserIdByPhoneNumber(phoneNumber: string): Promise<string | null> {
  const supabase = getSupabase()

  // Normalize the phone number for comparison
  const normalizedPhone = phoneNumber.replace(/\D/g, "")

  // Look up in ai_settings by business_phone
  const { data: settings } = await supabase
    .from("ai_settings")
    .select("user_id, business_phone")

  if (!settings || settings.length === 0) {
    return null
  }

  // Find matching phone number
  for (const setting of settings) {
    if (!setting.business_phone) continue
    const settingPhone = setting.business_phone.replace(/\D/g, "")
    if (settingPhone === normalizedPhone || normalizedPhone.endsWith(settingPhone) || settingPhone.endsWith(normalizedPhone)) {
      return setting.user_id
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const twilioClient = getTwilioClient()
    const formData = await request.formData()

    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const body = formData.get("Body") as string

    if (!from || !body || !to) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Look up the user by the Twilio number they received the SMS on
    const userId = await getUserIdByPhoneNumber(to)
    if (!userId) {
      console.error(`No user configured for phone number: ${to}`)
      return new NextResponse("No user configured for this number", { status: 404 })
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
    const aiResult = await generateAIResponse(userId, lead.id, body, lead.name)

    // Save the outgoing message
    await saveMessage(userId, lead.id, aiResult.response, "outbound")

    // Send the SMS response via Twilio
    await twilioClient.messages.create({
      body: aiResult.response,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: from,
    })

    // Log without PII
    console.log(`SMS response sent [Model: ${aiResult.model}, Cost: $${aiResult.cost.totalCost.toFixed(4)}]`)

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
