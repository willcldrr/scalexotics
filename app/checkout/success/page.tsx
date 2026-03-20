"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Car, Calendar, CreditCard, AlertCircle, Loader2 } from "lucide-react"

interface BookingData {
  id: string
  customer_name: string
  start_date: string
  end_date: string
  total_amount: number
  deposit_amount: number
  vehicle?: {
    make: string
    model: string
    year: number
  }
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found")
      setLoading(false)
      return
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Failed to verify payment")
        } else if (data.success && data.booking) {
          setBooking(data.booking)
        }
      } catch (err) {
        console.error("Error verifying payment:", err)
        setError("Failed to verify payment")
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white/50 animate-spin mx-auto mb-4" />
          <p className="text-white/50">Confirming your payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Verification Issue</h1>
          <p className="text-white/60 mb-4">{error}</p>
          <p className="text-white/40 text-sm">
            Don't worry - if your payment went through, your booking is confirmed.
            Contact us if you have any questions.
          </p>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Reservation Confirmed!
        </h1>

        <p className="text-white/60 mb-8">
          Your deposit has been received. Your exotic car rental is now secured.
        </p>

        {booking && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-8 text-left">
            <h2 className="font-semibold text-white mb-4">Booking Details</h2>

            <div className="space-y-4">
              {booking.vehicle && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#375DEE]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Car className="w-4 h-4 text-[#375DEE]" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                    </p>
                    <p className="text-sm text-white/50">Your vehicle</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#375DEE]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-[#375DEE]" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                  </p>
                  <p className="text-sm text-white/50">Rental dates</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    ${booking.deposit_amount.toLocaleString()} deposit paid
                  </p>
                  <p className="text-sm text-white/50">
                    Total: ${booking.total_amount.toLocaleString()} (${(booking.total_amount - booking.deposit_amount).toLocaleString()} remaining)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-8 text-left">
          <h2 className="font-semibold text-white mb-4">What happens next?</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Payment Confirmed</p>
                <p className="text-sm text-white/50">Your deposit has been processed securely</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#375DEE]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#375DEE] text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-white">Confirmation Sent</p>
                <p className="text-sm text-white/50">Check your phone for booking details</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#375DEE]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#375DEE] text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-white">Pickup Instructions</p>
                <p className="text-sm text-white/50">We'll text you pickup details before your rental date</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-white/40 text-sm">
          Questions? Reply to our text messages or call us anytime.
        </p>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-white/50">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
