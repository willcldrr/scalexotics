import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { campaign_type, tone, channel, business_name, offer_details, vehicle_name, custom_instructions } = await request.json()

    // Build AI prompt for message generation
    const systemPrompt = buildAIPrompt({
      campaignType: campaign_type,
      tone,
      channel,
      businessName: business_name,
      offerDetails: offer_details,
      vehicleName: vehicle_name,
      customInstructions: custom_instructions,
    })

    // Use OpenRouter API for AI generation
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://scaleexotics.com",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate the message template." }
        ],
        max_tokens: channel === "sms" ? 300 : 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      console.error("OpenRouter API error:", await response.text())
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 })
    }

    const data = await response.json()
    const generatedContent = data.choices?.[0]?.message?.content || ""

    return NextResponse.json({ content: generatedContent.trim() })
  } catch (error: any) {
    console.error("Template generation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function buildAIPrompt(params: {
  campaignType: string
  tone: string
  channel: string
  businessName?: string
  offerDetails?: string
  vehicleName?: string
  customInstructions?: string
}): string {
  const { campaignType, tone, channel, businessName, offerDetails, vehicleName, customInstructions } = params

  const toneGuide: Record<string, string> = {
    friendly: "warm, casual, personable - like texting a friend who happens to own a cool car rental business",
    professional: "polished, business-like but still personable - confident and trustworthy",
    luxury: "sophisticated, premium white-glove feel - exclusive and refined",
    energetic: "enthusiastic, exciting, passionate - pumped about cars and experiences",
  }

  const campaignGuide: Record<string, string> = {
    win_back: "Re-engage a customer who hasn't rented in a while. Create urgency but don't be pushy. Remind them of the great experience they had.",
    holiday: "Celebrate a holiday or special occasion. Be festive and timely. Create excitement around seasonal opportunities.",
    new_vehicle: "Announce a new addition to the fleet. Build excitement and exclusivity. Make them feel like insiders getting first access.",
    special_offer: "Promote a limited-time discount or deal. Create urgency but remain genuine. Focus on value.",
    milestone: "Celebrate a customer milestone like birthday or anniversary with the business. Be warm and appreciative.",
  }

  return `You are writing a ${campaignType.replace("_", " ")} reactivation message for ${businessName || "an exotic car rental business"}.

CAMPAIGN GOAL: ${campaignGuide[campaignType] || "Re-engage past customers and encourage them to book again."}

TONE: ${toneGuide[tone] || toneGuide.friendly}

CHANNEL: ${channel.toUpperCase()}
${channel === "sms" ? "- Keep it concise - aim for under 160 characters if possible, max 2 SMS segments (320 chars)" : "- Can be longer and include formatting, but keep it scannable"}
${channel === "sms" ? "- Be conversational and direct" : "- Include a clear greeting and sign-off"}

AVAILABLE PERSONALIZATION VARIABLES (use double curly braces):
- {{name}} - Customer's first name
- {{last_vehicle}} - Their last rented vehicle
- {{days_since_rental}} - Days since their last rental
- {{total_rentals}} - How many times they've rented
- {{business_name}} - Your business name
- {{offer_code}} - Promo code (if applicable)
- {{offer_amount}} - Discount amount (if applicable)
${channel === "email" ? "- {{unsubscribe_link}} - Required for email compliance" : ""}

${offerDetails ? `OFFER DETAILS: ${offerDetails}` : ""}
${vehicleName ? `FEATURED VEHICLE: ${vehicleName}` : ""}
${customInstructions ? `ADDITIONAL INSTRUCTIONS: ${customInstructions}` : ""}

REQUIREMENTS:
1. Feel personal and genuine - not like a mass marketing message
2. Create appropriate urgency without being spammy
3. Highlight the value proposition clearly
4. Include a clear call-to-action
5. Match the specified tone throughout
6. Use the personalization variables naturally
${channel === "sms" ? "7. NO subject line - just the message body" : ""}

Return ONLY the message content. No explanations, no subject line unless it's an email.
${channel === "email" ? "For email, format as: Subject: [subject line]\\n\\n[email body]" : ""}`
}
