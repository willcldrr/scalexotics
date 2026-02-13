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
  ExternalLink,
  AlertCircle,
  Key,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Palette,
} from "lucide-react"
import { leadSourceOptions } from "../lib/crm-status"
import { useCRMStatuses, type CRMStatus } from "../hooks/use-crm-statuses"

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

// Predefined color options
const colorPresets = [
  { label: "White", color: "text-white/60", bgColor: "bg-white/10" },
  { label: "White Muted", color: "text-white/40", bgColor: "bg-white/5" },
  { label: "Blue Light", color: "text-[#375DEE]", bgColor: "bg-[#375DEE]/15" },
  { label: "Blue Medium", color: "text-[#5a7df4]", bgColor: "bg-[#375DEE]/25" },
  { label: "Blue Bright", color: "text-[#7b9af7]", bgColor: "bg-[#375DEE]/35" },
  { label: "Blue Solid", color: "text-white", bgColor: "bg-[#375DEE]" },
  { label: "Green", color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
  { label: "Green Solid", color: "text-white", bgColor: "bg-emerald-500" },
  { label: "Yellow", color: "text-amber-400", bgColor: "bg-amber-500/20" },
  { label: "Red", color: "text-red-400", bgColor: "bg-red-500/20" },
  { label: "Purple", color: "text-purple-400", bgColor: "bg-purple-500/20" },
]

interface StatusFormData {
  value: string
  label: string
  description: string
  color: string
  bg_color: string
  is_active: boolean
  is_won: boolean
  is_lost: boolean
  show_in_pipeline: boolean
}

const defaultStatusForm: StatusFormData = {
  value: "",
  label: "",
  description: "",
  color: "text-white/60",
  bg_color: "bg-white/10",
  is_active: true,
  is_won: false,
  is_lost: false,
  show_in_pipeline: true,
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

  // Status management
  const { statuses, loading: statusesLoading, refetch: refetchStatuses, createStatus, updateStatus, deleteStatus } = useCRMStatuses()
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [editingStatus, setEditingStatus] = useState<CRMStatus | null>(null)
  const [statusForm, setStatusForm] = useState<StatusFormData>(defaultStatusForm)
  const [savingStatus, setSavingStatus] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [deletingStatusId, setDeletingStatusId] = useState<string | null>(null)

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
      const redirectUri = `${window.location.origin}/api/admin/crm/oauth/google/callback`

      if (oauthConfig) {
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
      await supabase.from("crm_oauth_tokens").delete().eq("provider", "google")
      await supabase.from("crm_oauth_config").delete().eq("id", oauthConfig.id)

      setOauthConfig(null)
      setConfigForm({ client_id: "", client_secret: "" })
      setOauthTokens((prev) => prev.filter((t) => t.provider !== "google"))
    }
  }

  // Status management handlers
  const openAddStatus = () => {
    setEditingStatus(null)
    setStatusForm({
      ...defaultStatusForm,
      sort_order: statuses.length + 1,
    } as any)
    setStatusError(null)
    setShowStatusModal(true)
  }

  const openEditStatus = (status: CRMStatus) => {
    setEditingStatus(status)
    setStatusForm({
      value: status.value,
      label: status.label,
      description: status.description || "",
      color: status.color,
      bg_color: status.bg_color,
      is_active: status.is_active,
      is_won: status.is_won,
      is_lost: status.is_lost,
      show_in_pipeline: status.show_in_pipeline,
    })
    setStatusError(null)
    setShowStatusModal(true)
  }

  const handleSaveStatus = async () => {
    if (!statusForm.value.trim() || !statusForm.label.trim()) {
      setStatusError("Value and Label are required")
      return
    }

    // Validate value format (lowercase, underscores only)
    const valueRegex = /^[a-z][a-z0-9_]*$/
    if (!valueRegex.test(statusForm.value)) {
      setStatusError("Value must be lowercase letters, numbers, and underscores only (start with letter)")
      return
    }

    setSavingStatus(true)
    setStatusError(null)

    try {
      if (editingStatus) {
        await updateStatus(editingStatus.id, {
          value: statusForm.value,
          label: statusForm.label,
          description: statusForm.description || null,
          color: statusForm.color,
          bg_color: statusForm.bg_color,
          is_active: statusForm.is_active,
          is_won: statusForm.is_won,
          is_lost: statusForm.is_lost,
          show_in_pipeline: statusForm.show_in_pipeline,
        } as any)
      } else {
        await createStatus({
          value: statusForm.value,
          label: statusForm.label,
          description: statusForm.description || null,
          color: statusForm.color,
          bg_color: statusForm.bg_color,
          sort_order: statuses.length + 1,
          is_active: statusForm.is_active,
          is_won: statusForm.is_won,
          is_lost: statusForm.is_lost,
          show_in_pipeline: statusForm.show_in_pipeline,
        } as any)
      }

      setShowStatusModal(false)
      setEditingStatus(null)
      setStatusForm(defaultStatusForm)
    } catch (error: any) {
      setStatusError(error.message || "Failed to save status")
    } finally {
      setSavingStatus(false)
    }
  }

  const handleDeleteStatus = async (status: CRMStatus) => {
    if (!confirm(`Are you sure you want to delete "${status.label}"? Leads with this status will keep the status value but it won't appear in dropdowns.`)) return

    setDeletingStatusId(status.id)
    try {
      await deleteStatus(status.id)
    } catch (error: any) {
      alert(error.message || "Failed to delete status")
    } finally {
      setDeletingStatusId(null)
    }
  }

  const selectColorPreset = (preset: typeof colorPresets[0]) => {
    setStatusForm({
      ...statusForm,
      color: preset.color,
      bg_color: preset.bgColor,
    })
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

      {/* Lead Status Configuration - Moved to top */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Lead Statuses</h2>
          <button
            onClick={openAddStatus}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#375DEE] hover:bg-[#4169E1] text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Status
          </button>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <p className="text-sm text-white/60">
              Customize lead statuses for your CRM pipeline. Drag to reorder, or click to edit.
            </p>
          </div>

          {statusesLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#375DEE]" />
            </div>
          ) : statuses.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-white/50 mb-4">No custom statuses configured yet.</p>
              <p className="text-sm text-white/40 mb-4">
                Run the migration at <code className="text-[#375DEE]">/supabase/crm_statuses.sql</code> to enable custom statuses.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {statuses.map((status) => (
                <div
                  key={status.id}
                  className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group"
                >
                  <GripVertical className="w-4 h-4 text-white/20 cursor-grab" />

                  <span className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${status.bg_color} ${status.color}`}>
                    {status.label}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/50 truncate">{status.description || "No description"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-white/30">{status.value}</code>
                      {status.is_active && <span className="text-xs text-[#375DEE] bg-[#375DEE]/10 px-1.5 py-0.5 rounded">Active</span>}
                      {status.is_won && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Won</span>}
                      {status.is_lost && <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Lost</span>}
                      {status.show_in_pipeline && <span className="text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded">Pipeline</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditStatus(status)}
                      className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStatus(status)}
                      disabled={deletingStatusId === status.id}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-white/60 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {deletingStatusId === status.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Edit Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold">
                {editingStatus ? "Edit Status" : "Add Status"}
              </h3>
            </div>

            <div className="p-6 space-y-5">
              {statusError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {statusError}
                </div>
              )}

              {/* Value */}
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Value <span className="text-white/40">(internal key)</span>
                </label>
                <input
                  type="text"
                  value={statusForm.value}
                  onChange={(e) => setStatusForm({ ...statusForm, value: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                  placeholder="e.g., demo_scheduled"
                  disabled={!!editingStatus}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors font-mono text-sm disabled:opacity-50"
                />
                {editingStatus && (
                  <p className="text-xs text-white/40 mt-1">Value cannot be changed after creation</p>
                )}
              </div>

              {/* Label */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Label</label>
                <input
                  type="text"
                  value={statusForm.label}
                  onChange={(e) => setStatusForm({ ...statusForm, label: e.target.value })}
                  placeholder="e.g., Demo Scheduled"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Description</label>
                <input
                  type="text"
                  value={statusForm.description}
                  onChange={(e) => setStatusForm({ ...statusForm, description: e.target.value })}
                  placeholder="e.g., Demo or call has been scheduled"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Color</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => selectColorPreset(preset)}
                      className={`p-2 rounded-lg border transition-all ${
                        statusForm.color === preset.color && statusForm.bg_color === preset.bgColor
                          ? "border-[#375DEE] ring-1 ring-[#375DEE]"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <span className={`block px-2 py-1 rounded text-xs font-medium ${preset.bgColor} ${preset.color}`}>
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Preview */}
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-white/50">Preview:</span>
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusForm.bg_color} ${statusForm.color}`}>
                    {statusForm.label || "Status Label"}
                  </span>
                </div>
              </div>

              {/* Custom Color Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Text Color Class</label>
                  <input
                    type="text"
                    value={statusForm.color}
                    onChange={(e) => setStatusForm({ ...statusForm, color: e.target.value })}
                    placeholder="text-white/60"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Background Color Class</label>
                  <input
                    type="text"
                    value={statusForm.bg_color}
                    onChange={(e) => setStatusForm({ ...statusForm, bg_color: e.target.value })}
                    placeholder="bg-white/10"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors font-mono text-sm"
                  />
                </div>
              </div>

              {/* Flags */}
              <div>
                <label className="block text-sm text-white/60 mb-3">Status Properties</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={statusForm.is_active}
                      onChange={(e) => setStatusForm({ ...statusForm, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#375DEE] focus:ring-[#375DEE]"
                    />
                    <div>
                      <p className="text-sm font-medium">Active</p>
                      <p className="text-xs text-white/40">Open/in progress leads</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={statusForm.show_in_pipeline}
                      onChange={(e) => setStatusForm({ ...statusForm, show_in_pipeline: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#375DEE] focus:ring-[#375DEE]"
                    />
                    <div>
                      <p className="text-sm font-medium">Show in Pipeline</p>
                      <p className="text-xs text-white/40">Display in kanban view</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={statusForm.is_won}
                      onChange={(e) => setStatusForm({ ...statusForm, is_won: e.target.checked, is_lost: e.target.checked ? false : statusForm.is_lost })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#375DEE] focus:ring-[#375DEE]"
                    />
                    <div>
                      <p className="text-sm font-medium">Won Status</p>
                      <p className="text-xs text-white/40">Counts as won deal</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={statusForm.is_lost}
                      onChange={(e) => setStatusForm({ ...statusForm, is_lost: e.target.checked, is_won: e.target.checked ? false : statusForm.is_won })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#375DEE] focus:ring-[#375DEE]"
                    />
                    <div>
                      <p className="text-sm font-medium">Lost Status</p>
                      <p className="text-xs text-white/40">Counts as lost deal</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false)
                  setEditingStatus(null)
                  setStatusForm(defaultStatusForm)
                }}
                className="px-4 py-2 text-white/60 hover:text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={savingStatus}
                className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {savingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingStatus ? "Update Status" : "Add Status"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Calendar & Meet Integration */}
      <div>
        <h2 className="text-lg font-bold mb-4">Google Calendar & Meet Integration</h2>

        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
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
                <li>
                  <code className="text-[#375DEE] bg-[#375DEE]/10 px-2 py-0.5 rounded">/supabase/crm_statuses.sql</code>
                  <span className="text-white/40 ml-2">- Custom status configuration</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
