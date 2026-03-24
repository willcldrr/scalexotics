"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Car, Calendar, DollarSign, Clock, Shield, AlertCircle, Loader2, CheckCircle, Phone, Mail } from "lucide-react"

interface PaymentData {
  vehicleId: string
  vehicleName: string
  startDate: string
  endDate: string
  dailyRate: number
  totalAmount: number
  depositAmount: number
  customerName: string
  customerPhone: string
  businessName?: string
}

interface BusinessBranding {
  name: string
  subtitle: string | null
  logo_url: string | null
  primary_color: string
  secondary_color: string
  phone: string | null
  email: string | null
  terms_enabled: boolean
  terms_text: string | null
  success_message: string | null
  require_id_upload: boolean
  require_insurance_upload: boolean
}

export default function SlugCheckoutPage() {
  const params = useParams()
  const token = params.token as string
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [business, setBusiness] = useState<BusinessBranding | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    if (token) {
      validateToken()
    }
  }, [token])

  const validateToken = async () => {
    try {
      const res = await fetch("/api/checkout/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok || !data.valid) {
        setError(data.error || "Invalid or expired payment link")
        setLoading(false)
        return
      }

      setPaymentData(data.data)
      setBusiness(data.business)
      setLoading(false)
    } catch (err) {
      setError("Failed to validate payment link")
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!paymentData) return

    // Check if terms must be accepted
    if (business?.terms_enabled && !termsAccepted) {
      return
    }

    setProcessingPayment(true)
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          ...paymentData,
        }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || "Failed to create checkout session")
        setProcessingPayment(false)
      }
    } catch (err) {
      setError("Failed to process payment")
      setProcessingPayment(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00")
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const calculateDays = () => {
    if (!paymentData) return 0
    const start = new Date(paymentData.startDate)
    const end = new Date(paymentData.endDate)
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/60">Validating payment link...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Payment Link Invalid</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <p className="text-sm text-white/40">
            This link may have expired or already been used. Please contact us for a new payment link.
          </p>
        </div>
      </div>
    )
  }

  if (!paymentData) return null

  const days = calculateDays()

  // Get branding colors
  const primaryColor = business?.primary_color || "#FFFFFF"
  const businessName = business?.name || paymentData.businessName || "Velocity Exotics"
  const subtitle = business?.subtitle || "Secure Payment"

  return (
    <div className="min-h-screen bg-black">
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {business?.logo_url ? (
                <img src={business.logo_url} alt={businessName} className="h-10 w-auto object-contain" />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: primaryColor + "20", color: primaryColor }}
                >
                  {businessName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-white">{businessName}</h1>
                <p className="text-sm text-white/50">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Shield className="w-4 h-4" />
              <span>SSL Secured</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden mb-6">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white mb-1">Booking Summary</h2>
            <p className="text-sm text-white/50">Review your reservation details</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/50 mb-1">Vehicle</p>
                <p className="text-lg font-semibold text-white">{paymentData.vehicleName}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/50 mb-1">Rental Period</p>
                <p className="text-white font-medium">{formatDate(paymentData.startDate)}</p>
                <p className="text-white/40 text-sm">to</p>
                <p className="text-white font-medium">{formatDate(paymentData.endDate)}</p>
                <p className="text-sm text-white/50 mt-2">{days} day{days !== 1 ? "s" : ""}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">Daily Rate</span>
                    <span className="text-white">${paymentData.dailyRate.toLocaleString()}/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">{days} day{days !== 1 ? "s" : ""}</span>
                    <span className="text-white">${paymentData.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-white font-semibold">Deposit Due Today</span>
                        <p className="text-xs text-white/40 mt-0.5">Remaining balance due at pickup</p>
                      </div>
                      <span className="text-2xl font-bold text-white">${paymentData.depositAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 mb-6">
          <p className="text-sm text-white/50 mb-1">Booking for</p>
          <p className="text-white font-medium">{paymentData.customerName}</p>
          {paymentData.customerPhone && (
            <p className="text-white/60 text-sm">{paymentData.customerPhone}</p>
          )}
        </div>

        {/* Terms Agreement */}
        {business?.terms_enabled && business?.terms_text && (
          <label className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/10 mb-6 cursor-pointer hover:bg-white/[0.04] transition-colors">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white/20"
            />
            <span className="text-sm text-white/70">{business.terms_text}</span>
          </label>
        )}

        <button
          onClick={handlePayment}
          disabled={processingPayment || (business?.terms_enabled && !termsAccepted)}
          className="w-full py-4 px-6 font-semibold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: primaryColor,
            color: business?.secondary_color || "#000000",
            boxShadow: `0 10px 25px -5px ${primaryColor}40`,
          }}
        >
          {processingPayment ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Pay ${paymentData.depositAmount.toLocaleString()} Deposit
            </>
          )}
        </button>

        <div className="mt-6 flex items-center justify-center gap-6 text-white/40 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>24hr Confirmation</span>
          </div>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          By completing this payment, you agree to the rental terms and conditions.
          The remaining balance of ${(paymentData.totalAmount - paymentData.depositAmount).toLocaleString()} is due at vehicle pickup.
        </p>

        {/* Business Contact */}
        {(business?.phone || business?.email) && (
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-white/40 mb-2">Questions? Contact us:</p>
            <div className="flex items-center justify-center gap-4">
              {business?.phone && (
                <a href={`tel:${business.phone}`} className="flex items-center gap-1 text-sm text-white/60 hover:text-white">
                  <Phone className="w-4 h-4" />
                  {business.phone}
                </a>
              )}
              {business?.email && (
                <a href={`mailto:${business.email}`} className="flex items-center gap-1 text-sm text-white/60 hover:text-white">
                  <Mail className="w-4 h-4" />
                  {business.email}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
