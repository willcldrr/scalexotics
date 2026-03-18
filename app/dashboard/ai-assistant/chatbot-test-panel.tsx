"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Settings, Bot, User, Sparkles, RotateCcw, Copy, Check, ChevronDown, ChevronUp, Smartphone, Instagram, Zap, Car, DollarSign, MessageSquare, AlertTriangle, TrendingUp, Cpu, Link, Phone, AtSign, Image, CreditCard, HelpCircle, X, Eye, EyeOff, ExternalLink } from "lucide-react"

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
    name?: string
    email?: string
    phone?: string
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
  personality: PersonalityType
  require_deposit: boolean
  deposit_percentage: number
  custom_system_prompt: string
  auto_escalate: boolean
  collect_customer_info: boolean
  // SMS-specific settings
  sms_send_inventory_link: boolean
  sms_inventory_link_url: string
  // Instagram-specific settings
  instagram_reference_profile: boolean
  // Stripe settings
  stripe_publishable_key: string
  stripe_secret_key: string
  // Custom payment domain (optional - defaults to rentalcapture.xyz)
  payment_domain: string
}

// Simulated contact info for testing
interface SimulatedContact {
  // SMS
  phone_number: string
  // Instagram
  instagram_username: string
  instagram_display_name: string
  instagram_followers: number
  instagram_is_verified: boolean
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
  email: string | null
  instagram_username: string | null
  collected_name: string | null
  collected_email: string | null
  collected_phone: string | null
  collected_vehicle_id: string | null
  collected_start_date: string | null
  collected_end_date: string | null
  ready_for_payment: boolean
}

type ModelId = "claude-haiku-4-5-20251001" | "claude-sonnet-4-6" | "claude-opus-4-6"

const MODELS: Record<ModelId, { name: string; description: string; inputCost: number; outputCost: number; recommended: boolean }> = {
  "claude-haiku-4-5-20251001": {
    name: "Claude Haiku 4.5",
    description: "Fastest, most cost-effective for routine conversations",
    inputCost: 1.0,
    outputCost: 5.0,
    recommended: true,
  },
  "claude-sonnet-4-6": {
    name: "Claude Sonnet 4.6",
    description: "Best combination of speed and intelligence",
    inputCost: 3.0,
    outputCost: 15.0,
    recommended: false,
  },
  "claude-opus-4-6": {
    name: "Claude Opus 4.6",
    description: "Most intelligent, best for complex situations",
    inputCost: 5.0,
    outputCost: 25.0,
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
  personality: "friendly",
  require_deposit: true,
  deposit_percentage: 25,
  custom_system_prompt: "",
  auto_escalate: true,
  collect_customer_info: false,
  // SMS-specific
  sms_send_inventory_link: true,
  sms_inventory_link_url: "https://velocityexotics.com/inventory",
  // Instagram-specific
  instagram_reference_profile: true,
  // Stripe
  stripe_publishable_key: "",
  stripe_secret_key: "",
  // Payment domain (empty = use default rentalcapture.xyz)
  payment_domain: "",
}

const defaultSimulatedContact: SimulatedContact = {
  // SMS - random phone number
  phone_number: "+1 (555) 867-5309",
  // Instagram - simulated profile
  instagram_username: "@exotic_car_lover",
  instagram_display_name: "Alex Thompson",
  instagram_followers: 1243,
  instagram_is_verified: false,
}

const defaultVehicles: Vehicle[] = [
  { id: "v1", name: "Lamborghini Huracan", make: "Lamborghini", model: "Huracan EVO", year: 2024, daily_rate: 1500, type: "supercar", status: "available" },
  { id: "v2", name: "Ferrari 488", make: "Ferrari", model: "488 Spider", year: 2023, daily_rate: 1800, type: "supercar", status: "available" },
  { id: "v3", name: "Rolls Royce Cullinan", make: "Rolls Royce", model: "Cullinan", year: 2024, daily_rate: 2000, type: "suv", status: "available" },
  { id: "v4", name: "Mercedes G63 AMG", make: "Mercedes", model: "G63 AMG", year: 2024, daily_rate: 800, type: "suv", status: "available" },
  { id: "v5", name: "Porsche 911 Turbo S", make: "Porsche", model: "911 Turbo S", year: 2024, daily_rate: 1200, type: "sports", status: "available" },
]

type PersonalityType = "friendly" | "professional" | "luxury" | "enthusiast"

interface PersonalityConfig {
  name: string
  emoji: string
  tagline: string
  description: string
  systemInstructions: string
}

const PERSONALITIES: Record<PersonalityType, PersonalityConfig> = {
  friendly: {
    name: "Friendly",
    emoji: "😊",
    tagline: "Like texting a friend",
    description: "Warm and casual with occasional emojis. Creates a relaxed, approachable vibe that puts customers at ease.",
    systemInstructions: `PERSONALITY: Friendly & Casual
- Be warm, approachable, and conversational
- Use occasional emojis to add personality (but don't overdo it)
- Feel like texting a friend who happens to rent exotic cars
- Use contractions (I'm, you're, we've, etc.)
- Keep it light and fun while still being helpful
- Example phrases: "Hey!", "Awesome choice!", "You're gonna love it!", "No worries!"`,
  },
  professional: {
    name: "Professional",
    emoji: "💼",
    tagline: "Direct, refined service",
    description: "Straight to the point with quiet confidence. Like a 5-star chef - delivers excellence without unnecessary words.",
    systemInstructions: `PERSONALITY: Professional & Direct
- Get straight to the point - no fluff, no filler
- Speak in plain English with quiet confidence
- Ultra-luxury service means respecting their time
- Brief but never cold - warmth through efficiency
- NEVER use emojis - absolutely zero emojis in any response
- Think 5-star hibachi chef: precision, presentation, no wasted motion
- Let the quality speak for itself
- Example phrases: "Got it.", "The Huracan. $1,500/day.", "March 15-17 works. That's $4,500 total, $1,125 deposit.", "Done. Sending your payment link now."`,
  },
  luxury: {
    name: "Luxury Concierge",
    emoji: "✨",
    tagline: "White-glove VIP service",
    description: "Sophisticated and elevated language. Premium concierge experience for discerning clientele.",
    systemInstructions: `PERSONALITY: Luxury Concierge
- Provide an elevated, white-glove service experience
- Use sophisticated, refined language
- Make the customer feel like a VIP
- Be attentive to details and anticipate needs
- Convey exclusivity and premium quality
- NO emojis - maintain elegance
- Example phrases: "It would be my pleasure.", "An excellent selection.", "Allow me to arrange that for you.", "We look forward to providing you with an exceptional experience."`,
  },
  enthusiast: {
    name: "Car Enthusiast",
    emoji: "🏎️",
    tagline: "Passion for performance",
    description: "Excited about the cars with genuine enthusiasm. Connects with fellow automotive lovers.",
    systemInstructions: `PERSONALITY: Car Enthusiast
- Show genuine passion and excitement about the vehicles
- Share interesting details about the cars when relevant
- Connect with customers as fellow car lovers
- Be energetic and enthusiastic
- Use car-related expressions naturally
- Emojis are okay when expressing excitement
- Example phrases: "This beast has 640 horsepower!", "The V10 sound is absolutely incredible!", "You're going to have a blast!", "This is one of our most popular cars for a reason!"`,
  },
}


interface Booking {
  id: string
  vehicleId: string
  startDate: string
  endDate: string
  status: string
  customerName: string
}

interface ChatbotTestPanelProps {
  initialSettings?: Partial<AISettings>
  initialVehicles?: Vehicle[]
  initialBookings?: Booking[]
}

export default function ChatbotTestPanel({ initialSettings, initialVehicles, initialBookings }: ChatbotTestPanelProps) {
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
  const [bookings] = useState<Booking[]>(initialBookings || [])
  const [channel, setChannel] = useState<"sms" | "instagram">("sms")
  const [selectedModel, setSelectedModel] = useState<ModelId>("claude-haiku-4-5-20251001")
  const [forceModel, setForceModel] = useState(false)
  const [showSettings, setShowSettings] = useState(true)
  const [showDebug, setShowDebug] = useState(true)
  const [showVehicles, setShowVehicles] = useState(true)
  const [showModels, setShowModels] = useState(true)
  const [showCosts, setShowCosts] = useState(true)
  const [showPersonality, setShowPersonality] = useState(true)
  const [lastSystemPrompt, setLastSystemPrompt] = useState("")
  const [copied, setCopied] = useState(false)
  const [totalCost, setTotalCost] = useState(0)
  const [totalSavings, setTotalSavings] = useState(0)
  const [leadData, setLeadData] = useState<LeadData>({
    name: "", // Will be populated from Instagram username or collected during conversation
    phone: "",
    email: null,
    instagram_username: null,
    collected_name: null,
    collected_email: null,
    collected_phone: null,
    collected_vehicle_id: null,
    collected_start_date: null,
    collected_end_date: null,
    ready_for_payment: false,
  })
  const [simulatedContact, setSimulatedContact] = useState<SimulatedContact>(defaultSimulatedContact)
  const [showChannelSettings, setShowChannelSettings] = useState(true)
  const [showStripeSettings, setShowStripeSettings] = useState(true)
  const [showStripeHelp, setShowStripeHelp] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  // Update lead data when channel changes
  useEffect(() => {
    if (channel === "instagram") {
      setLeadData(prev => ({
        ...prev,
        instagram_username: simulatedContact.instagram_username,
        name: simulatedContact.instagram_display_name,
        phone: "", // Unknown for Instagram
      }))
    } else {
      setLeadData(prev => ({
        ...prev,
        instagram_username: null,
        name: prev.collected_name || "", // SMS - we don't know their name yet
        phone: simulatedContact.phone_number, // We have their phone from SMS
      }))
    }
  }, [channel, simulatedContact])

  const buildSystemPrompt = () => {
    const personality = PERSONALITIES[settings.personality]

    const vehicleInfo = vehicles.length > 0
      ? vehicles.map(v => `- ${v.year} ${v.make} ${v.model}: $${v.daily_rate}/day (ID: ${v.id}) [${v.status}]`).join("\n")
      : "Various exotic vehicles available - ask for current inventory."

    // Determine customer name to use
    const customerName = leadData.collected_name || (channel === "instagram" ? leadData.instagram_username : null)
    const hasCustomerName = !!customerName

    const collectedInfo = []
    if (leadData.collected_name) collectedInfo.push(`Name: ${leadData.collected_name}`)
    if (leadData.collected_email) collectedInfo.push(`Email: ${leadData.collected_email}`)
    if (leadData.collected_phone) collectedInfo.push(`Phone: ${leadData.collected_phone}`)
    if (leadData.collected_vehicle_id) {
      const vehicle = vehicles.find(v => v.id === leadData.collected_vehicle_id)
      collectedInfo.push(`Vehicle: ${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Selected"}`)
    }
    if (leadData.collected_start_date) collectedInfo.push(`Start Date: ${leadData.collected_start_date}`)
    if (leadData.collected_end_date) collectedInfo.push(`End Date: ${leadData.collected_end_date}`)

    const collectedSummary = collectedInfo.length > 0
      ? collectedInfo.join("\n")
      : "None yet - need to collect booking info."

    const missingInfo = []
    // Customer info is required if toggle is on
    if (settings.collect_customer_info) {
      if (!leadData.collected_name && channel !== "instagram") missingInfo.push("customer name")
      if (!leadData.collected_email) missingInfo.push("email address")
      if (!leadData.collected_phone) missingInfo.push("phone number")
    }
    if (!leadData.collected_vehicle_id) missingInfo.push("which vehicle they want")
    if (!leadData.collected_start_date) missingInfo.push("start date")
    if (!leadData.collected_end_date) missingInfo.push("end date")

    if (settings.custom_system_prompt) {
      return settings.custom_system_prompt
    }

    const now = new Date()
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const todayFormatted = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`
    const currentTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const currentHour = now.getHours()

    // Determine if same-day booking is possible (before 5 PM to allow pickup by 8 PM close)
    const sameDayBookingAvailable = currentHour < 17 // Before 5 PM
    const sameDayMessage = sameDayBookingAvailable
      ? "Same-day bookings are available if customer can pick up before closing (8 PM)."
      : "Same-day bookings are NOT available - it's too late today. Earliest available is tomorrow."

    return `You are an AI assistant for ${settings.business_name || "an exotic car rental business"}. You handle ${channel === "sms" ? "SMS" : "Instagram DM"} conversations to qualify leads and collect booking information.

${personality.systemInstructions}

CURRENT DATE & TIME: ${todayFormatted} at ${currentTime}
Use this to calculate relative dates like "tomorrow", "this weekend", "next Friday", etc.

SAME-DAY BOOKING RULE:
${sameDayMessage}

BUSINESS INFO:
- Business: ${settings.business_name}
- Hours: ${settings.business_hours}
- Phone: ${settings.business_phone}
- Deposit Required: ${settings.require_deposit ? `Yes, ${settings.deposit_percentage}%` : "No"}

AVAILABLE VEHICLES:
${vehicleInfo}

CURRENT BOOKINGS (for availability):
${bookings.length > 0
      ? bookings.map(b => {
          const vehicle = vehicles.find(v => v.id === b.vehicleId)
          const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Unknown Vehicle"
          return `- ${vehicleName}: BOOKED ${b.startDate} to ${b.endDate} (${b.status})`
        }).join("\n")
      : "No current bookings - all vehicles available for any date."}

ALREADY COLLECTED FROM THIS LEAD:
${collectedSummary}

${missingInfo.length > 0 ? `STILL NEED TO COLLECT: ${missingInfo.join(", ")}` : "ALL INFO COLLECTED - Ready to send payment link!"}

YOUR GOALS (in order):
1. If no vehicle selected: Help them choose a vehicle from our fleet
2. If no dates: Ask for their rental dates (start and end date)
3. If customer wants TODAY: Check the SAME-DAY BOOKING RULE above - if it's too late, politely explain and suggest tomorrow instead
4. IMPORTANT - Check CURRENT BOOKINGS above: If the requested dates overlap with an existing booking for that vehicle, politely explain it's not available and suggest:
   - Different dates when that vehicle IS available
   - A similar vehicle that IS available for their dates
${settings.collect_customer_info ? `5. If customer info not collected yet: Ask for their name (unless Instagram - we have their username), email, and phone number
6. Once you have vehicle + dates + customer info: Summarize (vehicle, dates, total, deposit) and ask if they're ready - ONE confirmation only
7. When they confirm: Say "Here's your secure payment link: [SEND_PAYMENT_LINK]" - the system replaces the marker with the real URL` : `5. Once you have vehicle + dates: Summarize (vehicle, dates, total, deposit) and ask if they're ready - ONE confirmation only
6. When they confirm: Say "Here's your secure payment link: [SEND_PAYMENT_LINK]" - the system replaces the marker with the real URL`}

IMPORTANT - CONFIRMATION & PAYMENT LINK:
- Once you have vehicle + dates, summarize ONCE: vehicle, dates, total cost, deposit amount
- Ask ONE question like: "Sound good?" or "Ready to book?"
- When customer confirms (yes, sounds good, let's do it, etc.), respond with ONLY this exact text:
  "Here's your secure payment link: [SEND_PAYMENT_LINK]"
- The system will automatically replace [SEND_PAYMENT_LINK] with the real payment URL
- NEVER write out a URL yourself - ONLY use [SEND_PAYMENT_LINK] marker
- NEVER make up URLs like "velocityexotics.com/payment" or any other domain
- Do NOT ask for confirmation twice - one summary, one confirmation, then send link

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
${channel === "sms" ? "4" : "5"}. When you have vehicle + dates${settings.collect_customer_info ? " + customer info" : ""}, summarize and ask if they're ready to pay the deposit
${hasCustomerName ? `${channel === "sms" ? "5" : "6"}. The customer's name is ${customerName} - use it occasionally` : `${channel === "sms" ? "5" : "6"}. You don't know the customer's name yet - don't make one up or use placeholder names`}
${channel === "sms" ? "6" : "7"}. Never make up prices - use the rates listed above
${channel === "sms" ? "7" : "8"}. Do NOT use markdown formatting - no asterisks for bold (**text**), no underscores for italics, no double dashes (--), just plain text

${channel === "sms" ? `SMS-SPECIFIC FEATURES:
- Customer's phone: ${simulatedContact.phone_number} (you already have this from SMS)
${settings.sms_send_inventory_link ? `- INVENTORY LINK: If customer wants to see photos/options, offer to send: ${settings.sms_inventory_link_url}
  Example: "Want me to send you a link to see all our cars with photos?"` : ""}
- Keep messages under 160 characters when possible
- For longer responses, break into multiple short messages
- Include "Reply STOP to unsubscribe" on first promotional message only` : `INSTAGRAM-SPECIFIC FEATURES:
- Customer's username: ${simulatedContact.instagram_username}
- Customer's name: ${simulatedContact.instagram_display_name}
- They have ${simulatedContact.instagram_followers.toLocaleString()} followers
${settings.instagram_reference_profile ? `- You can reference their profile naturally if relevant (e.g., "Nice to meet you ${simulatedContact.instagram_display_name}!")` : "- Don't reference their profile or follower count"}
- Instagram allows slightly longer messages than SMS
- Can use line breaks for readability
- Emojis are more acceptable on Instagram`}

DATA EXTRACTION - CRITICAL:
After your message, you MUST include a data block with any information extracted from the customer's message.
Format: [EXTRACTED]{"vehicle_id":"ID or null","start_date":"YYYY-MM-DD or null","end_date":"YYYY-MM-DD or null","name":"string or null","email":"string or null","phone":"string or null","confirmed":true/false}[/EXTRACTED]

Rules for extraction:
- vehicle_id: Use the EXACT vehicle ID from AVAILABLE VEHICLES list (the ID in parentheses, like "v1", "v2", etc.) - NOT the vehicle name!
  Example: If customer says "Lamborghini", look up the Lamborghini in the list and use its ID (e.g., "v1")
- start_date/end_date: Parse dates from customer message into YYYY-MM-DD format. Use TODAY'S DATE above to calculate relative dates:
  * "tomorrow" → add 1 day to today
  * "this weekend" → next Saturday
  * "next Friday" → the coming Friday
  * "in 2 weeks" → add 14 days
  * "March 15" or "3/15" → use current year unless past, then next year
- name: Extract if customer provides their name (e.g., "I'm John", "My name is Sarah")
- email: Extract if customer provides email address
- phone: Extract if customer provides phone number (format as provided)
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
      // Debug: log what we're sending
      console.log("[ChatbotTest Client] Sending request with:", {
        vehiclesCount: vehicles?.length,
        leadData: leadData,
        settingsBusinessName: settings?.business_name,
      })

      const requestBody = {
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
        vehicles: vehicles,
        leadData: leadData,
      }

      console.log("[ChatbotTest Client] Full request body keys:", Object.keys(requestBody))
      console.log("[ChatbotTest Client] vehicles in body:", requestBody.vehicles?.length)
      console.log("[ChatbotTest Client] leadData in body:", requestBody.leadData)

      const bodyString = JSON.stringify(requestBody)
      console.log("[ChatbotTest Client] Body string length:", bodyString.length)
      console.log("[ChatbotTest Client] Body string includes 'vehicles':", bodyString.includes('"vehicles"'))
      console.log("[ChatbotTest Client] Body string includes 'leadData':", bodyString.includes('"leadData"'))

      const response = await fetch("/api/chatbot-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyString,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to get response")
      }

      // Use server-side extracted data if available, otherwise fall back to client parsing
      if (data.extractedData) {
        setLeadData(prev => {
          const updates: Partial<LeadData> = {}

          if (data.extractedData.name) {
            updates.collected_name = data.extractedData.name
            updates.name = data.extractedData.name
          }
          if (data.extractedData.email) {
            updates.collected_email = data.extractedData.email
          }
          if (data.extractedData.phone) {
            updates.collected_phone = data.extractedData.phone
          }
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
      inputRef.current?.focus({ preventScroll: true })
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
      name: channel === "instagram" ? "@test_user" : "", // Instagram gets a test username, SMS starts blank
      phone: "",
      email: null,
      instagram_username: channel === "instagram" ? "@test_user" : null,
      collected_name: null,
      collected_email: null,
      collected_phone: null,
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
          {/* Lead Data Card with Progress */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-white" />
                <span className="font-medium">Booking Progress</span>
              </div>
              <span className="text-xs text-white/40">
                {[
                  leadData.collected_vehicle_id,
                  leadData.collected_start_date,
                  leadData.collected_end_date,
                  ...(settings.collect_customer_info ? [
                    channel === "instagram" || leadData.collected_name,
                    leadData.collected_email,
                    leadData.collected_phone
                  ] : [])
                ].filter(Boolean).length}/{settings.collect_customer_info ? 6 : 3} collected
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex gap-1 mb-2">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${leadData.collected_vehicle_id ? "bg-green-500" : "bg-white/10"}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${leadData.collected_start_date ? "bg-green-500" : "bg-white/10"}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${leadData.collected_end_date ? "bg-green-500" : "bg-white/10"}`} />
                {settings.collect_customer_info && (
                  <>
                    <div className={`h-1.5 flex-1 rounded-full transition-colors ${(channel === "instagram" && leadData.instagram_username) || leadData.collected_name ? "bg-blue-500" : "bg-white/10"}`} />
                    <div className={`h-1.5 flex-1 rounded-full transition-colors ${leadData.collected_email ? "bg-blue-500" : "bg-white/10"}`} />
                    <div className={`h-1.5 flex-1 rounded-full transition-colors ${leadData.collected_phone ? "bg-blue-500" : "bg-white/10"}`} />
                  </>
                )}
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${leadData.ready_for_payment ? "bg-white" : "bg-white/10"}`} />
              </div>
              <div className="flex justify-between text-[10px] text-white/30">
                <span>Vehicle</span>
                <span>Start</span>
                <span>End</span>
                {settings.collect_customer_info && (
                  <>
                    <span>Name</span>
                    <span>Email</span>
                    <span>Phone</span>
                  </>
                )}
                <span>Confirmed</span>
              </div>
            </div>

            <div className="space-y-3">
              {/* Customer Info Section (when enabled) */}
              {settings.collect_customer_info && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40 flex items-center gap-2">
                      {(channel === "instagram" && leadData.instagram_username) || leadData.collected_name ? <Check className="w-3 h-3 text-blue-400" /> : <div className="w-3 h-3 rounded-full border border-white/20" />}
                      Name
                    </span>
                    <span className={((channel === "instagram" && leadData.instagram_username) || leadData.collected_name) ? "text-blue-400 font-medium" : "text-white/20"}>
                      {channel === "instagram" && leadData.instagram_username
                        ? leadData.instagram_username
                        : leadData.collected_name || "Waiting..."}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40 flex items-center gap-2">
                      {leadData.collected_email ? <Check className="w-3 h-3 text-blue-400" /> : <div className="w-3 h-3 rounded-full border border-white/20" />}
                      Email
                    </span>
                    <span className={leadData.collected_email ? "text-blue-400 font-medium truncate max-w-[150px]" : "text-white/20"}>
                      {leadData.collected_email || "Waiting..."}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40 flex items-center gap-2">
                      {leadData.collected_phone ? <Check className="w-3 h-3 text-blue-400" /> : <div className="w-3 h-3 rounded-full border border-white/20" />}
                      Phone
                    </span>
                    <span className={leadData.collected_phone ? "text-blue-400 font-medium" : "text-white/20"}>
                      {leadData.collected_phone || "Waiting..."}
                    </span>
                  </div>
                  <div className="border-t border-white/[0.06] my-2" />
                </>
              )}

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

          {/* Stripe Configuration Card */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowStripeSettings(!showStripeSettings)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className={`w-5 h-5 ${settings.stripe_publishable_key && settings.stripe_secret_key ? "text-green-400" : "text-orange-400"}`} />
                <span className="font-medium">Payment Setup</span>
                {settings.stripe_publishable_key && settings.stripe_secret_key ? (
                  <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">Connected</span>
                ) : (
                  <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full">Setup Required</span>
                )}
              </div>
              {showStripeSettings ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
            </button>

            {showStripeSettings && (
              <div className="p-4 pt-0 space-y-4 border-t border-white/[0.06]">
                {/* Header with help button */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Connect your Stripe account to accept payments</p>
                  <button
                    onClick={() => setShowStripeHelp(true)}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Setup Guide
                  </button>
                </div>

                {/* Test Mode Indicator */}
                {settings.stripe_publishable_key.startsWith("pk_test_") && (
                  <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <p className="text-xs text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" />
                      Test Mode - Use card 4242 4242 4242 4242
                    </p>
                  </div>
                )}

                {/* Publishable Key */}
                <div className="space-y-2">
                  <label className="block text-xs text-white/40">Publishable Key</label>
                  <input
                    type="text"
                    value={settings.stripe_publishable_key}
                    onChange={(e) => setSettings(prev => ({ ...prev, stripe_publishable_key: e.target.value }))}
                    placeholder="pk_test_... or pk_live_..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-mono focus:border-blue-500/50 focus:outline-none"
                  />
                </div>

                {/* Secret Key */}
                <div className="space-y-2">
                  <label className="block text-xs text-white/40">Secret Key</label>
                  <div className="relative">
                    <input
                      type={showSecretKey ? "text" : "password"}
                      value={settings.stripe_secret_key}
                      onChange={(e) => setSettings(prev => ({ ...prev, stripe_secret_key: e.target.value }))}
                      placeholder="sk_test_... or sk_live_..."
                      className="w-full px-3 py-2 pr-10 bg-white/5 border border-white/10 rounded-lg text-sm font-mono focus:border-blue-500/50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-white/30">Never share your secret key publicly</p>
                </div>

                {/* Custom Payment Domain */}
                <div className="pt-3 border-t border-white/[0.06] space-y-2">
                  <label className="block text-xs text-white/40">Payment Link Domain (Optional)</label>
                  <input
                    type="text"
                    value={settings.payment_domain}
                    onChange={(e) => setSettings(prev => ({ ...prev, payment_domain: e.target.value }))}
                    placeholder="yourdomain.com"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-blue-500/50 focus:outline-none"
                  />
                  <p className="text-xs text-white/30">
                    Leave empty to use default: <span className="text-blue-400">rentalcapture.xyz</span>
                  </p>
                  {settings.payment_domain && (
                    <p className="text-xs text-white/50">
                      Links will be: <span className="text-white font-mono">https://{settings.payment_domain}/checkout/XXXXXX</span>
                    </p>
                  )}
                </div>

                {/* Status */}
                {settings.stripe_publishable_key && settings.stripe_secret_key && (
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <p className="text-sm text-green-400">Stripe connected - payment links are active</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stripe Help Modal */}
          {showStripeHelp && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#111] border border-white/10 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#111]">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    Stripe Setup Guide
                  </h3>
                  <button
                    onClick={() => setShowStripeHelp(false)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-6">
                  {/* Step 1 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-medium">1</span>
                      <h4 className="font-medium">Create a Stripe Account</h4>
                    </div>
                    <p className="text-sm text-white/60 ml-8">
                      If you don't have one, sign up at{" "}
                      <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                        stripe.com <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-medium">2</span>
                      <h4 className="font-medium">Enable Test Mode (Recommended)</h4>
                    </div>
                    <p className="text-sm text-white/60 ml-8">
                      Toggle "Test mode" in the top-right corner of your Stripe dashboard. This lets you test payments without real money.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-medium">3</span>
                      <h4 className="font-medium">Get Your API Keys</h4>
                    </div>
                    <p className="text-sm text-white/60 ml-8">
                      Go to{" "}
                      <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                        Developers → API Keys <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                    <div className="ml-8 space-y-2">
                      <div className="p-2 bg-white/5 rounded text-xs font-mono">
                        <span className="text-white/40">Publishable key:</span> pk_test_...
                      </div>
                      <div className="p-2 bg-white/5 rounded text-xs font-mono">
                        <span className="text-white/40">Secret key:</span> sk_test_...
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-medium">4</span>
                      <h4 className="font-medium">Paste Keys Above</h4>
                    </div>
                    <p className="text-sm text-white/60 ml-8">
                      Copy both keys and paste them in the fields above. Payment links will work immediately.
                    </p>
                  </div>

                  {/* Test Card Info */}
                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 space-y-3">
                    <h4 className="font-medium text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Test Card Numbers
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/60">Success:</span>
                        <span className="font-mono">4242 4242 4242 4242</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">3D Secure:</span>
                        <span className="font-mono">4000 0000 0000 3220</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Declined:</span>
                        <span className="font-mono">4000 0000 0000 9995</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/40">Use any future expiry date, any 3-digit CVC, any ZIP code</p>
                  </div>

                  {/* Going Live */}
                  <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                    <h4 className="font-medium text-green-400 mb-2">Going Live</h4>
                    <p className="text-sm text-white/60">
                      When ready for real payments, switch off Test Mode in Stripe and replace keys with your live keys (pk_live_... and sk_live_...).
                    </p>
                  </div>
                </div>
                <div className="p-4 border-t border-white/10 sticky bottom-0 bg-[#111]">
                  <button
                    onClick={() => setShowStripeHelp(false)}
                    className="w-full py-2 bg-white hover:bg-white/90 text-black font-medium rounded-lg transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Channel Settings Card */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowChannelSettings(!showChannelSettings)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                {channel === "instagram" ? (
                  <Instagram className="w-5 h-5 text-pink-400" />
                ) : (
                  <Smartphone className="w-5 h-5 text-green-400" />
                )}
                <span className="font-medium">{channel === "instagram" ? "Instagram Contact" : "SMS Contact"}</span>
              </div>
              {showChannelSettings ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
            </button>

            {showChannelSettings && (
              <div className="p-4 pt-0 space-y-4 border-t border-white/[0.06]">
                {channel === "instagram" ? (
                  <>
                    {/* Instagram Profile Simulation */}
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-pink-500/20">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                        {simulatedContact.instagram_display_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{simulatedContact.instagram_display_name}</span>
                          {simulatedContact.instagram_is_verified && (
                            <span className="text-blue-400 text-xs">✓</span>
                          )}
                        </div>
                        <span className="text-xs text-white/50">{simulatedContact.instagram_username}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-white/40">{simulatedContact.instagram_followers.toLocaleString()} followers</span>
                        </div>
                      </div>
                    </div>

                    {/* Instagram-specific settings */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.instagram_reference_profile}
                          onChange={(e) => setSettings(prev => ({ ...prev, instagram_reference_profile: e.target.checked }))}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-pink-500"
                        />
                        <span className="text-sm">Reference profile in conversation</span>
                      </label>
                      <p className="text-xs text-white/30 ml-6">AI can mention "I see from your profile..." when relevant</p>
                    </div>

                    {/* Edit simulated profile */}
                    <div className="space-y-2">
                      <label className="block text-xs text-white/40">Simulated Username</label>
                      <input
                        type="text"
                        value={simulatedContact.instagram_username}
                        onChange={(e) => setSimulatedContact(prev => ({ ...prev, instagram_username: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-pink-500/50 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs text-white/40">Display Name</label>
                      <input
                        type="text"
                        value={simulatedContact.instagram_display_name}
                        onChange={(e) => setSimulatedContact(prev => ({ ...prev, instagram_display_name: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-pink-500/50 focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* SMS Contact Simulation */}
                    <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Phone className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-sm">{simulatedContact.phone_number}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-white/40">Unknown contact</span>
                          <span className="text-xs bg-white/10 px-2 py-0.5 rounded">SMS</span>
                        </div>
                      </div>
                    </div>

                    {/* SMS-specific settings */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.sms_send_inventory_link}
                          onChange={(e) => setSettings(prev => ({ ...prev, sms_send_inventory_link: e.target.checked }))}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500"
                        />
                        <span className="text-sm">Offer inventory link</span>
                      </label>
                      <p className="text-xs text-white/30 ml-6">AI can offer to send a link to view cars with photos</p>

                      {settings.sms_send_inventory_link && (
                        <div className="ml-6 space-y-2">
                          <label className="block text-xs text-white/40">Inventory Link URL</label>
                          <div className="flex items-center gap-2">
                            <Link className="w-4 h-4 text-white/40" />
                            <input
                              type="text"
                              value={settings.sms_inventory_link_url}
                              onChange={(e) => setSettings(prev => ({ ...prev, sms_inventory_link_url: e.target.value }))}
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-green-500/50 focus:outline-none"
                              placeholder="https://yoursite.com/inventory"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Edit simulated phone */}
                    <div className="space-y-2">
                      <label className="block text-xs text-white/40">Simulated Phone Number</label>
                      <input
                        type="text"
                        value={simulatedContact.phone_number}
                        onChange={(e) => setSimulatedContact(prev => ({ ...prev, phone_number: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-green-500/50 focus:outline-none"
                      />
                    </div>

                    {/* SMS Compliance note */}
                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <p className="text-xs text-amber-400">
                        <strong>SMS Compliance:</strong> AI will include opt-out language when appropriate (Reply STOP to unsubscribe)
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Personality Card */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowPersonality(!showPersonality)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="font-medium">AI Personality</span>
                <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{PERSONALITIES[settings.personality].name}</span>
              </div>
              {showPersonality ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
            </button>

            {showPersonality && (
              <div className="p-4 pt-0 space-y-3 border-t border-white/[0.06]">
                {(Object.entries(PERSONALITIES) as [PersonalityType, PersonalityConfig][]).map(([id, config]) => (
                  <button
                    key={id}
                    onClick={() => setSettings(prev => ({ ...prev, personality: id }))}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      settings.personality === id
                        ? "bg-purple-500/20 border-purple-500/50"
                        : "bg-white/[0.02] border-white/[0.06] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{config.emoji}</span>
                      <span className="text-sm font-medium">{config.name}</span>
                      <span className="text-xs text-white/40">— {config.tagline}</span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">{config.description}</p>
                  </button>
                ))}
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

                <div className="pt-3 border-t border-white/[0.06]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.collect_customer_info}
                      onChange={(e) => setSettings(prev => ({ ...prev, collect_customer_info: e.target.checked }))}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white"
                    />
                    <span className="text-sm">Collect Customer Info</span>
                  </label>
                  <p className="text-xs text-white/30 mt-2">
                    AI will ask for name, email, and phone before sending payment link.
                  </p>
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

            {showDebug && (
              <div className="p-4 pt-0 border-t border-white/[0.06]">
                {lastSystemPrompt ? (
                  <>
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
                  </>
                ) : (
                  <p className="text-xs text-white/40 italic">Send a message to see the system prompt</p>
                )}
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
                {channel === "instagram" ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {simulatedContact.instagram_display_name.charAt(0)}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {channel === "instagram"
                      ? simulatedContact.instagram_display_name
                      : simulatedContact.phone_number}
                  </p>
                  <p className="text-xs text-white/40">
                    {channel === "instagram"
                      ? `${simulatedContact.instagram_username} · Instagram DM`
                      : "SMS Conversation"}
                  </p>
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
                  placeholder={channel === "instagram" ? `Reply as ${simulatedContact.instagram_username}...` : `Reply as ${simulatedContact.phone_number}...`}
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
