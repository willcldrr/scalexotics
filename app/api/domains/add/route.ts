import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { domain } = await request.json()

  if (!domain) {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 })
  }

  // Clean domain (remove protocol, trailing slash)
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase()
    .trim()

  // Validate domain format
  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/
  if (!domainRegex.test(cleanDomain)) {
    return NextResponse.json({ error: "Please enter a valid domain (e.g., book.yourdomain.com)" }, { status: 400 })
  }

  // Require subdomain to protect user's main website
  // Count domain parts: "book.example.com" = 3 parts, "example.com" = 2 parts
  const domainParts = cleanDomain.split('.')
  const isRootDomain = domainParts.length === 2 ||
    (domainParts.length === 3 && ['co', 'com', 'org', 'net'].includes(domainParts[1])) // Handle .co.uk, .com.au etc.

  if (isRootDomain) {
    return NextResponse.json({
      error: "Please use a subdomain (e.g., book." + cleanDomain + ") to avoid affecting your main website. Adding your root domain would redirect ALL your website traffic to Scale Exotics."
    }, { status: 400 })
  }

  // Check if domain already exists for another user
  const { data: existing } = await supabase
    .from("custom_domains")
    .select("id, user_id")
    .eq("domain", cleanDomain)
    .single()

  if (existing && existing.user_id !== user.id) {
    return NextResponse.json({ error: "This domain is already registered by another user" }, { status: 400 })
  }

  // If user already has this domain, just return it
  if (existing && existing.user_id === user.id) {
    const { data: existingDomain } = await supabase
      .from("custom_domains")
      .select("*")
      .eq("id", existing.id)
      .single()
    return NextResponse.json({ domain: existingDomain, message: "Domain already configured" })
  }

  // Delete any existing domain for this user (one domain per user)
  await supabase
    .from("custom_domains")
    .delete()
    .eq("user_id", user.id)

  // Add domain to Vercel
  let vercelStatus = "pending"
  let vercelError = null

  if (VERCEL_API_TOKEN && VERCEL_PROJECT_ID) {
    try {
      const vercelUrl = VERCEL_TEAM_ID
        ? `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_TEAM_ID}`
        : `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`

      const vercelResponse = await fetch(vercelUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: cleanDomain }),
      })

      const vercelData = await vercelResponse.json()

      if (vercelResponse.ok) {
        vercelStatus = "awaiting_dns"
      } else if (vercelData.error?.code === "domain_already_in_use") {
        // Domain might already be added to this project
        vercelStatus = "awaiting_dns"
      } else {
        console.error("Vercel API error:", vercelData)
        vercelError = vercelData.error?.message || "Failed to add domain to Vercel"
      }
    } catch (err) {
      console.error("Vercel API error:", err)
      vercelError = "Failed to connect to Vercel"
    }
  } else {
    vercelError = "Vercel API not configured. Please contact support."
  }

  // Add to database
  const { data: newDomain, error: dbError } = await supabase
    .from("custom_domains")
    .insert({
      user_id: user.id,
      domain: cleanDomain,
      ssl_status: vercelStatus,
      verified: false,
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({
    domain: newDomain,
    vercelStatus,
    vercelError,
    message: vercelStatus === "awaiting_dns"
      ? "Domain added. Please configure your DNS."
      : vercelError || "Domain saved but Vercel configuration pending.",
  })
}
