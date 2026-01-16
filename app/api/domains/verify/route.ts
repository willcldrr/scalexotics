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

    // If domain not found in Vercel, try to add it
    if (vercelResponse.status === 404) {
      console.log("Domain not found in Vercel, attempting to add:", customDomain.domain)

      const addUrl = VERCEL_TEAM_ID
        ? `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_TEAM_ID}`
        : `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`

      const addResponse = await fetch(addUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: customDomain.domain }),
      })

      const addData = await addResponse.json()

      if (addResponse.ok || addData.error?.code === "domain_already_in_use") {
        return NextResponse.json({
          domain: customDomain,
          status: "added_to_vercel",
          message: "Domain has been added to Vercel. Please wait a few minutes for DNS to propagate, then verify again.",
          debug: { action: "added", vercelResponse: addData }
        })
      } else {
        return NextResponse.json({
          domain: customDomain,
          status: "vercel_error",
          message: addData.error?.message || "Failed to add domain to Vercel",
          debug: { action: "add_failed", vercelResponse: addData }
        })
      }
    }

    if (!vercelResponse.ok) {
      const errorData = await vercelResponse.json()
      return NextResponse.json({
        domain: customDomain,
        status: "vercel_error",
        message: "Failed to check domain status with Vercel",
        debug: { vercelStatus: vercelResponse.status, vercelResponse: errorData }
      })
    }

    const vercelData = await vercelResponse.json()

    // Determine status based on Vercel response
    let verified = false
    let sslStatus = customDomain.ssl_status

    if (vercelData.verified) {
      verified = true
      sslStatus = "active"
    } else if (vercelData.verification) {
      // DNS not configured yet - show what Vercel expects
      sslStatus = "awaiting_dns"
    }

    // Update database if status changed
    if (verified !== customDomain.verified || sslStatus !== customDomain.ssl_status) {
      await supabase
        .from("custom_domains")
        .update({ verified, ssl_status: sslStatus })
        .eq("id", customDomain.id)
    }

    // Build helpful message based on verification requirements
    let message = verified
      ? "Domain verified and SSL active!"
      : "Waiting for DNS configuration."

    if (!verified && vercelData.verification) {
      const verificationInfo = vercelData.verification
      message = `DNS not yet verified. Vercel is looking for: ${JSON.stringify(verificationInfo)}`
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
        // Include more debug info
        name: vercelData.name,
        apexName: vercelData.apexName,
        projectId: vercelData.projectId,
        gitBranch: vercelData.gitBranch,
      },
      message,
    })
  } catch (err) {
    console.error("Domain verification error:", err)
    return NextResponse.json({
      domain: customDomain,
      error: "Failed to verify domain status",
      debug: { errorMessage: err instanceof Error ? err.message : "Unknown error" }
    }, { status: 500 })
  }
}
