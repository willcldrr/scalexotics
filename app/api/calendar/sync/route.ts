import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Parse iCal date format
function parseICalDate(dateStr: string): string {
  if (dateStr.length === 8) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
  }
  if (dateStr.includes("T")) {
    const datePart = dateStr.split("T")[0]
    return `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`
  }
  return dateStr
}

// Parse iCal content
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
        const match = line.match(/DTSTART[^:]*:(.+)/)
        if (match) startDate = parseICalDate(match[1].trim())
      } else if (line.startsWith("DTEND")) {
        const match = line.match(/DTEND[^:]*:(.+)/)
        if (match) endDate = parseICalDate(match[1].trim())
      }
    }

    if (endDate && startDate) {
      const endDateObj = new Date(endDate)
      endDateObj.setDate(endDateObj.getDate() - 1)
      endDate = endDateObj.toISOString().split("T")[0]
    }

    if (startDate && endDate) {
      events.push({ uid: uid || `imported-${i}`, summary, startDate, endDate })
    }
  }

  return events
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

// GET - Sync all calendars for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()

    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization" },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: corsHeaders }
      )
    }

    // Get all active calendar syncs for this user
    const { data: syncs, error: syncsError } = await supabase
      .from("calendar_syncs")
      .select("*, vehicles(name, make, model, year)")
      .eq("user_id", user.id)
      .eq("is_active", true)

    if (syncsError) {
      return NextResponse.json(
        { error: "Failed to fetch calendar syncs" },
        { status: 500, headers: corsHeaders }
      )
    }

    const results = []

    for (const sync of syncs || []) {
      try {
        // Fetch the calendar
        const response = await fetch(sync.url, {
          headers: { "User-Agent": "ScaleExotics-Calendar-Sync/1.0" },
        })

        if (!response.ok) {
          results.push({
            vehicleId: sync.vehicle_id,
            source: sync.source,
            success: false,
            error: `HTTP ${response.status}`,
          })
          continue
        }

        const icalContent = await response.text()
        const events = parseICalEvents(icalContent)
        const today = new Date().toISOString().split("T")[0]
        const futureEvents = events.filter(e => e.endDate >= today)

        // Delete old imported bookings
        await supabase
          .from("bookings")
          .delete()
          .eq("vehicle_id", sync.vehicle_id)
          .eq("user_id", user.id)
          .eq("source", `ical:${sync.url}`)

        // Insert new bookings
        const bookingsToInsert = futureEvents.map(event => ({
          user_id: user.id,
          vehicle_id: sync.vehicle_id,
          customer_name: event.summary || "External Booking",
          customer_email: null,
          customer_phone: null,
          start_date: event.startDate,
          end_date: event.endDate,
          total_amount: 0,
          deposit_amount: 0,
          deposit_paid: false,
          status: "confirmed",
          notes: `Imported from ${sync.source || "external calendar"}`,
          source: `ical:${sync.url}`,
        }))

        if (bookingsToInsert.length > 0) {
          await supabase.from("bookings").insert(bookingsToInsert)
        }

        // Update sync record
        await supabase
          .from("calendar_syncs")
          .update({
            last_synced_at: new Date().toISOString(),
            event_count: futureEvents.length,
            last_error: null,
          })
          .eq("id", sync.id)

        results.push({
          vehicleId: sync.vehicle_id,
          source: sync.source,
          success: true,
          events: futureEvents.length,
        })
      } catch (error: any) {
        // Update sync record with error
        await supabase
          .from("calendar_syncs")
          .update({
            last_error: error.message,
          })
          .eq("id", sync.id)

        results.push({
          vehicleId: sync.vehicle_id,
          source: sync.source,
          success: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json(
      {
        success: true,
        synced: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error("Calendar sync error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST - Sync a specific calendar
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()

    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization" },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await request.json()
    const { syncId } = body

    if (!syncId) {
      return NextResponse.json(
        { error: "syncId is required" },
        { status: 400, headers: corsHeaders }
      )
    }

    // Get the sync record
    const { data: sync, error: syncError } = await supabase
      .from("calendar_syncs")
      .select("*")
      .eq("id", syncId)
      .eq("user_id", user.id)
      .single()

    if (syncError || !sync) {
      return NextResponse.json(
        { error: "Sync configuration not found" },
        { status: 404, headers: corsHeaders }
      )
    }

    // Fetch and parse the calendar
    const response = await fetch(sync.url, {
      headers: { "User-Agent": "ScaleExotics-Calendar-Sync/1.0" },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch calendar: HTTP ${response.status}` },
        { status: 400, headers: corsHeaders }
      )
    }

    const icalContent = await response.text()
    const events = parseICalEvents(icalContent)
    const today = new Date().toISOString().split("T")[0]
    const futureEvents = events.filter(e => e.endDate >= today)

    // Delete old imported bookings
    await supabase
      .from("bookings")
      .delete()
      .eq("vehicle_id", sync.vehicle_id)
      .eq("user_id", user.id)
      .eq("source", `ical:${sync.url}`)

    // Insert new bookings
    const bookingsToInsert = futureEvents.map(event => ({
      user_id: user.id,
      vehicle_id: sync.vehicle_id,
      customer_name: event.summary || "External Booking",
      customer_email: null,
      customer_phone: null,
      start_date: event.startDate,
      end_date: event.endDate,
      total_amount: 0,
      deposit_amount: 0,
      deposit_paid: false,
      status: "confirmed",
      notes: `Imported from ${sync.source || "external calendar"}`,
      source: `ical:${sync.url}`,
    }))

    if (bookingsToInsert.length > 0) {
      await supabase.from("bookings").insert(bookingsToInsert)
    }

    // Update sync record
    await supabase
      .from("calendar_syncs")
      .update({
        last_synced_at: new Date().toISOString(),
        event_count: futureEvents.length,
        last_error: null,
      })
      .eq("id", sync.id)

    return NextResponse.json(
      {
        success: true,
        events: futureEvents.length,
        message: `Synced ${futureEvents.length} events`,
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error("Calendar sync error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    )
  }
}
