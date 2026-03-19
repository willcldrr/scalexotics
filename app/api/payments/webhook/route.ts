import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { convertedStatus } from "@/lib/lead-status"
import { generateResponse, ChatMessage } from "@/lib/anthropic"
import { sendInstagramMessage } from "@/lib/instagram"

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  })
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Generate an AI confirmation response for deposit payment
async function generateDepositConfirmationResponse(
  businessName: string,
  customerName: string,
  vehicleName: string,
  startDate: string,
  endDate: string,
  depositAmount: number,
  tone: string = "friendly",
  channel: "sms" | "instagram" = "sms"
): Promise<string> {
  const toneInstructions: Record<string, string> = {
    friendly: "Be warm, casual, and enthusiastic. Feel like texting a friend who just made an exciting decision.",
    professional: "Be polished and business-like, but still warm and congratulatory.",
    luxury: "Provide a premium, white-glove concierge experience. Be sophisticated and elegant.",
    energetic: "Be super excited and enthusiastic! Show genuine excitement about their upcoming experience.",
  }

  const systemPrompt = `You are an AI assistant for ${businessName || "an exotic car rental business"}. A customer just successfully paid their deposit, and you need to send them a confirmation and next steps.

TONE: ${toneInstructions[tone] || toneInstructions.friendly}

BOOKING DETAILS:
- Customer: ${customerName}
- Vehicle: ${vehicleName}
- Dates: ${startDate} to ${endDate}
- Deposit Paid: $${depositAmount}

YOUR TASK:
Write a brief, enthusiastic confirmation message that:
1. Confirms their deposit was received and their booking is secured
2. Mentions the vehicle and dates
3. Lets them know you'll be in touch soon with pickup details
4. Thanks them for choosing the business

${channel === "sms"
  ? "Keep it SHORT - this is SMS, max 2-3 sentences. Be concise but warm."
  : "Keep it concise but can be slightly longer than SMS. Use line breaks for readability if needed."
}

DO NOT include any [EXTRACTED] blocks or special markers. Just write the natural message.`

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: "Generate a deposit confirmation message for this customer."
    }
  ]

  try {
    const result = await generateResponse(systemPrompt, messages, {
      model: "claude-haiku-4-5-20251001",
      maxTokens: 200,
      temperature: 0.8,
      forceModel: true, // No escalation needed for confirmations
    })

    return result.content
  } catch (error) {
    console.error("Error generating AI response:", error)
    // Fallback to a standard message if AI fails
    return `Your deposit of $${depositAmount} has been confirmed! Your ${vehicleName} is reserved for ${startDate} to ${endDate}. We'll be in touch with pickup details soon. Thanks for booking with us!`
  }
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const supabase = getSupabase()

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    console.log("Payment successful for session:", session.id)

    const metadata = session.metadata
    if (!metadata) {
      console.error("No metadata in session")
      return NextResponse.json({ received: true })
    }

    const leadId = metadata.lead_id
    const vehicleId = metadata.vehicle_id
    const startDate = metadata.start_date
    const endDate = metadata.end_date
    const customerPhone = metadata.customer_phone
    const customerName = metadata.customer_name
    const totalAmount = parseFloat(metadata.total_amount || "0")
    const depositAmount = parseFloat(metadata.deposit_amount || "0")

    // Validate required fields
    if (!vehicleId || !startDate || !endDate) {
      console.error("Missing required metadata fields:", { vehicleId, startDate, endDate })
      return NextResponse.json({ received: true })
    }

    try {
      let lead: any = null
      let userId: string | null = null

      // Try to get the lead if we have a lead_id
      if (leadId) {
        const { data: leadData } = await supabase
          .from("leads")
          .select("user_id, name, phone, email, instagram_user_id, instagram_username")
          .eq("id", leadId)
          .single()

        lead = leadData
        userId = leadData?.user_id
      }

      // If no lead found but we have customer phone, try to find by phone
      if (!lead && customerPhone) {
        const cleanPhone = customerPhone.replace(/\D/g, "")
        const { data: leadByPhone } = await supabase
          .from("leads")
          .select("id, user_id, name, phone, email, instagram_user_id, instagram_username")
          .or(`phone.ilike.%${cleanPhone}%`)
          .limit(1)
          .single()

        if (leadByPhone) {
          lead = leadByPhone
          userId = leadByPhone.user_id
        }
      }

      // If still no lead/user, try to get user from vehicle
      if (!userId && vehicleId) {
        const { data: vehicle } = await supabase
          .from("vehicles")
          .select("user_id")
          .eq("id", vehicleId)
          .single()

        userId = vehicle?.user_id
      }

      if (!userId) {
        console.error("Could not determine user_id for booking")
        return NextResponse.json({ received: true })
      }

      // Update lead status to converted (if we have a lead)
      if (lead && lead.id) {
        await supabase
          .from("leads")
          .update({
            status: convertedStatus,
            notes: `Deposit paid: $${depositAmount} via Stripe`,
          })
          .eq("id", lead.id)
      }

      // Create a booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: userId,
          vehicle_id: vehicleId,
          customer_name: customerName || lead?.name || "Customer",
          customer_phone: customerPhone || lead?.phone || null,
          customer_email: session.customer_email || lead?.email || null,
          start_date: startDate,
          end_date: endDate,
          total_amount: totalAmount,
          deposit_amount: depositAmount,
          deposit_paid: true,
          status: "confirmed",
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent as string,
          lead_id: lead?.id || leadId || null,
        })
        .select()
        .single()

      if (bookingError) {
        console.error("Error creating booking:", bookingError)
      } else {
        console.log("Booking created:", booking?.id)
      }

      // Send AI-powered confirmation via the appropriate channel (Instagram or SMS)
      try {
        // Get vehicle info
        const { data: vehicle } = await supabase
          .from("vehicles")
          .select("make, model, year")
          .eq("id", vehicleId)
          .single()

        const vehicleName = vehicle
          ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
          : "your vehicle"

        // Get AI settings for the business
        const { data: aiSettings } = await supabase
          .from("ai_settings")
          .select("business_name, tone")
          .eq("user_id", userId)
          .single()

        const businessName = aiSettings?.business_name || "our exotic car rental"
        const tone = aiSettings?.tone || "friendly"

        // Determine channel based on lead's instagram_user_id
        const isInstagramLead = !!lead?.instagram_user_id
        const channel = isInstagramLead ? "instagram" : "sms"

        // Generate AI response
        const confirmationMessage = await generateDepositConfirmationResponse(
          businessName,
          customerName || lead?.name || "Customer",
          vehicleName,
          startDate,
          endDate,
          depositAmount,
          tone,
          channel as "sms" | "instagram"
        )

        console.log(`Sending ${channel} confirmation:`, confirmationMessage)

        // Send via the appropriate channel
        if (isInstagramLead && lead?.instagram_user_id) {
          // Send via Instagram DM
          const result = await sendInstagramMessage(lead.instagram_user_id, confirmationMessage)
          if (result.success) {
            console.log("Instagram confirmation sent successfully, messageId:", result.messageId)
          } else {
            console.error("Failed to send Instagram confirmation:", result.error)
          }
        } else if (customerPhone || lead?.phone) {
          // Send via SMS
          const twilio = await import("twilio")
          const twilioClient = twilio.default(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
          )

          await twilioClient.messages.create({
            body: confirmationMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: customerPhone || lead?.phone,
          })

          console.log("SMS confirmation sent successfully")
        }

        // Save the confirmation message to the database (only if we have a lead)
        if (lead?.id) {
          await supabase.from("messages").insert({
            user_id: userId,
            lead_id: lead.id,
            content: confirmationMessage,
            direction: "outbound",
          })
          console.log("Confirmation message saved to database")
        }

      } catch (confirmationError) {
        console.error("Error sending AI confirmation:", confirmationError)
      }

    } catch (error) {
      console.error("Error processing successful payment:", error)
    }
  }

  return NextResponse.json({ received: true })
}
