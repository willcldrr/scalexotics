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
  Link,
  Send,
  Loader2,
  Copy,
  ExternalLink,
  Code,
  RotateCcw,
  Sparkles,
  MessageCircle,
  Instagram,
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
  custom_system_prompt: string
  instagram_enabled: boolean
  instagram_greeting: string
}

const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant for {{business_name}}, an exotic car rental business. Your role is to help potential customers book luxury vehicles via SMS.

## Your Personality
- Tone: {{tone}}
- Be helpful, knowledgeable, and enthusiastic about the cars
- Keep responses concise since this is SMS (aim for 1-3 sentences)
- Use emojis sparingly if the tone is friendly or energetic

## Business Information
- Business Name: {{business_name}}
- Phone: {{business_phone}}
- Hours: {{business_hours}}

## Available Vehicles
{{vehicles}}

## Booking Process
{{booking_process}}

## Pricing Information
{{pricing_info}}

## Your Goals
1. Answer questions about vehicles, availability, and pricing
2. Collect rental dates and vehicle preferences
3. Guide customers toward booking
4. Provide excellent customer service

## Guidelines
- If asked about availability, check the vehicle list and dates
- Always try to move the conversation toward a booking
- If you don't know something, offer to have a team member follow up
- Never make up pricing or availability information
- Be professional but match the configured tone`

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
  custom_system_prompt: "",
  instagram_enabled: false,
  instagram_greeting: "Hey! Thanks for reaching out on Instagram. Looking to rent an exotic car? I can help you find the perfect ride. What kind of car are you interested in?",
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
  const [activeTab, setActiveTab] = useState<"config" | "preview" | "connection" | "advanced">("config")
  const [userId, setUserId] = useState<string | null>(null)
  const [twilioStatus, setTwilioStatus] = useState<"loading" | "connected" | "error">("loading")
  const [twilioInfo, setTwilioInfo] = useState<any>(null)
  const [testPhone, setTestPhone] = useState("")
  const [testMessage, setTestMessage] = useState("Hey! This is a test message from your AI assistant.")
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [instagramStatus, setInstagramStatus] = useState<"loading" | "connected" | "not_configured" | "error">("loading")
  const [instagramInfo, setInstagramInfo] = useState<any>(null)

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
        .eq("user_id", user.id)
        .neq("status", "inactive")

      setVehicles(vehiclesData || [])
    }

    // Check Twilio connection
    checkTwilioConnection()

    // Check Instagram connection
    checkInstagramConnection()

    setLoading(false)
  }

  const checkInstagramConnection = async () => {
    setInstagramStatus("loading")
    try {
      const res = await fetch("/api/instagram/status")
      const data = await res.json()
      if (data.configured) {
        setInstagramStatus("connected")
        setInstagramInfo(data)
      } else {
        setInstagramStatus("not_configured")
        setInstagramInfo(data)
      }
    } catch (error) {
      setInstagramStatus("not_configured")
      setInstagramInfo({ error: "Instagram not configured" })
    }
  }

  const checkTwilioConnection = async () => {
    setTwilioStatus("loading")
    try {
      const res = await fetch("/api/sms/test")
      const data = await res.json()
      if (data.success) {
        setTwilioStatus("connected")
        setTwilioInfo(data)
      } else {
        setTwilioStatus("error")
        setTwilioInfo(data)
      }
    } catch (error) {
      setTwilioStatus("error")
      setTwilioInfo({ error: "Failed to connect to Twilio" })
    }
  }

  const sendTestMessage = async () => {
    if (!testPhone) return
    setSendingTest(true)
    setTestResult(null)

    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testPhone,
          message: testMessage,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setTestResult({ success: true, message: "Test message sent successfully!" })
      } else {
        setTestResult({ success: false, message: data.error || "Failed to send message" })
      }
    } catch (error) {
      setTestResult({ success: false, message: "Failed to send test message" })
    }

    setSendingTest(false)
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
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-12 bg-white/5 rounded-xl w-96" />
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-64 bg-white/5 rounded-2xl" />
            <div className="h-64 bg-white/5 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Status Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)]">
        {/* Subtle gradient background */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${
          settings.auto_respond ? "opacity-100" : "opacity-0"
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#375DEE]/10 via-transparent to-[#375DEE]/5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#375DEE]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* AI Icon with glow effect */}
              <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                settings.auto_respond
                  ? "bg-gradient-to-br from-[#375DEE] to-[#5b7cf2] shadow-lg shadow-[#375DEE]/25"
                  : "bg-white/10"
              }`}>
                <Bot className={`w-7 h-7 transition-colors ${
                  settings.auto_respond ? "text-white" : "text-white/40"
                }`} />
                {/* Pulsing indicator */}
                {settings.auto_respond && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">
                    AI Agent
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    settings.auto_respond
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : "bg-white/10 text-white/40 border border-white/10"
                  }`}>
                    {settings.auto_respond ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-white/50 mt-0.5">
                  {settings.auto_respond
                    ? "Automatically responding to incoming SMS messages"
                    : "Enable to start auto-responding to customers"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Power Toggle */}
              <button
                onClick={() => setSettings({ ...settings, auto_respond: !settings.auto_respond })}
                className={`relative w-16 h-9 rounded-full transition-all duration-300 ${
                  settings.auto_respond
                    ? "bg-gradient-to-r from-[#375DEE] to-[#5b7cf2] shadow-lg shadow-[#375DEE]/25"
                    : "bg-white/10 hover:bg-white/15"
                }`}
              >
                <div
                  className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow-lg transition-all duration-300 ${
                    settings.auto_respond ? "left-8" : "left-1"
                  }`}
                />
              </button>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  saved
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "bg-[#375DEE] hover:bg-[#4169E1] text-white shadow-lg shadow-[#375DEE]/25 hover:shadow-[#375DEE]/35"
                } disabled:opacity-50`}
              >
                {saved ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Saved</span>
                  </>
                ) : saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Saving</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
        {[
          { key: "config", label: "Configuration", icon: Settings },
          { key: "preview", label: "Preview", icon: MessageCircle },
          { key: "connection", label: "Connection", icon: Link },
          { key: "advanced", label: "Advanced", icon: Code },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-[#375DEE] text-white shadow-lg shadow-[#375DEE]/25"
                : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "config" && (
        <div className="max-w-2xl space-y-6">
          {/* Quick Settings - Single Card */}
          <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
            {/* Business Basics */}
            <div className="p-5 space-y-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-[#375DEE]" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Business</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Business Name"
                  value={settings.business_name}
                  onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                  className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 transition-all"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={settings.business_phone}
                  onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                  className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 transition-all"
                />
              </div>
              <input
                type="text"
                placeholder="Business Hours (e.g., 9 AM - 6 PM, Mon - Sat)"
                value={settings.business_hours}
                onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 transition-all"
              />
            </div>

            {/* AI Tone - Horizontal Pills */}
            <div className="p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#375DEE]" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">AI Tone</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {toneOptions.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => setSettings({ ...settings, tone: tone.value })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      settings.tone === tone.value
                        ? "bg-[#375DEE] text-white shadow-lg shadow-[#375DEE]/25"
                        : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Greeting - Single Textarea */}
            <div className="p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-[#375DEE]" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Greeting Message</span>
              </div>
              <textarea
                rows={2}
                placeholder="Hey! Thanks for reaching out about renting an exotic car..."
                value={settings.greeting_message}
                onChange={(e) => setSettings({ ...settings, greeting_message: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 transition-all resize-none"
              />
            </div>

            {/* Quick Toggles - Inline */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[#375DEE]" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Settings</span>
              </div>
              <div className="space-y-3">
                {/* Auto-Respond */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-white/80">Auto-respond to messages</span>
                  <button
                    onClick={() => setSettings({ ...settings, auto_respond: !settings.auto_respond })}
                    className={`relative w-10 h-5 rounded-full transition-all ${
                      settings.auto_respond ? "bg-[#375DEE]" : "bg-white/15"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      settings.auto_respond ? "translate-x-[22px]" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>

                {/* Response Delay */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-white/80">Response delay</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={settings.response_delay_seconds}
                      onChange={(e) => setSettings({ ...settings, response_delay_seconds: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-sm text-white text-center focus:outline-none focus:border-[#375DEE]/50"
                    />
                    <span className="text-xs text-white/40">sec</span>
                  </div>
                </div>

                {/* Follow-ups */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-white/80">Send follow-ups after</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSettings({ ...settings, follow_up_enabled: !settings.follow_up_enabled })}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                        settings.follow_up_enabled
                          ? "bg-[#375DEE]/20 text-[#375DEE]"
                          : "bg-white/[0.04] text-white/40"
                      }`}
                    >
                      {settings.follow_up_enabled ? "ON" : "OFF"}
                    </button>
                    {settings.follow_up_enabled && (
                      <>
                        <input
                          type="number"
                          min="1"
                          max="72"
                          value={settings.follow_up_hours}
                          onChange={(e) => setSettings({ ...settings, follow_up_hours: parseInt(e.target.value) || 24 })}
                          className="w-14 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-sm text-white text-center focus:outline-none focus:border-[#375DEE]/50"
                        />
                        <span className="text-xs text-white/40">hrs</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Deposit */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-white/80">Mention deposit</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSettings({ ...settings, require_deposit: !settings.require_deposit })}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                        settings.require_deposit
                          ? "bg-[#375DEE]/20 text-[#375DEE]"
                          : "bg-white/[0.04] text-white/40"
                      }`}
                    >
                      {settings.require_deposit ? "ON" : "OFF"}
                    </button>
                    {settings.require_deposit && (
                      <>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={settings.deposit_percentage}
                          onChange={(e) => setSettings({ ...settings, deposit_percentage: parseInt(e.target.value) || 25 })}
                          className="w-14 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-sm text-white text-center focus:outline-none focus:border-[#375DEE]/50"
                        />
                        <span className="text-xs text-white/40">%</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info - Collapsible */}
          <details className="group rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
            <summary className="px-5 py-4 cursor-pointer flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-white/40" />
                <span className="text-sm text-white/60">Additional Templates</span>
              </div>
              <svg className="w-4 h-4 text-white/40 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-5 pb-5 space-y-3 border-t border-white/[0.06] pt-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Booking Process</label>
                <textarea
                  rows={2}
                  placeholder="To secure your booking, we require a 25% deposit..."
                  value={settings.booking_process}
                  onChange={(e) => setSettings({ ...settings, booking_process: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#375DEE]/50 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Pricing Info</label>
                <textarea
                  rows={2}
                  placeholder="Our rates vary by vehicle and rental duration..."
                  value={settings.pricing_info}
                  onChange={(e) => setSettings({ ...settings, pricing_info: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#375DEE]/50 transition-all resize-none"
                />
              </div>
            </div>
          </details>

          {/* Vehicle Count - Minimal */}
          {vehicles.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <Car className="w-4 h-4 text-[#375DEE]" />
              <span className="text-sm text-white/60">
                AI knows about <span className="text-white font-medium">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {activeTab === "preview" && (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/[0.06] flex items-center gap-3 bg-gradient-to-r from-[#375DEE]/5 to-transparent">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#375DEE] to-[#5b7cf2] flex items-center justify-center shadow-lg shadow-[#375DEE]/20">
                <Bot className="w-5 h-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-black" />
              </div>
              <div>
                <h3 className="font-bold">AI Assistant</h3>
                <p className="text-xs text-emerald-400">Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto bg-gradient-to-b from-transparent to-white/[0.01]">
              {generatePreviewConversation().map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] ${message.direction === "outbound" ? "order-2" : "order-1"}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.direction === "outbound"
                          ? "bg-gradient-to-br from-[#375DEE] to-[#4a6eef] text-white rounded-br-md shadow-lg shadow-[#375DEE]/20"
                          : "bg-white/[0.06] text-white/90 rounded-bl-md border border-white/[0.06]"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                    <p className={`text-[10px] text-white/30 mt-1 ${message.direction === "outbound" ? "text-right" : ""}`}>
                      {message.direction === "outbound" ? "AI Assistant" : "Customer"} • Just now
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preview based on your current settings</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "connection" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Instagram Connection Status */}
          <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Instagram className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold">Instagram DMs</h3>
            </div>

            <div className="p-5 space-y-4">
              <div className={`p-4 rounded-xl flex items-center gap-3 ${
                instagramStatus === "connected"
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : instagramStatus === "error"
                  ? "bg-red-500/10 border border-red-500/20"
                  : "bg-white/[0.03] border border-white/[0.06]"
              }`}>
                {instagramStatus === "loading" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                    <span className="text-white/50 text-sm">Checking connection...</span>
                  </>
                ) : instagramStatus === "connected" ? (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-400 text-sm">Connected</p>
                      <p className="text-xs text-white/50">
                        Instagram API configured
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-amber-400 text-sm">Not Configured</p>
                      <p className="text-xs text-white/50">
                        Set up Instagram API credentials
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Instagram AI Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div>
                  <p className="text-sm font-medium">Auto-respond to DMs</p>
                  <p className="text-xs text-white/50">AI will respond to Instagram messages</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, instagram_enabled: !settings.instagram_enabled })}
                  disabled={instagramStatus !== "connected"}
                  className={`relative w-10 h-5 rounded-full transition-all ${
                    settings.instagram_enabled && instagramStatus === "connected"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500"
                      : "bg-white/15"
                  } disabled:opacity-50`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    settings.instagram_enabled && instagramStatus === "connected" ? "translate-x-[22px]" : "translate-x-0.5"
                  }`} />
                </button>
              </div>

              {/* Instagram Greeting */}
              {settings.instagram_enabled && (
                <div>
                  <label className="block text-xs text-white/50 mb-2 font-medium">Instagram Greeting</label>
                  <textarea
                    rows={2}
                    placeholder="Custom greeting for Instagram DMs..."
                    value={settings.instagram_greeting}
                    onChange={(e) => setSettings({ ...settings, instagram_greeting: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                  />
                </div>
              )}

              <button
                onClick={checkInstagramConnection}
                disabled={instagramStatus === "loading"}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white font-medium transition-all disabled:opacity-50 border border-white/[0.06]"
              >
                {instagramStatus === "loading" ? "Checking..." : "Refresh Status"}
              </button>
            </div>
          </div>

          {/* Instagram Webhook Setup */}
          <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Link className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="font-bold">Instagram Webhook Setup</h3>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-white/50">
                Configure your Meta Developer App to send Instagram DMs to this webhook:
              </p>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-[10px] text-white/40 mb-2 font-medium uppercase tracking-wider">Webhook URL (Instagram)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-purple-400 break-all">
                    https://your-domain.com/api/instagram/webhook
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/instagram/webhook`)
                    }}
                    className="p-2 rounded-lg hover:bg-white/[0.08] transition-colors"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4 text-white/40" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                <p className="text-sm font-medium text-purple-400 mb-2">Setup Instructions</p>
                <ol className="text-xs text-white/60 space-y-1.5 list-decimal list-inside">
                  <li>Go to Meta Developer Console</li>
                  <li>Create or select your Business App</li>
                  <li>Add "Instagram Graph API" product</li>
                  <li>Configure Webhooks → Subscribe to "messages"</li>
                  <li>Set callback URL to the webhook above</li>
                  <li>Add environment variables for credentials</li>
                </ol>
              </div>

              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <p className="text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">Required Environment Variables</p>
                <div className="space-y-1 font-mono text-xs">
                  <p className="text-white/60">INSTAGRAM_ACCESS_TOKEN</p>
                  <p className="text-white/60">INSTAGRAM_ACCOUNT_ID</p>
                  <p className="text-white/60">INSTAGRAM_VERIFY_TOKEN</p>
                  <p className="text-white/60">INSTAGRAM_APP_SECRET</p>
                </div>
              </div>

              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-white font-medium transition-all border border-purple-500/20"
              >
                Open Meta Developer Console
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Twilio Connection Status */}
          <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#375DEE]/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-[#375DEE]" />
              </div>
              <h3 className="font-bold">Twilio Connection</h3>
            </div>

            <div className="p-5 space-y-4">
              <div className={`p-4 rounded-xl flex items-center gap-3 ${
                twilioStatus === "connected"
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : twilioStatus === "error"
                  ? "bg-red-500/10 border border-red-500/20"
                  : "bg-white/[0.03] border border-white/[0.06]"
              }`}>
                {twilioStatus === "loading" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                    <span className="text-white/50 text-sm">Checking connection...</span>
                  </>
                ) : twilioStatus === "connected" ? (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-400 text-sm">Connected</p>
                      <p className="text-xs text-white/50">
                        Account: {twilioInfo?.friendlyName || "Active"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-red-400 text-sm">Connection Error</p>
                      <p className="text-xs text-white/50">
                        {twilioInfo?.error || "Could not connect to Twilio"}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {twilioStatus === "connected" && twilioInfo?.phoneNumber && (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-xs text-white/50 mb-1">Twilio Phone Number</p>
                  <p className="font-mono text-lg">{twilioInfo.phoneNumber}</p>
                </div>
              )}

              <button
                onClick={checkTwilioConnection}
                disabled={twilioStatus === "loading"}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white font-medium transition-all disabled:opacity-50 border border-white/[0.06]"
              >
                {twilioStatus === "loading" ? "Checking..." : "Refresh Connection"}
              </button>
            </div>
          </div>

          {/* Webhook Setup */}
          <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#375DEE]/10 flex items-center justify-center">
                <Link className="w-4 h-4 text-[#375DEE]" />
              </div>
              <h3 className="font-bold">Webhook Setup</h3>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-white/50">
                Configure your Twilio phone number to send incoming SMS to this webhook URL:
              </p>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-[10px] text-white/40 mb-2 font-medium uppercase tracking-wider">Webhook URL (SMS)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-[#375DEE] break-all">
                    https://your-domain.com/api/sms/webhook
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/sms/webhook`)
                    }}
                    className="p-2 rounded-lg hover:bg-white/[0.08] transition-colors"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4 text-white/40" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#375DEE]/5 border border-[#375DEE]/20">
                <p className="text-sm font-medium text-[#375DEE] mb-2">Setup Instructions</p>
                <ol className="text-xs text-white/60 space-y-1.5 list-decimal list-inside">
                  <li>Go to your Twilio Console</li>
                  <li>Navigate to Phone Numbers → Manage → Active Numbers</li>
                  <li>Click on your phone number</li>
                  <li>Under "Messaging", set webhook to the URL above</li>
                  <li>Set the HTTP method to POST</li>
                  <li>Save your changes</li>
                </ol>
              </div>

              <a
                href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white font-medium transition-all border border-white/[0.06]"
              >
                Open Twilio Console
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Send Test Message */}
          <div className="lg:col-span-2 rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#375DEE]/10 flex items-center justify-center">
                <Send className="w-4 h-4 text-[#375DEE]" />
              </div>
              <div>
                <h3 className="font-bold">Send Test Message</h3>
                <p className="text-xs text-white/40">Verify your Twilio configuration is working</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-2 font-medium">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1234567890"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/25 focus:outline-none focus:border-[#375DEE]/50 focus:bg-white/[0.05] transition-all"
                  />
                  <p className="text-[11px] text-white/30 mt-1.5">Include country code (e.g., +1 for US)</p>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-2 font-medium">Test Message</label>
                  <input
                    type="text"
                    placeholder="Test message..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/25 focus:outline-none focus:border-[#375DEE]/50 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              </div>

              {testResult && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                  testResult.success
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${testResult.success ? "text-emerald-400" : "text-red-400"}`}>
                    {testResult.message}
                  </span>
                </div>
              )}

              <button
                onClick={sendTestMessage}
                disabled={sendingTest || !testPhone || twilioStatus !== "connected"}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#375DEE]/25 hover:shadow-[#375DEE]/35"
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Test SMS
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "advanced" && (
        <div className="space-y-6">
          {/* System Prompt Editor */}
          <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#375DEE]/10 flex items-center justify-center">
                  <Code className="w-4 h-4 text-[#375DEE]" />
                </div>
                <div>
                  <h3 className="font-bold">Custom System Prompt</h3>
                  <p className="text-xs text-white/40">Customize the AI's instructions</p>
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, custom_system_prompt: "" })}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.05] transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-white/50">
                Leave empty to use the default prompt with your settings automatically applied.
              </p>

              <textarea
                rows={20}
                placeholder={DEFAULT_SYSTEM_PROMPT}
                value={settings.custom_system_prompt}
                onChange={(e) => setSettings({ ...settings, custom_system_prompt: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white placeholder:text-white/15 focus:outline-none focus:border-[#375DEE]/50 focus:bg-white/[0.03] transition-all font-mono text-sm resize-none"
                style={{ minHeight: "400px" }}
              />

              <div className="flex items-center justify-between text-xs text-white/30">
                <span>{settings.custom_system_prompt?.length || 0} characters</span>
                <span className={settings.custom_system_prompt ? "text-[#375DEE]" : ""}>
                  {settings.custom_system_prompt ? "Using custom prompt" : "Using default prompt"}
                </span>
              </div>
            </div>
          </div>

          {/* Available Variables */}
          <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#375DEE]/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#375DEE]" />
              </div>
              <div>
                <h3 className="font-bold">Available Variables</h3>
                <p className="text-xs text-white/40">Use these placeholders in your prompt</p>
              </div>
            </div>

            <div className="p-5">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { variable: "{{business_name}}", description: "Your business name", value: settings.business_name || "(not set)" },
                  { variable: "{{business_phone}}", description: "Your business phone", value: settings.business_phone || "(not set)" },
                  { variable: "{{business_hours}}", description: "Your business hours", value: settings.business_hours || "(not set)" },
                  { variable: "{{tone}}", description: "Conversation tone setting", value: settings.tone },
                  { variable: "{{greeting_message}}", description: "Initial greeting message", value: settings.greeting_message?.substring(0, 30) + "..." || "(not set)" },
                  { variable: "{{booking_process}}", description: "Booking process info", value: settings.booking_process?.substring(0, 30) + "..." || "(not set)" },
                  { variable: "{{pricing_info}}", description: "Pricing information", value: settings.pricing_info?.substring(0, 30) + "..." || "(not set)" },
                  { variable: "{{vehicles}}", description: "List of available vehicles", value: vehicles.length > 0 ? `${vehicles.length} vehicles` : "(none)" },
                  { variable: "{{deposit_percentage}}", description: "Deposit percentage", value: `${settings.deposit_percentage}%` },
                ].map((item) => (
                  <div key={item.variable} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-xs font-mono text-[#375DEE]">{item.variable}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(item.variable)}
                        className="p-1 rounded hover:bg-white/[0.08] transition-colors"
                        title="Copy variable"
                      >
                        <Copy className="w-3 h-3 text-white/30" />
                      </button>
                    </div>
                    <p className="text-[11px] text-white/40">{item.description}</p>
                    <p className="text-[10px] text-white/25 mt-1 truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Default Prompt Reference */}
          <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                <Info className="w-4 h-4 text-white/60" />
              </div>
              <div>
                <h3 className="font-bold">Default Prompt Reference</h3>
                <p className="text-xs text-white/40">Copy as a starting point for customization</p>
              </div>
            </div>

            <div className="p-5">
              <div className="relative">
                <pre className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-white/60 whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
                  {DEFAULT_SYSTEM_PROMPT}
                </pre>
                <button
                  onClick={() => setSettings({ ...settings, custom_system_prompt: DEFAULT_SYSTEM_PROMPT })}
                  className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#375DEE]/10 hover:bg-[#375DEE]/20 text-[#375DEE] text-xs font-medium transition-colors border border-[#375DEE]/20"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy to Editor
                </button>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-2xl bg-gradient-to-br from-[#375DEE]/10 to-transparent border border-[#375DEE]/20 p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#375DEE]/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-[#375DEE]" />
              </div>
              <div>
                <h3 className="font-bold text-[#375DEE] mb-2">Tips for Customizing</h3>
                <ul className="text-sm text-white/60 space-y-1.5">
                  <li>• Keep instructions clear and specific for best results</li>
                  <li>• SMS has a 160 character limit per segment, so instruct AI to be brief</li>
                  <li>• Include examples of ideal responses if you want specific formatting</li>
                  <li>• Test your custom prompt by sending test messages from the Connection tab</li>
                  <li>• Add specific rules like "never mention competitor names"</li>
                  <li>• Variables are replaced at runtime, reference them anywhere</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
