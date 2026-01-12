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

    // Email verification (signup) - redirect to verify-access or dashboard
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('access_verified')
        .eq('id', user.id)
        .single()

      if (profile?.access_verified) {
        return NextResponse.redirect(`${origin}/dashboard`)
      }
      return NextResponse.redirect(`${origin}/verify-access`)
    }
  }

  // No code or user - redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
