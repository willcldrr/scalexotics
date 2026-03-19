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
  Instagram,
  FlaskConical,
} from "lucide-react"
import ChatbotTestPanel from "./chatbot-test-panel"

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
  const [bookings, setBookings] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"test" | "connection" | "config">("test")
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
        .select("id, name, make, model, year, daily_rate, type, status")
        .eq("user_id", user.id)
        .neq("status", "inactive")

      setVehicles(vehiclesData || [])

      // Fetch upcoming bookings for availability
      const today = new Date().toISOString().split("T")[0]
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id, vehicle_id, start_date, end_date, status, customer_name")
        .eq("user_id", user.id)
        .in("status", ["confirmed", "pending", "active"])
        .gte("end_date", today)
        .order("start_date", { ascending: true })

      setBookings(bookingsData || [])
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
      <div className="space-y-6 animate-pulse">
        {/* Hero Card Skeleton */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10" />
              <div className="space-y-2">
                <div className="h-6 w-40 bg-white/10 rounded" />
                <div className="h-4 w-56 bg-white/5 rounded" />
              </div>
            </div>
            <div className="h-10 w-28 bg-white/10 rounded-xl" />
          </div>
        </div>
        {/* Tabs Skeleton */}
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-28 bg-white/5 rounded-xl" />
          ))}
        </div>
        {/* Content Grid Skeleton */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-5 h-72">
            <div className="h-5 w-32 bg-white/10 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-10 bg-white/5 rounded-lg" />
              <div className="h-10 bg-white/5 rounded-lg" />
              <div className="h-10 bg-white/5 rounded-lg" />
            </div>
          </div>
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-5 h-72">
            <div className="h-5 w-32 bg-white/10 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-10 bg-white/5 rounded-lg" />
              <div className="h-10 bg-white/5 rounded-lg" />
              <div className="h-10 bg-white/5 rounded-lg" />
            </div>
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
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* AI Icon with glow effect */}
              <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                settings.auto_respond
                  ? "bg-white shadow-lg shadow-white/25"
                  : "bg-white/10"
              }`}>
                <Bot className={`w-7 h-7 transition-colors ${
                  settings.auto_respond ? "text-black" : "text-white/40"
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
                    ? "bg-white shadow-lg shadow-white/25"
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
                    : "bg-white hover:bg-white/90 text-black shadow-lg shadow-white/25 hover:shadow-white/35"
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
          { key: "test", label: "Test", icon: FlaskConical },
          { key: "connection", label: "Connection", icon: Link },
          { key: "config", label: "Configuration", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-white text-black shadow-lg shadow-white/25"
                : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "config" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Info Section */}
            <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Info className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                </div>
                <div>
                  <h3 className="font-bold">Business Info</h3>
                  <p className="text-xs text-white/40">Basic information for AI context</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-2">Business Name</label>
                    <input
                      type="text"
                      placeholder="Your Business Name"
                      value={settings.business_name}
                      onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={settings.business_phone}
                      onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-2">Business Hours</label>
                  <input
                    type="text"
                    placeholder="9 AM - 6 PM, Monday - Saturday"
                    value={settings.business_hours}
                    onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* AI Behavior Section */}
            <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                </div>
                <div>
                  <h3 className="font-bold">AI Behavior</h3>
                  <p className="text-xs text-white/40">How the AI responds to customers</p>
                </div>
              </div>
              <div className="p-5 space-y-5">
                {/* Tone Selection */}
                <div>
                  <label className="block text-xs text-white/50 mb-3">Conversation Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {toneOptions.map((tone) => (
                      <button
                        key={tone.value}
                        onClick={() => setSettings({ ...settings, tone: tone.value })}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          settings.tone === tone.value
                            ? "bg-white text-black shadow-lg shadow-white/25"
                            : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
                        }`}
                      >
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Response Settings Grid */}
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-sm text-white/80">Auto-respond</span>
                    <button
                      onClick={() => setSettings({ ...settings, auto_respond: !settings.auto_respond })}
                      className={`relative w-10 h-5 rounded-full transition-all ${
                        settings.auto_respond ? "bg-white" : "bg-white/15"
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        settings.auto_respond ? "translate-x-[22px]" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-sm text-white/80">Response delay</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="300"
                        value={settings.response_delay_seconds}
                        onChange={(e) => setSettings({ ...settings, response_delay_seconds: parseInt(e.target.value) || 0 })}
                        className="w-14 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-sm text-white text-center focus:outline-none focus:border-white/50"
                      />
                      <span className="text-xs text-white/40">sec</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-sm text-white/80">Follow-ups</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSettings({ ...settings, follow_up_enabled: !settings.follow_up_enabled })}
                        className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                          settings.follow_up_enabled
                            ? "bg-white/20 text-white"
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
                            className="w-12 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-sm text-white text-center focus:outline-none focus:border-white/50"
                          />
                          <span className="text-xs text-white/40">hrs</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-sm text-white/80">Deposit</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSettings({ ...settings, require_deposit: !settings.require_deposit })}
                        className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                          settings.require_deposit
                            ? "bg-white/20 text-white"
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
                            className="w-12 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-sm text-white text-center focus:outline-none focus:border-white/50"
                          />
                          <span className="text-xs text-white/40">%</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Section */}
            <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                </div>
                <div>
                  <h3 className="font-bold">Messages & Templates</h3>
                  <p className="text-xs text-white/40">Default responses and info</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-2">Greeting Message</label>
                  <textarea
                    rows={2}
                    placeholder="Hey! Thanks for reaching out about renting an exotic car..."
                    value={settings.greeting_message}
                    onChange={(e) => setSettings({ ...settings, greeting_message: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-2">Booking Process</label>
                  <textarea
                    rows={2}
                    placeholder="To secure your booking, we require a 25% deposit..."
                    value={settings.booking_process}
                    onChange={(e) => setSettings({ ...settings, booking_process: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-2">Pricing Info</label>
                  <textarea
                    rows={2}
                    placeholder="Our rates vary by vehicle and rental duration..."
                    value={settings.pricing_info}
                    onChange={(e) => setSettings({ ...settings, pricing_info: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Advanced - Custom System Prompt */}
            <details className="group rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
              <summary className="px-5 py-4 cursor-pointer flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Code className="w-4 h-4 text-white/60" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white/80">Advanced: Custom System Prompt</h3>
                    <p className="text-xs text-white/40">Override the default AI instructions</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-white/40 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 space-y-4 border-t border-white/[0.06] pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/50">
                    Leave empty to use the default prompt with your settings automatically applied.
                  </p>
                  <button
                    onClick={() => setSettings({ ...settings, custom_system_prompt: "" })}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.05] transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>

                <textarea
                  rows={12}
                  placeholder={DEFAULT_SYSTEM_PROMPT}
                  value={settings.custom_system_prompt}
                  onChange={(e) => setSettings({ ...settings, custom_system_prompt: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white placeholder:text-white/15 focus:outline-none focus:border-white/50 focus:bg-white/[0.03] transition-all font-mono text-sm resize-none"
                />

                <div className="flex items-center justify-between text-xs text-white/30">
                  <span>{settings.custom_system_prompt?.length || 0} characters</span>
                  <span className={settings.custom_system_prompt ? "text-white/60" : ""}>
                    {settings.custom_system_prompt ? "Using custom prompt" : "Using default prompt"}
                  </span>
                </div>

                {/* Available Variables */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-xs text-white/50 mb-3 font-medium">Available Variables</p>
                  <div className="flex flex-wrap gap-2">
                    {["{{business_name}}", "{{business_phone}}", "{{business_hours}}", "{{tone}}", "{{vehicles}}", "{{deposit_percentage}}"].map((v) => (
                      <button
                        key={v}
                        onClick={() => navigator.clipboard.writeText(v)}
                        className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06] font-mono text-xs text-white/60 hover:bg-white/[0.08] hover:text-white transition-colors"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* Right Column - Quick Info */}
          <div className="space-y-6">
            {/* Vehicle Count */}
            <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Car className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{vehicles.length}</p>
                  <p className="text-xs text-white/50">Vehicles in AI context</p>
                </div>
              </div>
              {vehicles.length > 0 && (
                <div className="text-xs text-white/40 space-y-1 max-h-32 overflow-y-auto">
                  {vehicles.slice(0, 5).map((v: any) => (
                    <p key={v.id} className="truncate">{v.year} {v.make} {v.model}</p>
                  ))}
                  {vehicles.length > 5 && (
                    <p className="text-white/30">+{vehicles.length - 5} more</p>
                  )}
                </div>
              )}
            </div>

            {/* Current Status */}
            <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  settings.auto_respond ? "bg-white/20" : "bg-white/10"
                }`}>
                  <Zap className={`w-5 h-5 ${settings.auto_respond ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-white/40"}`} />
                </div>
                <div>
                  <p className="font-medium">{settings.auto_respond ? "AI Active" : "AI Paused"}</p>
                  <p className="text-xs text-white/50">
                    {settings.auto_respond ? "Responding to messages" : "Manual responses only"}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Tone</span>
                  <span className="text-white capitalize">{settings.tone}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Response delay</span>
                  <span className="text-white">{settings.response_delay_seconds}s</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Deposit</span>
                  <span className="text-white">{settings.require_deposit ? `${settings.deposit_percentage}%` : "Off"}</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/20 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                <h3 className="font-bold text-sm">Quick Tips</h3>
              </div>
              <ul className="text-xs text-white/60 space-y-2">
                <li>• Use Test tab to preview AI responses</li>
                <li>• Set delay 15-45s for natural feel</li>
                <li>• Friendly tone works best for most</li>
                <li>• Keep messages concise for SMS</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === "connection" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Instagram Connection Status */}
          <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Instagram className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
              </div>
              <h3 className="font-bold">Instagram DMs</h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl flex items-center gap-3 bg-white/[0.03] border border-white/[0.06]">
                {instagramStatus === "loading" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                    <span className="text-white/50 text-sm">Checking connection...</span>
                  </>
                ) : instagramStatus === "connected" ? (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Connected</p>
                      <p className="text-xs text-white/50">Instagram API configured</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-white/60" />
                    </div>
                    <div>
                      <p className="font-medium text-white/60 text-sm">Not Configured</p>
                      <p className="text-xs text-white/50">Set up Instagram API credentials</p>
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
                      ? "bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                      : "bg-white/15"
                  } disabled:opacity-50`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${
                    settings.instagram_enabled && instagramStatus === "connected"
                      ? "translate-x-[22px] bg-black"
                      : "translate-x-0.5 bg-white"
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
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-all resize-none"
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
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Link className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
              </div>
              <h3 className="font-bold">Instagram Webhook</h3>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-white/50">
                Configure your Meta Developer App to send Instagram DMs to this webhook:
              </p>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-[10px] text-white/40 mb-2 font-medium uppercase tracking-wider">Webhook URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] break-all">
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

              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <p className="text-[10px] text-white/40 mb-1.5 font-medium uppercase tracking-wider">Required Env Variables</p>
                <div className="space-y-1 font-mono text-xs text-white/60">
                  <p>INSTAGRAM_ACCESS_TOKEN</p>
                  <p>INSTAGRAM_ACCOUNT_ID</p>
                  <p>INSTAGRAM_VERIFY_TOKEN</p>
                  <p>INSTAGRAM_APP_SECRET</p>
                </div>
              </div>

              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white font-medium transition-all border border-white/[0.06]"
              >
                Open Meta Developer Console
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Twilio Connection Status */}
          <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
              </div>
              <h3 className="font-bold">Twilio Connection</h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl flex items-center gap-3 bg-white/[0.03] border border-white/[0.06]">
                {twilioStatus === "loading" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                    <span className="text-white/50 text-sm">Checking connection...</span>
                  </>
                ) : twilioStatus === "connected" ? (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Connected</p>
                      <p className="text-xs text-white/50">
                        Account: {twilioInfo?.friendlyName || "Active"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-white/60" />
                    </div>
                    <div>
                      <p className="font-medium text-white/60 text-sm">Connection Error</p>
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
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Link className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
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
                  <code className="flex-1 text-sm font-mono text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] break-all">
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

              <div className="p-4 rounded-xl bg-white/5 border border-white/20">
                <p className="text-sm font-medium text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] mb-2">Setup Instructions</p>
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
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Send className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
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
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/25 focus:outline-none focus:border-white/50 focus:bg-white/[0.05] transition-all"
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
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/25 focus:outline-none focus:border-white/50 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              </div>

              {testResult && (
                <div className={`p-4 rounded-xl flex items-center gap-3 bg-white/[0.03] border ${
                  testResult.success ? "border-white/20" : "border-white/10"
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-white/60 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${testResult.success ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-white/60"}`}>
                    {testResult.message}
                  </span>
                </div>
              )}

              <button
                onClick={sendTestMessage}
                disabled={sendingTest || !testPhone || twilioStatus !== "connected"}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
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


      {activeTab === "test" && (
        <ChatbotTestPanel
          initialSettings={{
            business_name: settings.business_name,
            business_phone: settings.business_phone,
            business_hours: settings.business_hours,
            greeting_message: settings.greeting_message,
            booking_process: settings.booking_process,
            pricing_info: settings.pricing_info,
            tone: settings.tone as "friendly" | "professional" | "luxury" | "energetic",
            require_deposit: settings.require_deposit,
            deposit_percentage: settings.deposit_percentage,
            custom_system_prompt: settings.custom_system_prompt,
            auto_escalate: true,
          }}
          initialVehicles={vehicles.map((v: any) => ({
            id: v.id || v.name,
            name: v.name,
            make: v.make,
            model: v.model,
            year: v.year || 2024,
            daily_rate: v.daily_rate,
            type: v.type || "exotic",
            status: v.status || "available",
          }))}
          initialBookings={bookings.map((b: any) => ({
            id: b.id,
            vehicleId: b.vehicle_id,
            startDate: b.start_date,
            endDate: b.end_date,
            status: b.status,
            customerName: b.customer_name,
          }))}
        />
      )}
    </div>
  )
}
