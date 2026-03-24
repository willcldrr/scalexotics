import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    // Clean the domain (remove protocol if present)
    const cleanDomain = domain.replace(/^https?:\/\//, '').toLowerCase()

    try {
      // Use Google's DNS-over-HTTPS API for reliable, uncached lookups
      const dnsResponse = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=CNAME`,
        { cache: 'no-store' }
      )

      const dnsData = await dnsResponse.json()

      // Check if we got CNAME records
      if (dnsData.Answer && dnsData.Answer.length > 0) {
        const cnameRecords = dnsData.Answer
          .filter((record: { type: number }) => record.type === 5) // Type 5 = CNAME
          .map((record: { data: string }) => record.data.replace(/\.$/, '')) // Remove trailing dot

        // Check if any CNAME points to Vercel
        const isVerified = cnameRecords.some(
          (record: string) => record.toLowerCase().includes('vercel') ||
                      record.toLowerCase().includes('vercel-dns.com')
        )

        if (isVerified) {
          return NextResponse.json({
            verified: true,
            message: "Domain is correctly configured",
            records: cnameRecords
          })
        } else {
          return NextResponse.json({
            verified: false,
            message: "CNAME record found but not pointing to Vercel",
            records: cnameRecords
          })
        }
      }

      // No CNAME records found - check if there's an A record (might be using root domain)
      const aResponse = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=A`,
        { cache: 'no-store' }
      )
      const aData = await aResponse.json()

      if (aData.Answer && aData.Answer.length > 0) {
        // Has A records but no CNAME - might be configured differently
        return NextResponse.json({
          verified: false,
          message: "Domain has A records but no CNAME. For subdomains, use a CNAME pointing to cname.vercel-dns.com",
          records: aData.Answer.map((r: { data: string }) => r.data)
        })
      }

      return NextResponse.json({
        verified: false,
        message: "No DNS records found. Please add the CNAME record and wait for propagation."
      })

    } catch (dnsError) {
      console.error("DNS lookup error:", dnsError)
      return NextResponse.json({
        verified: false,
        message: "DNS lookup failed. Please try again."
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
