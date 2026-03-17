import { createClient } from "@supabase/supabase-js"
import {
  generateResponse,
  shouldEscalate,
  ChatMessage,
  ModelId,
  GenerateResult,
  MODELS,
} from "./anthropic"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface AISettings {
  business_name: string
  business_phone: string
  business_hours: string
  greeting_message: string
  booking_process: string
  pricing_info: string
  tone: string
  require_deposit: boolean
  deposit_percentage: number
  preferred_model?: ModelId
  auto_escalate?: boolean
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

interface Message {
  direction: "inbound" | "outbound"
  content: string
}

interface LeadInfo {
  id: string
  name: string
  phone: string
  collected_vehicle_id?: string
  collected_start_date?: string
  collected_end_date?: string
  ready_for_payment?: boolean
}

interface BookingConflict {
  vehicle_id: string
  start_date: string
  end_date: string
}

export interface AIResponseResult {
  response: string
  model: ModelId
  escalated: boolean
  escalationReason?: string
  usage: {
    inputTokens: number
    outputTokens: number
    cacheCreationInputTokens?: number
    cacheReadInputTokens?: number
  }
  cost: {
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

export async function generateAIResponse(
  userId: string,
  leadId: string,
  incomingMessage: string,
  leadName: string,
  channel: "sms" | "instagram" = "sms",
  options?: {
    model?: ModelId
    forceModel?: boolean
  }
): Promise<AIResponseResult> {
  const supabase = getSupabase()

  // Get AI settings for this user
  const { data: settings } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("user_id", userId)
    .single()

  // Get available vehicles with IDs
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, name, make, model, year, daily_rate, type, status")
    .eq("user_id", userId)
    .neq("status", "inactive")

  // Get existing bookings for availability check
  const { data: bookings } = await supabase
    .from("bookings")
    .select("vehicle_id, start_date, end_date")
    .eq("user_id", userId)
    .in("status", ["confirmed", "pending"])

  // Get lead info including collected data
  const { data: lead } = await supabase
    .from("leads")
    .select("id, name, phone, collected_vehicle_id, collected_start_date, collected_end_date, ready_for_payment")
    .eq("id", leadId)
    .single()

  // Get conversation history
  const { data: messages } = await supabase
    .from("messages")
    .select("direction, content")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true })
    .limit(15)

  const aiSettings: AISettings = settings || {
    business_name: "our exotic car rental",
    business_phone: process.env.TWILIO_PHONE_NUMBER || "",
    business_hours: "9 AM - 6 PM, Monday - Saturday",
    greeting_message: "Hey! Thanks for reaching out about renting an exotic car. What dates are you looking at?",
    booking_process: "To secure your booking, we require a 25% deposit. Once confirmed, the vehicle is yours!",
    pricing_info: "Our rates vary by vehicle. Multi-day rentals get discounted rates.",
    tone: "friendly",
    require_deposit: true,
    deposit_percentage: 25,
    preferred_model: "claude-3-5-haiku-latest",
    auto_escalate: true,
  }

  const vehicleList = vehicles || []
  const bookingList = bookings || []
  const conversationHistory = messages || []
  const leadInfo: LeadInfo = lead || { id: leadId, name: leadName, phone: "" }

  // Build the system prompt with enhanced capabilities
  const systemPrompt = buildEnhancedSystemPrompt(aiSettings, vehicleList, bookingList, leadInfo, channel)

  // Build conversation messages for context
  const chatMessages: ChatMessage[] = buildChatMessages(conversationHistory, incomingMessage)

  // Determine model to use
  const requestedModel = options?.model || aiSettings.preferred_model || "claude-3-5-haiku-20241022"

  // Generate response using Anthropic API with prompt caching
  const result: GenerateResult = await generateResponse(
    systemPrompt,
    chatMessages,
    {
      model: requestedModel,
      maxTokens: 500,
      temperature: 0.7,
      usePromptCaching: true,
      forceModel: options?.forceModel || !aiSettings.auto_escalate,
    }
  )

  // Parse the AI response for structured data extraction
  const extractedData = parseAIResponseForData(result.content, vehicleList)

  // Use the clean response (without [EXTRACTED] block)
  let aiResponse = extractedData.cleanResponse

  // Update lead with any extracted information
  if (extractedData.hasUpdates) {
    const updateData: Record<string, any> = {}

    if (extractedData.vehicleId) {
      updateData.collected_vehicle_id = extractedData.vehicleId
      updateData.vehicle_interest = extractedData.vehicleId
    }
    if (extractedData.startDate) {
      updateData.collected_start_date = extractedData.startDate
    }
    if (extractedData.endDate) {
      updateData.collected_end_date = extractedData.endDate
    }

    // Check if we have all info needed for payment
    const currentVehicle = extractedData.vehicleId || leadInfo.collected_vehicle_id
    const currentStart = extractedData.startDate || leadInfo.collected_start_date
    const currentEnd = extractedData.endDate || leadInfo.collected_end_date

    if (currentVehicle && currentStart && currentEnd) {
      updateData.ready_for_payment = true
    }

    if (Object.keys(updateData).length > 0) {
      await supabase.from("leads").update(updateData).eq("id", leadId)
    }
  }

  // Check if AI response indicates ready for payment link
  // Only send if customer has confirmed AND we have [SEND_PAYMENT_LINK] marker
  const shouldSendPaymentLink = aiResponse.includes("[SEND_PAYMENT_LINK]") && (
    extractedData.confirmed ||
    leadInfo.ready_for_payment
  )

  if (shouldSendPaymentLink) {
    const vehicleId = leadInfo.collected_vehicle_id || extractedData.vehicleId
    const startDate = leadInfo.collected_start_date || extractedData.startDate
    const endDate = leadInfo.collected_end_date || extractedData.endDate

    if (vehicleId && startDate && endDate) {
      const paymentLink = await generatePaymentLink(
        userId,
        leadId,
        vehicleId,
        startDate,
        endDate,
        leadInfo.phone,
        leadInfo.name,
        aiSettings.deposit_percentage
      )

      if (paymentLink) {
        aiResponse = aiResponse.replace("[SEND_PAYMENT_LINK]", "")
        aiResponse = aiResponse.trim() + `\n\nHere's your secure payment link: ${paymentLink}`
      }
    } else {
      // Remove marker if we don't have all info
      aiResponse = aiResponse.replace("[SEND_PAYMENT_LINK]", "").trim()
    }
  } else if (aiResponse.includes("[SEND_PAYMENT_LINK]")) {
    // Remove marker if conditions not met
    aiResponse = aiResponse.replace("[SEND_PAYMENT_LINK]", "").trim()
  }

  return {
    response: aiResponse,
    model: result.model,
    escalated: result.escalated,
    escalationReason: result.escalationReason,
    usage: result.usage,
    cost: result.cost,
    extractedData: {
      vehicleId: extractedData.vehicleId,
      startDate: extractedData.startDate,
      endDate: extractedData.endDate,
      confirmed: extractedData.confirmed,
    },
  }
}

function buildEnhancedSystemPrompt(
  settings: AISettings,
  vehicles: Vehicle[],
  bookings: BookingConflict[],
  leadInfo: LeadInfo,
  channel: "sms" | "instagram" = "sms"
): string {
  const toneInstructions: Record<string, string> = {
    friendly: "Be warm, casual, and use occasional emojis. Feel like texting a friend.",
    professional: "Be polished and business-like, but still personable.",
    luxury: "Provide a premium, white-glove concierge experience. Be sophisticated.",
    energetic: "Be enthusiastic and excited about the cars! Show passion.",
  }

  const vehicleInfo =
    vehicles.length > 0
      ? vehicles
          .map((v) => `- ${v.year} ${v.make} ${v.model}: $${v.daily_rate}/day (ID: ${v.id.substring(0, 8)}) [${v.status}]`)
          .join("\n")
      : "Various exotic vehicles available - ask for current inventory."

  const bookingInfo =
    bookings.length > 0
      ? bookings.map((b) => `- Vehicle ${b.vehicle_id.substring(0, 8)}: ${b.start_date} to ${b.end_date}`).join("\n")
      : "No current bookings - all vehicles available."

  const collectedInfo = []
  if (leadInfo.collected_vehicle_id) {
    const vehicle = vehicles.find((v) => v.id === leadInfo.collected_vehicle_id)
    collectedInfo.push(`Vehicle: ${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Selected"}`)
  }
  if (leadInfo.collected_start_date) collectedInfo.push(`Start Date: ${leadInfo.collected_start_date}`)
  if (leadInfo.collected_end_date) collectedInfo.push(`End Date: ${leadInfo.collected_end_date}`)

  const collectedSummary = collectedInfo.length > 0 ? collectedInfo.join("\n") : "None yet - need to collect vehicle choice and dates."

  const missingInfo = []
  if (!leadInfo.collected_vehicle_id) missingInfo.push("which vehicle they want")
  if (!leadInfo.collected_start_date) missingInfo.push("start date")
  if (!leadInfo.collected_end_date) missingInfo.push("end date")

  return `You are an AI assistant for ${settings.business_name || "an exotic car rental business"}. You handle ${channel === "sms" ? "SMS" : "Instagram DM"} conversations to qualify leads and collect booking information.

TONE: ${toneInstructions[settings.tone] || toneInstructions.friendly}

BUSINESS INFO:
- Business: ${settings.business_name}
- Hours: ${settings.business_hours}
- Phone: ${settings.business_phone}
- Deposit Required: ${settings.require_deposit ? `Yes, ${settings.deposit_percentage}%` : "No"}

AVAILABLE VEHICLES:
${vehicleInfo}

CURRENT BOOKINGS (for availability):
${bookingInfo}

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

AVAILABILITY CHECK:
- When the customer mentions dates, check against CURRENT BOOKINGS above
- If their desired vehicle is booked during those dates, apologize and offer alternatives
- Always confirm availability before discussing payment

PRICING CALCULATION:
- Daily rate is shown next to each vehicle
- Multi-day rentals: just multiply daily rate × number of days
- Deposit is ${settings.deposit_percentage}% of total

RESPONSE GUIDELINES:
${
  channel === "sms"
    ? `1. Keep responses SHORT - this is SMS, max 2-3 sentences
2. Be conversational and natural`
    : `1. Keep responses conversational - this is Instagram DM, can be slightly longer than SMS but still concise
2. You can use line breaks for readability
3. Be friendly and engaging`
}
${channel === "sms" ? "3" : "4"}. Ask ONE question at a time to collect info
${channel === "sms" ? "4" : "5"}. When you have vehicle + dates, summarize and ask if they're ready to pay the deposit
${channel === "sms" ? "5" : "6"}. The customer's name is ${leadInfo.name} - use it occasionally
${channel === "sms" ? "6" : "7"}. Never make up prices - use the rates listed above

DATA EXTRACTION - CRITICAL:
After your message, you MUST include a data block with any information extracted from the customer's message.
Format: [EXTRACTED]{"vehicle_id":"ID or null","start_date":"YYYY-MM-DD or null","end_date":"YYYY-MM-DD or null","confirmed":true/false}[/EXTRACTED]

Rules for extraction:
- vehicle_id: Use the vehicle ID from AVAILABLE VEHICLES list if customer mentions a car (e.g., "Lamborghini" → use the Lamborghini's ID)
- start_date/end_date: Parse dates from customer message into YYYY-MM-DD format. Handle "March 15", "3/15", "this weekend", "next Friday" etc.
- confirmed: Set to true ONLY if customer explicitly confirms booking details (says yes, sounds good, let's do it, confirm, book it, etc.)
- Always include the [EXTRACTED] block, even if all values are null

Example flow:
- You: "Which car catches your eye?"
- Customer: "The Lamborghini looks sick"
- You: "Great choice! What dates are you looking at? [EXTRACTED]{"vehicle_id":"${vehicles[0]?.id?.substring(0, 8) || "v1"}","start_date":null,"end_date":null,"confirmed":false}[/EXTRACTED]"
- Customer: "March 15-17"
- You: "Perfect! The Lamborghini Huracan for March 15-17 is 3 days × $1,500 = $4,500 total. Deposit is $1,125 (25%). Does this look right? Ready to lock it in? [EXTRACTED]{"vehicle_id":null,"start_date":"2026-03-15","end_date":"2026-03-17","confirmed":false}[/EXTRACTED]"
- Customer: "Yes let's do it!"
- You: "Awesome! Sending your secure payment link now! [SEND_PAYMENT_LINK] [EXTRACTED]{"vehicle_id":null,"start_date":null,"end_date":null,"confirmed":true}[/EXTRACTED]"

Remember: ${channel === "sms" ? "You're texting, keep it brief" : "You're on Instagram DM, be personable"} and guide them toward booking!`
}

function buildChatMessages(history: Message[], newMessage: string): ChatMessage[] {
  const messages: ChatMessage[] = []

  for (const msg of history) {
    messages.push({
      role: msg.direction === "inbound" ? "user" : "assistant",
      content: msg.content,
    })
  }

  messages.push({
    role: "user",
    content: newMessage,
  })

  return messages
}

interface ExtractedData {
  hasUpdates: boolean
  vehicleId?: string
  startDate?: string
  endDate?: string
  confirmed?: boolean
  cleanResponse: string
}

function parseAIResponseForData(
  response: string,
  vehicles: Vehicle[]
): ExtractedData {
  const result: ExtractedData = {
    hasUpdates: false,
    cleanResponse: response
  }

  // Try to extract structured data from [EXTRACTED] block
  const extractedMatch = response.match(/\[EXTRACTED\](.*?)\[\/EXTRACTED\]/s)

  if (extractedMatch) {
    try {
      const jsonStr = extractedMatch[1].trim()
      const data = JSON.parse(jsonStr)

      // Extract vehicle ID - match partial IDs from the prompt
      if (data.vehicle_id && data.vehicle_id !== "null") {
        // Try to find matching vehicle by partial ID
        const matchedVehicle = vehicles.find(v =>
          v.id.startsWith(data.vehicle_id) ||
          v.id.substring(0, 8) === data.vehicle_id
        )
        if (matchedVehicle) {
          result.vehicleId = matchedVehicle.id
          result.hasUpdates = true
        }
      }

      // Extract dates
      if (data.start_date && data.start_date !== "null") {
        result.startDate = data.start_date
        result.hasUpdates = true
      }
      if (data.end_date && data.end_date !== "null") {
        result.endDate = data.end_date
        result.hasUpdates = true
      }

      // Extract confirmation
      if (data.confirmed === true) {
        result.confirmed = true
        result.hasUpdates = true
      }

    } catch (e) {
      console.error("Failed to parse extracted data:", e)
    }

    // Remove the [EXTRACTED] block from the response
    result.cleanResponse = response.replace(/\s*\[EXTRACTED\].*?\[\/EXTRACTED\]\s*/s, "").trim()
  }

  // Fallback: Try to extract vehicle mentions from response text if no structured data
  if (!result.vehicleId) {
    for (const vehicle of vehicles) {
      const vehicleTerms = [
        vehicle.make.toLowerCase(),
        vehicle.model.toLowerCase(),
        `${vehicle.make} ${vehicle.model}`.toLowerCase()
      ]

      const responseLower = response.toLowerCase()
      for (const term of vehicleTerms) {
        if (responseLower.includes(term)) {
          result.vehicleId = vehicle.id
          result.hasUpdates = true
          break
        }
      }
      if (result.vehicleId) break
    }
  }

  return result
}

async function generatePaymentLink(
  userId: string,
  leadId: string,
  vehicleId: string,
  startDate: string,
  endDate: string,
  customerPhone: string,
  customerName: string,
  depositPercentage: number
): Promise<string | null> {
  try {
    const supabase = getSupabase()

    const { data: vehicle } = await supabase.from("vehicles").select("daily_rate").eq("id", vehicleId).single()

    if (!vehicle) return null

    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const totalAmount = days * vehicle.daily_rate
    const depositAmount = (totalAmount * depositPercentage) / 100

    const { data: lead } = await supabase.from("leads").select("email").eq("id", leadId).single()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/payments/create-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        vehicleId,
        startDate,
        endDate,
        depositAmount,
        customerPhone,
        customerName,
        customerEmail: lead?.email,
      }),
    })

    if (!response.ok) {
      console.error("Failed to create checkout:", await response.text())
      return null
    }

    const data = await response.json()
    return data.checkoutUrl
  } catch (error) {
    console.error("Error generating payment link:", error)
    return null
  }
}

export async function findOrCreateLead(userId: string, phoneNumber: string): Promise<{ id: string; name: string } | null> {
  const supabase = getSupabase()
  const cleanPhone = phoneNumber.replace(/\D/g, "")

  const { data: existingLead } = await supabase
    .from("leads")
    .select("id, name")
    .eq("user_id", userId)
    .or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${phoneNumber}%`)
    .single()

  if (existingLead) {
    return existingLead
  }

  const { data: newLead, error } = await supabase
    .from("leads")
    .insert({
      user_id: userId,
      name: `SMS Lead ${phoneNumber}`,
      phone: phoneNumber,
      status: "new",
      source: "sms",
    })
    .select("id, name")
    .single()

  if (error) {
    console.error("Error creating lead:", error)
    return null
  }

  return newLead
}

export async function saveMessage(userId: string, leadId: string, content: string, direction: "inbound" | "outbound"): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from("messages").insert({
    user_id: userId,
    lead_id: leadId,
    content,
    direction,
  })

  if (error) {
    console.error("Error saving message:", error)
  }
}

export async function getDefaultUserId(): Promise<string | null> {
  const supabase = getSupabase()
  const { data } = await supabase.from("profiles").select("id").limit(1).single()

  return data?.id || null
}

// Re-export types and utilities from anthropic module
export { MODELS, shouldEscalate }
export type { ModelId }
