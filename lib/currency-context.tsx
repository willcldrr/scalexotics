"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "@/lib/currency"

const STORAGE_KEY = "velocity-currency"

interface CurrencyContextValue {
  currency: string
  setCurrency: (currency: string) => void
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => {},
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(DEFAULT_CURRENCY)

  // Load saved preference from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && SUPPORTED_CURRENCIES[saved]) {
        setCurrencyState(saved)
      }
    } catch {
      // localStorage may be unavailable (SSR, privacy mode, etc.)
    }
  }, [])

  const setCurrency = useCallback((code: string) => {
    const upper = code.toUpperCase()
    if (!SUPPORTED_CURRENCIES[upper]) return

    setCurrencyState(upper)
    try {
      localStorage.setItem(STORAGE_KEY, upper)
    } catch {
      // Ignore storage errors
    }
  }, [])

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
