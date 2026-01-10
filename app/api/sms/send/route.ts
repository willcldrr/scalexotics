import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { createClient } from "@supabase/supabase-js"

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { to, message, leadId, userId } = await request.json()

    if (!to || !message) {
      return NextResponse.json(
        { error: "Missing 'to' or 'message' field" },
        { status: 400 }
      )
    }

    // Send SMS via Twilio
    const twilioMessage = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    })

    // Save message to database if leadId provided
    if (leadId && userId) {
      await supabase.from("messages").insert({
        user_id: userId,
        lead_id: leadId,
        content: message,
        direction: "outbound",
      })
    }

    return NextResponse.json({
      success: true,
      messageId: twilioMessage.sid,
    })
  } catch (error: any) {
    console.error("Send SMS error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send SMS" },
      { status: 500 }
    )
  }
}
