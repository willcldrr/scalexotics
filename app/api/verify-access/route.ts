import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: "Access code is required" },
        { status: 400 }
      )
    }

    // Get valid access codes from environment variable
    // Can be a comma-separated list for multiple codes
    const validCodes = process.env.ACCESS_CODES?.split(",").map(c => c.trim().toUpperCase()) || []

    // Also support a single ACCESS_CODE variable
    const singleCode = process.env.ACCESS_CODE?.trim().toUpperCase()
    if (singleCode) {
      validCodes.push(singleCode)
    }

    if (validCodes.length === 0) {
      // If no codes are configured, reject all attempts
      console.error("No ACCESS_CODE or ACCESS_CODES environment variable configured")
      return NextResponse.json(
        { error: "Access verification is not configured" },
        { status: 500 }
      )
    }

    const submittedCode = code.trim().toUpperCase()

    if (validCodes.includes(submittedCode)) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: "Invalid access code" },
      { status: 401 }
    )
  } catch (error) {
    console.error("Error verifying access code:", error)
    return NextResponse.json(
      { error: "Failed to verify access code" },
      { status: 500 }
    )
  }
}
