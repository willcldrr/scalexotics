import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

// Service role client bypasses RLS
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get the authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use service role to check business status (bypasses RLS)
    const { data: business, error: dbError } = await serviceSupabase
      .from("businesses")
      .select("id, name, status, owner_user_id")
      .eq("owner_user_id", user.id)
      .single()

    if (dbError && dbError.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is fine
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      business: business || null,
      userId: user.id,
      email: user.email
    })
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
