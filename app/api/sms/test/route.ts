import { NextResponse } from "next/server"
import twilio from "twilio"

function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
}

export async function GET() {
  try {
    const client = getTwilioClient()

    // Test the connection by fetching account info
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch()

    return NextResponse.json({
      success: true,
      status: account.status,
      friendlyName: account.friendlyName,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    })
  } catch (error: any) {
    console.error("Twilio test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to connect to Twilio",
      },
      { status: 500 }
    )
  }
}
