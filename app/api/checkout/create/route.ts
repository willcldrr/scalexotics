import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { lookupPaymentToken, decodePaymentToken, markPaymentLinkUsed } from "@/lib/payment-link"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    // Try database lookup first (for short tokens)
    let paymentData = await lookupPaymentToken(token)

    // Fall back to legacy decode for old-style tokens
    if (!paymentData) {
      paymentData = decodePaymentToken(token)
    }

    if (!paymentData) {
      return NextResponse.json(
        { error: "Invalid or expired payment link" },
        { status: 400 }
      )
    }

    // Use Stripe keys from payment link (multi-tenant) or fall back to env vars
    const stripeSecretKey = paymentData.stripeSecretKey || process.env.STRIPE_SECRET_KEY

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Stripe is not configured for this business" },
        { status: 500 }
      )
    }

    // Create Stripe instance with the appropriate key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-02-25.clover",
    })

    // Build success and cancel URLs
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/checkout/${token}`

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${paymentData.vehicleName} Rental Deposit`,
              description: `${paymentData.startDate} to ${paymentData.endDate} | Total rental: $${paymentData.totalAmount.toLocaleString()}`,
              images: [],
            },
            unit_amount: paymentData.depositAmount * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        // Include lead_id and user_id for webhook to create booking
        lead_id: paymentData.leadId || "",
        user_id: paymentData.userId || "",
        vehicle_id: paymentData.vehicleId,
        start_date: paymentData.startDate,
        end_date: paymentData.endDate,
        customer_phone: paymentData.customerPhone,
        customer_name: paymentData.customerName,
        total_amount: paymentData.totalAmount.toString(),
        deposit_amount: paymentData.depositAmount.toString(),
        // Additional fields for reference
        paymentToken: token,
        vehicleName: paymentData.vehicleName,
        dailyRate: paymentData.dailyRate.toString(),
        businessName: paymentData.businessName || "Velocity Exotics",
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    // Mark link as used (prevents reuse)
    if (token.includes("-")) {
      await markPaymentLinkUsed(token)
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
