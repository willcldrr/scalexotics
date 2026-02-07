"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Sparkles,
  Clock,
  Bell,
  Mail,
  Save,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react"

interface ReactivationSettings {
  ai_enabled: boolean
  default_ai_tone: string
  max_messages_per_contact_per_month: number
  min_days_between_any_message: number
  global_dnd_enabled: boolean
  dnd_start_time: string
  dnd_end_time: string
  dnd_days: number[]
  auto_unsubscribe_after_opt_out: boolean
  unsubscribe_confirmation_message: string
  email_from_name: string
  email_reply_to: string
  track_opens: boolean
  track_clicks: boolean
}

interface SettingsTabProps {
  userId: string
}

const tones = [
  { value: "friendly", label: "Friendly", description: "Warm and casual tone" },
  { value: "professional", label: "Professional", description: "Business-like but personable" },
  { value: "luxury", label: "Luxury", description: "Premium and sophisticated" },
  { value: "energetic", label: "Energetic", description: "Enthusiastic and exciting" },
]

const daysOfWeek = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
]

export default function SettingsTab({ userId }: SettingsTabProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState<ReactivationSettings>({
    ai_enabled: true,
    default_ai_tone: "friendly",
    max_messages_per_contact_per_month: 8,
    min_days_between_any_message: 3,
    global_dnd_enabled: true,
    dnd_start_time: "21:00",
    dnd_end_time: "09:00",
    dnd_days: [0],
    auto_unsubscribe_after_opt_out: true,
    unsubscribe_confirmation_message: "You have been unsubscribed from our messages. Reply START to opt back in.",
    email_from_name: "",
    email_reply_to: "",
    track_opens: true,
    track_clicks: true,
  })

  useEffect(() => {
    fetchSettings()
  }, [userId])

  const fetchSettings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("reactivation_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (data) {
      setSettings({
        ...settings,
        ...data,
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    // Check if settings exist
    const { data: existing } = await supabase
      .from("reactivation_settings")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle()

    let error
    if (existing) {
      const result = await supabase
        .from("reactivation_settings")
        .update(settings)
        .eq("user_id", userId)
      error = result.error
    } else {
      const result = await supabase.from("reactivation_settings").insert({
        user_id: userId,
        ...settings,
      })
      error = result.error
    }

    if (error) {
      console.error("Error saving settings:", error)
      alert("Failed to save settings")
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const toggleDndDay = (day: number) => {
    const newDays = settings.dnd_days.includes(day)
      ? settings.dnd_days.filter((d) => d !== day)
      : [...settings.dnd_days, day]
    setSettings({ ...settings, dnd_days: newDays })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-white/[0.02] rounded-2xl border border-white/[0.06] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* AI Settings */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#375DEE]/15 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#375DEE]" />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              AI Settings
            </h3>
            <p className="text-sm text-white/50">Configure AI-powered message generation</p>
          </div>
        </div>

        <div className="space-y-6">
          <label className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
            <div>
              <p className="font-medium">Enable AI Messages</p>
              <p className="text-sm text-white/50">Let AI personalize messages for each contact</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.ai_enabled}
                onChange={(e) => setSettings({ ...settings, ai_enabled: e.target.checked })}
                className="sr-only"
              />
              <div
                onClick={() => setSettings({ ...settings, ai_enabled: !settings.ai_enabled })}
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  settings.ai_enabled ? "bg-[#375DEE]" : "bg-white/20"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.ai_enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          </label>

          <div>
            <label className="block text-sm text-white/50 mb-3">Default AI Tone</label>
            <div className="grid grid-cols-2 gap-3">
              {tones.map((tone) => (
                <label
                  key={tone.value}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    settings.default_ai_tone === tone.value
                      ? "bg-[#375DEE]/15 border-[#375DEE]/30"
                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  <input
                    type="radio"
                    name="default_ai_tone"
                    value={tone.value}
                    checked={settings.default_ai_tone === tone.value}
                    onChange={(e) => setSettings({ ...settings, default_ai_tone: e.target.value })}
                    className="sr-only"
                  />
                  <p className="font-medium">{tone.label}</p>
                  <p className="text-sm text-white/50">{tone.description}</p>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Frequency Settings */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white/[0.06] rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-white/60" />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              Frequency Limits
            </h3>
            <p className="text-sm text-white/50">Control how often contacts receive messages</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-2">Max messages per contact/month</label>
              <input
                type="number"
                value={settings.max_messages_per_contact_per_month}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    max_messages_per_contact_per_month: parseInt(e.target.value) || 8,
                  })
                }
                min={1}
                max={30}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#375DEE]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Min days between messages</label>
              <input
                type="number"
                value={settings.min_days_between_any_message}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    min_days_between_any_message: parseInt(e.target.value) || 3,
                  })
                }
                min={1}
                max={30}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#375DEE]/50 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Do Not Disturb Settings */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white/[0.06] rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-white/60" />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              Do Not Disturb
            </h3>
            <p className="text-sm text-white/50">Set quiet hours when messages won't be sent</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
            <div>
              <p className="font-medium">Enable Do Not Disturb</p>
              <p className="text-sm text-white/50">Pause messages during specified hours</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.global_dnd_enabled}
                onChange={(e) => setSettings({ ...settings, global_dnd_enabled: e.target.checked })}
                className="sr-only"
              />
              <div
                onClick={() => setSettings({ ...settings, global_dnd_enabled: !settings.global_dnd_enabled })}
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  settings.global_dnd_enabled ? "bg-[#375DEE]" : "bg-white/20"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.global_dnd_enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          </label>

          {settings.global_dnd_enabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/50 mb-2">Quiet hours start</label>
                  <input
                    type="time"
                    value={settings.dnd_start_time}
                    onChange={(e) => setSettings({ ...settings, dnd_start_time: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#375DEE]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-2">Quiet hours end</label>
                  <input
                    type="time"
                    value={settings.dnd_end_time}
                    onChange={(e) => setSettings({ ...settings, dnd_end_time: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#375DEE]/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/50 mb-3">No messages on these days</label>
                <div className="flex gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => toggleDndDay(day.value)}
                      className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                        settings.dnd_days.includes(day.value)
                          ? "bg-[#375DEE]/15 text-[#375DEE] border border-[#375DEE]/30"
                          : "bg-white/[0.03] text-white/50 hover:bg-white/[0.06] border border-white/[0.06]"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white/[0.06] rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-white/60" />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              Email Settings
            </h3>
            <p className="text-sm text-white/50">Configure email campaign settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-2">From Name</label>
              <input
                type="text"
                value={settings.email_from_name}
                onChange={(e) => setSettings({ ...settings, email_from_name: e.target.value })}
                placeholder="e.g., Miami Exotics"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Reply-To Email</label>
              <input
                type="email"
                value={settings.email_reply_to}
                onChange={(e) => setSettings({ ...settings, email_reply_to: e.target.value })}
                placeholder="e.g., hello@miamiexotics.com"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-4 bg-white/[0.02] rounded-xl cursor-pointer border border-white/[0.04] hover:border-white/[0.08] transition-colors">
              <input
                type="checkbox"
                checked={settings.track_opens}
                onChange={(e) => setSettings({ ...settings, track_opens: e.target.checked })}
                className="w-4 h-4 rounded accent-[#375DEE]"
              />
              <div>
                <p className="font-medium">Track Email Opens</p>
                <p className="text-xs text-white/50">Monitor when emails are opened</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-white/[0.02] rounded-xl cursor-pointer border border-white/[0.04] hover:border-white/[0.08] transition-colors">
              <input
                type="checkbox"
                checked={settings.track_clicks}
                onChange={(e) => setSettings({ ...settings, track_clicks: e.target.checked })}
                className="w-4 h-4 rounded accent-[#375DEE]"
              />
              <div>
                <p className="font-medium">Track Link Clicks</p>
                <p className="text-xs text-white/50">Monitor link clicks in emails</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Unsubscribe Settings */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white/[0.06] rounded-xl flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-white/60" />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              Unsubscribe Settings
            </h3>
            <p className="text-sm text-white/50">Configure opt-out handling</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
            <div>
              <p className="font-medium">Auto-unsubscribe on STOP</p>
              <p className="text-sm text-white/50">Automatically opt out contacts who reply STOP</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.auto_unsubscribe_after_opt_out}
                onChange={(e) =>
                  setSettings({ ...settings, auto_unsubscribe_after_opt_out: e.target.checked })
                }
                className="sr-only"
              />
              <div
                onClick={() =>
                  setSettings({
                    ...settings,
                    auto_unsubscribe_after_opt_out: !settings.auto_unsubscribe_after_opt_out,
                  })
                }
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  settings.auto_unsubscribe_after_opt_out ? "bg-[#375DEE]" : "bg-white/20"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.auto_unsubscribe_after_opt_out ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          </label>

          <div>
            <label className="block text-sm text-white/50 mb-2">Unsubscribe Confirmation Message</label>
            <textarea
              value={settings.unsubscribe_confirmation_message}
              onChange={(e) =>
                setSettings({ ...settings, unsubscribe_confirmation_message: e.target.value })
              }
              rows={2}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#375DEE]/50 resize-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-xl text-[#375DEE] font-medium hover:bg-[#375DEE]/25 transition-all disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  )
}
