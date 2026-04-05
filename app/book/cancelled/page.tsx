"use client"

import { useState, useEffect } from "react"
import { XCircle, ArrowLeft, Loader2 } from "lucide-react"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface BusinessBranding {
  company_name: string
  primary_color: string
  background_color: string
}

function CancelledContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("booking_id")
  const [branding, setBranding] = useState<BusinessBranding | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBranding()
  }, [bookingId])

  const fetchBranding = async () => {
    if (bookingId) {
      // Get booking to find owner
      const { data: booking } = await supabase
        .from("bookings")
        .select("user_id")
        .eq("id", bookingId)
        .single()

      if (booking) {
        // Fetch branding
        const { data: brandingData } = await supabase
          .from("business_branding")
          .select("company_name, primary_color, background_color")
          .eq("user_id", booking.user_id)
          .single()

        if (brandingData) {
          setBranding(brandingData)
        }
      }
    }
    setLoading(false)
  }

  const primaryColor = branding?.primary_color || "#375DEE"
  const backgroundColor = branding?.background_color || "#000000"

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor }}>
      <div className="max-w-md w-full text-center">
        <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Payment Cancelled
          </h1>
          <p className="text-white/60 mb-6">
            Your payment was cancelled. No charges have been made to your card.
          </p>

          <p className="text-white/40 text-sm mb-6">
            Your booking request is still saved. You can return to complete the payment at any time.
          </p>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-colors hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            <ArrowLeft className="w-4 h-4" />
            Try Again
          </button>
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          {branding?.company_name || ""}
        </p>
      </div>
    </div>
  )
}

export default function BookingCancelledPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <CancelledContent />
    </Suspense>
  )
}
