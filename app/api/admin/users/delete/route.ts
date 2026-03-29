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

    // Delete user sessions
    await serviceSupabase.from("user_sessions").delete().eq("user_id", userId)

    // Delete calendar syncs
    await serviceSupabase.from("calendar_syncs").delete().eq("user_id", userId)

    // Delete telegram data
    await serviceSupabase.from("telegram_link_codes").delete().eq("user_id", userId)
    await serviceSupabase.from("telegram_bot_logs").delete().eq("user_id", userId)

    // Delete instagram connections
    await serviceSupabase.from("instagram_connections").delete().eq("user_id", userId)

    // Delete agreements and inspections
    await serviceSupabase.from("agreements").delete().eq("user_id", userId)
    await serviceSupabase.from("inspections").delete().eq("user_id", userId)
    await serviceSupabase.from("deliveries").delete().eq("user_id", userId)

    // Delete reactivation data
    await serviceSupabase.from("reactivation_campaign_messages").delete().eq("user_id", userId)
    await serviceSupabase.from("reactivation_campaigns").delete().eq("user_id", userId)
    await serviceSupabase.from("reactivation_contacts").delete().eq("user_id", userId)
    await serviceSupabase.from("reactivation_templates").delete().eq("user_id", userId)
    await serviceSupabase.from("reactivation_settings").delete().eq("user_id", userId)

    // Clear references to this profile in other tables (these don't cascade)
    await serviceSupabase.from("access_codes").update({ used_by: null }).eq("used_by", userId)
    await serviceSupabase.from("client_invoices").update({ created_by: null }).eq("created_by", userId)

    // Delete CRM data that references this user
    await serviceSupabase.from("crm_oauth_tokens").delete().eq("user_id", userId)
    await serviceSupabase.from("crm_notes").delete().eq("user_id", userId)
    await serviceSupabase.from("crm_events").delete().eq("user_id", userId)
    await serviceSupabase.from("crm_activity_log").delete().eq("user_id", userId)

    // Delete payment links
    await serviceSupabase.from("payment_links").delete().eq("user_id", userId)

    // Delete integration requests
    await serviceSupabase.from("integration_requests").delete().eq("user_id", userId)

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
