import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// List of primary domains (not custom domains)
const PRIMARY_DOMAINS = [
  "scalexotics.com",
  "www.scalexotics.com",
  "localhost",
  "localhost:3000",
  "127.0.0.1",
  "127.0.0.1:3000",
]

export interface DomainOwner {
  userId: string
  domain: string
  verified: boolean
}

/**
 * Check if a hostname is a custom domain and return the owner's user_id
 */
export async function getCustomDomainOwner(hostname: string): Promise<DomainOwner | null> {
  // Normalize hostname (remove port, lowercase)
  const normalizedHost = hostname.split(":")[0].toLowerCase()

  // Check if this is a primary domain
  if (PRIMARY_DOMAINS.some(d => normalizedHost === d || normalizedHost.endsWith(`.${d.split(":")[0]}`))) {
    return null
  }

  // Check if it's a Vercel preview URL
  if (normalizedHost.includes("vercel.app")) {
    return null
  }

  // Look up in custom_domains table
  const { data, error } = await supabase
    .from("custom_domains")
    .select("user_id, domain, verified")
    .eq("domain", normalizedHost)
    .single()

  if (error || !data) {
    return null
  }

  return {
    userId: data.user_id,
    domain: data.domain,
    verified: data.verified,
  }
}

/**
 * Get branding for a custom domain
 */
export async function getBrandingForDomain(hostname: string) {
  const owner = await getCustomDomainOwner(hostname)

  if (!owner) {
    return null
  }

  const { data: branding } = await supabase
    .from("business_branding")
    .select("*")
    .eq("user_id", owner.userId)
    .single()

  return branding
}

/**
 * Mark a domain as verified (called by verification cron/webhook)
 */
export async function verifyDomain(domain: string): Promise<boolean> {
  const { error } = await supabase
    .from("custom_domains")
    .update({
      verified: true,
      verified_at: new Date().toISOString(),
      ssl_status: "active",
    })
    .eq("domain", domain)

  return !error
}
