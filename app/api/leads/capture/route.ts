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

// CORS headers for cross-origin requests from lead capture sites
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()

    // Get API key from header
    const apiKey = request.headers.get("X-API-Key")

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key" },
        { status: 401, headers: corsHeaders }
      )
    }

    // Validate API key and get associated user
    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("id, user_id, is_active, domain")
      .eq("key", apiKey)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401, headers: corsHeaders }
      )
    }

    if (!keyData.is_active) {
      return NextResponse.json(
        { error: "API key is inactive" },
        { status: 401, headers: corsHeaders }
      )
    }

    // Parse lead data from request
    const body = await request.json()
    const { name, email, phone, vehicle_interest, notes, source } = body

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400, headers: corsHeaders }
      )
    }

    // Clean phone number - ensure it has country code
    let cleanPhone = phone.replace(/\D/g, "")
    if (cleanPhone.length === 10) {
      cleanPhone = "1" + cleanPhone // Add US country code
    }
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400, headers: corsHeaders }
      )
    }
    const formattedPhone = "+" + cleanPhone

    // Check for existing lead with same phone number for this user
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("user_id", keyData.user_id)
      .or(`phone.ilike.%${cleanPhone.slice(-10)}%`)
      .single()

    if (existingLead) {
      // Update existing lead with new info if provided
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          name: name || undefined,
          email: email || undefined,
          notes: notes ? `${notes}\n\n[Updated from lead capture]` : undefined,
          vehicle_interest: vehicle_interest || undefined,
        })
        .eq("id", existingLead.id)

      if (updateError) {
        console.error("Error updating lead:", updateError)
      }

      // Update last_used_at for API key
      await supabase
        .from("api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", keyData.id)

      return NextResponse.json(
        {
          success: true,
          message: "Lead already exists, updated info",
          lead_id: existingLead.id,
          is_new: false
        },
        { status: 200, headers: corsHeaders }
      )
    }

    // Create new lead
    const { data: newLead, error: insertError } = await supabase
      .from("leads")
      .insert({
        user_id: keyData.user_id,
        api_key_id: keyData.id,
        name,
        email: email || null,
        phone: formattedPhone,
        vehicle_interest: vehicle_interest || null,
        notes: notes || null,
        source: source || keyData.domain || "lead_capture",
        status: "new",
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("Error creating lead:", insertError)
      return NextResponse.json(
        { error: "Failed to create lead" },
        { status: 500, headers: corsHeaders }
      )
    }

    // Update last_used_at for API key
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyData.id)

    // Send initial SMS to the new lead
    try {
      const twilioClient = getTwilioClient()

      // Get AI settings for personalized greeting
      const { data: aiSettings } = await supabase
        .from("ai_settings")
        .select("business_name, tone")
        .eq("user_id", keyData.user_id)
        .single()

      // Get vehicles for context
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("make, model, year")
        .eq("user_id", keyData.user_id)
        .eq("status", "available")
        .limit(3)

      // Generate greeting message
      const greeting = generateGreeting(
        name,
        aiSettings?.business_name || "our exotic car rental",
        aiSettings?.tone || "friendly",
        vehicles || [],
        vehicle_interest,
        notes
      )

      // Send SMS
      await twilioClient.messages.create({
        body: greeting,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      })

      // Save the outbound message
      await supabase.from("messages").insert({
        user_id: keyData.user_id,
        lead_id: newLead.id,
        content: greeting,
        direction: "outbound",
      })

      // Update lead status
      await supabase
        .from("leads")
        .update({ status: "contacted" })
        .eq("id", newLead.id)

      console.log(`Sent initial SMS to ${formattedPhone}`)

    } catch (smsError) {
      console.error("Failed to send initial SMS:", smsError)
      // Don't fail the lead capture if SMS fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Lead captured successfully",
        lead_id: newLead.id,
        is_new: true
      },
      { status: 201, headers: corsHeaders }
    )

  } catch (error) {
    console.error("Lead capture error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    )
  }
}

function generateGreeting(
  leadName: string,
  businessName: string,
  tone: string,
  vehicles: any[],
  vehicleInterest: string | null,
  notes: string | null
): string {
  const firstName = leadName.split(" ")[0]

  // Build vehicle list
  const vehicleList = vehicles.length > 0
    ? vehicles.map(v => `${v.year} ${v.make} ${v.model}`).slice(0, 3).join(", ")
    : "our exotic fleet"

  // Parse vehicle/date info from notes if available
  let dateInfo = ""
  if (notes) {
    const dateMatch = notes.match(/Dates?:\s*([^,\n]+)/i)
    if (dateMatch) dateInfo = dateMatch[1].trim()
  }

  // Generate based on tone
  if (vehicleInterest && dateInfo) {
    return `Hey ${firstName}! Thanks for reaching out to ${businessName}! I see you're interested in the ${vehicleInterest} for ${dateInfo}. Let me check availability and get back to you with pricing! 🔥`
  }

  if (vehicleInterest) {
    return `Hey ${firstName}! Thanks for your interest in ${businessName}! Great choice looking at the ${vehicleInterest}! What dates were you thinking? 🚗`
  }

  const greetings: Record<string, string[]> = {
    friendly: [
      `Hey ${firstName}! 👋 Thanks for checking out ${businessName}! I saw you're interested in renting an exotic car. What dates were you looking at?`,
      `Hi ${firstName}! This is ${businessName}. Super excited you reached out! Which car caught your eye? We've got ${vehicleList} and more 🔥`,
    ],
    professional: [
      `Hello ${firstName}, thank you for your interest in ${businessName}. I'd be happy to help you secure a vehicle. What dates are you considering?`,
    ],
    luxury: [
      `Good day ${firstName}. Thank you for considering ${businessName} for your exotic car experience. How may I assist you in selecting the perfect vehicle?`,
    ],
    energetic: [
      `Hey ${firstName}!! 🚗💨 SO pumped you hit us up at ${businessName}! Ready to drive something INSANE?? What are you thinking - Lambo? Ferrari? 🔥`,
    ],
  }

  const toneGreetings = greetings[tone] || greetings.friendly
  return toneGreetings[Math.floor(Math.random() * toneGreetings.length)]
}
