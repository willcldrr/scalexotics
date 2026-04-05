"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Bot,
  Save,
  CheckCircle,
  Loader2,
  Send,
  RotateCcw,
  Sparkles,
  ChevronDown,
  User,
  CreditCard,
  Check,
  Eye,
  EyeOff,
  Car,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Copy,
} from "lucide-react"
import Link from "next/link"
import PageTransition from "@/app/components/page-transition"

type ModelId = "claude-haiku-4-5-20251001" | "claude-sonnet-4-6" | "claude-opus-4-6"

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

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  model?: string
  cost?: { totalCost: number }
}

interface LeadData {
  collected_vehicle_id: string | null
  collected_start_date: string | null
  collected_end_date: string | null
  ready_for_payment: boolean
}

const MODELS: Record<ModelId, { name: string; short: string }> = {
  "claude-haiku-4-5-20251001": { name: "Claude Haiku 4.5", short: "Haiku" },
  "claude-sonnet-4-6": { name: "Claude Sonnet 4.6", short: "Sonnet" },
  "claude-opus-4-6": { name: "Claude Opus 4.6", short: "Opus" },
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
  business_hours: "9 AM - 6 PM, Monday - Saturday",
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
  const [bookings, setBookings] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelId>("claude-haiku-4-5-20251001")
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [totalCost, setTotalCost] = useState(0)
  const [leadData, setLeadData] = useState<LeadData>({
    collected_vehicle_id: null,
    collected_start_date: null,
    collected_end_date: null,
    ready_for_payment: false,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessageCount = useRef(0)

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

  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    prevMessageCount.current = messages.length
  }, [messages.length])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    setUserId(user.id)

    const [settingsRes, vehiclesRes, bookingsRes, stripeRes] = await Promise.all([
      supabase.from("ai_settings").select("*").eq("user_id", user.id).single(),
      supabase.from("vehicles").select("id, name, make, model, year, daily_rate, type, status").eq("user_id", user.id).neq("status", "inactive"),
      supabase.from("bookings").select("id, vehicle_id, start_date, end_date, status").eq("user_id", user.id).in("status", ["confirmed", "pending", "active"]).gte("end_date", new Date().toISOString().split("T")[0]),
      supabase.from("deposit_portal_config").select("stripe_publishable_key, stripe_secret_key, company_slug").eq("user_id", user.id).single(),
    ])

    if (settingsRes.data) {
      setSettings(settingsRes.data)
      if (settingsRes.data.preferred_model) setSelectedModel(settingsRes.data.preferred_model)
    }
    setVehicles(vehiclesRes.data || [])
    setBookings(bookingsRes.data || [])
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

    const payload = { user_id: userId, ...settings, preferred_model: selectedModel }
    delete payload.id

    if (settings.id) {
      await supabase.from("ai_settings").update(payload).eq("id", settings.id)
    } else {
      const { data } = await supabase.from("ai_settings").insert(payload).select().single()
      if (data) setSettings(data)
    }

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

  // --- Chat Functions ---

  const buildSystemPrompt = () => {
    const personality = toneOptions.find(t => t.value === settings.tone)?.label || "Friendly"
    const vehicleInfo = vehicles.map(v => `- ${v.year} ${v.make} ${v.model} (ID: ${v.id}) - $${v.daily_rate}/day - ${v.status}`).join("\n")
    const now = new Date()
    const todayFormatted = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

    if (settings.custom_system_prompt) return settings.custom_system_prompt

    return `You are an AI assistant for ${settings.business_name || "an exotic car rental business"}. You help customers book exotic car rentals via Instagram DMs.

PERSONALITY: ${personality}

CURRENT DATE: ${todayFormatted}

BUSINESS INFO:
- Hours: ${settings.business_hours}
- Phone: ${settings.business_phone}
- Deposit: ${settings.require_deposit ? `${settings.deposit_percentage}%` : "Not required"}
${settings.booking_process ? `\nBOOKING PROCESS:\n${settings.booking_process}` : ""}
${settings.pricing_info ? `\nPRICING INFO:\n${settings.pricing_info}` : ""}

AVAILABLE VEHICLES (for your reference - DO NOT list these unless customer asks):
${vehicleInfo || "No vehicles configured yet."}

YOUR GOALS:
1. Ask which car caught their eye (don't list vehicles unless they ask)
2. Collect rental dates (start and end)
3. When you have both, summarize the booking (vehicle, dates, total cost, deposit amount) and ask for confirmation
4. When they confirm (yes, yeah, looks good, let's do it, book it, etc.) — IMMEDIATELY include [SEND_PAYMENT_LINK] in your response. Do NOT re-summarize or re-ask.

WAITLIST FLOW (when a customer wants a vehicle that's NOT in the available list):
- If they ask for a specific car that isn't listed above, let them know it's not currently available
- Offer to add them to the waitlist so the business can notify them when it becomes available
- Ask for their preferred dates so the business knows when they're looking
- If they agree to the waitlist, include "waitlist_vehicle" in the [EXTRACTED] block with the vehicle name they wanted
- Keep it brief and helpful — don't oversell the available vehicles if they're not interested
- Example: "The Huracan isn't available right now, but I can put you on the waitlist and we'll reach out as soon as it is. What dates were you looking at?"

CRITICAL PAYMENT LINK RULES:
- When the customer says YES/confirms after seeing a summary, your VERY NEXT response MUST include [SEND_PAYMENT_LINK]
- Do NOT summarize again. Do NOT ask "does this look good?" again. Just send the link.
- The system replaces [SEND_PAYMENT_LINK] with the actual payment URL
- Keep the message short when sending the link, for example:
  "Here's your secure link to lock in the ${settings.deposit_percentage}% deposit: [SEND_PAYMENT_LINK]"

GUIDELINES:
- Keep responses concise and conversational
- Ask ONE question at a time
- Be helpful and match the ${personality.toLowerCase()} tone
- Never make up prices - use rates above
- Do NOT use emojis in your responses
- Do NOT list all vehicles upfront - only if customer specifically asks
- LANGUAGE: Always respond in the same language the customer uses. If they write in Spanish, respond in Spanish. If they write in French, respond in French. Default to English if unclear.

DATE CALCULATION (IMPORTANT):
- Rental days = end date minus start date
- Example: March 24 to March 31 = 7 days (31 - 24 = 7)
- Total cost = daily rate x number of days
- ALWAYS double-check your math before confirming

DATA EXTRACTION:
After your message, include: [EXTRACTED]{"vehicle_id":"ID or null","start_date":"YYYY-MM-DD or null","end_date":"YYYY-MM-DD or null","confirmed":true/false,"waitlist_vehicle":"vehicle name or null","language":"detected language code (en, es, fr, etc.)"}[/EXTRACTED]

IMPORTANT for "confirmed" field:
- Set confirmed to TRUE when the customer agrees to a booking summary (they say yes, yeah, looks good, let's do it, confirm, book it, sounds good, etc.)
- If confirmed is true, you MUST also include [SEND_PAYMENT_LINK] in your message text
- Do NOT set confirmed to true if the customer is still asking questions or hasn't seen a summary yet

IMPORTANT for "waitlist_vehicle" field:
- Set this to the vehicle name the customer wanted when it's NOT in the available list (e.g., "Lamborghini Huracan")
- Only set this when the customer has expressed interest in an unavailable vehicle
- Set to null for all other messages`
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    const userMsg: ChatMessage = { role: "user", content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chatbot-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          systemPrompt: buildSystemPrompt(),
          settings,
          model: selectedModel,
          forceModel: false,
          autoEscalate: true,
          vehicles,
          leadData,
          userId,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to get response")

      if (data.extractedData) {
        setLeadData(prev => ({
          ...prev,
          collected_vehicle_id: data.extractedData.vehicleId || prev.collected_vehicle_id,
          collected_start_date: data.extractedData.startDate || prev.collected_start_date,
          collected_end_date: data.extractedData.endDate || prev.collected_end_date,
          ready_for_payment: data.extractedData.confirmed || prev.ready_for_payment,
        }))
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.response, model: data.model, cost: data.cost }])
      if (data.cost?.totalCost) setTotalCost(prev => prev + data.cost.totalCost)
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}` }])
    }

    setIsLoading(false)
  }

  const resetChat = () => {
    setMessages([])
    setTotalCost(0)
    setLeadData({ collected_vehicle_id: null, collected_start_date: null, collected_end_date: null, ready_for_payment: false })
    inputRef.current?.focus()
  }

  const collectedCount = [leadData.collected_vehicle_id, leadData.collected_start_date, leadData.collected_end_date].filter(Boolean).length

  return (
    <PageTransition loading={loading}>
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-black border border-white/[0.1] shadow-[0_4px_30px_rgba(0,0,0,0.4),0_0_25px_rgba(255,255,255,0.04)]">
        <div className={`absolute inset-0 transition-opacity duration-500 ${settings.auto_respond ? "opacity-100" : "opacity-0"}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
        </div>
        <div className="relative p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${settings.auto_respond ? "bg-white shadow-[0_0_25px_rgba(255,255,255,0.35)]" : "bg-white/10"}`}>
              <Bot className={`w-7 h-7 ${settings.auto_respond ? "text-black" : "text-white/40"}`} />
              {settings.auto_respond && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">AI Agent</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${settings.auto_respond ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-white/10 text-white/40 border border-white/10"}`}>
                  {settings.auto_respond ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-white/50 mt-0.5">
                {settings.auto_respond ? "Responding to Instagram DMs" : "Enable to start auto-responding"} <span className="px-2 py-0.5 bg-white/[0.06] text-white/30 text-[10px] rounded-full font-medium uppercase tracking-wider">SMS Coming Soon</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSettings({ ...settings, auto_respond: !settings.auto_respond })}
              className={`relative w-16 h-9 rounded-full transition-all duration-300 ${settings.auto_respond ? "bg-white shadow-lg shadow-white/25" : "bg-white/10 hover:bg-white/15"}`}
            >
              <div className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow-lg transition-all duration-300 ${settings.auto_respond ? "left-8" : "left-1"}`} />
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

      {/* Two Column Layout: Config + Test */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: Configuration */}
        <div className="space-y-5">
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
              <div className="sm:col-span-2">
                <label className="block text-xs text-white/50 mb-1.5">Business Hours</label>
                <input type="text" placeholder="9 AM - 6 PM, Monday - Saturday" value={settings.business_hours} onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all" />
              </div>
            </div>
          </div>

          {/* Booking & Pricing */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-5">
            <h3 className="text-sm font-semibold mb-4">Booking & Pricing</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Booking Process</label>
                <textarea rows={2} placeholder="Describe your booking process (e.g., deposit required, ID verification, etc.)" value={settings.booking_process} onChange={(e) => setSettings({ ...settings, booking_process: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all resize-none" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Pricing Info</label>
                <textarea rows={2} placeholder="Additional pricing details (e.g., multi-day discounts, mileage limits, etc.)" value={settings.pricing_info} onChange={(e) => setSettings({ ...settings, pricing_info: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all resize-none" />
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

          {/* Tone */}
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
          <details className="rounded-xl bg-white/[0.03] border border-white/[0.08]">
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

        {/* Right Column: Live Test Chat */}
        <div className="space-y-4">
          {/* Booking Progress */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Booking Progress</span>
              <span className="text-xs text-white/40">{collectedCount}/3</span>
            </div>
            <div className="flex gap-1 mb-3">
              <div className={`h-1 flex-1 rounded-full ${leadData.collected_vehicle_id ? "bg-white" : "bg-white/10"}`} />
              <div className={`h-1 flex-1 rounded-full ${leadData.collected_start_date ? "bg-white" : "bg-white/10"}`} />
              <div className={`h-1 flex-1 rounded-full ${leadData.collected_end_date ? "bg-white" : "bg-white/10"}`} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <div><span className="text-white/40">Vehicle: </span><span className={leadData.collected_vehicle_id ? "text-white" : "text-white/30"}>{leadData.collected_vehicle_id ? vehicles.find(v => v.id === leadData.collected_vehicle_id)?.name?.split(" ")[0] || "Selected" : "---"}</span></div>
              <div><span className="text-white/40">Start: </span><span className={leadData.collected_start_date ? "text-white" : "text-white/30"}>{leadData.collected_start_date || "---"}</span></div>
              <div><span className="text-white/40">End: </span><span className={leadData.collected_end_date ? "text-white" : "text-white/30"}>{leadData.collected_end_date || "---"}</span></div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] h-[450px] lg:h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-3 sm:p-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <Bot className="w-5 h-5 text-white/50 hidden sm:block" />
                <span className="text-sm font-medium">Live Test</span>
                <div className="relative">
                  <button onClick={() => setShowModelDropdown(!showModelDropdown)} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-white/[0.05] rounded-lg text-xs sm:text-sm text-white/70 hover:text-white transition-colors">
                    <Sparkles className="w-3.5 h-3.5" />
                    {MODELS[selectedModel].short}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {showModelDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                      {(Object.entries(MODELS) as [ModelId, typeof MODELS[ModelId]][]).map(([id, model]) => (
                        <button key={id} onClick={() => { setSelectedModel(id); setShowModelDropdown(false) }} className={`w-full px-3 py-2 text-left text-sm transition-colors ${selectedModel === id ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"}`}>
                          {model.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/30 font-mono">${totalCost.toFixed(4)}</span>
                <button onClick={resetChat} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/50 hover:text-white transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot className="w-12 h-12 text-white/20 mb-4" />
                  <p className="text-white/40 text-sm">Test your AI configuration</p>
                  <p className="text-white/20 text-xs mt-1">Changes to settings on the left are reflected here instantly</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === "user" ? "order-first" : ""}`}>
                    <div className={`rounded-2xl px-4 py-2.5 ${msg.role === "user" ? "bg-white text-black rounded-br-md" : "bg-white/[0.08] rounded-bl-md"}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === "assistant" && msg.model && (
                      <p className="text-[10px] text-white/30 mt-1 ml-1">
                        {MODELS[msg.model as ModelId]?.short || msg.model}
                        {msg.cost && ` · $${msg.cost.totalCost.toFixed(4)}`}
                      </p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-black" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Bot className="w-4 h-4" /></div>
                  <div className="bg-white/[0.08] rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/[0.08]">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-2">
                <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors" disabled={isLoading} />
                <button type="submit" disabled={!input.trim() || isLoading} className="px-4 py-3 bg-white text-black rounded-xl font-medium transition-all hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  )
}
