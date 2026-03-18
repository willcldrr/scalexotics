import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

const EXPIRATION_HOURS = 24

export interface PaymentLinkData {
  vehicleId: string
  vehicleName: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  dailyRate: number
  totalAmount: number
  depositAmount: number
  customerName: string
  customerPhone: string
  businessName?: string
  // Stripe keys for multi-tenant support
  stripePublishableKey?: string
  stripeSecretKey?: string
  // Custom payment domain (e.g., "exoticrentals.com" - defaults to rentalcapture.xyz)
  paymentDomain?: string
}

interface StoredPaymentLink extends PaymentLinkData {
  id: string
  short_token: string
  expires_at: string
  created_at: string
  used_at: string | null
}

// Default payment domain
const DEFAULT_PAYMENT_DOMAIN = "https://rentalcapture.xyz/checkout"

/**
 * Get the payment link domain
 * Priority: custom domain > env variable > default (rentalcapture.xyz)
 */
function getPaymentDomain(customDomain?: string): string {
  if (customDomain) {
    // Normalize the custom domain
    const domain = customDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "")
    return `https://${domain}/checkout`
  }
  return process.env.PAYMENT_LINK_DOMAIN || DEFAULT_PAYMENT_DOMAIN
}

/**
 * Generate a short, readable token in format: XXXXXXX-XXXXXXX-XXXXX
 * Uses alphanumeric characters (excluding confusing ones like 0/O, 1/I/l)
 */
function generateShortToken(): string {
  // Alphanumeric without confusing characters
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

  const generateSegment = (length: number): string => {
    const bytes = crypto.randomBytes(length)
    let result = ""
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length]
    }
    return result
  }

  return `${generateSegment(7)}-${generateSegment(7)}-${generateSegment(5)}`
}

/**
 * Get Supabase client for server-side operations
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables not configured")
  }

  return createClient(supabaseUrl, supabaseKey)
}

/**
 * Generate a secure payment link with a short, readable token
 * Stores payment data in database and returns a short URL
 *
 * @param data - Payment/booking data to store
 * @returns Full payment URL with short token (e.g., /checkout/ABC1234-XYZ5678-12345)
 */
export async function generateSecurePaymentLink(data: PaymentLinkData): Promise<string> {
  const domain = getPaymentDomain(data.paymentDomain)
  const shortToken = generateShortToken()

  // Calculate expiration
  const expiresAt = new Date(Date.now() + EXPIRATION_HOURS * 60 * 60 * 1000).toISOString()

  try {
    const supabase = getSupabaseClient()

    // Store payment link in database
    const { error } = await supabase.from("payment_links").insert({
      short_token: shortToken,
      vehicle_id: data.vehicleId,
      vehicle_name: data.vehicleName,
      start_date: data.startDate,
      end_date: data.endDate,
      daily_rate: data.dailyRate,
      total_amount: data.totalAmount,
      deposit_amount: data.depositAmount,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      business_name: data.businessName || "Velocity Exotics",
      expires_at: expiresAt,
      // Store Stripe keys for multi-tenant checkout
      stripe_publishable_key: data.stripePublishableKey || null,
      stripe_secret_key: data.stripeSecretKey || null,
      // Store custom payment domain
      payment_domain: data.paymentDomain || null,
    })

    if (error) {
      console.error("Failed to store payment link:", error)
      throw new Error("Failed to create payment link")
    }

    return `${domain}/${shortToken}`
  } catch (error) {
    console.error("Payment link generation error:", error)
    throw error
  }
}

/**
 * Legacy sync version - generates token without DB storage
 * Used as fallback if DB is unavailable
 */
export function generateSecurePaymentLinkSync(data: PaymentLinkData): string {
  const domain = getPaymentDomain()
  const shortToken = generateShortToken()

  // For sync version, encode minimal data in token itself
  // This is a fallback and won't persist
  console.warn("Using sync payment link generation - link data will not be persisted")

  const payload = Buffer.from(JSON.stringify({
    ...data,
    exp: Date.now() + EXPIRATION_HOURS * 60 * 60 * 1000,
  })).toString("base64url")

  return `${domain}/${shortToken}?d=${payload}`
}

/**
 * Look up payment data by short token from database
 *
 * @param shortToken - The short token (e.g., ABC1234-XYZ5678-12345)
 * @returns Payment data or null if not found/expired
 */
export async function lookupPaymentToken(shortToken: string): Promise<PaymentLinkData | null> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("payment_links")
      .select("*")
      .eq("short_token", shortToken.toUpperCase())
      .single()

    if (error || !data) {
      console.error("Payment link not found:", error)
      return null
    }

    // Check expiration
    if (new Date(data.expires_at) < new Date()) {
      console.error("Payment link expired")
      return null
    }

    // Check if already used
    if (data.used_at) {
      console.error("Payment link already used")
      return null
    }

    return {
      vehicleId: data.vehicle_id,
      vehicleName: data.vehicle_name,
      startDate: data.start_date,
      endDate: data.end_date,
      dailyRate: data.daily_rate,
      totalAmount: data.total_amount,
      depositAmount: data.deposit_amount,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      businessName: data.business_name,
      stripePublishableKey: data.stripe_publishable_key || undefined,
      stripeSecretKey: data.stripe_secret_key || undefined,
      paymentDomain: data.payment_domain || undefined,
    }
  } catch (error) {
    console.error("Failed to lookup payment token:", error)
    return null
  }
}

/**
 * Mark a payment link as used (after successful payment)
 */
export async function markPaymentLinkUsed(shortToken: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from("payment_links")
      .update({ used_at: new Date().toISOString() })
      .eq("short_token", shortToken.toUpperCase())

    return !error
  } catch {
    return false
  }
}

/**
 * Legacy decode function for old-style tokens
 * Kept for backwards compatibility
 */
export function decodePaymentToken(token: string): PaymentLinkData | null {
  // Check if it's a short token format (has dashes)
  if (token.includes("-")) {
    // This is async, but we need sync for backwards compat
    // Return null and let the API handle async lookup
    return null
  }

  // Try to decode as legacy base64 token
  try {
    // Check for query param encoded data
    if (token.includes("?d=")) {
      const [, encoded] = token.split("?d=")
      const payload = JSON.parse(Buffer.from(encoded, "base64url").toString())

      if (payload.exp && payload.exp < Date.now()) {
        return null
      }

      const { exp, ...data } = payload
      return data
    }

    return null
  } catch {
    return null
  }
}
