export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
  locale: string
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar", locale: "en-CA" },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
} as const

export const DEFAULT_CURRENCY = "USD"

/**
 * Format an amount with proper currency symbol and locale formatting.
 * Amounts are expected in standard units (e.g. dollars, not cents).
 */
export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  const info = SUPPORTED_CURRENCIES[currency.toUpperCase()]
  const locale = info?.locale ?? "en-US"
  const code = info?.code ?? "USD"

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Convert an amount between currencies using the provided rates.
 * Rates should be keyed by currency code with values relative to USD
 * (i.e. rates["EUR"] = 0.92 means 1 USD = 0.92 EUR).
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): number {
  const fromUpper = from.toUpperCase()
  const toUpper = to.toUpperCase()

  if (fromUpper === toUpper) return amount

  const fromRate = rates[fromUpper]
  const toRate = rates[toUpper]

  if (fromRate == null || toRate == null) {
    throw new Error(`Missing exchange rate for ${fromRate == null ? fromUpper : toUpper}`)
  }

  // Convert to USD first, then to target currency
  const amountInUsd = amount / fromRate
  return amountInUsd * toRate
}

/**
 * Returns the symbol for a given currency code.
 */
export function getCurrencySymbol(currency: string): string {
  const info = SUPPORTED_CURRENCIES[currency.toUpperCase()]
  return info?.symbol ?? "$"
}
