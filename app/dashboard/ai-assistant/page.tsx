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

    setLoading(false)
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

      {/* Main On/Off Toggle */}
      <div className={`rounded-2xl p-5 flex items-center justify-between ${
        settings.auto_respond
          ? "bg-gradient-to-r from-[#375DEE]/20 via-[#375DEE]/10 to-transparent border border-[#375DEE]/30"
          : "bg-white/[0.03] border border-white/10"
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            settings.auto_respond ? "bg-[#375DEE]/20" : "bg-white/10"
          }`}>
            {settings.auto_respond ? (
              <Zap className="w-6 h-6 text-[#375DEE]" />
            ) : (
              <Bot className="w-6 h-6 text-white/40" />
            )}
          </div>
          <div>
            <p className="font-semibold text-lg">
              {settings.auto_respond ? "AI Agent is ON" : "AI Agent is OFF"}
            </p>
            <p className="text-sm text-white/50">
              {settings.auto_respond
                ? "Automatically responding to incoming SMS messages"
                : "Turn on to enable automatic SMS responses"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setSettings({ ...settings, auto_respond: !settings.auto_respond })
          }}
          className={`relative w-16 h-9 rounded-full transition-colors ${
            settings.auto_respond ? "bg-[#375DEE]" : "bg-white/20"
          }`}
        >
          <div
            className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow-lg transition-all ${
              settings.auto_respond ? "left-8" : "left-1"
            }`}
          />
        </button>
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
        <button
          onClick={() => setActiveTab("connection")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "connection" ? "bg-[#375DEE] text-white" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Link className="w-4 h-4 inline mr-2" />
          Connection
        </button>
        <button
          onClick={() => setActiveTab("advanced")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "advanced" ? "bg-[#375DEE] text-white" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Code className="w-4 h-4 inline mr-2" />
          Advanced
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

      {activeTab === "connection" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Twilio Connection Status */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Phone className="w-5 h-5 text-[#375DEE]" />
              Twilio Connection
            </h2>

            <div className="space-y-4">
              {/* Connection Status */}
              <div className={`p-4 rounded-xl flex items-center gap-3 ${
                twilioStatus === "connected"
                  ? "bg-green-500/10 border border-green-500/30"
                  : twilioStatus === "error"
                  ? "bg-red-500/10 border border-red-500/30"
                  : "bg-white/5 border border-white/10"
              }`}>
                {twilioStatus === "loading" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                    <span className="text-white/50">Checking connection...</span>
                  </>
                ) : twilioStatus === "connected" ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="font-medium text-green-400">Connected</p>
                      <p className="text-sm text-white/50">
                        Account: {twilioInfo?.friendlyName || "Active"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="font-medium text-red-400">Connection Error</p>
                      <p className="text-sm text-white/50">
                        {twilioInfo?.error || "Could not connect to Twilio"}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {twilioStatus === "connected" && twilioInfo?.phoneNumber && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-white/60 mb-1">Twilio Phone Number</p>
                  <p className="font-mono text-lg">{twilioInfo.phoneNumber}</p>
                </div>
              )}

              <button
                onClick={checkTwilioConnection}
                disabled={twilioStatus === "loading"}
                className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors disabled:opacity-50"
              >
                {twilioStatus === "loading" ? "Checking..." : "Refresh Connection"}
              </button>
            </div>
          </div>

          {/* Webhook Setup */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Link className="w-5 h-5 text-[#375DEE]" />
              Webhook Setup
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-white/60">
                Configure your Twilio phone number to send incoming SMS to this webhook URL:
              </p>

              <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                <p className="text-xs text-white/50 mb-2">Webhook URL (SMS)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-[#375DEE] break-all">
                    https://your-domain.com/api/sms/webhook
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/sms/webhook`)
                    }}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#375DEE]/10 border border-[#375DEE]/30">
                <p className="text-sm font-medium text-[#375DEE] mb-2">Setup Instructions:</p>
                <ol className="text-sm text-white/70 space-y-2 list-decimal list-inside">
                  <li>Go to your Twilio Console</li>
                  <li>Navigate to Phone Numbers → Manage → Active Numbers</li>
                  <li>Click on your phone number</li>
                  <li>Under "Messaging", set "A message comes in" webhook to the URL above</li>
                  <li>Set the HTTP method to POST</li>
                  <li>Save your changes</li>
                </ol>
              </div>

              <a
                href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
              >
                Open Twilio Console
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Send Test Message */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Send className="w-5 h-5 text-[#375DEE]" />
              Send Test Message
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-white/60">
                Send a test SMS to verify your Twilio configuration is working correctly.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1234567890"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                  <p className="text-xs text-white/40 mt-1">Include country code (e.g., +1 for US)</p>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Test Message</label>
                  <input
                    type="text"
                    placeholder="Test message..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
              </div>

              {testResult && (
                <div className={`p-4 rounded-xl ${
                  testResult.success
                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 inline mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 inline mr-2" />
                  )}
                  {testResult.message}
                </div>
              )}

              <button
                onClick={sendTestMessage}
                disabled={sendingTest || !testPhone || twilioStatus !== "connected"}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
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
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <Code className="w-5 h-5 text-[#375DEE]" />
                Custom System Prompt
              </h2>
              <button
                onClick={() => setSettings({ ...settings, custom_system_prompt: "" })}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Default
              </button>
            </div>

            <p className="text-sm text-white/60 mb-4">
              Customize the full system prompt used by the AI assistant. Leave empty to use the default prompt with your settings automatically applied.
            </p>

            <textarea
              rows={20}
              placeholder={DEFAULT_SYSTEM_PROMPT}
              value={settings.custom_system_prompt}
              onChange={(e) => setSettings({ ...settings, custom_system_prompt: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-[#375DEE] transition-colors font-mono text-sm resize-none"
              style={{ minHeight: "400px" }}
            />

            <div className="mt-2 flex items-center justify-between text-xs text-white/40">
              <span>{settings.custom_system_prompt?.length || 0} characters</span>
              <span>{settings.custom_system_prompt ? "Using custom prompt" : "Using default prompt"}</span>
            </div>
          </div>

          {/* Available Variables */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <FileText className="w-5 h-5 text-[#375DEE]" />
              Available Variables
            </h2>

            <p className="text-sm text-white/60 mb-4">
              Use these placeholders in your system prompt. They will be automatically replaced with your configured values.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { variable: "{{business_name}}", description: "Your business name", value: settings.business_name || "(not set)" },
                { variable: "{{business_phone}}", description: "Your business phone", value: settings.business_phone || "(not set)" },
                { variable: "{{business_hours}}", description: "Your business hours", value: settings.business_hours || "(not set)" },
                { variable: "{{tone}}", description: "Conversation tone setting", value: settings.tone },
                { variable: "{{greeting_message}}", description: "Initial greeting message", value: settings.greeting_message?.substring(0, 50) + "..." || "(not set)" },
                { variable: "{{booking_process}}", description: "Booking process info", value: settings.booking_process?.substring(0, 50) + "..." || "(not set)" },
                { variable: "{{pricing_info}}", description: "Pricing information", value: settings.pricing_info?.substring(0, 50) + "..." || "(not set)" },
                { variable: "{{vehicles}}", description: "List of available vehicles", value: vehicles.length > 0 ? `${vehicles.length} vehicles` : "(none)" },
                { variable: "{{deposit_percentage}}", description: "Deposit percentage", value: `${settings.deposit_percentage}%` },
              ].map((item) => (
                <div key={item.variable} className="p-3 rounded-xl bg-black/30 border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-sm font-mono text-[#375DEE]">{item.variable}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(item.variable)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                      title="Copy variable"
                    >
                      <Copy className="w-3 h-3 text-white/40" />
                    </button>
                  </div>
                  <p className="text-xs text-white/50">{item.description}</p>
                  <p className="text-xs text-white/30 mt-1 truncate">Current: {item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Default Prompt Reference */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Info className="w-5 h-5 text-[#375DEE]" />
              Default System Prompt Reference
            </h2>

            <p className="text-sm text-white/60 mb-4">
              This is the default system prompt used when no custom prompt is set. Copy it as a starting point for customization.
            </p>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-black/30 border border-white/10 text-sm font-mono text-white/70 whitespace-pre-wrap overflow-x-auto">
                {DEFAULT_SYSTEM_PROMPT}
              </pre>
              <button
                onClick={() => {
                  setSettings({ ...settings, custom_system_prompt: DEFAULT_SYSTEM_PROMPT })
                }}
                className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#375DEE]/20 hover:bg-[#375DEE]/30 text-[#375DEE] text-sm font-medium transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy to Editor
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[#375DEE]/10 rounded-2xl border border-[#375DEE]/30 p-6">
            <h3 className="font-semibold mb-3 text-[#375DEE]">Tips for Customizing</h3>
            <ul className="text-sm text-white/70 space-y-2">
              <li>• Keep instructions clear and specific for best results</li>
              <li>• Remember that SMS has a 160 character limit per segment, so instruct the AI to keep responses brief</li>
              <li>• Include examples of ideal responses if you want specific formatting</li>
              <li>• Test your custom prompt by sending test messages from the Connection tab</li>
              <li>• You can add specific rules like "never mention competitor names" or "always ask for the customer's preferred vehicle"</li>
              <li>• Variables are replaced at runtime, so you can reference them anywhere in your prompt</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
