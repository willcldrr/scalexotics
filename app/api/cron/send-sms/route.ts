import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import twilio from "twilio"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
}

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  // If no CRON_SECRET is set, allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === "development"
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabase()
    const twilioClient = getTwilioClient()

    // Get leads with pending initial SMS
    const now = new Date().toISOString()
    const { data: pendingLeads, error: fetchError } = await supabase
      .from("leads")
      .select(`
        id,
        user_id,
        name,
        phone,
        vehicle_interest,
        notes,
        source
      `)
      .eq("initial_sms_sent", false)
      .not("initial_sms_scheduled_at", "is", null)
      .lte("initial_sms_scheduled_at", now)
      .limit(10) // Process in batches

    if (fetchError) {
      console.error("Error fetching pending leads:", fetchError)
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
    }

    if (!pendingLeads || pendingLeads.length === 0) {
      return NextResponse.json({ message: "No pending SMS to send", count: 0 })
    }

    const results = []

    for (const lead of pendingLeads) {
      try {
        // Get AI settings for this user
        const { data: aiSettings } = await supabase
          .from("ai_settings")
          .select("*")
          .eq("user_id", lead.user_id)
          .single()

        // Get user's vehicles for context
        const { data: vehicles } = await supabase
          .from("vehicles")
          .select("name, make, model, year, daily_rate")
          .eq("user_id", lead.user_id)
          .eq("status", "available")
          .limit(5)

        // Generate personalized greeting
        const greeting = generateInitialGreeting(
          lead.name,
          aiSettings,
          vehicles || [],
          lead.vehicle_interest,
          lead.notes
        )

        // Send SMS via Twilio
        await twilioClient.messages.create({
          body: greeting,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: lead.phone,
        })

        // Save the outbound message
        await supabase.from("messages").insert({
          user_id: lead.user_id,
          lead_id: lead.id,
          content: greeting,
          direction: "outbound",
        })

        // Mark as sent
        await supabase
          .from("leads")
          .update({
            initial_sms_sent: true,
            initial_sms_sent_at: new Date().toISOString(),
            status: "contacted",
          })
          .eq("id", lead.id)

        results.push({ leadId: lead.id, status: "sent" })
        console.log(`Sent initial SMS to lead ${lead.id}`)

      } catch (err: any) {
        console.error(`Failed to send SMS to lead ${lead.id}:`, err)
        results.push({ leadId: lead.id, status: "failed", error: err.message })
      }
    }

    return NextResponse.json({
      message: "Processed pending SMS",
      count: results.length,
      results,
    })

  } catch (error: any) {
    console.error("Cron SMS error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function generateInitialGreeting(
  leadName: string,
  aiSettings: any,
  vehicles: any[],
  vehicleInterest: string | null,
  notes: string | null
): string {
  const businessName = aiSettings?.business_name || "our exotic car rental"
  const tone = aiSettings?.tone || "friendly"

  // Extract first name
  const firstName = leadName.split(" ")[0]

  // Parse any vehicle or date info from notes
  let vehicleInfo = vehicleInterest || ""
  let dateInfo = ""

  if (notes) {
    // Try to extract vehicle preference from notes
    const vehicleMatch = notes.match(/vehicle[:\s]+([^,\n]+)/i)
    if (vehicleMatch) vehicleInfo = vehicleMatch[1].trim()

    // Try to extract dates from notes
    const dateMatch = notes.match(/dates?[:\s]+([^,\n]+)/i)
    if (dateMatch) dateInfo = dateMatch[1].trim()
  }

  // Build vehicle list for context
  const vehicleList = vehicles.length > 0
    ? vehicles.map(v => `${v.year} ${v.make} ${v.model}`).slice(0, 3).join(", ")
    : "our exotic fleet"

  // Generate greeting based on tone and available info
  const greetings: Record<string, string[]> = {
    friendly: [
      `Hey ${firstName}! 👋 Thanks for checking out ${businessName}! I saw you're interested in renting an exotic car. What dates were you looking at?`,
      `Hi ${firstName}! This is ${businessName}. Super excited you reached out! Which car caught your eye? We've got ${vehicleList} and more 🔥`,
      `Hey ${firstName}! Thanks for your interest in ${businessName}! Ready to turn some heads? What dates work best for you?`,
    ],
    professional: [
      `Hello ${firstName}, thank you for your interest in ${businessName}. I'd be happy to help you secure a vehicle. What dates are you considering?`,
      `Good day ${firstName}. This is ${businessName}. We received your inquiry and would love to assist. Which vehicle interests you?`,
    ],
    luxury: [
      `Good evening ${firstName}. Thank you for considering ${businessName} for your exotic car experience. How may I assist you in selecting the perfect vehicle?`,
      `Hello ${firstName}. Welcome to ${businessName}. I'm here to curate an exceptional driving experience for you. What occasion are we celebrating?`,
    ],
    energetic: [
      `Hey ${firstName}!! 🚗💨 SO pumped you hit us up at ${businessName}! Ready to drive something INSANE?? What are you thinking - Lambo? Ferrari? 🔥`,
      `YOOO ${firstName}! ${businessName} here! Let's get you behind the wheel of something EPIC! Which beast are you eyeing? 🏎️`,
    ],
  }

  const toneGreetings = greetings[tone] || greetings.friendly

  // If we have specific info, customize the message
  if (vehicleInfo && dateInfo) {
    return `Hey ${firstName}! Thanks for reaching out to ${businessName}! I see you're interested in the ${vehicleInfo} for ${dateInfo}. Let me check availability and get you a quote! 🔥`
  } else if (vehicleInfo) {
    return `Hey ${firstName}! Thanks for your interest in ${businessName}! Great choice looking at the ${vehicleInfo}! What dates were you thinking?`
  } else if (dateInfo) {
    return `Hey ${firstName}! This is ${businessName}. Thanks for reaching out! I see you're looking at ${dateInfo}. Which of our exotics caught your eye? We've got ${vehicleList}!`
  }

  // Return a random greeting for the tone
  return toneGreetings[Math.floor(Math.random() * toneGreetings.length)]
}
