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

  // Get user's domain
  const { data: customDomain } = await supabase
    .from("custom_domains")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!customDomain) {
    return NextResponse.json({ error: "No domain configured" }, { status: 404 })
  }

  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    return NextResponse.json({
      error: "Vercel API not configured",
      domain: customDomain
    }, { status: 500 })
  }

  try {
    // Check domain status from Vercel
    const vercelUrl = VERCEL_TEAM_ID
      ? `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${customDomain.domain}?teamId=${VERCEL_TEAM_ID}`
      : `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${customDomain.domain}`

    const vercelResponse = await fetch(vercelUrl, {
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
      },
    })

    if (!vercelResponse.ok) {
      // Domain might not be added to Vercel yet
      if (vercelResponse.status === 404) {
        return NextResponse.json({
          domain: customDomain,
          status: "not_found",
          message: "Domain not found in Vercel. Try re-adding it.",
        })
      }
      throw new Error("Failed to fetch domain status")
    }

    const vercelData = await vercelResponse.json()

    // Determine status based on Vercel response
    let verified = false
    let sslStatus = customDomain.ssl_status

    if (vercelData.verified) {
      verified = true
      sslStatus = "active"
    } else if (vercelData.verification) {
      // DNS not configured yet
      sslStatus = "awaiting_dns"
    }

    // Update database if status changed
    if (verified !== customDomain.verified || sslStatus !== customDomain.ssl_status) {
      await supabase
        .from("custom_domains")
        .update({ verified, ssl_status: sslStatus })
        .eq("id", customDomain.id)
    }

    return NextResponse.json({
      domain: {
        ...customDomain,
        verified,
        ssl_status: sslStatus,
      },
      vercelData: {
        verified: vercelData.verified,
        verification: vercelData.verification,
      },
      message: verified
        ? "Domain verified and SSL active!"
        : "Waiting for DNS configuration. Make sure your CNAME record is set correctly.",
    })
  } catch (err) {
    console.error("Domain verification error:", err)
    return NextResponse.json({
      domain: customDomain,
      error: "Failed to verify domain status",
    }, { status: 500 })
  }
}
