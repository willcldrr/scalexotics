import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12 // GCM standard IV length
const AUTH_TAG_LENGTH = 16 // GCM auth tag length
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
}

interface TokenPayload extends PaymentLinkData {
  exp: number // Expiration timestamp
  iat: number // Issued at timestamp
}

/**
 * Get the encryption key from environment variable
 * Must be a 32-byte (64 hex character) string
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.PAYMENT_LINK_SECRET
  if (!secret) {
    throw new Error("PAYMENT_LINK_SECRET environment variable is not set")
  }

  // If it's a hex string, convert to buffer
  if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, "hex")
  }

  // Otherwise, hash it to get a consistent 32-byte key
  return crypto.createHash("sha256").update(secret).digest()
}

/**
 * Get the payment link domain from environment variable
 */
function getPaymentDomain(): string {
  return process.env.PAYMENT_LINK_DOMAIN || "https://www.rentalcapture.xyz"
}

/**
 * Encode buffer to URL-safe base64
 */
function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

/**
 * Decode URL-safe base64 to buffer
 */
function fromBase64Url(str: string): Buffer {
  // Add padding if needed
  const padded = str + "=".repeat((4 - (str.length % 4)) % 4)
  return Buffer.from(
    padded.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  )
}

/**
 * Generate a secure payment link with AES-256-GCM encrypted data
 *
 * @param data - Payment/booking data to encode
 * @returns Full payment URL with encrypted token
 */
export function generateSecurePaymentLink(data: PaymentLinkData): string {
  const key = getEncryptionKey()
  const domain = getPaymentDomain()

  // Create payload with expiration
  const now = Math.floor(Date.now() / 1000)
  const payload: TokenPayload = {
    ...data,
    iat: now,
    exp: now + (EXPIRATION_HOURS * 60 * 60),
  }

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH)

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  // Encrypt payload
  const payloadJson = JSON.stringify(payload)
  const encrypted = Buffer.concat([
    cipher.update(payloadJson, "utf8"),
    cipher.final(),
  ])

  // Get auth tag
  const authTag = cipher.getAuthTag()

  // Combine: IV + AuthTag + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted])

  // Encode to URL-safe base64
  const token = toBase64Url(combined)

  return `${domain}/${token}`
}

/**
 * Decode and decrypt a payment token
 *
 * @param token - The base64url encoded token (without domain)
 * @returns Decoded payment data or null if invalid/expired
 */
export function decodePaymentToken(token: string): PaymentLinkData | null {
  try {
    const key = getEncryptionKey()

    // Decode from base64url
    const combined = fromBase64Url(token)

    // Minimum length check: IV + AuthTag + at least 1 byte of ciphertext
    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
      console.error("Token too short")
      return null
    }

    // Extract components
    const iv = combined.subarray(0, IV_LENGTH)
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ])

    // Parse JSON
    const payload: TokenPayload = JSON.parse(decrypted.toString("utf8"))

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      console.error("Token expired")
      return null
    }

    // Return data without internal fields
    const { exp, iat, ...data } = payload
    return data

  } catch (error) {
    console.error("Failed to decode payment token:", error)
    return null
  }
}

/**
 * Extract token from a full payment URL
 *
 * @param url - Full URL like https://www.rentalcapture.xyz/abc123...
 * @returns Just the token portion
 */
export function extractTokenFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // Token is the path without leading slash
    const token = urlObj.pathname.slice(1)
    return token || null
  } catch {
    return null
  }
}

/**
 * Validate that a payment link is properly formed and not expired
 *
 * @param url - Full payment URL to validate
 * @returns Validation result with decoded data if valid
 */
export function validatePaymentLink(url: string): {
  valid: boolean
  data?: PaymentLinkData
  error?: string
} {
  const token = extractTokenFromUrl(url)
  if (!token) {
    return { valid: false, error: "Invalid URL format" }
  }

  const data = decodePaymentToken(token)
  if (!data) {
    return { valid: false, error: "Invalid or expired token" }
  }

  return { valid: true, data }
}
