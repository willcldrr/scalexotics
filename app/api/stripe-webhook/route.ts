import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { applyRateLimit } from "@/lib/api-rate-limit"
import { claimWebhookEvent, markWebhookEventProcessed } from "@/lib/webhook-idempotency"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, { limit: 100, window: 60 })
  if (limited) return limited

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

  // Idempotency: short-circuit duplicate deliveries of the same Stripe event.
  const claim = await claimWebhookEvent("stripe", event.id, event.type)
  if (!claim.claimed) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    const invoiceId = session.metadata?.invoice_id
    const bookingId = session.metadata?.booking_id
    const source = session.metadata?.source

    // Handle booking deposits
    if (source === "booking_deposit" && bookingId) {
      // Verify amount matches expected deposit
      const { data: booking } = await supabase
        .from("bookings")
        .select("deposit_amount")
        .eq("id", bookingId)
        .single()

      if (booking) {
        const expectedAmountCents = Math.round(booking.deposit_amount * 100)
        const paidAmountCents = session.amount_total || 0
        if (Math.abs(paidAmountCents - expectedAmountCents) > 1) {
          console.error(`AMOUNT MISMATCH for booking ${bookingId}: paid ${paidAmountCents} cents, expected ${expectedAmountCents} cents`)
          return NextResponse.json({ received: true })
        }
      }

      const { data: updatedBooking, error } = await supabase
        .from("bookings")
        .update({
          deposit_paid: true,
          status: "confirmed",
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq("id", bookingId)
        .select("lead_id")
        .single()

      if (error) {
        console.error("Error updating booking:", error)
      } else {
        console.log(`Booking ${bookingId} deposit confirmed`)

        // Update lead status to booked
        const leadId = updatedBooking?.lead_id
        if (leadId) {
          await supabase.from("leads").update({ status: 'booked' }).eq("id", leadId)
        }
      }
    }

    // Handle invoices
    if (invoiceId) {
      // Check which table to update based on source
      if (source === "dashboard_invoices") {
        // Verify amount matches expected invoice total
        const { data: invoice } = await supabase
          .from("invoices")
          .select("total_amount")
          .eq("id", invoiceId)
          .single()

        if (invoice) {
          const expectedAmountCents = Math.round(invoice.total_amount * 100)
          const paidAmountCents = session.amount_total || 0
          if (Math.abs(paidAmountCents - expectedAmountCents) > 1) {
            console.error(`AMOUNT MISMATCH for invoice ${invoiceId}: paid ${paidAmountCents} cents, expected ${expectedAmountCents} cents`)
            return NextResponse.json({ received: true })
          }
        }

        // Update dashboard invoices table
        const { error } = await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq("id", invoiceId)

        if (error) {
          console.error("Error updating dashboard invoice:", error)
        } else {
          console.log(`Dashboard invoice ${invoiceId} marked as paid`)
        }
      } else {
        // Verify amount matches expected invoice total
        const { data: clientInvoice } = await supabase
          .from("client_invoices")
          .select("total_amount")
          .eq("id", invoiceId)
          .single()

        if (clientInvoice) {
          const expectedAmountCents = Math.round(clientInvoice.total_amount * 100)
          const paidAmountCents = session.amount_total || 0
          if (Math.abs(paidAmountCents - expectedAmountCents) > 1) {
            console.error(`AMOUNT MISMATCH for client invoice ${invoiceId}: paid ${paidAmountCents} cents, expected ${expectedAmountCents} cents`)
            return NextResponse.json({ received: true })
          }
        }

        // Update client_invoices table (legacy)
        const { error } = await supabase
          .from("client_invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq("id", invoiceId)

        if (error) {
          console.error("Error updating client invoice:", error)
        } else {
          console.log(`Client invoice ${invoiceId} marked as paid`)
        }
      }
    }
  }

  await markWebhookEventProcessed(claim.rowId, "processed")
  return NextResponse.json({ received: true })
}
