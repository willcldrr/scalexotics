import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { applyRateLimit } from '@/lib/api-rate-limit'

function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  let device = 'Desktop'
  let browser = 'Unknown'
  let os = 'Unknown'

  // Parse OS
  if (ua.includes('iPhone')) os = 'iOS'
  else if (ua.includes('iPad')) os = 'iPadOS'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS'
  else if (ua.includes('Windows NT 10')) os = 'Windows 10'
  else if (ua.includes('Windows NT 11') || (ua.includes('Windows NT 10') && ua.includes('Win64'))) os = 'Windows'
  else if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('CrOS')) os = 'Chrome OS'

  // Parse Browser (order matters - check specific before generic)
  if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera'
  else if (ua.includes('Brave')) browser = 'Brave'
  else if (ua.includes('Vivaldi')) browser = 'Vivaldi'
  else if (ua.includes('Chrome/') && !ua.includes('Edg/') && !ua.includes('OPR/')) browser = 'Chrome'
  else if (ua.includes('Safari/') && !ua.includes('Chrome/') && !ua.includes('Chromium/')) browser = 'Safari'
  else if (ua.includes('Firefox/')) browser = 'Firefox'

  // Parse Device Type
  if (ua.includes('iPhone') || (ua.includes('Android') && ua.includes('Mobile'))) {
    device = 'Mobile'
  } else if (ua.includes('iPad') || (ua.includes('Android') && !ua.includes('Mobile'))) {
    device = 'Tablet'
  } else {
    device = 'Desktop'
  }

  return { device, browser, os }
}

function getClientIP(request: NextRequest, headersList: Headers): string {
  // Priority order: platform-specific headers first, then standard headers
  return (
    headersList.get('cf-connecting-ip') ||              // Cloudflare (most reliable when behind CF)
    headersList.get('true-client-ip') ||                // Cloudflare Enterprise
    headersList.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||  // Vercel
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||         // Standard proxy
    headersList.get('x-real-ip') ||                     // Nginx
    (request as any).ip ||                              // Next.js built-in
    'Unknown'
  )
}

/**
 * Resolve IP to approximate location using ip-api.com (free, no key needed).
 * Returns a location string like "New York, US" or null on failure.
 * Skips private/reserved IPs.
 */
async function resolveIPLocation(ip: string): Promise<string | null> {
  if (!ip || ip === 'Unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return null
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,city,regionName,country,countryCode`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) return null

    const data = await res.json()
    if (data.status !== 'success') return null

    const parts = [data.city, data.regionName, data.countryCode].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  } catch {
    return null
  }
}

/**
 * Clean up sessions that have been inactive for more than 30 days.
 * Runs opportunistically on POST requests (non-blocking).
 */
async function cleanupStaleSessions(supabase: any, userId: string): Promise<void> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  await supabase
    .from('user_sessions')
    .delete()
    .eq('user_id', userId)
    .lt('last_active', thirtyDaysAgo.toISOString())
}

// GET - List user's sessions
export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, { limit: 30, window: 60 })
  if (limited) return limited

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the current device's session_token from the request
  const sessionToken = request.headers.get('x-session-token')

  const { data: sessions, error } = await supabase
    .from('user_sessions')
    .select('id, user_id, device_info, browser, os, ip_address, location, last_active, created_at, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('last_active', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mark which session is the current device (never expose session_token to client)
  const sessionsWithCurrent = sessions?.map(session => ({
    ...session,
    is_current: false, // Will be matched below
  })) || []

  // Match current session by token (server-side only)
  if (sessionToken) {
    const { data: currentSession } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('session_token', sessionToken)
      .single()

    if (currentSession) {
      const idx = sessionsWithCurrent.findIndex(s => s.id === currentSession.id)
      if (idx !== -1) {
        sessionsWithCurrent[idx].is_current = true
      }
    }
  }

  return NextResponse.json({ sessions: sessionsWithCurrent })
}

// POST - Record or update a session for this device
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, { limit: 30, window: 60 })
  if (limited) return limited

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const ip = getClientIP(request, headersList)
  const { device, browser, os } = parseUserAgent(userAgent)

  // Get session token from request body or header
  let body: { session_token?: string } = {}
  try {
    body = await request.json()
  } catch {
    // No body provided
  }

  const sessionToken = body.session_token || request.headers.get('x-session-token')

  // Opportunistically clean up stale sessions (fire-and-forget)
  cleanupStaleSessions(supabase, user.id).catch(() => {})

  // Resolve geolocation in background (don't block response for existing sessions)
  const locationPromise = resolveIPLocation(ip)

  if (!sessionToken) {
    // No token provided - check if there's already a session for this device fingerprint
    const { data: existingDeviceSession } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('browser', browser)
      .eq('os', os)
      .eq('ip_address', ip)
      .eq('is_active', true)
      .not('session_token', 'is', null)
      .order('last_active', { ascending: false })
      .limit(1)
      .single()

    if (existingDeviceSession) {
      // Found existing session for this device - update and return its token
      const location = await locationPromise

      const updateData: Record<string, any> = {
        device_info: device,
        user_agent: userAgent,
        last_active: new Date().toISOString(),
      }
      if (location) updateData.location = location

      const { data: session, error } = await supabase
        .from('user_sessions')
        .update(updateData)
        .eq('id', existingDeviceSession.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ session, session_token: existingDeviceSession.session_token })
    }

    // No existing session for this device - create new one with secure token
    const newToken = crypto.randomUUID()
    const location = await locationPromise

    const { data: session, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: newToken,
        device_info: device,
        browser,
        os,
        ip_address: ip,
        user_agent: userAgent,
        location: location || null,
        is_active: true,
        last_active: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session, session_token: newToken })
  }

  // Check if session with this token exists for this user
  const { data: existingSession } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('session_token', sessionToken)
    .eq('is_active', true)
    .single()

  if (existingSession) {
    // Update the existing session
    const location = await locationPromise

    const updateData: Record<string, any> = {
      device_info: device,
      browser,
      os,
      ip_address: ip,
      user_agent: userAgent,
      last_active: new Date().toISOString(),
    }
    if (location) updateData.location = location

    const { data: session, error } = await supabase
      .from('user_sessions')
      .update(updateData)
      .eq('id', existingSession.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session, session_token: sessionToken })
  }

  // Session token doesn't exist or was revoked, create new session
  const newToken = crypto.randomUUID()
  const location = await locationPromise

  const { data: session, error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: user.id,
      session_token: newToken,
      device_info: device,
      browser,
      os,
      ip_address: ip,
      user_agent: userAgent,
      location: location || null,
      is_active: true,
      last_active: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ session, session_token: newToken })
}

// DELETE - Revoke a session (soft-delete by marking inactive)
export async function DELETE(request: NextRequest) {
  const limited = await applyRateLimit(request, { limit: 30, window: 60 })
  if (limited) return limited

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
  }

  // Validate UUID format to prevent injection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
  }

  // Soft-delete: mark as inactive rather than hard delete
  const { error } = await supabase
    .from('user_sessions')
    .update({ is_active: false })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
