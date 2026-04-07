"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  Bot,
  Send,
  RotateCcw,
  Sparkles,
  ChevronDown,
  User,
  Loader2,
  Settings2,
} from "lucide-react"
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

export default function AIAssistantTestPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<AISettings | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
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

    const [settingsRes, vehiclesRes] = await Promise.all([
      supabase.from("ai_settings").select("*").eq("user_id", user.id).single(),
      supabase.from("vehicles").select("id, name, make, model, year, daily_rate, type, status").eq("user_id", user.id).neq("status", "inactive"),
    ])

    if (settingsRes.data) {
      setSettings(settingsRes.data)
      if (settingsRes.data.preferred_model) setSelectedModel(settingsRes.data.preferred_model)
    }
    setVehicles(vehiclesRes.data || [])
    setLoading(false)
  }

  const buildSystemPrompt = () => {
    if (!settings) return ""
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
4. When they confirm — IMMEDIATELY include [SEND_PAYMENT_LINK] in your response.

CRITICAL PAYMENT LINK RULES:
- When the customer says YES/confirms after seeing a summary, your VERY NEXT response MUST include [SEND_PAYMENT_LINK]
- The system replaces [SEND_PAYMENT_LINK] with the actual payment URL
- Keep the message short when sending the link

GUIDELINES:
- Keep responses concise and conversational
- Ask ONE question at a time
- Be helpful and match the ${personality.toLowerCase()} tone
- Never make up prices - use rates above
- Do NOT use emojis in your responses
- Do NOT list all vehicles upfront - only if customer specifically asks
- LANGUAGE: Always respond in the same language the customer uses.

DATE CALCULATION (IMPORTANT):
- Rental days = end date minus start date
- Total cost = daily rate x number of days
- ALWAYS double-check your math before confirming

DATA EXTRACTION:
After your message, include: [EXTRACTED]{"vehicle_id":"ID or null","start_date":"YYYY-MM-DD or null","end_date":"YYYY-MM-DD or null","confirmed":true/false,"waitlist_vehicle":"vehicle name or null","language":"detected language code"}[/EXTRACTED]

IMPORTANT for "confirmed" field:
- Set confirmed to TRUE when the customer agrees to a booking summary
- If confirmed is true, you MUST also include [SEND_PAYMENT_LINK] in your message text`
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !settings) return
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
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl w-fit">
        <Link
          href="/dashboard/ai-assistant"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.05] transition-all"
        >
          <Settings2 className="w-4 h-4" />
          Configuration
        </Link>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-white text-black font-medium">
          <Bot className="w-4 h-4" />
          Test Chat
        </div>
      </div>

      {/* Two Column Layout: Progress + Chat */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left: Booking Progress & Fleet Info */}
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
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">Vehicle</span>
                <span className={leadData.collected_vehicle_id ? "text-white" : "text-white/30"}>
                  {leadData.collected_vehicle_id ? vehicles.find(v => v.id === leadData.collected_vehicle_id)?.name?.split(" ")[0] || "Selected" : "---"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Start</span>
                <span className={leadData.collected_start_date ? "text-white" : "text-white/30"}>
                  {leadData.collected_start_date || "---"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">End</span>
                <span className={leadData.collected_end_date ? "text-white" : "text-white/30"}>
                  {leadData.collected_end_date || "---"}
                </span>
              </div>
            </div>
            {leadData.ready_for_payment && (
              <div className="mt-3 p-2 rounded-lg bg-white/10 text-center text-xs font-medium">
                Ready for payment link
              </div>
            )}
          </div>

          {/* Fleet */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">Fleet</span>
              <span className="text-xs text-white/40 ml-auto">{vehicles.length}</span>
            </div>
            <div className="space-y-2">
              {vehicles.slice(0, 6).map(v => (
                <div key={v.id} className={`flex justify-between text-xs ${
                  leadData.collected_vehicle_id === v.id ? "text-white" : "text-white/50"
                }`}>
                  <span className="truncate">{v.make} {v.model}</span>
                  <span>${v.daily_rate}</span>
                </div>
              ))}
              {vehicles.length > 6 && (
                <p className="text-xs text-white/30">+{vehicles.length - 6} more</p>
              )}
              {vehicles.length === 0 && (
                <p className="text-xs text-white/40">No vehicles added yet</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/50">Messages</span>
              <span>{messages.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Cost</span>
              <span className="font-mono">${totalCost.toFixed(4)}</span>
            </div>
          </div>

          {/* Current Config */}
          {settings && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4">
              <span className="text-sm font-medium">Active Config</span>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Tone</span>
                  <span className="text-white/70 capitalize">{settings.tone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Deposit</span>
                  <span className="text-white/70">{settings.require_deposit ? `${settings.deposit_percentage}%` : "Off"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Auto-escalate</span>
                  <span className="text-white/70">{settings.auto_escalate ? "On" : "Off"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Chat Panel */}
        <div className="lg:col-span-3">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] h-[500px] lg:h-[700px] flex flex-col">
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
                  <p className="text-white/20 text-xs mt-1">Try: &quot;Do you have a Lambo available this weekend?&quot;</p>
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
