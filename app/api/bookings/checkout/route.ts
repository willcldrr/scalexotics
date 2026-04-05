import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { applyRateLimit } from "@/lib/api-rate-limit"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, { limit: 15, window: 60 })
  if (limited) return limited

  try {
    const { bookingId, vehicleName, startDate, endDate, customerEmail } = await request.json()

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      )
    }

    // Verify the booking exists
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    if (booking.deposit_paid) {
      return NextResponse.json(
        { error: "Deposit has already been paid" },
        { status: 400 }
      )
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Rental Deposit - ${vehicleName}`,
              description: `${startDate} to ${endDate}`,
            },
            unit_amount: Math.round(booking.deposit_amount * 100), // Convert to cents - use DB amount
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/book/success?booking_id=${bookingId}`,
      cancel_url: `${origin}/book/cancelled?booking_id=${bookingId}`,
      customer_email: customerEmail || undefined,
      metadata: {
        booking_id: bookingId,
        source: "booking_deposit",
      },
    })

    // Update booking with stripe session ID
    await supabase
      .from("bookings")
      .update({
        stripe_checkout_session_id: session.id,
      })
      .eq("id", bookingId)

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error("Error creating booking checkout:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
