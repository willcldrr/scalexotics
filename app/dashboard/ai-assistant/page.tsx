"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Bot,
  Save,
  CheckCircle,
  Loader2,
  Sparkles,
  CreditCard,
  Check,
  Eye,
  EyeOff,
  Car,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Copy,
  FlaskConical,
  Power,
} from "lucide-react"
import Link from "next/link"
import PageTransition from "@/app/components/page-transition"

interface AISettings {
  id?: string
  business_name: string
  business_phone: string
  business_hours: string
  booking_process: string
  pricing_info: string
  tone: string
  auto_respond: boolean
  require_deposit: boolean
  deposit_percentage: number
  custom_system_prompt: string
  instagram_enabled: boolean
  auto_escalate: boolean
  [key: string]: any
}

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  year: number
  daily_rate: number
  type: string
  status: string
}

interface DaySchedule {
  enabled: boolean
  start: string
  end: string
}

type WeekSchedule = Record<string, DaySchedule>

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const defaultWeekSchedule: WeekSchedule = {
  Monday: { enabled: true, start: "09:00", end: "18:00" },
  Tuesday: { enabled: true, start: "09:00", end: "18:00" },
  Wednesday: { enabled: true, start: "09:00", end: "18:00" },
  Thursday: { enabled: true, start: "09:00", end: "18:00" },
  Friday: { enabled: true, start: "09:00", end: "18:00" },
  Saturday: { enabled: true, start: "10:00", end: "16:00" },
  Sunday: { enabled: false, start: "10:00", end: "16:00" },
}

function parseBusinessHours(hoursStr: string): WeekSchedule {
  if (!hoursStr) return { ...defaultWeekSchedule }
  try {
    const parsed = JSON.parse(hoursStr)
    if (typeof parsed === "object" && parsed.Monday !== undefined) return parsed
  } catch {
    // Not JSON, return default
  }
  return { ...defaultWeekSchedule }
}

function formatScheduleForDisplay(schedule: WeekSchedule): string {
  const enabled = DAYS.filter(d => schedule[d]?.enabled)
  if (enabled.length === 0) return "Closed"
  const allSameTime = enabled.every(d => schedule[d].start === schedule[enabled[0]].start && schedule[d].end === schedule[enabled[0]].end)
  if (allSameTime && enabled.length > 0) {
    const s = schedule[enabled[0]]
    const timeStr = `${formatTime(s.start)} - ${formatTime(s.end)}`
    if (enabled.length === 7) return `${timeStr}, 7 days a week`
    if (enabled.length === 1) return `${timeStr}, ${enabled[0]}`
    return `${timeStr}, ${enabled[0]} - ${enabled[enabled.length - 1]}`
  }
  return enabled.map(d => `${d.slice(0, 3)}: ${formatTime(schedule[d].start)}-${formatTime(schedule[d].end)}`).join(", ")
}

function formatTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`
}

const toneOptions = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "luxury", label: "Luxury" },
  { value: "energetic", label: "Enthusiast" },
]

const defaultSettings: AISettings = {
  business_name: "",
  business_phone: "",
  business_hours: JSON.stringify(defaultWeekSchedule),
  booking_process: "",
  pricing_info: "",
  tone: "friendly",
  auto_respond: true,
  require_deposit: true,
  deposit_percentage: 25,
  custom_system_prompt: "",
  instagram_enabled: false,
  auto_escalate: true,
}

export default function AIAssistantPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<AISettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [businessHours, setBusinessHours] = useState<WeekSchedule>(defaultWeekSchedule)

  // Stripe state
  const [stripePublishable, setStripePublishable] = useState("")
  const [stripeSecret, setStripeSecret] = useState("")
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [savingStripe, setSavingStripe] = useState(false)
  const [stripeSaved, setStripeSaved] = useState(false)
  const [companySlug, setCompanySlug] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    setUserId(user.id)

    const [settingsRes, vehiclesRes, stripeRes] = await Promise.all([
      supabase.from("ai_settings").select("*").eq("user_id", user.id).single(),
      supabase.from("vehicles").select("id, name, make, model, year, daily_rate, type, status").eq("user_id", user.id).neq("status", "inactive"),
      supabase.from("deposit_portal_config").select("stripe_publishable_key, stripe_secret_key, company_slug").eq("user_id", user.id).single(),
    ])

    if (settingsRes.data) {
      setSettings(settingsRes.data)
      setBusinessHours(parseBusinessHours(settingsRes.data.business_hours))
    }
    setVehicles(vehiclesRes.data || [])
    if (stripeRes.data) {
      setStripePublishable(stripeRes.data.stripe_publishable_key || "")
      setStripeSecret(stripeRes.data.stripe_secret_key || "")
      setCompanySlug(stripeRes.data.company_slug || "")
    }

    setLoading(false)
  }

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    setSaved(false)

    const hoursJson = JSON.stringify(businessHours)
    const hoursDisplay = formatScheduleForDisplay(businessHours)

    const payload = {
      user_id: userId,
      ...settings,
      business_hours: hoursJson,
      business_hours_display: hoursDisplay,
    }
    delete payload.id

    if (settings.id) {
      await supabase.from("ai_settings").update(payload).eq("id", settings.id)
    } else {
      const { data } = await supabase.from("ai_settings").insert(payload).select().single()
      if (data) setSettings(data)
    }

    setSettings(prev => ({ ...prev, business_hours: hoursJson }))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const saveStripeKeys = async () => {
    if (!stripePublishable || !stripeSecret || !userId) return
    setSavingStripe(true)
    const { data: existing } = await supabase.from("deposit_portal_config").select("id").eq("user_id", userId).single()
    if (existing) {
      await supabase.from("deposit_portal_config").update({ stripe_publishable_key: stripePublishable, stripe_secret_key: stripeSecret }).eq("user_id", userId)
    } else {
      await supabase.from("deposit_portal_config").insert({ user_id: userId, stripe_publishable_key: stripePublishable, stripe_secret_key: stripeSecret })
    }
    setSavingStripe(false)
    setStripeSaved(true)
    setTimeout(() => setStripeSaved(false), 2000)
  }

  const updateDaySchedule = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  return (
    <PageTransition loading={loading}>
    <div className="space-y-6">
      {/* Header with AI Toggle */}
      <div className="relative overflow-hidden rounded-2xl bg-black border border-white/[0.1] shadow-[0_4px_30px_rgba(0,0,0,0.4),0_0_25px_rgba(255,255,255,0.04)]">
        <div className={`absolute inset-0 transition-opacity duration-700 ${settings.auto_respond ? "opacity-100" : "opacity-0"}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-emerald-500/[0.04]" />
        </div>
        <div className="relative p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${settings.auto_respond ? "bg-white shadow-[0_0_30px_rgba(255,255,255,0.4)]" : "bg-white/10"}`}>
              <Bot className={`w-7 h-7 transition-colors duration-300 ${settings.auto_respond ? "text-black" : "text-white/40"}`} />
              {settings.auto_respond && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">AI Agent</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 ${settings.auto_respond ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-white/10 text-white/40 border border-white/10"}`}>
                  {settings.auto_respond ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-white/50 mt-0.5">
                {settings.auto_respond ? "Responding to Instagram DMs" : "Enable to start auto-responding"} <span className="px-2 py-0.5 bg-white/[0.06] text-white/30 text-[10px] rounded-full font-medium uppercase tracking-wider">SMS Coming Soon</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Redesigned AI On/Off Toggle */}
            <button
              onClick={() => setSettings({ ...settings, auto_respond: !settings.auto_respond })}
              className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full font-semibold text-sm transition-all duration-500 ${
                settings.auto_respond
                  ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4),0_0_60px_rgba(16,185,129,0.15)]"
                  : "bg-white/[0.08] text-white/50 hover:bg-white/[0.12] hover:text-white/70"
              }`}
            >
              <Power className={`w-4 h-4 transition-all duration-300 ${settings.auto_respond ? "drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]" : ""}`} />
              <span>{settings.auto_respond ? "ON" : "OFF"}</span>
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${settings.auto_respond ? "bg-white animate-pulse" : "bg-white/30"}`} />
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${saved ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-white hover:bg-white/90 text-black shadow-[0_0_20px_rgba(255,255,255,0.25)]"} disabled:opacity-50`}
            >
              {saved ? <><CheckCircle className="w-4 h-4" /><span className="hidden sm:inline">Saved</span></> : saving ? <><Loader2 className="w-4 h-4 animate-spin" /><span className="hidden sm:inline">Saving</span></> : <><Save className="w-4 h-4" /><span className="hidden sm:inline">Save</span></>}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl w-fit">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-white text-black font-medium">
          <Bot className="w-4 h-4" />
          Configuration
        </div>
        <Link
          href="/dashboard/ai-assistant/test"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.05] transition-all"
        >
          <FlaskConical className="w-4 h-4" />
          Test Chat
        </Link>
      </div>

      {/* No Vehicles Blocker */}
      {vehicles.length === 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-amber-400">No vehicles in your fleet</h3>
              <p className="text-sm text-white/50 mt-1">
                The AI assistant needs vehicles to reference when talking to customers. Add at least one vehicle with a daily rate to get started.
              </p>
              <Link
                href="/dashboard/vehicles"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-all"
              >
                <Car className="w-4 h-4" />
                Add Vehicles
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Business Info */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-5">
          <h3 className="text-sm font-semibold mb-4">Business Info</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Business Name</label>
              <input type="text" placeholder="Your Business Name" value={settings.business_name} onChange={(e) => setSettings({ ...settings, business_name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Phone <span className="text-white/30 text-[10px]">(SMS coming soon)</span></label>
              <input type="tel" placeholder="+1 (555) 123-4567" value={settings.business_phone} onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all" />
            </div>
          </div>
        </div>

        {/* Booking & Pricing */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-5">
          <h3 className="text-sm font-semibold mb-4">Booking & Pricing</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Booking Process</label>
              <textarea rows={2} placeholder="Describe your booking process..." value={settings.booking_process} onChange={(e) => setSettings({ ...settings, booking_process: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                <span className="text-sm">Require Deposit</span>
                <button onClick={() => setSettings({ ...settings, require_deposit: !settings.require_deposit })} className={`w-10 h-5 rounded-full transition-all relative ${settings.require_deposit ? "bg-white" : "bg-white/20"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-transform ${settings.require_deposit ? "translate-x-[22px] bg-black" : "translate-x-0.5 bg-white"}`} />
                </button>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03]">
                <span className="text-sm">Deposit %</span>
                <input type="number" min="1" max="100" value={settings.deposit_percentage} onChange={(e) => setSettings({ ...settings, deposit_percentage: parseInt(e.target.value) || 25 })} className="w-16 ml-auto px-2 py-1 bg-white/[0.05] border border-white/[0.08] rounded text-sm text-center focus:outline-none focus:border-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Business Hours</h3>
          <div className="space-y-2">
            {DAYS.map(day => (
              <div key={day} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${businessHours[day]?.enabled ? "bg-white/[0.03]" : "bg-white/[0.01]"}`}>
                {/* Day toggle */}
                <button
                  onClick={() => updateDaySchedule(day, "enabled", !businessHours[day]?.enabled)}
                  className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${businessHours[day]?.enabled ? "bg-white" : "bg-white/20"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-transform ${businessHours[day]?.enabled ? "translate-x-[18px] bg-black" : "translate-x-0.5 bg-white"}`} />
                </button>

                {/* Day name */}
                <span className={`text-sm w-24 flex-shrink-0 ${businessHours[day]?.enabled ? "text-white" : "text-white/30"}`}>
                  {day}
                </span>

                {businessHours[day]?.enabled ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={businessHours[day]?.start || "09:00"}
                      onChange={(e) => updateDaySchedule(day, "start", e.target.value)}
                      className="px-2 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-xs focus:outline-none focus:border-white/20 transition-all [color-scheme:dark]"
                    />
                    <span className="text-white/30 text-xs">to</span>
                    <input
                      type="time"
                      value={businessHours[day]?.end || "18:00"}
                      onChange={(e) => updateDaySchedule(day, "end", e.target.value)}
                      className="px-2 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-xs focus:outline-none focus:border-white/20 transition-all [color-scheme:dark]"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-white/20">Closed</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tone / Personality */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-white/50" />
            <h3 className="text-sm font-semibold">Personality</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {toneOptions.map((tone) => (
              <button key={tone.value} onClick={() => setSettings({ ...settings, tone: tone.value })} className={`px-3 py-2 rounded-lg text-sm transition-all ${settings.tone === tone.value ? "bg-white text-black font-medium" : "bg-white/[0.05] text-white/60 hover:text-white"}`}>
                {tone.label}
              </button>
            ))}
          </div>

          {/* Tone Preview */}
          <div className="mt-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Preview</p>
            <div className="space-y-2">
              <div className="flex justify-end">
                <div className="bg-white/10 text-white/60 rounded-lg px-3 py-2 text-xs max-w-[80%]">
                  Hey, do you have any Lamborghinis available this weekend?
                </div>
              </div>
              <div className="flex justify-start">
                <p
                  key={settings.tone}
                  className="text-white/70 text-sm max-w-[85%] animate-[fadeIn_300ms_ease-in-out]"
                >
                  {({
                    friendly: "Absolutely! We've got a 2024 Huracan EVO ready to go this weekend at $1,500/day. Want me to check the exact dates for you?",
                    professional: "Yes, we have a 2024 Lamborghini Huracan EVO available this weekend. The daily rate is $1,500. Would you like to proceed with a reservation?",
                    luxury: "Indeed. Our 2024 Lamborghini Huracan EVO is available for your weekend. At $1,500 per day, it offers an exceptional driving experience. Shall I arrange the details?",
                    energetic: "You bet! The 2024 Huracan EVO is free this weekend and it is an incredible machine. $1,500/day and worth every penny. Ready to lock it in?",
                  } as Record<string, string>)[settings.tone] || "Absolutely! We've got a 2024 Huracan EVO ready to go this weekend at $1,500/day. Want me to check the exact dates for you?"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Channels & Behavior */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-5">
          <h3 className="text-sm font-semibold mb-4">Channels & Behavior</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
              <div>
                <span className="text-sm">Instagram DMs</span>
                <p className="text-xs text-white/40 mt-0.5">AI responds to Instagram direct messages</p>
              </div>
              <button onClick={() => setSettings({ ...settings, instagram_enabled: !settings.instagram_enabled })} className={`w-10 h-5 rounded-full transition-all relative ${settings.instagram_enabled ? "bg-white" : "bg-white/20"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-transform ${settings.instagram_enabled ? "translate-x-[22px] bg-black" : "translate-x-0.5 bg-white"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
              <div>
                <span className="text-sm">Auto-Escalation</span>
                <p className="text-xs text-white/40 mt-0.5">Automatically use a smarter model for complex conversations</p>
              </div>
              <button onClick={() => setSettings({ ...settings, auto_escalate: !settings.auto_escalate })} className={`w-10 h-5 rounded-full transition-all relative ${settings.auto_escalate ? "bg-white" : "bg-white/20"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-transform ${settings.auto_escalate ? "translate-x-[22px] bg-black" : "translate-x-0.5 bg-white"}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Stripe */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className={`w-4 h-4 ${stripePublishable && stripeSecret ? "text-emerald-400" : "text-white/50"}`} />
            <h3 className="text-sm font-semibold">Payment Keys</h3>
            {stripePublishable && stripeSecret && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
          </div>
          <div className="space-y-2">
            <input type="text" value={stripePublishable} onChange={(e) => setStripePublishable(e.target.value)} placeholder="pk_live_..." className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-xs font-mono placeholder:text-white/30 focus:outline-none focus:border-white/20" />
            <div className="relative">
              <input type={showSecretKey ? "text" : "password"} value={stripeSecret} onChange={(e) => setStripeSecret(e.target.value)} placeholder="sk_live_..." className="w-full px-3 py-2 pr-8 bg-white/[0.05] border border-white/[0.08] rounded-lg text-xs font-mono placeholder:text-white/30 focus:outline-none focus:border-white/20" />
              <button onClick={() => setShowSecretKey(!showSecretKey)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button onClick={saveStripeKeys} disabled={!stripePublishable || !stripeSecret || savingStripe} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/[0.08] hover:bg-white/[0.12] disabled:opacity-50 rounded-lg text-xs transition-colors">
              {savingStripe ? <Loader2 className="w-3 h-3 animate-spin" /> : stripeSaved ? <><Check className="w-3 h-3 text-emerald-400" /> Saved</> : <><Save className="w-3 h-3" /> Save Keys</>}
            </button>
          </div>
        </div>

        {/* Fleet Overview */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-4 h-4 text-white/50" />
            <h3 className="text-sm font-semibold">Fleet</h3>
            <span className="text-xs text-white/40 ml-auto">{vehicles.length} vehicles</span>
          </div>
          {vehicles.length === 0 ? (
            <p className="text-sm text-white/40">No vehicles added yet. Add vehicles in the Vehicles tab for the AI to reference.</p>
          ) : (
            <div className="space-y-1.5">
              {vehicles.slice(0, 6).map(v => (
                <div key={v.id} className="flex justify-between text-xs text-white/50">
                  <span className="truncate">{v.year} {v.make} {v.model}</span>
                  <span className="flex-shrink-0 ml-2">${v.daily_rate}/day</span>
                </div>
              ))}
              {vehicles.length > 6 && <p className="text-xs text-white/30">+{vehicles.length - 6} more</p>}
            </div>
          )}

          {/* Gallery Link */}
          {companySlug && vehicles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                <span className="text-xs font-medium text-white/60">Public Gallery</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 text-[11px] text-white/50 bg-white/[0.04] rounded-lg px-3 py-2 truncate border border-white/[0.06]">
                  {typeof window !== "undefined" ? window.location.origin : ""}/gallery/{companySlug}
                </code>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/gallery/${companySlug}`
                    navigator.clipboard.writeText(url)
                  }}
                  className="flex-shrink-0 p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
                  title="Copy gallery link"
                >
                  <Copy className="w-3.5 h-3.5 text-white/50" />
                </button>
                <a
                  href={`/gallery/${companySlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
                  title="Open gallery"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-white/50" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Custom Prompt (collapsed by default) */}
        <details className="rounded-xl bg-white/[0.03] border border-white/[0.08] lg:col-span-2">
          <summary className="p-5 cursor-pointer text-sm font-semibold select-none">Advanced: Custom System Prompt</summary>
          <div className="px-5 pb-5">
            <p className="text-xs text-white/40 mb-2">Override the entire AI prompt. Leave empty to use the auto-generated prompt based on your settings above.</p>
            <textarea rows={6} placeholder="Leave empty to use auto-generated prompt..." value={settings.custom_system_prompt} onChange={(e) => setSettings({ ...settings, custom_system_prompt: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm font-mono placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all resize-none" />
            {settings.custom_system_prompt && (
              <button onClick={() => setSettings({ ...settings, custom_system_prompt: "" })} className="mt-2 text-xs text-red-400 hover:text-red-300">Clear custom prompt</button>
            )}
          </div>
        </details>
      </div>
    </div>
    </PageTransition>
  )
}
