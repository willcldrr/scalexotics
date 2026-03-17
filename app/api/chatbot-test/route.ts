import { NextRequest, NextResponse } from "next/server"
import { generateResponse, ChatMessage, ModelId } from "@/lib/anthropic"

// Force Node.js runtime for Anthropic SDK compatibility
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  console.log("[Chatbot Test] POST request received")
  console.log("[Chatbot Test] ANTHROPIC_API_KEY present:", !!process.env.ANTHROPIC_API_KEY)
  console.log("[Chatbot Test] ANTHROPIC_API_KEY length:", process.env.ANTHROPIC_API_KEY?.length || 0)

  try {
    const body = await request.json()
    console.log("[Chatbot Test] Request body parsed, model:", body.model)
    const { messages, systemPrompt, model, forceModel, autoEscalate } = body

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
    const requestedModel: ModelId = model || "claude-3-5-haiku-latest"

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

    // Clean up the response - remove [SEND_PAYMENT_LINK] marker if present
    if (aiResponse.includes("[SEND_PAYMENT_LINK]")) {
      aiResponse = aiResponse.replace("[SEND_PAYMENT_LINK]", "")
      aiResponse = aiResponse.trim()
      // Add a mock payment link for testing
      aiResponse += "\n\nHere's your secure payment link: https://checkout.example.com/test-session"
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
