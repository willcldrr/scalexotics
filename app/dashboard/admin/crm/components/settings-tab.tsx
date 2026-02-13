"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Link,
  Unlink,
  Calendar,
  Video,
  Check,
  X,
  Loader2,
  Info,
  Database,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  ExternalLink,
  AlertCircle,
  Key,
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

interface OAuthConfig {
  id: string
  provider: string
  client_id: string
  client_secret: string
  redirect_uri: string | null
  scopes: string
  is_active: boolean
}

export default function SettingsTab() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [oauthTokens, setOauthTokens] = useState<OAuthToken[]>([])
  const [oauthConfig, setOauthConfig] = useState<OAuthConfig | null>(null)
  const [stats, setStats] = useState({
    leads: 0,
    notes: 0,
    events: 0,
  })

  // Config form state
  const [showConfigForm, setShowConfigForm] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [configForm, setConfigForm] = useState({
    client_id: "",
    client_secret: "",
  })
  const [configError, setConfigError] = useState<string | null>(null)
  const [configSuccess, setConfigSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [tokensRes, configRes, leadsRes, notesRes, eventsRes] = await Promise.all([
      supabase.from("crm_oauth_tokens").select("id, provider, provider_email, token_expires_at, created_at, updated_at"),
      supabase.from("crm_oauth_config").select("*").eq("provider", "google").single(),
      supabase.from("crm_leads").select("id", { count: "exact", head: true }),
      supabase.from("crm_notes").select("id", { count: "exact", head: true }),
      supabase.from("crm_events").select("id", { count: "exact", head: true }),
    ])

    setOauthTokens(tokensRes.data || [])
    if (configRes.data) {
      setOauthConfig(configRes.data)
      setConfigForm({
        client_id: configRes.data.client_id || "",
        client_secret: configRes.data.client_secret || "",
      })
    }
    setStats({
      leads: leadsRes.count || 0,
      notes: notesRes.count || 0,
      events: eventsRes.count || 0,
    })
    setLoading(false)
  }

  const handleSaveConfig = async () => {
    if (!configForm.client_id || !configForm.client_secret) {
      setConfigError("Both Client ID and Client Secret are required")
      return
    }

    setSavingConfig(true)
    setConfigError(null)
    setConfigSuccess(null)

    try {
      // Get current URL for redirect URI
      const redirectUri = `${window.location.origin}/api/admin/crm/oauth/google/callback`

      if (oauthConfig) {
        // Update existing config
        const { error } = await supabase
          .from("crm_oauth_config")
          .update({
            client_id: configForm.client_id,
            client_secret: configForm.client_secret,
            redirect_uri: redirectUri,
          })
          .eq("id", oauthConfig.id)

        if (error) throw error
      } else {
        // Insert new config
        const { error } = await supabase.from("crm_oauth_config").insert({
          provider: "google",
          client_id: configForm.client_id,
          client_secret: configForm.client_secret,
          redirect_uri: redirectUri,
          scopes: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
        })

        if (error) throw error
      }

      setConfigSuccess("Google OAuth credentials saved successfully")
      setShowConfigForm(false)
      fetchData()
    } catch (error: any) {
      setConfigError(error.message || "Failed to save credentials")
    } finally {
      setSavingConfig(false)
    }
  }

  const handleConnect = async () => {
    if (!oauthConfig) {
      setConfigError("Please configure Google OAuth credentials first")
      return
    }

    setConnecting(true)

    // Redirect to our OAuth initiation endpoint
    window.location.href = "/api/admin/crm/oauth/google"
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

  const handleDeleteConfig = async () => {
    if (!confirm("Are you sure you want to remove the Google OAuth configuration? This will also disconnect any connected accounts.")) return

    if (oauthConfig) {
      // Delete all tokens first
      await supabase.from("crm_oauth_tokens").delete().eq("provider", "google")

      // Then delete config
      await supabase.from("crm_oauth_config").delete().eq("id", oauthConfig.id)

      setOauthConfig(null)
      setConfigForm({ client_id: "", client_secret: "" })
      setOauthTokens((prev) => prev.filter((t) => t.provider !== "google"))
    }
  }

  const googleToken = oauthTokens.find((t) => t.provider === "google")
  const redirectUri = typeof window !== "undefined"
    ? `${window.location.origin}/api/admin/crm/oauth/google/callback`
    : ""

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Messages */}
      {configError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/20 text-white/70">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{configError}</span>
          <button onClick={() => setConfigError(null)} className="ml-auto p-1 hover:bg-white/10 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {configSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#375DEE]/10 border border-[#375DEE]/30 text-[#375DEE]">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{configSuccess}</span>
          <button onClick={() => setConfigSuccess(null)} className="ml-auto p-1 hover:bg-white/10 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Google Calendar & Meet Integration */}
      <div>
        <h2 className="text-lg font-bold mb-4">Google Calendar & Meet Integration</h2>

        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#4285F4]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">Google Calendar & Meet</h3>
                <p className="text-xs text-white/50">Sync events and create Google Meet video calls</p>
              </div>
              {googleToken && (
                <div className="flex items-center gap-2 text-[#375DEE]">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              )}
            </div>
          </div>

          {/* Step 1: OAuth Credentials Configuration */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#375DEE] flex items-center justify-center text-xs font-bold">1</div>
                <h4 className="font-medium">Configure OAuth Credentials</h4>
              </div>
              {oauthConfig && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#375DEE] bg-[#375DEE]/10 px-2 py-1 rounded">Configured</span>
                  <button
                    onClick={() => setShowConfigForm(!showConfigForm)}
                    className="text-xs text-white/50 hover:text-white"
                  >
                    {showConfigForm ? "Cancel" : "Edit"}
                  </button>
                </div>
              )}
            </div>

            {!oauthConfig && !showConfigForm && (
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start gap-2 mb-3">
                    <Info className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-white/60">
                      <p className="mb-2">To connect Google Calendar, you need to create OAuth credentials in Google Cloud Console:</p>
                      <ol className="list-decimal list-inside space-y-1 text-white/50">
                        <li>Go to Google Cloud Console</li>
                        <li>Create a new project or select existing</li>
                        <li>Enable Google Calendar API</li>
                        <li>Create OAuth 2.0 credentials (Web application)</li>
                        <li>Add the redirect URI shown below</li>
                      </ol>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-[#0a0a0a] rounded-lg">
                    <p className="text-xs text-white/40 mb-1">Redirect URI (add this to Google Console):</p>
                    <code className="text-xs text-[#375DEE] break-all">{redirectUri}</code>
                  </div>
                </div>

                <button
                  onClick={() => setShowConfigForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] text-white font-medium rounded-lg transition-colors"
                >
                  <Key className="w-4 h-4" />
                  Add Google Credentials
                </button>
              </div>
            )}

            {(showConfigForm || (!oauthConfig && showConfigForm)) && (
              <div className="space-y-4">
                <div className="p-4 bg-[#0a0a0a] rounded-lg border border-white/10">
                  <p className="text-xs text-white/40 mb-1">Redirect URI (add this to Google Console):</p>
                  <code className="text-xs text-[#375DEE] break-all">{redirectUri}</code>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Client ID</label>
                  <input
                    type="text"
                    placeholder="Your Google OAuth Client ID"
                    value={configForm.client_id}
                    onChange={(e) => setConfigForm({ ...configForm, client_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Client Secret</label>
                  <div className="relative">
                    <input
                      type={showSecrets ? "text" : "password"}
                      placeholder="Your Google OAuth Client Secret"
                      value={configForm.client_secret}
                      onChange={(e) => setConfigForm({ ...configForm, client_secret: e.target.value })}
                      className="w-full px-4 py-3 pr-12 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecrets(!showSecrets)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
                    >
                      {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveConfig}
                    disabled={savingConfig}
                    className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                  >
                    {savingConfig ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save Credentials
                      </>
                    )}
                  </button>
                  {oauthConfig && (
                    <>
                      <button
                        onClick={() => setShowConfigForm(false)}
                        className="px-4 py-2 text-white/60 hover:text-white font-medium rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteConfig}
                        className="px-4 py-2 text-white/40 hover:text-white font-medium rounded-lg transition-colors ml-auto"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {oauthConfig && !showConfigForm && (
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <Check className="w-4 h-4 text-[#375DEE]" />
                <span>Client ID: {oauthConfig.client_id.substring(0, 20)}...</span>
              </div>
            )}
          </div>

          {/* Step 2: Connect Account */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${oauthConfig ? "bg-[#375DEE]" : "bg-white/20"}`}>2</div>
              <h4 className={`font-medium ${!oauthConfig ? "text-white/40" : ""}`}>Connect Your Google Account</h4>
            </div>

            {!oauthConfig ? (
              <p className="text-sm text-white/40">Complete step 1 first to enable account connection.</p>
            ) : googleToken ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-[#375DEE]/10 rounded-lg border border-[#375DEE]/20">
                  <Check className="w-5 h-5 text-[#375DEE]" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Account Connected</p>
                    {googleToken.provider_email && (
                      <p className="text-xs text-white/50">{googleToken.provider_email}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Video className="w-3.5 h-3.5" />
                  <span>Google Meet links will be auto-generated for video calls</span>
                </div>

                <button
                  onClick={() => handleDisconnect("google")}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Unlink className="w-4 h-4" />
                  Disconnect Account
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-white/60">
                  Connect your Google account to sync calendar events and create Google Meet links.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4" />
                      Connect Google Account
                    </>
                  )}
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
                Make sure you&apos;ve run the CRM database migrations in your Supabase SQL editor.
              </p>
              <p className="text-sm text-white/60 mb-4">
                Migration files are located at:
              </p>
              <ul className="text-sm text-white/50 space-y-2">
                <li>
                  <code className="text-[#375DEE] bg-[#375DEE]/10 px-2 py-0.5 rounded">/supabase/crm_tables.sql</code>
                  <span className="text-white/40 ml-2">- Core CRM tables</span>
                </li>
                <li>
                  <code className="text-[#375DEE] bg-[#375DEE]/10 px-2 py-0.5 rounded">/supabase/crm_oauth_config.sql</code>
                  <span className="text-white/40 ml-2">- OAuth configuration table</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
