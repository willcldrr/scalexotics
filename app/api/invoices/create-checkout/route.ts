import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json()

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      )
    }

    // Fetch the invoice
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 }
      )
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    // Create line items from invoice items
    const lineItems = invoice.items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.description || "Invoice Item",
        },
        unit_amount: Math.round(Math.abs(item.unit_price) * 100), // Convert to cents
      },
      quantity: item.quantity,
    })).filter((item: any) => item.price_data.unit_amount > 0) // Filter out negative items (deposits)

    // If there's tax, add it as a line item
    if (invoice.tax_amount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Tax (${invoice.tax_rate}%)`,
          },
          unit_amount: Math.round(invoice.tax_amount * 100),
        },
        quantity: 1,
      })
    }

    // Handle case where all items might be negative (like a credit)
    if (lineItems.length === 0) {
      return NextResponse.json(
        { error: "No payable items on this invoice" },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/invoice/success?invoice_id=${invoiceId}`,
      cancel_url: `${origin}/invoice/${invoiceId}`,
      customer_email: invoice.customer_email || undefined,
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        source: "dashboard_invoices",
      },
    })

    // Update invoice with stripe session ID and set status to sent
    await supabase
      .from("invoices")
      .update({
        stripe_checkout_session_id: session.id,
        status: invoice.status === "draft" ? "sent" : invoice.status,
      })
      .eq("id", invoiceId)

    return NextResponse.json({
      url: session.url,
      sessionId: session.id
    })
  } catch (error: any) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
