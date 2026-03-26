import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

// Service role client bypasses RLS
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper to verify admin
async function verifyAdmin(request: NextRequest): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { isAdmin: false, error: "Unauthorized" }
    }

    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return { isAdmin: false, error: "Admin access required" }
    }

    return { isAdmin: true, userId: user.id }
  } catch (err) {
    return { isAdmin: false, error: "Auth error" }
  }
}

// GET - List all businesses
export async function GET(request: NextRequest) {
  const { isAdmin, error } = await verifyAdmin(request)
  if (!isAdmin) {
    return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })
  }

  const { data: businesses, error: dbError } = await serviceSupabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ businesses })
}

// PATCH - Update business status (approve/deny/suspend)
export async function PATCH(request: NextRequest) {
  const { isAdmin, error } = await verifyAdmin(request)
  if (!isAdmin) {
    return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })
  }

  const { businessId, status } = await request.json()

  if (!businessId || !status) {
    return NextResponse.json({ error: "businessId and status are required" }, { status: 400 })
  }

  const validStatuses = ["active", "inactive", "suspended", "pending"]
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const { error: dbError } = await serviceSupabase
    .from("businesses")
    .update({ status })
    .eq("id", businessId)

  if (dbError) {
    console.error("Error updating business:", dbError)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE - Delete a business
export async function DELETE(request: NextRequest) {
  const { isAdmin, error } = await verifyAdmin(request)
  if (!isAdmin) {
    return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 })
  }

  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get("id")

  if (!businessId) {
    return NextResponse.json({ error: "Business ID is required" }, { status: 400 })
  }

  const { error: dbError } = await serviceSupabase
    .from("businesses")
    .delete()
    .eq("id", businessId)

  if (dbError) {
    console.error("Error deleting business:", dbError)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
