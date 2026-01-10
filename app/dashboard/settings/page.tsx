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
} from "lucide-react"

interface Profile {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
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

  useEffect(() => {
    fetchProfile()
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
