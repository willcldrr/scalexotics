import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=auth_error`)
    }

    // Check if this is a password recovery flow (cookie set in forgot-password page)
    const isPasswordRecovery = cookieStore.get('password_recovery')?.value === 'true'

    if (isPasswordRecovery) {
      // Clear the recovery cookie
      cookieStore.delete('password_recovery')
      return NextResponse.redirect(`${origin}/reset-password`)
    }

    // For email verification (signup), check if user needs access verification
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

  // No code - redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
