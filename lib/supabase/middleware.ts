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

  // Pending approval page - require login
  if (!user && pathname === '/pending-approval') {
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

  // For authenticated users, check business approval status
  if (user) {
    // Check business approval for dashboard routes
    if (pathname.startsWith('/dashboard')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      // Admins always have access
      if (profile?.is_admin) {
        // SECURITY: Protect admin routes - only allow admins
        // (redundant check but kept for clarity)
        return supabaseResponse
      }

      // Non-admin users need an active business
      const { data: business } = await supabase
        .from('businesses')
        .select('status')
        .eq('owner_user_id', user.id)
        .single()

      // If business is not active, redirect to pending-approval
      if (!business || business.status !== 'active') {
        const url = request.nextUrl.clone()
        url.pathname = '/pending-approval'
        return NextResponse.redirect(url)
      }

      // SECURITY: Protect admin routes - only allow admins
      if (pathname.startsWith('/dashboard/admin')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }

    // Redirect logged in users away from auth pages (login/signup)
    if (pathname === '/login' || pathname === '/signup') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      // Admins go to dashboard
      if (profile?.is_admin) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }

      // Check business status for non-admins
      const { data: business } = await supabase
        .from('businesses')
        .select('status')
        .eq('owner_user_id', user.id)
        .single()

      const url = request.nextUrl.clone()
      url.pathname = business?.status === 'active' ? '/dashboard' : '/pending-approval'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
