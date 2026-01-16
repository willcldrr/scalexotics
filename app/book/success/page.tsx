"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { CheckCircle, Calendar, Car, Loader2, Phone, Mail, Building } from "lucide-react"
import { format } from "date-fns"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Booking {
  id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string
  start_date: string
  end_date: string
  total_amount: number
  deposit_amount: number
  user_id: string
  vehicles?: {
    make: string
    model: string
    year: number
  }
}

interface BusinessBranding {
  company_name: string
  logo_url: string | null
  primary_color: string
  background_color: string
  support_email: string | null
  support_phone: string | null
  website_url: string | null
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("booking_id")

  const [booking, setBooking] = useState<Booking | null>(null)
  const [branding, setBranding] = useState<BusinessBranding | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
    } else {
      setLoading(false)
    }
  }, [bookingId])

  const fetchBooking = async () => {
    const { data } = await supabase
      .from("bookings")
      .select(`
        id,
        customer_name,
        customer_email,
        customer_phone,
        start_date,
        end_date,
        total_amount,
        deposit_amount,
        user_id,
        vehicles (make, model, year)
      `)
      .eq("id", bookingId)
      .single()

    if (data) {
      setBooking({
        ...data,
        vehicles: Array.isArray(data.vehicles) ? data.vehicles[0] : data.vehicles,
      })

      // Fetch business branding
      const { data: brandingData } = await supabase
        .from("business_branding")
        .select("*")
        .eq("user_id", data.user_id)
        .single()

      if (brandingData) {
        setBranding(brandingData)
      } else {
        // Fallback
        const [profileRes, aiSettingsRes] = await Promise.all([
          supabase.from("profiles").select("company_name, email").eq("id", data.user_id).single(),
          supabase.from("ai_settings").select("business_name, business_phone").eq("user_id", data.user_id).single(),
        ])

        setBranding({
          company_name: aiSettingsRes.data?.business_name || profileRes.data?.company_name || "Vehicle Rentals",
          logo_url: null,
          primary_color: "#375DEE",
          background_color: "#000000",
          support_email: profileRes.data?.email || null,
          support_phone: aiSettingsRes.data?.business_phone || null,
          website_url: null,
        })
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
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.company_name}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Building className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
            )}
          </div>

          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-white/60 mb-6">
            Your deposit has been received. We're excited to have you as our guest!
          </p>

          {booking && (
            <div className="bg-white/5 rounded-xl p-4 mb-6 text-left space-y-4">
              {/* Vehicle */}
              {booking.vehicles && (
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Car className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {booking.vehicles.year} {booking.vehicles.make} {booking.vehicles.model}
                    </p>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-white/40" />
                <div>
                  <p className="text-white/60 text-sm">Rental Period</p>
                  <p className="text-white font-medium">
                    {format(new Date(booking.start_date), "MMM d")} - {format(new Date(booking.end_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Deposit Paid</span>
                  <span className="text-green-400 font-medium font-numbers">
                    ${booking.deposit_amount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Balance Due at Pickup</span>
                  <span className="text-white font-numbers">
                    ${(booking.total_amount - booking.deposit_amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-white/60">Total</span>
                  <span className="text-white font-bold font-numbers">
                    ${booking.total_amount?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div
            className="rounded-xl p-4 mb-6"
            style={{ backgroundColor: `${primaryColor}10` }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: primaryColor }}>What's Next?</p>
            <p className="text-white/60 text-sm">
              We'll contact you shortly to confirm pickup details and finalize arrangements.
              A confirmation email has been sent to your email address.
            </p>
          </div>

          {branding && (
            <div className="text-white/40 text-sm space-y-1">
              <p>Questions? Contact {branding.company_name}</p>
              {branding.support_phone && (
                <p className="flex items-center justify-center gap-2">
                  <Phone className="w-3 h-3" />
                  {branding.support_phone}
                </p>
              )}
              {branding.support_email && (
                <p className="flex items-center justify-center gap-2">
                  <Mail className="w-3 h-3" />
                  {branding.support_email}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-sm mt-6">
          {branding?.company_name}
        </p>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  const primaryColor = "#375DEE"
  const backgroundColor = "#000000"

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
