import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key for admin-level access to bypass RLS
// This is safe because we're only exposing specific invoice data by ID
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Validate UUID format to prevent injection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 })
  }

  try {
    const { data: invoice, error } = await supabaseAdmin
      .from("client_invoices")
      .select(
        "id, invoice_number, type, base_amount, ad_spend_rate, ad_spend_days, ad_spend_total, total_amount, booking_description, client_name, client_email, status, due_date, paid_at, created_at"
      )
      .eq("id", id)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Don't expose internal fields like notes, stripe IDs, created_by
    return NextResponse.json({ invoice })
  } catch (error) {
    console.error("Invoice fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    )
  }
}
