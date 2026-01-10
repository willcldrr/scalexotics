import { createClient } from "@supabase/supabase-js"

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

export async function generateAIResponse(
  userId: string,
  leadId: string,
  incomingMessage: string,
  leadName: string
): Promise<string> {
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
  }

  const vehicleList = vehicles || []
  const bookingList = bookings || []
  const conversationHistory = messages || []
  const leadInfo: LeadInfo = lead || { id: leadId, name: leadName, phone: "" }

  // Build the system prompt with enhanced capabilities
  const systemPrompt = buildEnhancedSystemPrompt(aiSettings, vehicleList, bookingList, leadInfo)

  // Build conversation messages for context
  const conversationMessages = buildConversationMessages(conversationHistory, incomingMessage, leadName)

  // Call OpenRouter API (Claude) with function calling for structured extraction
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:3000",
    },
    body: JSON.stringify({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationMessages,
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    console.error("OpenRouter API error:", await response.text())
    return "Thanks for your message! I'll get back to you shortly."
  }

  const data = await response.json()
  let aiResponse = data.choices[0]?.message?.content || "Thanks for reaching out! How can I help you today?"

  // Parse the AI response for structured data extraction
  const extractedData = parseAIResponseForData(aiResponse, vehicleList)

  // Update lead with any extracted information
  if (extractedData.hasUpdates) {
    const updateData: any = {}

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
  if (aiResponse.includes("[SEND_PAYMENT_LINK]") ||
      (leadInfo.ready_for_payment && aiResponse.toLowerCase().includes("payment link"))) {

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
        // Replace placeholder with actual link
        aiResponse = aiResponse.replace("[SEND_PAYMENT_LINK]", "")
        aiResponse = aiResponse.trim() + `\n\nHere's your secure payment link: ${paymentLink}`
      }
    }
  }

  return aiResponse
}

function buildEnhancedSystemPrompt(
  settings: AISettings,
  vehicles: Vehicle[],
  bookings: BookingConflict[],
  leadInfo: LeadInfo
): string {
  const toneInstructions = {
    friendly: "Be warm, casual, and use occasional emojis. Feel like texting a friend.",
    professional: "Be polished and business-like, but still personable.",
    luxury: "Provide a premium, white-glove concierge experience. Be sophisticated.",
    energetic: "Be enthusiastic and excited about the cars! Show passion.",
  }

  const vehicleInfo = vehicles.length > 0
    ? vehicles.map(v => `- ${v.year} ${v.make} ${v.model}: $${v.daily_rate}/day (ID: ${v.id.substring(0, 8)}) [${v.status}]`).join("\n")
    : "Various exotic vehicles available - ask for current inventory."

  // Format existing bookings for availability context
  const bookingInfo = bookings.length > 0
    ? bookings.map(b => `- Vehicle ${b.vehicle_id.substring(0, 8)}: ${b.start_date} to ${b.end_date}`).join("\n")
    : "No current bookings - all vehicles available."

  // What info has been collected from this lead
  const collectedInfo = []
  if (leadInfo.collected_vehicle_id) {
    const vehicle = vehicles.find(v => v.id === leadInfo.collected_vehicle_id)
    collectedInfo.push(`Vehicle: ${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Selected"}`)
  }
  if (leadInfo.collected_start_date) collectedInfo.push(`Start Date: ${leadInfo.collected_start_date}`)
  if (leadInfo.collected_end_date) collectedInfo.push(`End Date: ${leadInfo.collected_end_date}`)

  const collectedSummary = collectedInfo.length > 0
    ? collectedInfo.join("\n")
    : "None yet - need to collect vehicle choice and dates."

  const missingInfo = []
  if (!leadInfo.collected_vehicle_id) missingInfo.push("which vehicle they want")
  if (!leadInfo.collected_start_date) missingInfo.push("start date")
  if (!leadInfo.collected_end_date) missingInfo.push("end date")

  return `You are an AI assistant for ${settings.business_name || "an exotic car rental business"}. You handle SMS conversations to qualify leads and collect booking information.

TONE: ${toneInstructions[settings.tone as keyof typeof toneInstructions] || toneInstructions.friendly}

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
4. Once you have vehicle + dates: Calculate the total, explain the deposit, and offer to send a payment link
5. When ready to send payment link, include "[SEND_PAYMENT_LINK]" in your response

AVAILABILITY CHECK:
- When the customer mentions dates, check against CURRENT BOOKINGS above
- If their desired vehicle is booked during those dates, apologize and offer alternatives
- Always confirm availability before discussing payment

PRICING CALCULATION:
- Daily rate is shown next to each vehicle
- Multi-day rentals: just multiply daily rate × number of days
- Deposit is ${settings.deposit_percentage}% of total

RESPONSE GUIDELINES:
1. Keep responses SHORT - this is SMS, max 2-3 sentences
2. Be conversational and natural
3. Ask ONE question at a time to collect info
4. When you have vehicle + dates, summarize and ask if they're ready to pay the deposit
5. The customer's name is ${leadInfo.name} - use it occasionally
6. Never make up prices - use the rates listed above

Example flow:
- "Which car catches your eye?" → They pick Lamborghini
- "Great choice! What dates are you looking at?" → March 15-17
- "Perfect! The Lamborghini Huracan for March 15-17 is 3 days × $1,500 = $4,500 total. Deposit is $1,125 (25%). Ready to lock it in? I can send you a secure payment link!"
- If they say yes → Include [SEND_PAYMENT_LINK] and say you're sending the link

Remember: You're texting, keep it brief and guide them toward booking!`
}

function buildConversationMessages(
  history: Message[],
  newMessage: string,
  leadName: string
): Array<{ role: "user" | "assistant"; content: string }> {
  const messages: Array<{ role: "user" | "assistant"; content: string }> = []

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

function parseAIResponseForData(response: string, vehicles: Vehicle[]): {
  hasUpdates: boolean
  vehicleId?: string
  startDate?: string
  endDate?: string
} {
  const result: any = { hasUpdates: false }

  // Try to extract vehicle mentions
  for (const vehicle of vehicles) {
    const vehicleTerms = [
      vehicle.make.toLowerCase(),
      vehicle.model.toLowerCase(),
      `${vehicle.make} ${vehicle.model}`.toLowerCase(),
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

  // Try to extract dates (various formats)
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/g,  // MM/DD or MM/DD/YYYY
    /(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*[-–to]+\s*\d{1,2}(?:st|nd|rd|th)?)?)/gi, // March 15-17
    /(\d{4}-\d{2}-\d{2})/g, // YYYY-MM-DD
  ]

  // This is simplified - in production you'd want more robust date parsing
  // For now, the AI will handle date understanding and we track when it confirms

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

    // Get vehicle info
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("daily_rate")
      .eq("id", vehicleId)
      .single()

    if (!vehicle) return null

    // Calculate amounts
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const totalAmount = days * vehicle.daily_rate
    const depositAmount = (totalAmount * depositPercentage) / 100

    // Get lead email if available
    const { data: lead } = await supabase
      .from("leads")
      .select("email")
      .eq("id", leadId)
      .single()

    // Call our checkout API
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

export async function findOrCreateLead(
  userId: string,
  phoneNumber: string
): Promise<{ id: string; name: string } | null> {
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

export async function saveMessage(
  userId: string,
  leadId: string,
  content: string,
  direction: "inbound" | "outbound"
): Promise<void> {
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
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .limit(1)
    .single()

  return data?.id || null
}
