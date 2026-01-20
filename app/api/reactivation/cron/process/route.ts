import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// This cron job processes active reactivation campaigns
// Run every 15 minutes via Vercel Cron or similar

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Use service role client for cron operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const now = new Date()
    const results: any[] = []

    // Get active campaigns that should be processed
    const { data: campaigns, error: campaignsError } = await supabase
      .from("reactivation_campaigns")
      .select("*")
      .eq("status", "active")
      .or(`start_date.is.null,start_date.lte.${now.toISOString()}`)

    if (campaignsError) {
      console.error("Error fetching campaigns:", campaignsError)
      return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
    }

    for (const campaign of campaigns || []) {
      // Check if campaign has ended
      if (campaign.end_date && new Date(campaign.end_date) < now) {
        await supabase
          .from("reactivation_campaigns")
          .update({ status: "completed" })
          .eq("id", campaign.id)
        continue
      }

      // Check DND hours
      if (isInDNDPeriod(campaign, now)) {
        results.push({ campaignId: campaign.id, status: "skipped_dnd" })
        continue
      }

      // Get user's reactivation settings
      const { data: settings } = await supabase
        .from("reactivation_settings")
        .select("*")
        .eq("user_id", campaign.user_id)
        .maybeSingle()

      // Check global DND
      if (settings?.global_dnd_enabled && isInGlobalDND(settings, now)) {
        results.push({ campaignId: campaign.id, status: "skipped_global_dnd" })
        continue
      }

      // Get eligible contacts for this campaign
      const eligibleContacts = await getEligibleContacts(supabase, campaign, settings)

      let messagesSent = 0

      for (const contact of eligibleContacts) {
        // Check frequency limits
        const canSend = await checkFrequencyLimits(supabase, campaign, contact, settings)
        if (!canSend) continue

        // Send via appropriate channels
        for (const channel of campaign.channels || ["sms"]) {
          if (channel === "sms" && contact.phone && contact.sms_opted_in) {
            const sent = await sendSMSMessage(supabase, campaign, contact)
            if (sent) messagesSent++
          }

          if (channel === "email" && contact.email && contact.email_opted_in) {
            const sent = await sendEmailMessage(supabase, campaign, contact, settings)
            if (sent) messagesSent++
          }
        }
      }

      // Update campaign metrics
      await supabase
        .from("reactivation_campaigns")
        .update({
          messages_sent: campaign.messages_sent + messagesSent,
        })
        .eq("id", campaign.id)

      results.push({
        campaignId: campaign.id,
        contactsProcessed: eligibleContacts.length,
        messagesSent,
      })
    }

    return NextResponse.json({
      processed: campaigns?.length || 0,
      results,
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error("Cron processing error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function isInDNDPeriod(campaign: any, now: Date): boolean {
  if (!campaign.dnd_start_time || !campaign.dnd_end_time) return false

  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTime = currentHour * 60 + currentMinute

  const [startHour, startMinute] = campaign.dnd_start_time.split(":").map(Number)
  const [endHour, endMinute] = campaign.dnd_end_time.split(":").map(Number)

  const startTime = startHour * 60 + startMinute
  const endTime = endHour * 60 + endMinute

  // Check if current day is in DND days
  const currentDay = now.getDay()
  if (campaign.dnd_days?.includes(currentDay)) return true

  // Check DND hours (handle overnight periods)
  if (startTime > endTime) {
    // Overnight period (e.g., 21:00 to 09:00)
    return currentTime >= startTime || currentTime < endTime
  } else {
    // Same day period
    return currentTime >= startTime && currentTime < endTime
  }
}

function isInGlobalDND(settings: any, now: Date): boolean {
  if (!settings.dnd_start_time || !settings.dnd_end_time) return false

  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTime = currentHour * 60 + currentMinute

  const [startHour, startMinute] = settings.dnd_start_time.split(":").map(Number)
  const [endHour, endMinute] = settings.dnd_end_time.split(":").map(Number)

  const startTime = startHour * 60 + startMinute
  const endTime = endHour * 60 + endMinute

  const currentDay = now.getDay()
  if (settings.dnd_days?.includes(currentDay)) return true

  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime
  } else {
    return currentTime >= startTime && currentTime < endTime
  }
}

async function getEligibleContacts(supabase: any, campaign: any, settings: any) {
  // Base query for active, opted-in contacts
  let query = supabase
    .from("reactivation_contacts")
    .select("*")
    .eq("user_id", campaign.user_id)
    .eq("status", "active")

  // If campaign has specific contact IDs, use those
  if (campaign.contact_ids && campaign.contact_ids.length > 0) {
    query = query.in("id", campaign.contact_ids)
  }

  // Apply segment filters if defined
  if (campaign.target_segments) {
    const segments = campaign.target_segments

    if (segments.min_spend) {
      query = query.gte("total_spend", segments.min_spend)
    }
    if (segments.max_spend) {
      query = query.lte("total_spend", segments.max_spend)
    }
    if (segments.min_rental_count) {
      query = query.gte("rental_count", segments.min_rental_count)
    }
    if (segments.vehicle_types && segments.vehicle_types.length > 0) {
      query = query.in("preferred_vehicle_type", segments.vehicle_types)
    }
  }

  const { data, error } = await query.limit(100) // Process in batches

  if (error) {
    console.error("Error fetching contacts:", error)
    return []
  }

  return data || []
}

async function checkFrequencyLimits(
  supabase: any,
  campaign: any,
  contact: any,
  settings: any
): Promise<boolean> {
  const now = new Date()

  // Check campaign-specific limits
  const { data: campaignMessages } = await supabase
    .from("reactivation_campaign_messages")
    .select("id, sent_at")
    .eq("campaign_id", campaign.id)
    .eq("contact_id", contact.id)

  // Check max messages per contact for this campaign
  if (campaignMessages && campaignMessages.length >= (campaign.max_messages_per_contact || 3)) {
    return false
  }

  // Check min days between messages
  if (campaignMessages && campaignMessages.length > 0) {
    const lastMessage = campaignMessages.sort(
      (a: any, b: any) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
    )[0]

    if (lastMessage.sent_at) {
      const daysSinceLastMessage = Math.floor(
        (now.getTime() - new Date(lastMessage.sent_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceLastMessage < (campaign.min_days_between_messages || 7)) {
        return false
      }
    }
  }

  // Check global monthly limit
  if (settings?.max_messages_per_contact_per_month) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const { count } = await supabase
      .from("reactivation_campaign_messages")
      .select("id", { count: "exact" })
      .eq("contact_id", contact.id)
      .gte("sent_at", monthStart.toISOString())

    if (count && count >= settings.max_messages_per_contact_per_month) {
      return false
    }
  }

  // Check global min days between any message
  if (settings?.min_days_between_any_message) {
    const { data: recentMessages } = await supabase
      .from("reactivation_campaign_messages")
      .select("sent_at")
      .eq("contact_id", contact.id)
      .order("sent_at", { ascending: false })
      .limit(1)

    if (recentMessages && recentMessages.length > 0) {
      const daysSinceAnyMessage = Math.floor(
        (now.getTime() - new Date(recentMessages[0].sent_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceAnyMessage < settings.min_days_between_any_message) {
        return false
      }
    }
  }

  return true
}

async function sendSMSMessage(supabase: any, campaign: any, contact: any): Promise<boolean> {
  try {
    // Get template or generate AI message
    let messageContent = ""

    if (campaign.template_id) {
      const { data: template } = await supabase
        .from("reactivation_templates")
        .select("content")
        .eq("id", campaign.template_id)
        .single()

      if (template) {
        messageContent = personalizeMessage(template.content, contact, campaign)
      }
    }

    // If no template, skip (would need AI generation here)
    if (!messageContent) {
      return false
    }

    // Get user's Twilio credentials from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("twilio_account_sid, twilio_auth_token, twilio_phone_number")
      .eq("id", campaign.user_id)
      .single()

    if (!profile?.twilio_account_sid || !profile?.twilio_auth_token || !profile?.twilio_phone_number) {
      console.error("Missing Twilio credentials for user:", campaign.user_id)
      return false
    }

    // Send via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${profile.twilio_account_sid}/Messages.json`
    const auth = Buffer.from(`${profile.twilio_account_sid}:${profile.twilio_auth_token}`).toString("base64")

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: contact.phone,
        From: profile.twilio_phone_number,
        Body: messageContent,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Twilio error:", errorText)
      return false
    }

    const result = await response.json()

    // Record the message
    await supabase.from("reactivation_campaign_messages").insert({
      campaign_id: campaign.id,
      contact_id: contact.id,
      user_id: campaign.user_id,
      channel: "sms",
      content: messageContent,
      status: "sent",
      sent_at: new Date().toISOString(),
      twilio_message_sid: result.sid,
    })

    // Update contact's last contacted timestamp
    await supabase
      .from("reactivation_contacts")
      .update({
        last_contacted_at: new Date().toISOString(),
        total_messages_sent: contact.total_messages_sent + 1,
      })
      .eq("id", contact.id)

    return true
  } catch (error) {
    console.error("SMS send error:", error)
    return false
  }
}

async function sendEmailMessage(
  supabase: any,
  campaign: any,
  contact: any,
  settings: any
): Promise<boolean> {
  // Email sending would use Resend or similar
  // For now, just record the attempt
  console.log(`Would send email to ${contact.email} for campaign ${campaign.id}`)
  return false
}

function personalizeMessage(template: string, contact: any, campaign: any): string {
  let message = template

  // Calculate days since last rental
  let daysSinceRental = "a while"
  if (contact.last_rental_date) {
    const lastRental = new Date(contact.last_rental_date)
    const now = new Date()
    const days = Math.floor((now.getTime() - lastRental.getTime()) / (1000 * 60 * 60 * 24))
    daysSinceRental = days.toString()
  }

  // Replace variables
  const replacements: Record<string, string> = {
    "{{name}}": contact.name?.split(" ")[0] || "there",
    "{{full_name}}": contact.name || "Valued Customer",
    "{{last_vehicle}}": contact.preferred_vehicle_type || "one of our amazing vehicles",
    "{{days_since_rental}}": daysSinceRental,
    "{{total_rentals}}": (contact.rental_count || 0).toString(),
    "{{business_name}}": "Scale Exotics", // Would come from user profile
    "{{offer_code}}": "COMEBACK20",
    "{{offer_amount}}": "20%",
  }

  Object.entries(replacements).forEach(([variable, value]) => {
    message = message.replace(new RegExp(variable.replace(/[{}]/g, "\\$&"), "g"), value)
  })

  return message
}
