import { NextRequest, NextResponse } from "next/server"
import { generateResponse, ChatMessage, ModelId } from "@/lib/anthropic"
import { generateSecurePaymentLink, PaymentLinkData } from "@/lib/payment-link"

// Force Node.js runtime for Anthropic SDK compatibility
export const runtime = "nodejs"

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  year: number
  daily_rate: number
}

interface LeadData {
  name: string
  phone: string
  collected_vehicle_id: string | null
  collected_start_date: string | null
  collected_end_date: string | null
}

export async function POST(request: NextRequest) {
  console.log("[Chatbot Test] POST request received")
  console.log("[Chatbot Test] ANTHROPIC_API_KEY present:", !!process.env.ANTHROPIC_API_KEY)
  console.log("[Chatbot Test] ANTHROPIC_API_KEY length:", process.env.ANTHROPIC_API_KEY?.length || 0)

  try {
    const body = await request.json()
    console.log("[Chatbot Test] Request body parsed, model:", body.model)
    const { messages, systemPrompt, model, forceModel, autoEscalate, vehicles, leadData, settings } = body

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      )
    }

    // Build conversation messages for Anthropic
    const chatMessages: ChatMessage[] = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    // Determine model to use
    const requestedModel: ModelId = model || "claude-haiku-4-5-20251001"

    // Generate response using Anthropic Direct API with prompt caching
    const result = await generateResponse(
      systemPrompt,
      chatMessages,
      {
        model: requestedModel,
        maxTokens: 800, // Increased for structured data output
        temperature: 0.7,
        usePromptCaching: true,
        forceModel: forceModel || !autoEscalate,
      }
    )

    let aiResponse = result.content

    // Parse extracted data from response
    let extractedData: {
      vehicleId?: string
      startDate?: string
      endDate?: string
      confirmed?: boolean
    } | undefined

    const extractedMatch = aiResponse.match(/\[EXTRACTED\](.*?)\[\/EXTRACTED\]/s)
    if (extractedMatch) {
      try {
        const data = JSON.parse(extractedMatch[1].trim())
        extractedData = {
          vehicleId: data.vehicle_id !== "null" ? data.vehicle_id : undefined,
          startDate: data.start_date !== "null" ? data.start_date : undefined,
          endDate: data.end_date !== "null" ? data.end_date : undefined,
          confirmed: data.confirmed === true,
        }
      } catch (e) {
        console.error("Failed to parse extracted data:", e)
      }

      // Remove the [EXTRACTED] block from the response
      aiResponse = aiResponse.replace(/\s*\[EXTRACTED\].*?\[\/EXTRACTED\]\s*/s, "").trim()
    }

    // Generate payment link if [SEND_PAYMENT_LINK] marker is present
    if (aiResponse.includes("[SEND_PAYMENT_LINK]")) {
      aiResponse = aiResponse.replace("[SEND_PAYMENT_LINK]", "")
      aiResponse = aiResponse.trim()

      // Try to generate a real payment link
      const vehicleId = extractedData?.vehicleId || (leadData as LeadData)?.collected_vehicle_id
      const startDate = extractedData?.startDate || (leadData as LeadData)?.collected_start_date
      const endDate = extractedData?.endDate || (leadData as LeadData)?.collected_end_date
      const customerName = (leadData as LeadData)?.name || "Customer"
      const customerPhone = (leadData as LeadData)?.phone || ""

      if (vehicleId && startDate && endDate && vehicles) {
        const vehicle = (vehicles as Vehicle[]).find((v: Vehicle) => v.id === vehicleId)

        if (vehicle) {
          // Calculate number of days
          const start = new Date(startDate)
          const end = new Date(endDate)
          const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))

          const totalAmount = vehicle.daily_rate * days
          const depositPercentage = settings?.deposit_percentage || 25
          const depositAmount = Math.round(totalAmount * (depositPercentage / 100))

          try {
            const paymentData: PaymentLinkData = {
              vehicleId: vehicle.id,
              vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
              startDate,
              endDate,
              dailyRate: vehicle.daily_rate,
              totalAmount,
              depositAmount,
              customerName,
              customerPhone,
              businessName: settings?.business_name || "Velocity Exotics",
            }

            const paymentLink = generateSecurePaymentLink(paymentData)
            aiResponse += `\n\nHere's your secure payment link: ${paymentLink}`
          } catch (error) {
            console.error("Failed to generate payment link:", error)
            aiResponse += "\n\n[Payment link generation failed - please contact us directly]"
          }
        } else {
          aiResponse += "\n\n[Could not find vehicle information for payment link]"
        }
      } else {
        aiResponse += "\n\n[Missing booking details for payment link - please provide vehicle and dates]"
      }
    }

    return NextResponse.json({
      response: aiResponse,
      model: result.model,
      escalated: result.escalated,
      escalationReason: result.escalationReason,
      usage: result.usage,
      cost: result.cost,
      extractedData,
    })

  } catch (error: any) {
    console.error("Chatbot test error:", error)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)

    // Check for specific error types
    if (error?.message?.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured", details: error?.message },
        { status: 500 }
      )
    }

    if (error?.status === 401) {
      return NextResponse.json(
        { error: "Invalid API key", details: "The Anthropic API key is invalid or expired" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    )
  }
}
