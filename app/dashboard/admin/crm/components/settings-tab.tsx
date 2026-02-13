"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Settings2,
  Link,
  Unlink,
  Calendar,
  Video,
  Check,
  X,
  Loader2,
  ExternalLink,
  AlertCircle,
  Info,
  Database,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { crmStatusOptions, leadSourceOptions } from "../lib/crm-status"

interface OAuthToken {
  id: string
  provider: string
  provider_email: string | null
  token_expires_at: string | null
  created_at: string
  updated_at: string
}

export default function SettingsTab() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [oauthTokens, setOauthTokens] = useState<OAuthToken[]>([])
  const [stats, setStats] = useState({
    leads: 0,
    notes: 0,
    events: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [tokensRes, leadsRes, notesRes, eventsRes] = await Promise.all([
      supabase.from("crm_oauth_tokens").select("id, provider, provider_email, token_expires_at, created_at, updated_at"),
      supabase.from("crm_leads").select("id", { count: "exact", head: true }),
      supabase.from("crm_notes").select("id", { count: "exact", head: true }),
      supabase.from("crm_events").select("id", { count: "exact", head: true }),
    ])

    setOauthTokens(tokensRes.data || [])
    setStats({
      leads: leadsRes.count || 0,
      notes: notesRes.count || 0,
      events: eventsRes.count || 0,
    })
    setLoading(false)
  }

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("crm_oauth_tokens")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", provider)

    setOauthTokens((prev) => prev.filter((t) => t.provider !== provider))
  }

  const googleToken = oauthTokens.find((t) => t.provider === "google")
  const zoomToken = oauthTokens.find((t) => t.provider === "zoom")

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Integration Status */}
      <div>
        <h2 className="text-lg font-bold mb-4">Integrations</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Google Calendar */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#4285F4]" />
                </div>
                <div>
                  <h3 className="font-bold">Google Calendar</h3>
                  <p className="text-xs text-white/50">Sync events and schedule meetings</p>
                </div>
              </div>
            </div>

            {googleToken ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
                {googleToken.provider_email && (
                  <p className="text-sm text-white/60">{googleToken.provider_email}</p>
                )}
                <button
                  onClick={() => handleDisconnect("google")}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors"
                >
                  <Unlink className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white/40">
                  <X className="w-4 h-4" />
                  <span className="text-sm">Not connected</span>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 mt-0.5" />
                    <p className="text-xs text-amber-400/80">
                      Google Calendar integration requires OAuth setup. Add GOOGLE_CRM_CLIENT_ID and GOOGLE_CRM_CLIENT_SECRET to your environment variables, then create the OAuth callback route.
                    </p>
                  </div>
                </div>
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/40 rounded-lg text-sm font-medium cursor-not-allowed"
                >
                  <Link className="w-4 h-4" />
                  Connect Google Calendar
                </button>
              </div>
            )}
          </div>

          {/* Zoom */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Video className="w-6 h-6 text-[#2D8CFF]" />
                </div>
                <div>
                  <h3 className="font-bold">Zoom</h3>
                  <p className="text-xs text-white/50">Create meeting links automatically</p>
                </div>
              </div>
            </div>

            {zoomToken ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
                {zoomToken.provider_email && (
                  <p className="text-sm text-white/60">{zoomToken.provider_email}</p>
                )}
                <button
                  onClick={() => handleDisconnect("zoom")}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors"
                >
                  <Unlink className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white/40">
                  <X className="w-4 h-4" />
                  <span className="text-sm">Not connected</span>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 mt-0.5" />
                    <p className="text-xs text-amber-400/80">
                      Zoom integration requires OAuth setup. Add ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET to your environment variables, then create the OAuth callback route.
                    </p>
                  </div>
                </div>
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/40 rounded-lg text-sm font-medium cursor-not-allowed"
                >
                  <Link className="w-4 h-4" />
                  Connect Zoom
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CRM Data Stats */}
      <div>
        <h2 className="text-lg font-bold mb-4">CRM Data</h2>
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-white/50 text-sm mb-1">Total Leads</p>
              <p className="text-2xl font-bold">{stats.leads}</p>
            </div>
            <div>
              <p className="text-white/50 text-sm mb-1">Total Notes</p>
              <p className="text-2xl font-bold">{stats.notes}</p>
            </div>
            <div>
              <p className="text-white/50 text-sm mb-1">Total Events</p>
              <p className="text-2xl font-bold">{stats.events}</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Stats
            </button>
          </div>
        </div>
      </div>

      {/* Lead Status Configuration */}
      <div>
        <h2 className="text-lg font-bold mb-4">Lead Statuses</h2>
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <p className="text-sm text-white/60 mb-4">
            These are the available lead statuses in your CRM pipeline.
          </p>
          <div className="space-y-2">
            {crmStatusOptions.map((status) => (
              <div key={status.value} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${status.bgColor} ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-sm text-white/50">{status.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lead Sources */}
      <div>
        <h2 className="text-lg font-bold mb-4">Lead Sources</h2>
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <p className="text-sm text-white/60 mb-4">
            Available lead source options for tracking where leads come from.
          </p>
          <div className="flex flex-wrap gap-2">
            {leadSourceOptions.map((source) => (
              <span
                key={source}
                className="px-3 py-1.5 bg-white/5 rounded-lg text-sm text-white/70"
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Database Setup Instructions */}
      <div>
        <h2 className="text-lg font-bold mb-4">Database Setup</h2>
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-[#375DEE] mt-0.5" />
            <div>
              <p className="text-sm text-white/80 mb-3">
                Make sure you&apos;ve run the CRM database migration in your Supabase SQL editor.
              </p>
              <p className="text-sm text-white/60 mb-4">
                The migration file is located at: <code className="text-[#375DEE] bg-[#375DEE]/10 px-2 py-0.5 rounded">/supabase/crm_tables.sql</code>
              </p>
              <p className="text-sm text-white/60">
                This creates the following tables with Row Level Security:
              </p>
              <ul className="text-sm text-white/50 mt-2 space-y-1 list-disc list-inside">
                <li><code className="text-white/70">crm_leads</code> - B2B lead management</li>
                <li><code className="text-white/70">crm_notes</code> - Notes and activity log</li>
                <li><code className="text-white/70">crm_events</code> - Calendar events</li>
                <li><code className="text-white/70">crm_oauth_tokens</code> - OAuth credentials</li>
                <li><code className="text-white/70">crm_activity_log</code> - Activity tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
