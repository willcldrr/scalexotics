"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Bot,
  Settings,
  MessageSquare,
  Clock,
  Phone,
  Save,
  CheckCircle,
  AlertCircle,
  Zap,
  FileText,
  Car,
  DollarSign,
  Calendar,
  Info,
} from "lucide-react"

interface AISettings {
  id?: string
  business_name: string
  business_phone: string
  business_hours: string
  greeting_message: string
  booking_process: string
  pricing_info: string
  tone: string
  auto_respond: boolean
  response_delay_seconds: number
  require_deposit: boolean
  deposit_percentage: number
  follow_up_enabled: boolean
  follow_up_hours: number
}

const defaultSettings: AISettings = {
  business_name: "",
  business_phone: "",
  business_hours: "9 AM - 6 PM, Monday - Saturday",
  greeting_message: "Hey! Thanks for reaching out about renting an exotic car. I'm here to help you find the perfect vehicle for your needs. What dates are you looking at?",
  booking_process: "To secure your booking, we require a 25% deposit. Once confirmed, the vehicle will be reserved exclusively for you.",
  pricing_info: "Our rates vary by vehicle and rental duration. Multi-day rentals include discounted daily rates.",
  tone: "friendly",
  auto_respond: true,
  response_delay_seconds: 30,
  require_deposit: true,
  deposit_percentage: 25,
  follow_up_enabled: true,
  follow_up_hours: 24,
}

const toneOptions = [
  { value: "friendly", label: "Friendly & Casual", description: "Warm, approachable tone with emojis" },
  { value: "professional", label: "Professional", description: "Polished, business-like communication" },
  { value: "luxury", label: "Luxury Concierge", description: "High-end, white-glove service feel" },
  { value: "energetic", label: "Energetic & Exciting", description: "Enthusiastic about the cars and experience" },
]

export default function AIAssistantPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<AISettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"config" | "preview" | "stats">("config")
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)

      // Fetch AI settings
      const { data: settingsData } = await supabase
        .from("ai_settings")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (settingsData) {
        setSettings(settingsData)
      }

      // Fetch vehicles for context
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("name, make, model, daily_rate")
        .neq("status", "inactive")

      setVehicles(vehiclesData || [])
    }

    setLoading(false)
  }

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    setSaved(false)

    const settingsData = {
      user_id: userId,
      ...settings,
    }

    if (settings.id) {
      await supabase.from("ai_settings").update(settingsData).eq("id", settings.id)
    } else {
      const { data } = await supabase.from("ai_settings").insert(settingsData).select().single()
      if (data) {
        setSettings(data)
      }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const generatePreviewConversation = () => {
    const greeting = settings.greeting_message || defaultSettings.greeting_message
    return [
      { direction: "inbound", content: "Hey, I saw your ad for the Lamborghini. Is it available this weekend?" },
      { direction: "outbound", content: greeting },
      { direction: "inbound", content: "I'm looking at Saturday to Sunday" },
      { direction: "outbound", content: `Great choice! Let me check availability for Saturday to Sunday. ${settings.business_name ? `At ${settings.business_name}, we` : "We"} have some amazing options. ${settings.pricing_info || defaultSettings.pricing_info}` },
      { direction: "inbound", content: "What's the process to book?" },
      { direction: "outbound", content: settings.booking_process || defaultSettings.booking_process },
    ]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            AI Assistant
          </h1>
          <p className="text-white/50 mt-1">Loading configuration...</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-white/5 rounded-xl" />
          <div className="h-64 bg-white/5 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            AI Assistant
          </h1>
          <p className="text-white/50 mt-1">Configure your SMS booking assistant</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {saved ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Saved!
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl p-4 flex items-center gap-3 ${settings.auto_respond ? "bg-green-500/10 border border-green-500/30" : "bg-yellow-500/10 border border-yellow-500/30"}`}>
        {settings.auto_respond ? (
          <>
            <Zap className="w-5 h-5 text-green-400" />
            <div>
              <p className="font-medium text-green-400">AI Assistant is Active</p>
              <p className="text-sm text-white/50">Automatically responding to incoming messages</p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="font-medium text-yellow-400">AI Assistant is Paused</p>
              <p className="text-sm text-white/50">Enable auto-respond to activate</p>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "config" ? "bg-[#375DEE] text-white" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Configuration
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "preview" ? "bg-[#375DEE] text-white" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Preview
        </button>
      </div>

      {activeTab === "config" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Business Information */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Info className="w-5 h-5 text-[#375DEE]" />
              Business Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Business Name</label>
                <input
                  type="text"
                  placeholder="Exotic Rentals Miami"
                  value={settings.business_name}
                  onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Business Phone</label>
                <input
                  type="tel"
                  placeholder="(305) 555-0123"
                  value={settings.business_phone}
                  onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Business Hours</label>
                <input
                  type="text"
                  placeholder="9 AM - 6 PM, Monday - Saturday"
                  value={settings.business_hours}
                  onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Conversation Settings */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <MessageSquare className="w-5 h-5 text-[#375DEE]" />
              Conversation Style
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Tone</label>
                <div className="space-y-2">
                  {toneOptions.map((tone) => (
                    <label
                      key={tone.value}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        settings.tone === tone.value
                          ? "bg-[#375DEE]/10 border-[#375DEE]/50"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tone"
                        value={tone.value}
                        checked={settings.tone === tone.value}
                        onChange={(e) => setSettings({ ...settings, tone: e.target.value })}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">{tone.label}</p>
                        <p className="text-sm text-white/50">{tone.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <FileText className="w-5 h-5 text-[#375DEE]" />
              Message Templates
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Greeting Message</label>
                <textarea
                  rows={3}
                  placeholder="Hey! Thanks for reaching out..."
                  value={settings.greeting_message}
                  onChange={(e) => setSettings({ ...settings, greeting_message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Booking Process Info</label>
                <textarea
                  rows={3}
                  placeholder="To secure your booking..."
                  value={settings.booking_process}
                  onChange={(e) => setSettings({ ...settings, booking_process: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Pricing Info</label>
                <textarea
                  rows={2}
                  placeholder="Our rates vary by vehicle..."
                  value={settings.pricing_info}
                  onChange={(e) => setSettings({ ...settings, pricing_info: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Automation Settings */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Zap className="w-5 h-5 text-[#375DEE]" />
              Automation Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <p className="font-medium">Auto-Respond</p>
                  <p className="text-sm text-white/50">Automatically reply to incoming messages</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, auto_respond: !settings.auto_respond })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.auto_respond ? "bg-[#375DEE]" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.auto_respond ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Response Delay (seconds)</label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={settings.response_delay_seconds}
                  onChange={(e) => setSettings({ ...settings, response_delay_seconds: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                />
                <p className="text-xs text-white/40 mt-1">Add a delay to make responses feel more natural</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <p className="font-medium">Follow-up Messages</p>
                  <p className="text-sm text-white/50">Send follow-ups to unresponsive leads</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, follow_up_enabled: !settings.follow_up_enabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.follow_up_enabled ? "bg-[#375DEE]" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.follow_up_enabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {settings.follow_up_enabled && (
                <div>
                  <label className="block text-sm text-white/60 mb-2">Follow-up After (hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={settings.follow_up_hours}
                    onChange={(e) => setSettings({ ...settings, follow_up_hours: parseInt(e.target.value) || 24 })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <p className="font-medium">Require Deposit</p>
                  <p className="text-sm text-white/50">Mention deposit requirement to leads</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, require_deposit: !settings.require_deposit })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.require_deposit ? "bg-[#375DEE]" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.require_deposit ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {settings.require_deposit && (
                <div>
                  <label className="block text-sm text-white/60 mb-2">Deposit Percentage</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.deposit_percentage}
                    onChange={(e) => setSettings({ ...settings, deposit_percentage: parseInt(e.target.value) || 25 })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Context */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Car className="w-5 h-5 text-[#375DEE]" />
              Vehicle Information (AI Context)
            </h2>
            <p className="text-sm text-white/50 mb-4">
              The AI will have access to these vehicles when answering questions about availability and pricing.
            </p>
            {vehicles.length === 0 ? (
              <p className="text-white/40 text-center py-8">
                No vehicles added yet. Add vehicles in the Vehicles section.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {vehicles.map((vehicle, index) => (
                  <div key={index} className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                    <p className="text-sm text-[#375DEE]">${vehicle.daily_rate}/day</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "preview" && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#375DEE]/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#375DEE]" />
              </div>
              <div>
                <h3 className="font-semibold">Preview Conversation</h3>
                <p className="text-sm text-white/50">See how your AI will respond</p>
              </div>
            </div>
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {generatePreviewConversation().map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.direction === "outbound"
                        ? "bg-[#375DEE] text-white rounded-br-md"
                        : "bg-white/10 text-white rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/10 bg-white/[0.02]">
              <p className="text-sm text-white/40 text-center">
                This is a preview based on your current settings
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
