import { NextRequest, NextResponse } from "next/server"

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

// Debug endpoint to test Vercel API connection
// DELETE THIS FILE AFTER DEBUGGING
export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {
    env: {
      hasToken: !!VERCEL_API_TOKEN,
      tokenPrefix: VERCEL_API_TOKEN?.substring(0, 8) + "...",
      projectId: VERCEL_PROJECT_ID,
      teamId: VERCEL_TEAM_ID || "(not set)",
    },
  }

  // Test 1: List current domains on project
  if (VERCEL_API_TOKEN && VERCEL_PROJECT_ID) {
    try {
      const listUrl = VERCEL_TEAM_ID
        ? `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_TEAM_ID}`
        : `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains`

      const listResponse = await fetch(listUrl, {
        headers: {
          Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        },
      })

      const listData = await listResponse.json()
      results.listDomains = {
        status: listResponse.status,
        ok: listResponse.ok,
        data: listData,
      }
    } catch (err) {
      results.listDomains = { error: err instanceof Error ? err.message : "Unknown error" }
    }

    // Test 2: Try to add the test domain
    try {
      const addUrl = VERCEL_TEAM_ID
        ? `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_TEAM_ID}`
        : `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`

      const addResponse = await fetch(addUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "book.rentalcapture.xyz" }),
      })

      const addData = await addResponse.json()
      results.addDomain = {
        status: addResponse.status,
        ok: addResponse.ok,
        data: addData,
      }
    } catch (err) {
      results.addDomain = { error: err instanceof Error ? err.message : "Unknown error" }
    }
  }

  return NextResponse.json(results, { status: 200 })
}
