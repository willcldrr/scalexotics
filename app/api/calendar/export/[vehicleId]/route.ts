import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Generate iCal format date (YYYYMMDD)
function formatICalDate(date: string): string {
  return date.replace(/-/g, "")
}

// Generate unique UID for calendar events
function generateUID(bookingId: string, domain: string): string {
  return `${bookingId}@${domain}`
}

// Escape special characters in iCal text
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const supabase = getSupabase()
    const { vehicleId } = await params

    // Get token from query params for authentication
    const token = request.nextUrl.searchParams.get("token")

    if (!token) {
      return new NextResponse("Missing authentication token", { status: 401 })
    }

    // Validate token (it's the user's API key)
    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("user_id, is_active")
      .eq("key", token)
      .single()

    if (keyError || !keyData || !keyData.is_active) {
      return new NextResponse("Invalid or inactive token", { status: 401 })
    }

    // Get vehicle info
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id, name, make, model, year")
      .eq("id", vehicleId)
      .eq("user_id", keyData.user_id)
      .single()

    if (vehicleError || !vehicle) {
      return new NextResponse("Vehicle not found", { status: 404 })
    }

    // Get all bookings for this vehicle
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, start_date, end_date, customer_name, status, notes")
      .eq("vehicle_id", vehicleId)
      .eq("user_id", keyData.user_id)
      .in("status", ["confirmed", "pending", "active"])
      .order("start_date", { ascending: true })

    if (bookingsError) {
      return new NextResponse("Error fetching bookings", { status: 500 })
    }

    const vehicleName = vehicle.name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    const domain = "scalexotics.com"
    const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

    // Build iCal content
    let icalContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Scale Exotics//Calendar Export//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${escapeICalText(vehicleName)} - Bookings`,
      `X-WR-CALDESC:Booking calendar for ${escapeICalText(vehicleName)}`,
    ]

    // Add each booking as an event
    for (const booking of bookings || []) {
      const startDate = formatICalDate(booking.start_date)
      // Add 1 day to end date for all-day events (iCal uses exclusive end dates)
      const endDate = formatICalDate(
        new Date(new Date(booking.end_date).getTime() + 86400000)
          .toISOString()
          .split("T")[0]
      )

      const summary = booking.customer_name
        ? `Booked - ${escapeICalText(booking.customer_name)}`
        : `Booked - ${booking.status}`

      icalContent.push(
        "BEGIN:VEVENT",
        `UID:${generateUID(booking.id, domain)}`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:Status: ${booking.status}${booking.notes ? "\\n" + escapeICalText(booking.notes) : ""}`,
        "TRANSP:OPAQUE",
        `STATUS:${booking.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"}`,
        "END:VEVENT"
      )
    }

    icalContent.push("END:VCALENDAR")

    // Return as .ics file
    return new NextResponse(icalContent.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${vehicleName.replace(/[^a-zA-Z0-9]/g, "_")}_calendar.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    console.error("Calendar export error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
