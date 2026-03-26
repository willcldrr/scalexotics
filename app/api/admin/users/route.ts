import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

// Service role client bypasses RLS
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List all users with their business info
export async function GET(request: NextRequest) {
  try {
    // Get the current user from cookies
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin using service role
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await serviceSupabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Fetch all businesses
    const { data: businesses, error: businessesError } = await serviceSupabase
      .from("businesses")
      .select("id, name, status, payment_domain, stripe_connected, owner_user_id")

    if (businessesError) {
      console.error("Error fetching businesses:", businessesError)
      return NextResponse.json({ error: businessesError.message }, { status: 500 })
    }

    // Map profiles with their business info
    const usersWithBusiness = profiles.map(profile => ({
      ...profile,
      business: businesses?.find(b => b.owner_user_id === profile.id) || null
    }))

    return NextResponse.json({ users: usersWithBusiness })
  } catch (err) {
    console.error("Admin users API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
