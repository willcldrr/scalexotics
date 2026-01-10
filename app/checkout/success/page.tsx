"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Car, Calendar, CreditCard } from "lucide-react"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In production, you could verify the session here
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-white/50">Confirming your payment...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Reservation Confirmed!
        </h1>

        <p className="text-white/60 mb-8">
          Your deposit has been received. Your exotic car rental is now secured.
        </p>

        {/* Confirmation Details */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-8 text-left">
          <h2 className="font-semibold text-white mb-4">What happens next?</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#375DEE]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-[#375DEE]" />
              </div>
              <div>
                <p className="font-medium text-white">Payment Confirmed</p>
                <p className="text-sm text-white/50">Your deposit has been processed securely</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#375DEE]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-[#375DEE]" />
              </div>
              <div>
                <p className="font-medium text-white">Confirmation SMS Sent</p>
                <p className="text-sm text-white/50">Check your phone for booking details</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#375DEE]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Car className="w-4 h-4 text-[#375DEE]" />
              </div>
              <div>
                <p className="font-medium text-white">Pickup Instructions</p>
                <p className="text-sm text-white/50">We'll text you pickup details before your rental date</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <p className="text-white/40 text-sm">
          Questions? Reply to our text messages or call us anytime.
        </p>
      </div>
    </div>
  )
}
