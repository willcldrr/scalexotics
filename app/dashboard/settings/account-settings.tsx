"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Save, Loader2, Lock, User, Building, HelpCircle, Mail, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function AccountSettings() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [profile, setProfile] = useState({
    full_name: "",
    company_name: "",
    phone: "",
  })

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [verifyingPassword, setVerifyingPassword] = useState(false)

  const [newEmail, setNewEmail] = useState("")
  const [showEmailChange, setShowEmailChange] = useState(false)
  const [changingEmail, setChangingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          company_name: data.company_name || "",
          phone: data.phone || "",
        })
      }
    }
    setLoading(false)
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setSaving(true)

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        company_name: profile.company_name,
        phone: profile.phone,
      })
      .eq("id", user.id)

    if (error) {
      toast.error("Failed to update profile", { description: error.message })
    } else {
      toast.success("Profile updated successfully")
    }

    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (!passwordData.current) {
      toast.error("Current password required", { description: "Please enter your current password to continue" })
      return
    }

    if (passwordData.new !== passwordData.confirm) {
      toast.error("Passwords do not match", { description: "New password and confirmation must be identical" })
      return
    }

    if (passwordData.new.length < 6) {
      toast.error("Password too short", { description: "Password must be at least 6 characters" })
      return
    }

    setChangingPassword(true)

    // First verify the current password by re-authenticating
    setVerifyingPassword(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email,
      password: passwordData.current,
    })
    setVerifyingPassword(false)

    if (signInError) {
      toast.error("Current password incorrect", { description: "Please verify your current password and try again" })
      setChangingPassword(false)
      return
    }

    // Now update the password
    const { error } = await supabase.auth.updateUser({
      password: passwordData.new,
    })

    if (error) {
      toast.error("Failed to change password", { description: error.message })
    } else {
      toast.success("Password changed successfully", { description: "Your password has been updated" })
      setPasswordData({ current: "", new: "", confirm: "" })
    }

    setChangingPassword(false)
  }

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      toast.error("Invalid email address")
      return
    }

    if (newEmail.toLowerCase() === user?.email?.toLowerCase()) {
      toast.error("That's your current email")
      return
    }

    setChangingEmail(true)

    // Supabase sends a confirmation link to BOTH the old and new email
    // The change only takes effect after the new email is confirmed
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    })

    if (error) {
      toast.error("Failed to send verification", { description: error.message })
    } else {
      setEmailSent(true)
      toast.success("Verification email sent", { description: `Check ${newEmail} to confirm the change` })
    }

    setChangingEmail(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.3),0_0_15px_rgba(255,255,255,0.03)] transition-all duration-300 hover:border-white/[0.12] p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-white" />
          <h2 className="text-lg font-bold">Profile Information</h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-white/60 mb-2">Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white/50 cursor-not-allowed"
              />
              <button
                onClick={() => { setShowEmailChange(!showEmailChange); setEmailSent(false); setNewEmail("") }}
                className="px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                Change
              </button>
            </div>
            {showEmailChange && (
              <div className="mt-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                {emailSent ? (
                  <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Verification email sent</p>
                      <p className="text-xs text-white/40 mt-0.5">Click the link in the email sent to <span className="text-white/60">{newEmail}</span> to confirm the change.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-white/40">A verification link will be sent to your new email. The change only takes effect after you confirm.</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="New email address"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleChangeEmail()}
                        className="flex-1 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all"
                      />
                      <button
                        onClick={handleChangeEmail}
                        disabled={changingEmail || !newEmail.trim()}
                        className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        {changingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send Verification"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Company Name</label>
            <div className="relative">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Your company name"
                value={profile.company_name}
                onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Phone Number</label>
            <input
              type="tel"
              placeholder="Your phone number"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-300"
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-white/90 text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 font-semibold rounded-xl transition-all duration-300"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Password Settings */}
      <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.3),0_0_15px_rgba(255,255,255,0.03)] transition-all duration-300 hover:border-white/[0.12] p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-white" />
          <h2 className="text-lg font-bold">Change Password</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-white/40 hover:text-white/60 transition-all duration-300">
                <HelpCircle className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              For security, you must verify your current password before setting a new one. Passwords must be at least 6 characters.
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-white/60 mb-2">Current Password</label>
            <input
              type="password"
              placeholder="Enter your current password"
              value={passwordData.current}
              onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-300"
            />
            <p className="text-xs text-white/40 mt-1">Required to verify your identity</p>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={passwordData.new}
              onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-300"
            />
            <p className="text-xs text-white/40 mt-1">Must be at least 6 characters</p>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-300"
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={changingPassword || !passwordData.current || !passwordData.new || !passwordData.confirm}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            {changingPassword ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {changingPassword ? (verifyingPassword ? "Verifying..." : "Changing...") : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  )
}
