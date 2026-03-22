import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Handle Instagram OAuth callback
 * Exchanges auth code for access token and stores credentials
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  const dashboardUrl = new URL("/dashboard/settings", request.url)

  // Handle OAuth errors
  if (error) {
    console.error("[Instagram OAuth] Error:", error, errorDescription)
    dashboardUrl.searchParams.set("instagram_error", errorDescription || error)
    return NextResponse.redirect(dashboardUrl)
  }

  if (!code || !state) {
    dashboardUrl.searchParams.set("instagram_error", "Missing authorization code")
    return NextResponse.redirect(dashboardUrl)
  }

  // Verify state from cookie
  const storedState = request.cookies.get("instagram_oauth_state")?.value
  if (state !== storedState) {
    dashboardUrl.searchParams.set("instagram_error", "Invalid state parameter")
    return NextResponse.redirect(dashboardUrl)
  }

  // Decode state to get user ID
  let userId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString())
    userId = decoded.userId
  } catch {
    dashboardUrl.searchParams.set("instagram_error", "Invalid state format")
    return NextResponse.redirect(dashboardUrl)
  }

  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/callback`

  if (!appId || !appSecret) {
    dashboardUrl.searchParams.set("instagram_error", "Meta App not configured")
    return NextResponse.redirect(dashboardUrl)
  }

  try {
    // Exchange code for short-lived access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code: code,
      }).toString()
    )

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("[Instagram OAuth] Token exchange failed:", errorData)
      dashboardUrl.searchParams.set("instagram_error", "Failed to get access token")
      return NextResponse.redirect(dashboardUrl)
    }

    const tokenData = await tokenResponse.json()
    const shortLivedToken = tokenData.access_token

    // Exchange for long-lived token (60 days)
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortLivedToken,
      }).toString()
    )

    if (!longLivedResponse.ok) {
      const errorData = await longLivedResponse.json()
      console.error("[Instagram OAuth] Long-lived token exchange failed:", errorData)
      dashboardUrl.searchParams.set("instagram_error", "Failed to get long-lived token")
      return NextResponse.redirect(dashboardUrl)
    }

    const longLivedData = await longLivedResponse.json()
    const accessToken = longLivedData.access_token
    const expiresIn = longLivedData.expires_in || 5184000 // Default 60 days

    // Get user's Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    )

    if (!pagesResponse.ok) {
      console.error("[Instagram OAuth] Failed to get pages")
      dashboardUrl.searchParams.set("instagram_error", "Failed to get Facebook pages")
      return NextResponse.redirect(dashboardUrl)
    }

    const pagesData = await pagesResponse.json()
    const pages = pagesData.data || []

    if (pages.length === 0) {
      dashboardUrl.searchParams.set("instagram_error", "No Facebook pages found. Please create a Facebook page and link your Instagram account to it.")
      return NextResponse.redirect(dashboardUrl)
    }

    // Get Instagram Business Account for the first page
    // In a production app, you'd let the user choose which page/account
    let instagramAccountId: string | null = null
    let instagramUsername: string | null = null
    let pageAccessToken: string | null = null
    let pageName: string | null = null

    for (const page of pages) {
      const igResponse = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account,name&access_token=${page.access_token}`
      )

      if (igResponse.ok) {
        const igData = await igResponse.json()
        if (igData.instagram_business_account) {
          instagramAccountId = igData.instagram_business_account.id
          pageAccessToken = page.access_token
          pageName = igData.name

          // Get Instagram username
          const usernameResponse = await fetch(
            `https://graph.facebook.com/v19.0/${instagramAccountId}?fields=username&access_token=${page.access_token}`
          )
          if (usernameResponse.ok) {
            const usernameData = await usernameResponse.json()
            instagramUsername = usernameData.username
          }
          break
        }
      }
    }

    if (!instagramAccountId || !pageAccessToken) {
      dashboardUrl.searchParams.set("instagram_error", "No Instagram Business account found. Make sure your Instagram is a Business or Creator account and linked to a Facebook page.")
      return NextResponse.redirect(dashboardUrl)
    }

    // Store credentials in database
    const supabase = getSupabase()
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Upsert instagram_connections record
    const { error: upsertError } = await supabase
      .from("instagram_connections")
      .upsert({
        user_id: userId,
        instagram_account_id: instagramAccountId,
        instagram_username: instagramUsername,
        page_name: pageName,
        access_token: pageAccessToken,
        token_expires_at: expiresAt,
        connected_at: new Date().toISOString(),
        is_active: true,
      }, {
        onConflict: "user_id",
      })

    if (upsertError) {
      console.error("[Instagram OAuth] Failed to store credentials:", upsertError)
      dashboardUrl.searchParams.set("instagram_error", "Failed to save connection")
      return NextResponse.redirect(dashboardUrl)
    }

    // Clear the state cookie
    const response = NextResponse.redirect(dashboardUrl)
    response.cookies.delete("instagram_oauth_state")
    dashboardUrl.searchParams.set("instagram_success", "true")

    return NextResponse.redirect(dashboardUrl)
  } catch (err) {
    console.error("[Instagram OAuth] Error:", err)
    dashboardUrl.searchParams.set("instagram_error", "An unexpected error occurred")
    return NextResponse.redirect(dashboardUrl)
  }
}
