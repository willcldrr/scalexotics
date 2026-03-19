import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()

    const { leadId, vehicleId, startDate, endDate, depositAmount, customerPhone, customerName, customerEmail } = await request.json()

    if (!leadId || !vehicleId || !startDate || !endDate || !depositAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get the lead to find the user_id (business owner)
    const { data: lead } = await supabase
      .from("leads")
      .select("user_id")
      .eq("id", leadId)
      .single()

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    // Get the business's Stripe configuration
    const { data: depositConfig } = await supabase
      .from("deposit_portal_config")
      .select("stripe_secret_key, stripe_publishable_key")
      .eq("user_id", lead.user_id)
      .single()

    // Use business's Stripe key if available, otherwise fall back to platform key
    const stripeSecretKey = depositConfig?.stripe_secret_key || process.env.STRIPE_SECRET_KEY

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Stripe is not configured. Please add your Stripe API keys in Settings > Deposit Portal." },
        { status: 400 }
      )
    }

    // Create Stripe instance with the business's key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-02-25.clover",
    })

    // Get vehicle details
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("name, make, model, year, daily_rate")
      .eq("id", vehicleId)
      .single()

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      )
    }

    // Calculate rental days
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const totalAmount = days * vehicle.daily_rate

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "http://localhost:3000"

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail || undefined,
      metadata: {
        lead_id: leadId,
        vehicle_id: vehicleId,
        start_date: startDate,
        end_date: endDate,
        customer_phone: customerPhone || "",
        customer_name: customerName || "",
        total_amount: totalAmount.toString(),
        deposit_amount: depositAmount.toString(),
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Deposit: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
              description: `Rental from ${startDate} to ${endDate} (${days} day${days > 1 ? "s" : ""})`,
            },
            unit_amount: Math.round(depositAmount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          lead_id: leadId,
          vehicle_id: vehicleId,
        },
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
    })

    // Update lead with pending payment info
    await supabase
      .from("leads")
      .update({
        stripe_session_id: session.id,
        vehicle_interest: vehicleId,
        notes: `Pending deposit: $${depositAmount} for ${startDate} to ${endDate}`,
      })
      .eq("id", leadId)

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
    })

  } catch (error: any) {
    console.error("Create checkout error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
