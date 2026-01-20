// Reactivation Email Utility using Resend
// Install: npm install resend
// Add RESEND_API_KEY to environment variables

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
  fromName: string
  replyTo?: string
  campaignId: string
  contactId: string
  messageId: string
}

interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendReactivationEmail(params: SendEmailParams): Promise<EmailResponse> {
  const { to, subject, html, text, fromName, replyTo, campaignId, contactId, messageId } = params

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <reactivation@${process.env.EMAIL_DOMAIN || "mail.scaleexotics.com"}>`,
        to: [to],
        subject,
        html,
        text: text || stripHtml(html),
        reply_to: replyTo,
        headers: {
          "X-Campaign-ID": campaignId,
          "X-Contact-ID": contactId,
          "X-Message-ID": messageId,
        },
        tags: [
          { name: "campaign_id", value: campaignId },
          { name: "contact_id", value: contactId },
          { name: "message_id", value: messageId },
          { name: "type", value: "reactivation" },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Resend API error:", errorData)
      return { success: false, error: errorData.message || "Failed to send email" }
    }

    const data = await response.json()
    return { success: true, messageId: data.id }
  } catch (error: any) {
    console.error("Email send error:", error)
    return { success: false, error: error.message }
  }
}

// Generate HTML email template
export function generateEmailHtml(params: {
  content: string
  businessName: string
  unsubscribeUrl: string
  previewText?: string
}): string {
  const { content, businessName, unsubscribeUrl, previewText } = params

  // Convert line breaks to paragraphs
  const formattedContent = content
    .split("\n\n")
    .map((p) => `<p style="margin: 0 0 16px 0; line-height: 1.6;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("")

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName}</title>
  ${previewText ? `<!--[if !mso]><!--><span style="display:none;font-size:0;max-height:0;line-height:0;mso-hide:all">${previewText}</span><!--<![endif]-->` : ""}
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #111111; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">${businessName}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px; color: #e5e5e5; font-size: 16px;">
              ${formattedContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: rgba(255,255,255,0.4);">
                You're receiving this because you previously rented with ${businessName}.
              </p>
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.4);">
                <a href="${unsubscribeUrl}" style="color: rgba(255,255,255,0.5); text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// Strip HTML tags for plain text version
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// Personalize email content with contact variables
export function personalizeEmailContent(
  template: string,
  contact: {
    name?: string
    email?: string
    last_rental_date?: string
    total_spend?: number
    rental_count?: number
    preferred_vehicle_type?: string
  },
  variables?: Record<string, string>
): string {
  let content = template

  // Calculate days since last rental
  let daysSinceRental = "a while"
  if (contact.last_rental_date) {
    const lastRental = new Date(contact.last_rental_date)
    const now = new Date()
    const days = Math.floor((now.getTime() - lastRental.getTime()) / (1000 * 60 * 60 * 24))
    daysSinceRental = days.toString()
  }

  // Default replacements
  const replacements: Record<string, string> = {
    "{{name}}": contact.name?.split(" ")[0] || "there",
    "{{full_name}}": contact.name || "Valued Customer",
    "{{email}}": contact.email || "",
    "{{last_vehicle}}": contact.preferred_vehicle_type || "one of our amazing vehicles",
    "{{days_since_rental}}": daysSinceRental,
    "{{total_rentals}}": (contact.rental_count || 0).toString(),
    "{{total_spent}}": `$${(contact.total_spend || 0).toLocaleString()}`,
    ...variables,
  }

  // Replace all variables
  Object.entries(replacements).forEach(([variable, value]) => {
    const regex = new RegExp(variable.replace(/[{}]/g, "\\$&"), "g")
    content = content.replace(regex, value)
  })

  return content
}
