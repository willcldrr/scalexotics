import { NextRequest, NextResponse } from "next/server"
import { lookupPaymentToken, decodePaymentToken } from "@/lib/payment-link"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "No token provided" },
        { status: 400 }
      )
    }

    // Try database lookup first (for short tokens)
    let data = await lookupPaymentToken(token)

    // Fall back to legacy decode for old-style tokens
    if (!data) {
      data = decodePaymentToken(token)
    }

    if (!data) {
      return NextResponse.json(
        { valid: false, error: "Invalid or expired payment link" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      data,
    })
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json(
      { valid: false, error: "Failed to validate token" },
      { status: 500 }
    )
  }
}
