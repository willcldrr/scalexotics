"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface Branding {
  logoUrl: string | null
  companyName: string
  isLoading: boolean
}

const defaultBranding: Branding = {
  logoUrl: null,
  companyName: "Scale Exotics",
  isLoading: true,
}

interface BrandingContextValue extends Branding {
  refreshBranding: () => Promise<void>
}

const BrandingContext = createContext<BrandingContextValue>({
  ...defaultBranding,
  refreshBranding: async () => {},
})

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<Branding>(defaultBranding)
  const supabaseRef = useRef(createClient())

  const loadBranding = useCallback(async () => {
    const supabase = supabaseRef.current
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setBranding({ ...defaultBranding, isLoading: false })
      return
    }

    const { data } = await supabase
      .from("business_branding")
      .select("logo_url, company_name")
      .eq("user_id", user.id)
      .single()

    setBranding({
      logoUrl: data?.logo_url || null,
      companyName: data?.company_name || "Scale Exotics",
      isLoading: false,
    })
  }, [])

  useEffect(() => {
    loadBranding()

    const handleBrandingChange = () => loadBranding()
    window.addEventListener("brandingChanged", handleBrandingChange)

    return () => {
      window.removeEventListener("brandingChanged", handleBrandingChange)
    }
  }, [loadBranding])

  return (
    <BrandingContext.Provider value={{ ...branding, refreshBranding: loadBranding }}>
      {children}
    </BrandingContext.Provider>
  )
}

export const useBranding = () => useContext(BrandingContext)
