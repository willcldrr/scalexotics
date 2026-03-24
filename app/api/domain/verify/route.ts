import { NextResponse } from "next/server"
import dns from "dns"
import { promisify } from "util"

const resolveCname = promisify(dns.resolveCname)

export async function POST(request: Request) {
  try {
    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    // Clean the domain (remove protocol if present)
    const cleanDomain = domain.replace(/^https?:\/\//, '').toLowerCase()

    try {
      // Try to resolve CNAME record
      const records = await resolveCname(cleanDomain)

      // Check if any CNAME points to Vercel
      const isVerified = records.some(
        (record) => record.toLowerCase().includes('vercel') ||
                    record.toLowerCase().includes('vercel-dns.com')
      )

      if (isVerified) {
        return NextResponse.json({
          verified: true,
          message: "Domain is correctly configured",
          records
        })
      } else {
        return NextResponse.json({
          verified: false,
          message: "CNAME record found but not pointing to Vercel",
          records
        })
      }
    } catch (dnsError: unknown) {
      // DNS lookup failed - domain not configured yet
      const errorCode = (dnsError as { code?: string })?.code
      if (errorCode === 'ENOTFOUND' || errorCode === 'ENODATA') {
        return NextResponse.json({
          verified: false,
          message: "No CNAME record found. Please add the DNS record and wait for propagation."
        })
      }

      return NextResponse.json({
        verified: false,
        message: "DNS lookup failed. The domain may not exist or DNS hasn't propagated yet."
      })
    }
  } catch (error) {
    console.error("Domain verification error:", error)
    return NextResponse.json(
      { error: "Failed to verify domain" },
      { status: 500 }
    )
  }
}
