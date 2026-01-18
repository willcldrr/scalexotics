import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { convertedStatus } from "@/lib/lead-status"

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-11-20.acacia",
  })
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const supabase = getSupabase()

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    console.log("Payment successful for session:", session.id)

    const metadata = session.metadata
    if (!metadata) {
      console.error("No metadata in session")
      return NextResponse.json({ received: true })
    }

    const leadId = metadata.lead_id
    const vehicleId = metadata.vehicle_id
    const startDate = metadata.start_date
    const endDate = metadata.end_date
    const customerPhone = metadata.customer_phone
    const customerName = metadata.customer_name
    const totalAmount = parseFloat(metadata.total_amount || "0")
    const depositAmount = parseFloat(metadata.deposit_amount || "0")

    try {
      // Get the lead to find the user_id
      const { data: lead } = await supabase
        .from("leads")
        .select("user_id, name, phone, email")
        .eq("id", leadId)
        .single()

      if (!lead) {
        console.error("Lead not found:", leadId)
        return NextResponse.json({ received: true })
      }

      // Update lead status to converted
      await supabase
        .from("leads")
        .update({
          status: convertedStatus,
          notes: `Deposit paid: $${depositAmount} via Stripe`,
        })
        .eq("id", leadId)

      // Create a booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: lead.user_id,
          vehicle_id: vehicleId,
          customer_name: customerName || lead.name,
          customer_phone: customerPhone || lead.phone,
          customer_email: session.customer_email || lead.email,
          start_date: startDate,
          end_date: endDate,
          total_amount: totalAmount,
          deposit_amount: depositAmount,
          deposit_paid: true,
          status: "confirmed",
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent as string,
          lead_id: leadId,
        })
        .select()
        .single()

      if (bookingError) {
        console.error("Error creating booking:", bookingError)
      } else {
        console.log("Booking created:", booking?.id)
      }

      // Send confirmation SMS to customer
      if (customerPhone || lead.phone) {
        try {
          const twilio = await import("twilio")
          const twilioClient = twilio.default(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
          )

          const { data: vehicle } = await supabase
            .from("vehicles")
            .select("make, model, year")
            .eq("id", vehicleId)
            .single()

          const vehicleName = vehicle
            ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
            : "your vehicle"

          await twilioClient.messages.create({
            body: `Your reservation is confirmed! ${vehicleName} from ${startDate} to ${endDate}. Deposit of $${depositAmount} received. We'll be in touch with pickup details!`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: customerPhone || lead.phone,
          })

          // Save the confirmation message
          await supabase.from("messages").insert({
            user_id: lead.user_id,
            lead_id: leadId,
            content: `Your reservation is confirmed! ${vehicleName} from ${startDate} to ${endDate}. Deposit of $${depositAmount} received. We'll be in touch with pickup details!`,
            direction: "outbound",
          })

        } catch (smsError) {
          console.error("Error sending confirmation SMS:", smsError)
        }
      }

    } catch (error) {
      console.error("Error processing successful payment:", error)
    }
  }

  return NextResponse.json({ received: true })
}
