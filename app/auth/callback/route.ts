import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=auth_error`)
    }

    // Handle different auth types
    if (type === 'recovery') {
      // Password reset - redirect to reset password page
      return NextResponse.redirect(`${origin}/reset-password`)
    }

    // Check user's business status to determine redirect
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Check if user is admin (admins always go to dashboard)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (profile?.is_admin) {
        return NextResponse.redirect(`${origin}/dashboard`)
      }

      // Check business status for non-admin users
      const { data: business } = await supabase
        .from('businesses')
        .select('status')
        .eq('owner_user_id', user.id)
        .single()

      if (business?.status === 'active') {
        return NextResponse.redirect(`${origin}/dashboard`)
      } else if (business?.status === 'suspended') {
        return NextResponse.redirect(`${origin}/login?error=account_suspended`)
      } else {
        // Pending or no business - go to pending approval
        return NextResponse.redirect(`${origin}/pending-approval`)
      }
    }
  }

  // No code or user - redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
