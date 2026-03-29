import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

// Service role client for admin operations
const getServiceSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify the requesting user is an admin
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin status using service role
    const serviceSupabase = getServiceSupabase()
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get user ID to delete from request
    const { userId, businessId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Don't allow deleting yourself
    if (userId === user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Delete business if provided
    if (businessId) {
      const { error: businessError } = await serviceSupabase
        .from("businesses")
        .delete()
        .eq("id", businessId)

      if (businessError) {
        console.error("Error deleting business:", businessError)
        // Continue anyway - business might already be deleted
      }
    }

    // Delete related data first (due to foreign key constraints)
    // Delete vehicles
    await serviceSupabase.from("vehicles").delete().eq("user_id", userId)

    // Delete bookings
    await serviceSupabase.from("bookings").delete().eq("user_id", userId)

    // Delete leads
    await serviceSupabase.from("leads").delete().eq("user_id", userId)

    // Delete messages
    await serviceSupabase.from("messages").delete().eq("user_id", userId)

    // Delete deposit portal config
    await serviceSupabase.from("deposit_portal_config").delete().eq("user_id", userId)

    // Delete business branding
    await serviceSupabase.from("business_branding").delete().eq("user_id", userId)

    // Delete custom domains
    await serviceSupabase.from("custom_domains").delete().eq("user_id", userId)

    // Delete profile
    const { error: profileError } = await serviceSupabase
      .from("profiles")
      .delete()
      .eq("id", userId)

    if (profileError) {
      console.error("Error deleting profile:", profileError)
      return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 })
    }

    // Delete from auth.users (this will cascade delete the user completely)
    const { error: authDeleteError } = await serviceSupabase.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError)
      // Profile is already deleted, so return partial success
      return NextResponse.json({
        success: true,
        warning: "Profile deleted but auth user removal failed"
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
