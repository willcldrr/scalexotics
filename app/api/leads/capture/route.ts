import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, "")
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400, headers: corsHeaders }
      )
    }

    // Check for existing lead with same phone number for this user
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("user_id", keyData.user_id)
      .or(`phone.ilike.%${cleanPhone}%`)
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

    // Schedule initial SMS for 1-2 minutes from now (random delay for natural feel)
    const delayMinutes = 1 + Math.random() // 1 to 2 minutes
    const smsScheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString()

    // Create new lead with scheduled SMS
    const { data: newLead, error: insertError } = await supabase
      .from("leads")
      .insert({
        user_id: keyData.user_id,
        api_key_id: keyData.id,
        name,
        email: email || null,
        phone,
        vehicle_interest: vehicle_interest || null,
        notes: notes || null,
        source: source || keyData.domain || "lead_capture",
        status: "new",
        initial_sms_scheduled_at: smsScheduledAt,
        initial_sms_sent: false,
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
