import { NextResponse } from "next/server"

/**
 * Check if Instagram API is configured
 */
export async function GET() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID
  const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN
  const appSecret = process.env.INSTAGRAM_APP_SECRET

  // Check if all required credentials are present
  const configured = !!(accessToken && accountId && verifyToken && appSecret)

  if (!configured) {
    return NextResponse.json({
      configured: false,
      message: "Instagram API credentials not configured",
      missing: {
        accessToken: !accessToken,
        accountId: !accountId,
        verifyToken: !verifyToken,
        appSecret: !appSecret,
      },
    })
  }

  // Optionally verify the token is valid by making a test API call
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}?fields=id,username&access_token=${accessToken}`
    )

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        configured: true,
        connected: true,
        accountId: data.id,
        username: data.username,
      })
    } else {
      const error = await response.json()
      return NextResponse.json({
        configured: true,
        connected: false,
        error: error.error?.message || "Failed to verify Instagram connection",
      })
    }
  } catch (error) {
    return NextResponse.json({
      configured: true,
      connected: false,
      error: "Failed to connect to Instagram API",
    })
  }
}
