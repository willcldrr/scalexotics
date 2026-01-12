import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Parse iCal date format (YYYYMMDD or YYYYMMDDTHHMMSSZ)
function parseICalDate(dateStr: string): string {
  // Handle DATE format: YYYYMMDD
  if (dateStr.length === 8) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
  }
  // Handle DATETIME format: YYYYMMDDTHHMMSSZ
  if (dateStr.includes("T")) {
    const datePart = dateStr.split("T")[0]
    return `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`
  }
  return dateStr
}

// Parse iCal content and extract events
function parseICalEvents(icalContent: string): Array<{
  uid: string
  summary: string
  startDate: string
  endDate: string
}> {
  const events: Array<{
    uid: string
    summary: string
    startDate: string
    endDate: string
  }> = []

  // Split into events
  const eventBlocks = icalContent.split("BEGIN:VEVENT")

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split("END:VEVENT")[0]
    const lines = block.split(/\r?\n/)

    let uid = ""
    let summary = "External Booking"
    let startDate = ""
    let endDate = ""

    for (const line of lines) {
      if (line.startsWith("UID:")) {
        uid = line.substring(4).trim()
      } else if (line.startsWith("SUMMARY:")) {
        summary = line.substring(8).trim()
      } else if (line.startsWith("DTSTART")) {
        // Handle both DTSTART:20240115 and DTSTART;VALUE=DATE:20240115
        const match = line.match(/DTSTART[^:]*:(.+)/)
        if (match) {
          startDate = parseICalDate(match[1].trim())
        }
      } else if (line.startsWith("DTEND")) {
        const match = line.match(/DTEND[^:]*:(.+)/)
        if (match) {
          endDate = parseICalDate(match[1].trim())
        }
      }
    }

    // For all-day events, iCal uses exclusive end dates, so subtract 1 day
    if (endDate && startDate) {
      const endDateObj = new Date(endDate)
      endDateObj.setDate(endDateObj.getDate() - 1)
      endDate = endDateObj.toISOString().split("T")[0]
    }

    // Only add events with valid dates
    if (startDate && endDate) {
      events.push({ uid: uid || `imported-${i}`, summary, startDate, endDate })
    }
  }

  return events
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

// POST - Fetch and parse an external iCal URL
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()

    // Get auth token from header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization" },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.replace("Bearer ", "")

    // Validate token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await request.json()
    const { url, vehicleId, source } = body

    if (!url || !vehicleId) {
      return NextResponse.json(
        { error: "URL and vehicleId are required" },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verify user owns this vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id")
      .eq("id", vehicleId)
      .eq("user_id", user.id)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404, headers: corsHeaders }
      )
    }

    // Fetch the iCal URL
    let icalContent: string
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "ScaleExotics-Calendar-Sync/1.0",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar: ${response.status}`)
      }

      icalContent = await response.text()
    } catch (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch calendar URL. Make sure the URL is accessible." },
        { status: 400, headers: corsHeaders }
      )
    }

    // Parse the iCal content
    const events = parseICalEvents(icalContent)

    // Save or update the calendar sync configuration
    const { data: existingSync } = await supabase
      .from("calendar_syncs")
      .select("id")
      .eq("vehicle_id", vehicleId)
      .eq("url", url)
      .single()

    if (existingSync) {
      await supabase
        .from("calendar_syncs")
        .update({
          last_synced_at: new Date().toISOString(),
          event_count: events.length,
        })
        .eq("id", existingSync.id)
    } else {
      await supabase.from("calendar_syncs").insert({
        user_id: user.id,
        vehicle_id: vehicleId,
        url,
        source: source || "external",
        last_synced_at: new Date().toISOString(),
        event_count: events.length,
        is_active: true,
      })
    }

    // Process events - create blocked dates or external bookings
    const today = new Date().toISOString().split("T")[0]
    const futureEvents = events.filter(e => e.endDate >= today)

    // Delete old imported bookings for this vehicle from this URL
    await supabase
      .from("bookings")
      .delete()
      .eq("vehicle_id", vehicleId)
      .eq("user_id", user.id)
      .eq("source", `ical:${url}`)

    // Insert new imported bookings
    const bookingsToInsert = futureEvents.map(event => ({
      user_id: user.id,
      vehicle_id: vehicleId,
      customer_name: event.summary || "External Booking",
      customer_email: null,
      customer_phone: null,
      start_date: event.startDate,
      end_date: event.endDate,
      total_amount: 0,
      deposit_amount: 0,
      deposit_paid: false,
      status: "confirmed",
      notes: `Imported from ${source || "external calendar"}`,
      source: `ical:${url}`,
    }))

    if (bookingsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("bookings")
        .insert(bookingsToInsert)

      if (insertError) {
        console.error("Error inserting bookings:", insertError)
        // Don't fail the request, just log it
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Imported ${futureEvents.length} events`,
        events: futureEvents.length,
        total_parsed: events.length,
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error("Calendar import error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    )
  }
}
