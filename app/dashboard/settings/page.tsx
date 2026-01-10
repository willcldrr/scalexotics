"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  User,
  Building2,
  Mail,
  Lock,
  Save,
  Check,
  AlertCircle,
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react"

interface Profile {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
}

interface ApiKey {
  id: string
  key: string
  name: string
  domain: string | null
  is_active: boolean
  created_at: string
  last_used_at: string | null
}

export default function SettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [formData, setFormData] = useState({
    full_name: "",
    company_name: "",
  })

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [showAddKeyModal, setShowAddKeyModal] = useState(false)
  const [newKeyData, setNewKeyData] = useState({ name: "", domain: "" })
  const [creatingKey, setCreatingKey] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
    fetchApiKeys()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profile) {
        setProfile(profile)
        setFormData({
          full_name: profile.full_name || "",
          company_name: profile.company_name || "",
        })
      }
    }
    setLoading(false)
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        company_name: formData.company_name,
      })
      .eq("id", profile.id)

    if (error) {
      setMessage({ type: "error", text: "Failed to update profile. Please try again." })
    } else {
      setProfile({ ...profile, ...formData })
      setMessage({ type: "success", text: "Profile updated successfully!" })
    }

    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: "error", text: "New passwords do not match." })
      return
    }

    if (passwordData.new_password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." })
      return
    }

    setChangingPassword(true)
    setMessage(null)

    const { error } = await supabase.auth.updateUser({
      password: passwordData.new_password,
    })

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: "Password changed successfully!" })
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })
    }

    setChangingPassword(false)
  }

  // API Key functions
  const fetchApiKeys = async () => {
    const { data } = await supabase
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false })

    setApiKeys(data || [])
  }

  const generateApiKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let key = "sk_"
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return key
  }

  const handleCreateApiKey = async () => {
    if (!profile || !newKeyData.name) return

    setCreatingKey(true)
    const key = generateApiKey()

    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        user_id: profile.id,
        key,
        name: newKeyData.name,
        domain: newKeyData.domain || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      setMessage({ type: "error", text: "Failed to create API key" })
    } else {
      setApiKeys([data, ...apiKeys])
      setNewlyCreatedKey(key)
      setNewKeyData({ name: "", domain: "" })
    }

    setCreatingKey(false)
  }

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key? Any lead capture sites using it will stop working.")) return

    const { error } = await supabase.from("api_keys").delete().eq("id", id)

    if (!error) {
      setApiKeys(apiKeys.filter((k) => k.id !== id))
      setMessage({ type: "success", text: "API key deleted" })
    }
  }

  const handleToggleApiKey = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: !isActive })
      .eq("id", id)

    if (!error) {
      setApiKeys(apiKeys.map((k) => (k.id === id ? { ...k, is_active: !isActive } : k)))
    }
  }

  const copyToClipboard = async (text: string, keyId: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedKeyId(keyId)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId)
    } else {
      newVisible.add(keyId)
    }
    setVisibleKeys(newVisible)
  }

  const maskKey = (key: string) => {
    return key.substring(0, 7) + "•".repeat(20) + key.substring(key.length - 4)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Settings
          </h1>
          <p className="text-white/50 mt-1">Loading your settings...</p>
        </div>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-white/10 rounded w-32 mb-6" />
              <div className="space-y-4">
                <div className="h-12 bg-white/10 rounded" />
                <div className="h-12 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Settings
        </h1>
        <p className="text-white/50 mt-1">Manage your account settings</p>
      </div>

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

      {/* Profile Settings */}
      <div className="bg-white/5 rounded-2xl border border-white/10">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
            <User className="w-5 h-5 text-[#375DEE]" />
            Profile Information
          </h2>
          <p className="text-white/50 text-sm mt-1">Update your personal details</p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm text-white/60 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={profile?.email || ""}
              disabled
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 cursor-not-allowed"
            />
            <p className="text-xs text-white/40 mt-2">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name
            </label>
            <input
              type="text"
              placeholder="John Smith"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Company Name
            </label>
            <input
              type="text"
              placeholder="Exotic Rentals LLC"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            <Save className="w-5 h-5" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Password Settings */}
      <div className="bg-white/5 rounded-2xl border border-white/10">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
            <Lock className="w-5 h-5 text-[#375DEE]" />
            Change Password
          </h2>
          <p className="text-white/50 text-sm mt-1">Update your account password</p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm text-white/60 mb-2">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
            />
            <p className="text-xs text-white/40 mt-2">Minimum 6 characters</p>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={changingPassword || !passwordData.new_password || !passwordData.confirm_password}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            <Lock className="w-5 h-5" />
            {changingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>

      {/* API Keys Section */}
      <div className="bg-white/5 rounded-2xl border border-white/10">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
              <Key className="w-5 h-5 text-[#375DEE]" />
              API Keys
            </h2>
            <p className="text-white/50 text-sm mt-1">Manage keys for your lead capture sites</p>
          </div>
          <button
            onClick={() => {
              setShowAddKeyModal(true)
              setNewlyCreatedKey(null)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] text-white font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Key
          </button>
        </div>
        <div className="p-6">
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50 mb-4">No API keys yet</p>
              <p className="text-white/40 text-sm max-w-md mx-auto">
                Create an API key to connect your lead capture sites. Each key can be associated with a specific domain.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className={`p-4 rounded-xl border ${
                    apiKey.is_active ? "bg-white/5 border-white/10" : "bg-white/[0.02] border-white/5 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{apiKey.name}</h3>
                        {!apiKey.is_active && (
                          <span className="px-2 py-0.5 text-xs rounded bg-white/10 text-white/50">Disabled</span>
                        )}
                      </div>
                      {apiKey.domain && (
                        <p className="text-sm text-white/40 mb-2">{apiKey.domain}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-[#375DEE] bg-black/30 px-3 py-1.5 rounded-lg">
                          {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          title={visibleKeys.has(apiKey.id) ? "Hide key" : "Show key"}
                        >
                          {visibleKeys.has(apiKey.id) ? (
                            <EyeOff className="w-4 h-4 text-white/50" />
                          ) : (
                            <Eye className="w-4 h-4 text-white/50" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          title="Copy key"
                        >
                          {copiedKeyId === apiKey.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-white/50" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-white/30 mt-2">
                        Created {formatDate(apiKey.created_at)} • Last used: {formatDate(apiKey.last_used_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleApiKey(apiKey.id, apiKey.is_active)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          apiKey.is_active
                            ? "bg-white/10 hover:bg-white/15"
                            : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        }`}
                      >
                        {apiKey.is_active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleDeleteApiKey(apiKey.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                        title="Delete key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Documentation Link */}
          <div className="mt-6 p-4 rounded-xl bg-[#375DEE]/10 border border-[#375DEE]/30">
            <p className="text-sm text-white/70 mb-2">
              <strong>How to use:</strong> Add the API key to your lead capture site's configuration.
              Send POST requests to <code className="bg-black/30 px-2 py-0.5 rounded">/api/leads/capture</code> with
              the header <code className="bg-black/30 px-2 py-0.5 rounded">X-API-Key: your-key</code>
            </p>
            <a
              href="/lead-capture-example.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#375DEE] hover:underline"
            >
              View example lead capture page
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Add API Key Modal */}
      {showAddKeyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-md">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                {newlyCreatedKey ? "API Key Created" : "Create API Key"}
              </h2>
            </div>
            <div className="p-6">
              {newlyCreatedKey ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                    <p className="text-sm text-green-400 mb-2 font-medium">Your new API key:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm font-mono bg-black/30 px-3 py-2 rounded-lg break-all">
                        {newlyCreatedKey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(newlyCreatedKey, "new")}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        {copiedKeyId === "new" ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-sm text-yellow-400">
                      <strong>Important:</strong> Copy this key now. You won't be able to see the full key again.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddKeyModal(false)
                      setNewlyCreatedKey(null)
                    }}
                    className="w-full px-5 py-3 rounded-xl bg-[#375DEE] hover:bg-[#4169E1] font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Key Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Miami Exotics Landing Page"
                      value={newKeyData.name}
                      onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Domain (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., miamiexoticsleads.com"
                      value={newKeyData.domain}
                      onChange={(e) => setNewKeyData({ ...newKeyData, domain: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                    />
                    <p className="text-xs text-white/40 mt-2">Used to identify where leads came from</p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowAddKeyModal(false)}
                      className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateApiKey}
                      disabled={creatingKey || !newKeyData.name}
                      className="flex-1 px-5 py-3 rounded-xl bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 font-semibold transition-colors"
                    >
                      {creatingKey ? "Creating..." : "Create Key"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-red-500/5 rounded-2xl border border-red-500/20">
        <div className="p-6 border-b border-red-500/20">
          <h2 className="text-xl font-semibold text-red-400" style={{ fontFamily: 'var(--font-display)' }}>
            Danger Zone
          </h2>
          <p className="text-white/50 text-sm mt-1">Irreversible account actions</p>
        </div>
        <div className="p-6">
          <p className="text-white/60 mb-4">
            Once you delete your account, there is no going back. All your data including leads, vehicles, and bookings will be permanently removed.
          </p>
          <button
            onClick={() => alert("Contact support to delete your account")}
            className="px-6 py-3 border border-red-500/50 text-red-400 hover:bg-red-500/10 font-semibold rounded-xl transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
