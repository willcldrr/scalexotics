import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

// Service role client for bypassing RLS in middleware checks
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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

  // Service role client for database queries (bypasses RLS)
  const serviceSupabase = getServiceSupabase()

  const pathname = request.nextUrl.pathname

  // SECURITY: Gate /api/admin/* so unauthenticated requests are rejected before
  // hitting per-route handlers. Individual routes still enforce admin role.
  if (pathname.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: adminProfile } = await serviceSupabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return supabaseResponse
  }

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
    const needsAuthCheck = pathname.startsWith('/dashboard') || pathname === '/login' || pathname === '/signup'

    if (needsAuthCheck) {
      // Fetch profile and business in PARALLEL (saves ~150-200ms)
      const [profileResult, businessResult] = await Promise.all([
        serviceSupabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single(),
        serviceSupabase
          .from('businesses')
          .select('status')
          .eq('owner_user_id', user.id)
          .single()
      ])

      const profile = profileResult.data
      const business = businessResult.data
      const isAdmin = profile?.is_admin
      const businessStatus = business?.status
      const hasActiveBusiness = businessStatus === 'active'
      const isSuspended = businessStatus === 'suspended'

      // Handle suspended account page - only suspended users can access
      if (pathname === '/account-suspended') {
        if (!isSuspended) {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard'
          return NextResponse.redirect(url)
        }
        return supabaseResponse
      }

      // Handle dashboard routes
      if (pathname.startsWith('/dashboard')) {
        // Admins always have access
        if (isAdmin) {
          return supabaseResponse
        }

        // SECURITY: Protect admin routes - only allow admins
        if (pathname.startsWith('/dashboard/admin')) {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard'
          return NextResponse.redirect(url)
        }

        // Suspended users go to suspended page
        if (isSuspended) {
          const url = request.nextUrl.clone()
          url.pathname = '/account-suspended'
          return NextResponse.redirect(url)
        }

        // Non-admin users need an active business
        if (!hasActiveBusiness) {
          const url = request.nextUrl.clone()
          url.pathname = '/pending-approval'
          return NextResponse.redirect(url)
        }
      }

      // Redirect logged in users away from auth pages (login/signup)
      if (pathname === '/login' || pathname === '/signup') {
        const url = request.nextUrl.clone()
        url.pathname = (isAdmin || hasActiveBusiness) ? '/dashboard' : '/pending-approval'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
