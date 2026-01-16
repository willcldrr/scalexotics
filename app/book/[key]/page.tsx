"use client"

import { useState, useEffect, use } from "react"
import { createClient } from "@supabase/supabase-js"
import {
  Car,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Phone,
  User,
  Mail,
  MapPin,
  CreditCard,
  Shield,
  Clock,
  AlertCircle,
} from "lucide-react"
import { format, addDays, eachDayOfInterval, isSameDay, isWithinInterval, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import Image from "next/image"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  year: number
  type: string
  daily_rate: number
  image_url: string | null
  description: string | null
}

interface Booking {
  vehicle_id: string
  start_date: string
  end_date: string
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

export default function BookingPortalPage({ params }: { params: Promise<{ key: string }> }) {
  const { key: apiKey } = use(params)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [branding, setBranding] = useState<BusinessBranding | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Booking flow state
  const [step, setStep] = useState<"vehicles" | "dates" | "details" | "payment" | "success">("vehicles")
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    driversLicense: "",
    notes: "",
  })
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [apiKey])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    // Validate API key and get user
    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("user_id")
      .eq("key", apiKey)
      .eq("is_active", true)
      .single()

    if (keyError || !keyData) {
      setError("Invalid or inactive booking link")
      setLoading(false)
      return
    }

    setUserId(keyData.user_id)

    // Fetch business branding
    const { data: brandingData } = await supabase
      .from("business_branding")
      .select("*")
      .eq("user_id", keyData.user_id)
      .single()

    if (brandingData) {
      setBranding(brandingData)
    } else {
      // Fallback to profile/ai_settings if no branding configured
      const [profileRes, aiSettingsRes] = await Promise.all([
        supabase.from("profiles").select("company_name, email").eq("id", keyData.user_id).single(),
        supabase.from("ai_settings").select("business_name, business_phone").eq("user_id", keyData.user_id).single(),
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

    // Fetch vehicles
    const { data: vehiclesData } = await supabase
      .from("vehicles")
      .select("id, name, make, model, year, type, daily_rate, image_url, description")
      .eq("user_id", keyData.user_id)
      .eq("status", "available")
      .order("daily_rate", { ascending: false })

    setVehicles(vehiclesData || [])

    // Fetch existing bookings for availability
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("vehicle_id, start_date, end_date")
      .eq("user_id", keyData.user_id)
      .in("status", ["confirmed", "pending", "active"])
      .gte("end_date", new Date().toISOString().split("T")[0])

    setBookings(bookingsData || [])
    setLoading(false)
  }

  const isDateBooked = (date: Date, vehicleId: string) => {
    return bookings.some((booking) => {
      if (booking.vehicle_id !== vehicleId) return false
      const start = new Date(booking.start_date)
      const end = new Date(booking.end_date)
      return isWithinInterval(date, { start, end })
    })
  }

  const handleDateClick = (date: Date) => {
    if (!selectedVehicle || isDateBooked(date, selectedVehicle.id)) return

    if (!startDate || (startDate && endDate)) {
      setStartDate(date)
      setEndDate(null)
    } else if (date < startDate) {
      setStartDate(date)
    } else {
      // Check if any dates in range are booked
      const daysInRange = eachDayOfInterval({ start: startDate, end: date })
      const hasBookedDay = daysInRange.some((d) => isDateBooked(d, selectedVehicle.id))
      if (hasBookedDay) {
        setStartDate(date)
        setEndDate(null)
      } else {
        setEndDate(date)
      }
    }
  }

  const calculateDays = () => {
    if (!startDate || !endDate) return 0
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  const calculateTotal = () => {
    if (!selectedVehicle) return 0
    return calculateDays() * selectedVehicle.daily_rate
  }

  const calculateDeposit = () => {
    return Math.round(calculateTotal() * 0.25) // 25% deposit
  }

  const handleSubmit = async () => {
    if (!selectedVehicle || !startDate || !endDate || !userId) return

    setProcessing(true)

    try {
      // Create booking first
      const bookingData = {
        user_id: userId,
        vehicle_id: selectedVehicle.id,
        customer_name: formData.name,
        customer_email: formData.email || null,
        customer_phone: formData.phone,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        total_amount: calculateTotal(),
        deposit_amount: calculateDeposit(),
        deposit_paid: false,
        status: "pending",
        notes: formData.notes || null,
      }

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert(bookingData)
        .select()
        .single()

      if (bookingError) {
        throw new Error("Failed to create booking")
      }

      // Create Stripe checkout for deposit
      const response = await fetch("/api/bookings/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          vehicleName: `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`,
          startDate: format(startDate, "MMM d, yyyy"),
          endDate: format(endDate, "MMM d, yyyy"),
          depositAmount: calculateDeposit(),
          customerEmail: formData.email,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
      setProcessing(false)
    }
  }

  const primaryColor = branding?.primary_color || "#375DEE"
  const backgroundColor = branding?.background_color || "#000000"

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startDay = monthStart.getDay()
    const paddedDays = [...Array(startDay).fill(null), ...days]

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold">{format(currentMonth, "MMMM yyyy")}</span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="py-2 text-white/50">
              {day}
            </div>
          ))}

          {paddedDays.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />

            const isBooked = selectedVehicle && isDateBooked(day, selectedVehicle.id)
            const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))
            const isSelected = (startDate && isSameDay(day, startDate)) || (endDate && isSameDay(day, endDate))
            const isInRange = startDate && endDate && day > startDate && day < endDate

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                disabled={isBooked || isPast}
                className={`py-2 rounded-lg text-sm transition-colors ${
                  isBooked
                    ? "bg-red-500/20 text-red-400 cursor-not-allowed"
                    : isPast
                    ? "text-white/20 cursor-not-allowed"
                    : !isSelected && !isInRange
                    ? "hover:bg-white/10"
                    : ""
                }`}
                style={
                  isSelected
                    ? { backgroundColor: primaryColor, color: "white" }
                    : isInRange
                    ? { backgroundColor: `${primaryColor}20`, color: "white" }
                    : undefined
                }
              >
                {format(day, "d")}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4 text-xs text-white/50 justify-center">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: primaryColor }} /> Selected
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500/30" /> Booked
          </span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    )
  }

  if (error && !vehicles.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor }}>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Booking Unavailable</h1>
          <p className="text-white/50">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor }}>
      {/* Header */}
      <header className="border-b border-white/10 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.company_name}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Car className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
            )}
            <span className="font-semibold text-lg">{branding?.company_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Shield className="w-4 h-4" />
            Secure Booking
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b border-white/10 py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {[
              { key: "vehicles", label: "Vehicle" },
              { key: "dates", label: "Dates" },
              { key: "details", label: "Details" },
              { key: "payment", label: "Payment" },
            ].map((s, i) => {
              const stepIndex = ["vehicles", "dates", "details", "payment"].indexOf(step)
              const isComplete = stepIndex > i
              const isCurrent = step === s.key

              return (
                <div key={s.key} className="flex items-center gap-2 sm:gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isComplete
                        ? "bg-green-500 text-white"
                        : !isCurrent
                        ? "bg-white/10 text-white/50"
                        : ""
                    }`}
                    style={isCurrent ? { backgroundColor: primaryColor, color: "white" } : undefined}
                  >
                    {isComplete ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`hidden sm:block text-sm ${isCurrent ? "text-white" : "text-white/50"}`}>
                    {s.label}
                  </span>
                  {i < 3 && <div className="w-8 sm:w-16 h-px bg-white/20" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        {/* Step 1: Vehicle Selection */}
        {step === "vehicles" && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Choose Your Vehicle</h1>
              <p className="text-white/50">Select from our available fleet</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => {
                    setSelectedVehicle(vehicle)
                    setStep("dates")
                  }}
                  className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden transition-colors text-left group"
                  style={{ ["--hover-border" as any]: `${primaryColor}50` }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = `${primaryColor}50`}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                >
                  <div className="aspect-video bg-white/5 relative overflow-hidden">
                    {vehicle.image_url ? (
                      <img
                        src={vehicle.image_url}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-12 h-12 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-white/50 text-sm">{vehicle.type}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-xl font-numbers" style={{ color: primaryColor }}>
                        ${vehicle.daily_rate}
                      </span>
                      <span className="text-white/40 text-sm">/day</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {vehicles.length === 0 && (
              <div className="text-center py-16">
                <Car className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No vehicles available at this time</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date Selection */}
        {step === "dates" && selectedVehicle && (
          <div className="space-y-6">
            <button
              onClick={() => {
                setStep("vehicles")
                setStartDate(null)
                setEndDate(null)
              }}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to vehicles
            </button>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Vehicle Summary */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <div className="aspect-video rounded-xl overflow-hidden bg-white/5 mb-4">
                  {selectedVehicle.image_url ? (
                    <img
                      src={selectedVehicle.image_url}
                      alt={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </h2>
                <p className="text-white/50">{selectedVehicle.type}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-white/60">Daily Rate</span>
                  <span className="font-bold text-xl font-numbers" style={{ color: primaryColor }}>
                    ${selectedVehicle.daily_rate}
                  </span>
                </div>
              </div>

              {/* Calendar */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <h3 className="font-semibold mb-4">Select Rental Dates</h3>
                {renderCalendar()}

                {startDate && endDate && (
                  <div
                    className="mt-6 p-4 rounded-xl border"
                    style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60">Duration</span>
                      <span className="font-medium">{calculateDays()} days</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60">Dates</span>
                      <span className="font-medium">
                        {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-white/60">Total</span>
                      <span className="font-bold text-xl font-numbers" style={{ color: primaryColor }}>
                        ${calculateTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setStep("details")}
                  disabled={!startDate || !endDate}
                  className="w-full mt-4 py-4 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Customer Details */}
        {step === "details" && selectedVehicle && startDate && endDate && (
          <div className="space-y-6">
            <button
              onClick={() => setStep("dates")}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to dates
            </button>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Form */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <h2 className="text-xl font-bold mb-6">Your Information</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="John Smith"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Driver's License # *</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="text"
                        required
                        value={formData.driversLicense}
                        onChange={(e) => setFormData({ ...formData, driversLicense: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="License number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Special Requests (Optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
                      placeholder="Any special requests or notes..."
                    />
                  </div>
                </div>
              </div>

              {/* Booking Summary */}
              <div className="space-y-4">
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                  <h3 className="font-semibold mb-4">Booking Summary</h3>

                  <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                    <div className="w-20 h-14 rounded-lg overflow-hidden bg-white/5">
                      {selectedVehicle.image_url ? (
                        <img
                          src={selectedVehicle.image_url}
                          alt={selectedVehicle.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                      </p>
                      <p className="text-sm text-white/50">{selectedVehicle.type}</p>
                    </div>
                  </div>

                  <div className="py-4 space-y-2 border-b border-white/10">
                    <div className="flex items-center gap-2 text-white/60">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <Clock className="w-4 h-4" />
                      <span>{calculateDays()} days</span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/60">Rental Total</span>
                      <span className="font-numbers">${calculateTotal().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between" style={{ color: primaryColor }}>
                      <span>Deposit Due Today (25%)</span>
                      <span className="font-bold font-numbers">${calculateDeposit().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-white/50 text-sm">
                      <span>Balance Due at Pickup</span>
                      <span className="font-numbers">${(calculateTotal() - calculateDeposit()).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={() => setStep("payment")}
                  disabled={!formData.name || !formData.email || !formData.phone || !formData.driversLicense}
                  className="w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  Continue to Payment
                </button>

                <p className="text-center text-white/40 text-sm">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Secure payment powered by Stripe
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === "payment" && selectedVehicle && startDate && endDate && (
          <div className="space-y-6 max-w-lg mx-auto">
            <button
              onClick={() => setStep("details")}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to details
            </button>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <CreditCard className="w-8 h-8" style={{ color: primaryColor }} />
              </div>

              <h2 className="text-2xl font-bold mb-2">Complete Your Booking</h2>
              <p className="text-white/60 mb-6">
                Pay a 25% deposit to secure your reservation
              </p>

              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-white/60">Vehicle</span>
                  <span>{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-white/60">Dates</span>
                  <span>{format(startDate, "MMM d")} - {format(endDate, "MMM d")}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="font-medium">Deposit Amount</span>
                  <span className="font-bold text-xl font-numbers" style={{ color: primaryColor }}>
                    ${calculateDeposit().toLocaleString()}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={processing}
                className="w-full py-4 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay ${calculateDeposit().toLocaleString()} Deposit
                  </>
                )}
              </button>

              <p className="text-white/40 text-sm mt-4">
                By completing this booking, you agree to our rental terms and conditions.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 p-6 mt-12">
        <div className="max-w-5xl mx-auto text-center text-white/40 text-sm">
          <p>{branding?.company_name}</p>
          {branding?.support_phone && <p>{branding.support_phone}</p>}
          {branding?.support_email && <p>{branding.support_email}</p>}
          {branding?.website_url && (
            <p className="mt-2">
              <a
                href={branding.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/60"
                style={{ color: primaryColor }}
              >
                {branding.website_url.replace(/^https?:\/\//, "")}
              </a>
            </p>
          )}
        </div>
      </footer>
    </div>
  )
}
