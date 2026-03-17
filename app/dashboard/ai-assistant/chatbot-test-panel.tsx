"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Settings, Bot, User, Sparkles, RotateCcw, Copy, Check, ChevronDown, ChevronUp, Smartphone, Instagram, Zap, Car, DollarSign, MessageSquare, AlertTriangle, TrendingUp, Cpu } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  model?: string
  escalated?: boolean
  escalationReason?: string
  usage?: {
    inputTokens: number
    outputTokens: number
    cacheCreationInputTokens?: number
    cacheReadInputTokens?: number
  }
  cost?: {
    inputCost: number
    outputCost: number
    totalCost: number
    cacheSavings?: number
  }
  extractedData?: {
    vehicleId?: string
    startDate?: string
    endDate?: string
    confirmed?: boolean
  }
}

interface AISettings {
  business_name: string
  business_phone: string
  business_hours: string
  greeting_message: string
  booking_process: string
  pricing_info: string
  tone: "friendly" | "professional" | "luxury" | "energetic"
  require_deposit: boolean
  deposit_percentage: number
  custom_system_prompt: string
  auto_escalate: boolean
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

interface LeadData {
  name: string
  phone: string
  collected_vehicle_id: string | null
  collected_start_date: string | null
  collected_end_date: string | null
  ready_for_payment: boolean
}

type ModelId = "claude-3-haiku-20240307" | "claude-3-sonnet-20240229" | "claude-3-opus-20240229"

const MODELS: Record<ModelId, { name: string; description: string; inputCost: number; outputCost: number; recommended: boolean }> = {
  "claude-3-haiku-20240307": {
    name: "Claude 3 Haiku",
    description: "Fast and cost-effective for routine conversations",
    inputCost: 0.25,
    outputCost: 1.25,
    recommended: true,
  },
  "claude-3-sonnet-20240229": {
    name: "Claude 3 Sonnet",
    description: "Balanced performance and capability",
    inputCost: 3.0,
    outputCost: 15.0,
    recommended: false,
  },
  "claude-3-opus-20240229": {
    name: "Claude 3 Opus",
    description: "Most capable, best for complex situations",
    inputCost: 15.0,
    outputCost: 75.0,
    recommended: false,
  },
}

const defaultSettings: AISettings = {
  business_name: "Velocity Exotics",
  business_phone: "(555) 123-4567",
  business_hours: "9 AM - 8 PM, 7 days a week",
  greeting_message: "Hey! Thanks for reaching out about renting an exotic car. What dates are you looking at?",
  booking_process: "To secure your booking, we require a deposit. Once confirmed, the vehicle is yours!",
  pricing_info: "Our rates vary by vehicle. Multi-day rentals get discounted rates.",
  tone: "friendly",
  require_deposit: true,
  deposit_percentage: 25,
  custom_system_prompt: "",
  auto_escalate: true,
}

const defaultVehicles: Vehicle[] = [
  { id: "v1", name: "Lamborghini Huracan", make: "Lamborghini", model: "Huracan EVO", year: 2024, daily_rate: 1500, type: "supercar", status: "available" },
  { id: "v2", name: "Ferrari 488", make: "Ferrari", model: "488 Spider", year: 2023, daily_rate: 1800, type: "supercar", status: "available" },
  { id: "v3", name: "Rolls Royce Cullinan", make: "Rolls Royce", model: "Cullinan", year: 2024, daily_rate: 2000, type: "suv", status: "available" },
  { id: "v4", name: "Mercedes G63 AMG", make: "Mercedes", model: "G63 AMG", year: 2024, daily_rate: 800, type: "suv", status: "available" },
  { id: "v5", name: "Porsche 911 Turbo S", make: "Porsche", model: "911 Turbo S", year: 2024, daily_rate: 1200, type: "sports", status: "available" },
]

const toneDescriptions = {
  friendly: "Warm, casual, occasional emojis. Feel like texting a friend.",
  professional: "Polished and business-like, but still personable.",
  luxury: "Premium, white-glove concierge experience. Sophisticated.",
  energetic: "Enthusiastic and excited about the cars! Show passion.",
}

interface ChatbotTestPanelProps {
  initialSettings?: Partial<AISettings>
  initialVehicles?: Vehicle[]
}

export default function ChatbotTestPanel({ initialSettings, initialVehicles }: ChatbotTestPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<AISettings>({
    ...defaultSettings,
    ...initialSettings,
  })
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles?.length ? initialVehicles.map((v, i) => ({
    id: v.id || `v${i}`,
    name: v.name || `${v.make} ${v.model}`,
    make: v.make,
    model: v.model,
    year: v.year || 2024,
    daily_rate: v.daily_rate,
    type: v.type || "exotic",
    status: v.status || "available",
  })) : defaultVehicles)
  const [channel, setChannel] = useState<"sms" | "instagram">("sms")
  const [selectedModel, setSelectedModel] = useState<ModelId>("claude-3-haiku-20240307")
  const [forceModel, setForceModel] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [showVehicles, setShowVehicles] = useState(false)
  const [showModels, setShowModels] = useState(true)
  const [showCosts, setShowCosts] = useState(true)
  const [lastSystemPrompt, setLastSystemPrompt] = useState("")
  const [copied, setCopied] = useState(false)
  const [totalCost, setTotalCost] = useState(0)
  const [totalSavings, setTotalSavings] = useState(0)
  const [leadData, setLeadData] = useState<LeadData>({
    name: "Test Customer",
    phone: "(555) 999-1234",
    collected_vehicle_id: null,
    collected_start_date: null,
    collected_end_date: null,
    ready_for_payment: false,
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const buildSystemPrompt = () => {
    const toneInstructions = {
      friendly: "Be warm, casual, and use occasional emojis. Feel like texting a friend.",
      professional: "Be polished and business-like, but still personable.",
      luxury: "Provide a premium, white-glove concierge experience. Be sophisticated.",
      energetic: "Be enthusiastic and excited about the cars! Show passion.",
    }

    const vehicleInfo = vehicles.length > 0
      ? vehicles.map(v => `- ${v.year} ${v.make} ${v.model}: $${v.daily_rate}/day (ID: ${v.id}) [${v.status}]`).join("\n")
      : "Various exotic vehicles available - ask for current inventory."

    const collectedInfo = []
    if (leadData.collected_vehicle_id) {
      const vehicle = vehicles.find(v => v.id === leadData.collected_vehicle_id)
      collectedInfo.push(`Vehicle: ${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Selected"}`)
    }
    if (leadData.collected_start_date) collectedInfo.push(`Start Date: ${leadData.collected_start_date}`)
    if (leadData.collected_end_date) collectedInfo.push(`End Date: ${leadData.collected_end_date}`)

    const collectedSummary = collectedInfo.length > 0
      ? collectedInfo.join("\n")
      : "None yet - need to collect vehicle choice and dates."

    const missingInfo = []
    if (!leadData.collected_vehicle_id) missingInfo.push("which vehicle they want")
    if (!leadData.collected_start_date) missingInfo.push("start date")
    if (!leadData.collected_end_date) missingInfo.push("end date")

    if (settings.custom_system_prompt) {
      return settings.custom_system_prompt
    }

    return `You are an AI assistant for ${settings.business_name || "an exotic car rental business"}. You handle ${channel === "sms" ? "SMS" : "Instagram DM"} conversations to qualify leads and collect booking information.

TONE: ${toneInstructions[settings.tone]}

BUSINESS INFO:
- Business: ${settings.business_name}
- Hours: ${settings.business_hours}
- Phone: ${settings.business_phone}
- Deposit Required: ${settings.require_deposit ? `Yes, ${settings.deposit_percentage}%` : "No"}

AVAILABLE VEHICLES:
${vehicleInfo}

CURRENT BOOKINGS (for availability):
No current bookings - all vehicles available.

ALREADY COLLECTED FROM THIS LEAD:
${collectedSummary}

${missingInfo.length > 0 ? `STILL NEED TO COLLECT: ${missingInfo.join(", ")}` : "ALL INFO COLLECTED - Ready to send payment link!"}

YOUR GOALS (in order):
1. If no vehicle selected: Help them choose a vehicle from our fleet
2. If no dates: Ask for their rental dates (start and end date)
3. If dates conflict with bookings: Let them know and suggest alternatives
4. Once you have vehicle + dates: Calculate total and ask them to CONFIRM the booking details
5. After customer CONFIRMS (says yes, sounds good, let's do it, etc.): Include "[SEND_PAYMENT_LINK]" to send the payment link

IMPORTANT - CONFIRMATION STEP:
- NEVER send a payment link without explicit customer confirmation
- First summarize: vehicle, dates, total cost, deposit amount
- Ask: "Does this look right? Ready to secure your booking?"
- Only after they confirm positively, include [SEND_PAYMENT_LINK]

PRICING CALCULATION:
- Daily rate is shown next to each vehicle
- Multi-day rentals: just multiply daily rate × number of days
- Deposit is ${settings.deposit_percentage}% of total

RESPONSE GUIDELINES:
${channel === "sms"
    ? `1. Keep responses SHORT - this is SMS, max 2-3 sentences
2. Be conversational and natural`
    : `1. Keep responses conversational - this is Instagram DM, can be slightly longer than SMS but still concise
2. You can use line breaks for readability
3. Be friendly and engaging`}
${channel === "sms" ? "3" : "4"}. Ask ONE question at a time to collect info
${channel === "sms" ? "4" : "5"}. When you have vehicle + dates, summarize and ask if they're ready to pay the deposit
${channel === "sms" ? "5" : "6"}. The customer's name is ${leadData.name} - use it occasionally
${channel === "sms" ? "6" : "7"}. Never make up prices - use the rates listed above

DATA EXTRACTION - CRITICAL:
After your message, you MUST include a data block with any information extracted from the customer's message.
Format: [EXTRACTED]{"vehicle_id":"ID or null","start_date":"YYYY-MM-DD or null","end_date":"YYYY-MM-DD or null","confirmed":true/false}[/EXTRACTED]

Rules for extraction:
- vehicle_id: Use the vehicle ID from AVAILABLE VEHICLES list if customer mentions a car (e.g., "Lamborghini" → use that vehicle's ID)
- start_date/end_date: Parse dates from customer message into YYYY-MM-DD format. Handle "March 15", "3/15", "this weekend", "next Friday" etc.
- confirmed: Set to true ONLY if customer explicitly confirms booking details (says yes, sounds good, let's do it, confirm, book it, etc.)
- Always include the [EXTRACTED] block, even if all values are null

Remember: ${channel === "sms" ? "You're texting, keep it brief" : "You're on Instagram DM, be personable"} and guide them toward booking!`
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    const systemPrompt = buildSystemPrompt()
    setLastSystemPrompt(systemPrompt)

    try {
      const response = await fetch("/api/chatbot-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt,
          settings,
          channel,
          model: selectedModel,
          forceModel,
          autoEscalate: settings.auto_escalate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to get response")
      }

      // Use server-side extracted data if available, otherwise fall back to client parsing
      if (data.extractedData) {
        setLeadData(prev => {
          const updates: Partial<LeadData> = {}

          if (data.extractedData.vehicleId) {
            updates.collected_vehicle_id = data.extractedData.vehicleId
          }
          if (data.extractedData.startDate) {
            updates.collected_start_date = data.extractedData.startDate
          }
          if (data.extractedData.endDate) {
            updates.collected_end_date = data.extractedData.endDate
          }
          if (data.extractedData.confirmed) {
            updates.ready_for_payment = true
          }

          // Check if all info collected
          const vehicleId = data.extractedData.vehicleId || prev.collected_vehicle_id
          const startDate = data.extractedData.startDate || prev.collected_start_date
          const endDate = data.extractedData.endDate || prev.collected_end_date

          if (vehicleId && startDate && endDate) {
            updates.ready_for_payment = prev.ready_for_payment || false
          }

          return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev
        })
      } else {
        // Fallback to client-side parsing
        const extractedData = parseResponseForData(data.response, userMessage.content)
        if (extractedData.hasUpdates) {
          setLeadData(prev => ({
            ...prev,
            ...extractedData.updates,
          }))
        }
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        model: data.model,
        escalated: data.escalated,
        escalationReason: data.escalationReason,
        usage: data.usage,
        cost: data.cost,
        extractedData: data.extractedData,
      }

      setMessages(prev => [...prev, assistantMessage])

      // Update total cost
      if (data.cost) {
        setTotalCost(prev => prev + data.cost.totalCost)
        if (data.cost.cacheSavings) {
          setTotalSavings(prev => prev + data.cost.cacheSavings)
        }
      }
    } catch (error: any) {
      console.error("Error:", error)
      const errorText = error?.message || "Unknown error occurred"
      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${errorText}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const parseResponseForData = (response: string, userInput: string) => {
    const result: { hasUpdates: boolean; updates: Partial<LeadData> } = {
      hasUpdates: false,
      updates: {},
    }

    const inputLower = userInput.toLowerCase()
    for (const vehicle of vehicles) {
      const terms = [vehicle.make.toLowerCase(), vehicle.model.toLowerCase()]
      for (const term of terms) {
        if (inputLower.includes(term)) {
          result.updates.collected_vehicle_id = vehicle.id
          result.hasUpdates = true
          break
        }
      }
      if (result.updates.collected_vehicle_id) break
    }

    const datePattern = /(\d{1,2}\/\d{1,2}|\w+\s+\d{1,2}(?:st|nd|rd|th)?)/gi
    const dates = userInput.match(datePattern)
    if (dates && dates.length >= 1) {
      if (!leadData.collected_start_date) {
        result.updates.collected_start_date = dates[0]
        result.hasUpdates = true
      }
      if (dates.length >= 2 && !leadData.collected_end_date) {
        result.updates.collected_end_date = dates[1]
        result.hasUpdates = true
      }
    }

    if (response.includes("[SEND_PAYMENT_LINK]")) {
      result.updates.ready_for_payment = true
      result.hasUpdates = true
    }

    return result
  }

  const resetConversation = () => {
    setMessages([])
    setLeadData({
      name: "Test Customer",
      phone: "(555) 999-1234",
      collected_vehicle_id: null,
      collected_start_date: null,
      collected_end_date: null,
      ready_for_payment: false,
    })
    setLastSystemPrompt("")
    setTotalCost(0)
    setTotalSavings(0)
  }

  const copySystemPrompt = () => {
    navigator.clipboard.writeText(lastSystemPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatCost = (cost: number) => {
    if (cost < 0.001) return "<$0.001"
    if (cost < 0.01) return `$${cost.toFixed(4)}`
    return `$${cost.toFixed(3)}`
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Chatbot Test Lab</h3>
          <p className="text-sm text-white/40">Test your AI assistant before deployment</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Channel Toggle */}
          <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-full border border-white/[0.06]">
            <button
              onClick={() => setChannel("sms")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                channel === "sms" ? "bg-white text-black" : "text-white/60 hover:text-white"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              SMS
            </button>
            <button
              onClick={() => setChannel("instagram")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                channel === "instagram" ? "bg-white text-black" : "text-white/60 hover:text-white"
              }`}
            >
              <Instagram className="w-4 h-4" />
              IG
            </button>
          </div>
          <button
            onClick={resetConversation}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-full transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Model Selection Card */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowModels(!showModels)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-white" />
                <span className="font-medium">Model Selection</span>
              </div>
              {showModels ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
            </button>

            {showModels && (
              <div className="p-4 pt-0 space-y-3 border-t border-white/[0.06]">
                {(Object.entries(MODELS) as [ModelId, typeof MODELS[ModelId]][]).map(([id, model]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedModel(id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      selectedModel === id
                        ? "bg-white/10 border-white/30"
                        : "bg-white/[0.02] border-white/[0.06] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-2">
                        {model.name}
                        {model.recommended && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">RECOMMENDED</span>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mb-2">{model.description}</p>
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      <span>In: ${model.inputCost}/1M</span>
                      <span>Out: ${model.outputCost}/1M</span>
                    </div>
                  </button>
                ))}

                {/* Escalation Settings */}
                <div className="pt-3 border-t border-white/[0.06] space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.auto_escalate}
                      onChange={(e) => setSettings(prev => ({ ...prev, auto_escalate: e.target.checked }))}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white"
                    />
                    <span className="text-sm">Auto-escalate to Sonnet</span>
                  </label>
                  <p className="text-xs text-white/30">
                    Automatically use Sonnet for complaints, complex requests, or frustrated customers.
                  </p>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceModel}
                      onChange={(e) => setForceModel(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white"
                    />
                    <span className="text-sm">Force selected model</span>
                  </label>
                  <p className="text-xs text-white/30">
                    Disable auto-escalation and always use the selected model.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Cost Tracking Card */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowCosts(!showCosts)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="font-medium">Cost Tracking</span>
              </div>
              {showCosts ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
            </button>

            {showCosts && (
              <div className="p-4 pt-0 border-t border-white/[0.06]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/[0.02] rounded-lg">
                    <p className="text-xs text-white/40 mb-1">Total Cost</p>
                    <p className="text-lg font-mono font-medium text-white">{formatCost(totalCost)}</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-xs text-green-400/60 mb-1">Cache Savings</p>
                    <p className="text-lg font-mono font-medium text-green-400">{formatCost(totalSavings)}</p>
                  </div>
                </div>
                <p className="text-xs text-white/30 mt-3">
                  Prompt caching saves ~90% on repeated system prompts after the first message.
                </p>
              </div>
            )}
          </div>

          {/* AI Settings Card */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-white" />
                <span className="font-medium">AI Settings</span>
              </div>
              {showSettings ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
            </button>

            {showSettings && (
              <div className="p-4 pt-0 space-y-4 border-t border-white/[0.06]">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Business Name</label>
                  <input
                    type="text"
                    value={settings.business_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, business_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-white/50 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Business Hours</label>
                  <input
                    type="text"
                    value={settings.business_hours}
                    onChange={(e) => setSettings(prev => ({ ...prev, business_hours: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-white/50 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">AI Tone</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["friendly", "professional", "luxury", "energetic"] as const).map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setSettings(prev => ({ ...prev, tone }))}
                        className={`px-3 py-2 text-xs rounded-lg border transition-all capitalize ${
                          settings.tone === tone
                            ? "bg-white/20 border-white/50 text-white"
                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-white/30 mt-2">{toneDescriptions[settings.tone]}</p>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.require_deposit}
                      onChange={(e) => setSettings(prev => ({ ...prev, require_deposit: e.target.checked }))}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white"
                    />
                    <span className="text-sm">Require Deposit</span>
                  </label>
                  {settings.require_deposit && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.deposit_percentage}
                        onChange={(e) => setSettings(prev => ({ ...prev, deposit_percentage: parseInt(e.target.value) || 25 }))}
                        className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-center focus:border-white/50 focus:outline-none"
                      />
                      <span className="text-sm text-white/40">%</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Inventory Card */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowVehicles(!showVehicles)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-white" />
                <span className="font-medium">Vehicle Inventory</span>
                <span className="text-xs text-white/40">({vehicles.length})</span>
              </div>
              {showVehicles ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
            </button>

            {showVehicles && (
              <div className="p-4 pt-0 space-y-2 border-t border-white/[0.06]">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className={`p-3 rounded-lg border transition-all ${
                      leadData.collected_vehicle_id === vehicle.id
                        ? "bg-white/10 border-white/30"
                        : "bg-white/[0.02] border-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                        <p className="text-xs text-white/40">{vehicle.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">${vehicle.daily_rate}/day</p>
                        <p className="text-xs text-green-400">{vehicle.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lead Data Card with Progress */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-white" />
                <span className="font-medium">Booking Progress</span>
              </div>
              <span className="text-xs text-white/40">
                {[leadData.collected_vehicle_id, leadData.collected_start_date, leadData.collected_end_date].filter(Boolean).length}/3 collected
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex gap-1 mb-2">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${leadData.collected_vehicle_id ? "bg-green-500" : "bg-white/10"}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${leadData.collected_start_date ? "bg-green-500" : "bg-white/10"}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${leadData.collected_end_date ? "bg-green-500" : "bg-white/10"}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${leadData.ready_for_payment ? "bg-white" : "bg-white/10"}`} />
              </div>
              <div className="flex justify-between text-[10px] text-white/30">
                <span>Vehicle</span>
                <span>Start</span>
                <span>End</span>
                <span>Confirmed</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40 flex items-center gap-2">
                  {leadData.collected_vehicle_id ? <Check className="w-3 h-3 text-green-400" /> : <div className="w-3 h-3 rounded-full border border-white/20" />}
                  Vehicle
                </span>
                <span className={leadData.collected_vehicle_id ? "text-green-400 font-medium" : "text-white/20"}>
                  {leadData.collected_vehicle_id
                    ? vehicles.find(v => v.id === leadData.collected_vehicle_id)?.name || "Selected"
                    : "Waiting..."}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40 flex items-center gap-2">
                  {leadData.collected_start_date ? <Check className="w-3 h-3 text-green-400" /> : <div className="w-3 h-3 rounded-full border border-white/20" />}
                  Start Date
                </span>
                <span className={leadData.collected_start_date ? "text-green-400 font-medium" : "text-white/20"}>
                  {leadData.collected_start_date || "Waiting..."}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40 flex items-center gap-2">
                  {leadData.collected_end_date ? <Check className="w-3 h-3 text-green-400" /> : <div className="w-3 h-3 rounded-full border border-white/20" />}
                  End Date
                </span>
                <span className={leadData.collected_end_date ? "text-green-400 font-medium" : "text-white/20"}>
                  {leadData.collected_end_date || "Waiting..."}
                </span>
              </div>
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40 flex items-center gap-2">
                    {leadData.ready_for_payment ? <Check className="w-3 h-3 text-white" /> : <div className="w-3 h-3 rounded-full border border-white/20" />}
                    Customer Confirmed
                  </span>
                  <span className={leadData.ready_for_payment ? "text-white font-medium" : "text-white/20"}>
                    {leadData.ready_for_payment ? "Yes - Ready!" : "Awaiting..."}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            {leadData.collected_vehicle_id && leadData.collected_start_date && leadData.collected_end_date && (
              <div className={`mt-4 p-3 rounded-lg text-center text-sm font-medium ${
                leadData.ready_for_payment
                  ? "bg-white/20 text-white border border-white/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}>
                {leadData.ready_for_payment
                  ? "Ready to send payment link!"
                  : "All info collected - awaiting confirmation"}
              </div>
            )}
          </div>

          {/* Debug Panel */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-white" />
                <span className="font-medium">Debug: System Prompt</span>
              </div>
              {showDebug ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
            </button>

            {showDebug && lastSystemPrompt && (
              <div className="p-4 pt-0 border-t border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40">Last sent prompt</span>
                  <button
                    onClick={copySystemPrompt}
                    className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="text-xs text-white/60 bg-black/50 p-3 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap font-mono">
                  {lastSystemPrompt}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  channel === "sms" ? "bg-green-500/20" : "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                }`}>
                  {channel === "sms" ? (
                    <Smartphone className="w-5 h-5 text-green-400" />
                  ) : (
                    <Instagram className="w-5 h-5 text-pink-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{channel === "sms" ? "SMS Conversation" : "Instagram DM"}</p>
                  <p className="text-xs text-white/40">Testing with {leadData.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40">Using</p>
                <p className="text-sm font-medium text-white">{MODELS[selectedModel].name}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Start a Test Conversation</h3>
                  <p className="text-sm text-white/40 max-w-sm">
                    Send a message to test your AI assistant. Try asking about vehicles, pricing, or availability.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {[
                      "Hey, what cars do you have?",
                      "Is the Lamborghini available this weekend?",
                      "How much for the Ferrari?",
                      "I'm very unhappy with the service!",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-full hover:border-white/30 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index}>
                  <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] ${message.role === "user" ? "" : ""}`}>
                      {/* Escalation Badge */}
                      {message.escalated && (
                        <div className="flex items-center gap-1 mb-1 text-xs text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Escalated to Sonnet: {message.escalationReason}</span>
                        </div>
                      )}

                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          message.role === "user"
                            ? "bg-white text-black rounded-br-md"
                            : "bg-white/[0.06] text-white rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {/* Message Meta */}
                      <div className={`flex items-center gap-3 mt-1 text-[10px] ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}>
                        <span className="text-white/30">
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {message.model && (
                          <span className="text-white/40">
                            {MODELS[message.model as ModelId]?.name || message.model}
                          </span>
                        )}
                        {message.cost && (
                          <span className="text-green-400/60">
                            {formatCost(message.cost.totalCost)}
                            {message.cost.cacheSavings && message.cost.cacheSavings > 0 && (
                              <span className="text-green-400"> (saved {formatCost(message.cost.cacheSavings)})</span>
                            )}
                          </span>
                        )}
                        {message.usage && (
                          <span className="text-white/30">
                            {message.usage.inputTokens}→{message.usage.outputTokens} tokens
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.06] px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-1">
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
            <div className="p-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Type a message as ${leadData.name}...`}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-white/50 focus:outline-none transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 flex items-center justify-center bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5 text-black" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
