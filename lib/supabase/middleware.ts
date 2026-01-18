import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public auth pages - allow access without login
  const publicAuthPages = ['/forgot-password', '/check-email']
  if (publicAuthPages.includes(pathname)) {
    return supabaseResponse
  }

  // Protected routes - require login
  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Verify access page - require login but not access verification
  if (!user && pathname === '/verify-access') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Reset password page - requires authenticated session (from magic link)
  if (!user && pathname === '/reset-password') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // For authenticated users, check access code verification
  if (user) {
    // Check access verification for dashboard routes
    if (pathname.startsWith('/dashboard')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('access_verified')
        .eq('id', user.id)
        .single()

      // If not verified, redirect to verify-access page
      if (!profile?.access_verified) {
        const url = request.nextUrl.clone()
        url.pathname = '/verify-access'
        return NextResponse.redirect(url)
      }
    }

    // Redirect verified users away from verify-access page
    if (pathname === '/verify-access') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('access_verified')
        .eq('id', user.id)
        .single()

      if (profile?.access_verified) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }

    // Redirect logged in users away from auth pages (login/signup)
    if (pathname === '/login' || pathname === '/signup') {
      // Check if they need to verify access first
      const { data: profile } = await supabase
        .from('profiles')
        .select('access_verified')
        .eq('id', user.id)
        .single()

      const url = request.nextUrl.clone()
      url.pathname = profile?.access_verified ? '/dashboard' : '/verify-access'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
