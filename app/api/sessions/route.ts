import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  let device = 'Unknown Device'
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'

  // Parse OS
  if (ua.includes('Windows NT 10')) os = 'Windows 10'
  else if (ua.includes('Windows NT 11') || ua.includes('Windows NT 10.0') && ua.includes('Windows')) os = 'Windows 11'
  else if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS X')) os = 'macOS'
  else if (ua.includes('iPhone')) os = 'iOS'
  else if (ua.includes('iPad')) os = 'iPadOS'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('Linux')) os = 'Linux'

  // Parse Browser
  if (ua.includes('Edg/')) browser = 'Microsoft Edge'
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome'
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari'
  else if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera'

  // Parse Device Type
  if (ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android')) {
    if (ua.includes('iPad') || ua.includes('Tablet')) device = 'Tablet'
    else device = 'Mobile'
  } else {
    device = 'Desktop'
  }

  return { device, browser, os }
}

// GET - List user's sessions
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: sessions, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('last_active', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sessions })
}

// POST - Record a new session
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'Unknown'

  const { device, browser, os } = parseUserAgent(userAgent)

  // First, mark all existing sessions as not current
  await supabase
    .from('user_sessions')
    .update({ is_current: false })
    .eq('user_id', user.id)

  // Insert new session
  const { data: session, error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: user.id,
      device_info: device,
      browser,
      os,
      ip_address: ip,
      is_current: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ session })
}

// DELETE - Revoke a session
export async function DELETE(request: NextRequest) {
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

  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
