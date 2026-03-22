import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

const sendSmsSchema = z.object({
  to: z.string().min(10, "Phone number too short").max(20, "Phone number too long"),
  message: z.string().min(1, "Message is required").max(1600, "Message too long"),
  leadId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
})

function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const twilioClient = getTwilioClient()
    const supabase = getSupabase()

    const body = await request.json()

    const parseResult = sendSmsSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { to, message, leadId, userId } = parseResult.data

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
