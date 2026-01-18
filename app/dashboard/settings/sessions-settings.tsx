"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Monitor, Smartphone, Tablet, Trash2, AlertCircle, Check, MapPin, RefreshCw } from "lucide-react"

interface Session {
  id: string
  device_info: string
  browser: string
  os: string
  ip_address: string
  is_current: boolean
  last_active: string
  created_at: string
}

export default function SessionsSettings() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  useEffect(() => {
    initializeSessions()
  }, [])

  const initializeSessions = async () => {
    setLoading(true)
    setError(null)

    try {
      // First, try to fetch existing sessions
      let response = await fetch('/api/sessions')
      let data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sessions')
      }

      // If no sessions exist, create one for the current device
      if (!data.sessions || data.sessions.length === 0) {
        await fetch('/api/sessions', { method: 'POST' })
        // Fetch again after creating
        response = await fetch('/api/sessions')
        data = await response.json()
      }

      setSessions(data.sessions || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sessions')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sessions')
      }

      setSessions(data.sessions || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const revokeSession = async (sessionId: string) => {
    setRevokingId(sessionId)
    setMessage(null)

    try {
      const response = await fetch(`/api/sessions?id=${sessionId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke session')
      }

      setSessions(sessions.filter(s => s.id !== sessionId))
      setMessage({ type: 'success', text: 'Session revoked successfully' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setRevokingId(null)
    }
  }

  const getDeviceIcon = (deviceInfo: string) => {
    switch (deviceInfo?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />
      case 'tablet':
        return <Tablet className="w-5 h-5" />
      default:
        return <Monitor className="w-5 h-5" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 text-red-400 mb-4">
            <AlertCircle className="w-5 h-5" />
            <p>Failed to load sessions: {error}</p>
          </div>
          <p className="text-white/50 text-sm mb-4">
            The user_sessions table may not exist. Run this SQL in your Supabase SQL Editor:
          </p>
          <pre className="bg-black/50 p-4 rounded-xl text-xs text-white/70 overflow-x-auto">
{`-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON user_sessions;

-- Create table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  is_current BOOLEAN DEFAULT false,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create policies
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions" ON user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON user_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON user_sessions FOR DELETE USING (auth.uid() = user_id);`}
          </pre>
          <button
            onClick={initializeSessions}
            className="mt-4 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-[#375DEE]" />
            <div>
              <h2 className="text-lg font-semibold">Active Sessions</h2>
              <p className="text-sm text-white/50">Devices currently logged into your account</p>
            </div>
          </div>
          <button
            onClick={initializeSessions}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh sessions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active sessions found</p>
            <p className="text-sm mt-1">Click refresh to detect your current session</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                  session.is_current
                    ? 'bg-[#375DEE]/10 border-[#375DEE]/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${session.is_current ? 'bg-[#375DEE]/20 text-[#375DEE]' : 'bg-white/10 text-white/60'}`}>
                    {getDeviceIcon(session.device_info)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {session.browser} on {session.os}
                      </span>
                      {session.is_current && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#375DEE] text-white">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/50 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {session.ip_address}
                      </span>
                      <span>•</span>
                      <span>Last active {formatDate(session.last_active)}</span>
                    </div>
                  </div>
                </div>

                {!session.is_current && (
                  <button
                    onClick={() => revokeSession(session.id)}
                    disabled={revokingId === session.id}
                    className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Revoke session"
                  >
                    {revokingId === session.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <h3 className="font-medium mb-2">Session Security</h3>
        <p className="text-sm text-white/50">
          If you notice any unfamiliar sessions, revoke them immediately and consider changing your password.
          Sessions are automatically created when you log in from a new device or browser.
        </p>
      </div>
    </div>
  )
}
