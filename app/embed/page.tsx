"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import {
  Car,
  Calendar,
  DollarSign,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Phone,
  User,
  Mail,
} from "lucide-react"
import { format, addDays, eachDayOfInterval, isSameDay, isWithinInterval, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"

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
  status: string
}

interface Booking {
  vehicle_id: string
  start_date: string
  end_date: string
}

function EmbedContent() {
  const searchParams = useSearchParams()
  const apiKey = searchParams.get("key")
  const theme = searchParams.get("theme") || "dark"
  const primaryColor = searchParams.get("color") || "#375DEE"

  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const isDark = theme === "dark"

  useEffect(() => {
    if (apiKey) {
      fetchData()
    }
  }, [apiKey])

  const fetchData = async () => {
    setLoading(true)

    // Get user_id from API key
    const { data: keyData } = await supabase
      .from("api_keys")
      .select("user_id")
      .eq("key", apiKey)
      .eq("is_active", true)
      .single()

    if (keyData) {
      // Fetch vehicles
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", keyData.user_id)
        .eq("status", "available")
        .order("daily_rate", { ascending: false })

      setVehicles(vehiclesData || [])

      // Fetch bookings for availability
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("vehicle_id, start_date, end_date")
        .eq("user_id", keyData.user_id)
        .in("status", ["confirmed", "pending"])

      setBookings(bookingsData || [])
    }

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
      setEndDate(date)
    }
  }

  const calculateTotal = () => {
    if (!startDate || !endDate || !selectedVehicle) return 0
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return days * selectedVehicle.daily_rate
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicle || !startDate || !endDate) return

    setSubmitting(true)

    // Submit as a lead
    try {
      const response = await fetch("/api/leads/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey || "",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          vehicle_interest: `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`,
          notes: `Dates: ${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}\nTotal: $${calculateTotal().toLocaleString()}`,
          source: "booking_widget",
        }),
      })

      if (response.ok) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error("Error submitting:", error)
    }

    setSubmitting(false)
  }

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Pad start with empty days
    const startDay = monthStart.getDay()
    const paddedDays = [...Array(startDay).fill(null), ...days]

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className={`p-2 rounded-lg ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold">{format(currentMonth, "MMMM yyyy")}</span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className={`p-2 rounded-lg ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className={`py-2 ${isDark ? "text-white/50" : "text-gray-500"}`}>
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
                  isSelected
                    ? "text-white"
                    : isInRange
                    ? `${isDark ? "bg-white/10" : "bg-gray-100"}`
                    : isBooked
                    ? `${isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-500"} cursor-not-allowed`
                    : isPast
                    ? `${isDark ? "text-white/20" : "text-gray-300"} cursor-not-allowed`
                    : `${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`
                }`}
                style={isSelected ? { backgroundColor: primaryColor } : undefined}
              >
                {format(day, "d")}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-black" : "bg-white"}`}>
        <Loader2 className={`w-8 h-8 animate-spin ${isDark ? "text-white" : "text-gray-800"}`} style={{ color: primaryColor }} />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Check className="w-8 h-8" style={{ color: primaryColor }} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
          <p className={isDark ? "text-white/60" : "text-gray-600"}>
            We'll get back to you shortly to confirm your booking.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
      {!selectedVehicle ? (
        // Vehicle List
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-center">Available Vehicles</h2>

          <div className="grid gap-4">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle)}
                className={`p-4 rounded-xl text-left transition-colors ${
                  isDark
                    ? "bg-white/5 border border-white/10 hover:bg-white/10"
                    : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-4">
                  {vehicle.image_url ? (
                    <img
                      src={vehicle.image_url}
                      alt={vehicle.name}
                      className="w-24 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className={`w-24 h-16 rounded-lg flex items-center justify-center ${isDark ? "bg-white/10" : "bg-gray-200"}`}>
                      <Car className="w-8 h-8" style={{ color: primaryColor }} />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <p className={`text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>
                      {vehicle.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: primaryColor }}>
                      ${vehicle.daily_rate}
                    </p>
                    <p className={`text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>/day</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : showBookingForm ? (
        // Booking Form
        <div className="space-y-6">
          <button
            onClick={() => setShowBookingForm(false)}
            className={`flex items-center gap-2 ${isDark ? "text-white/60 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <div className={`p-4 rounded-xl ${isDark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"}`}>
            <h3 className="font-semibold mb-2">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</h3>
            <p className={`text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>
              {format(startDate!, "MMM d")} - {format(endDate!, "MMM d, yyyy")}
            </p>
            <p className="font-bold mt-2" style={{ color: primaryColor }}>
              Total: ${calculateTotal().toLocaleString()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm mb-2 ${isDark ? "text-white/60" : "text-gray-600"}`}>Full Name</label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-white/40" : "text-gray-400"}`} />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl ${
                    isDark
                      ? "bg-white/5 border border-white/10 text-white"
                      : "bg-gray-50 border border-gray-200 text-black"
                  }`}
                  placeholder="John Smith"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${isDark ? "text-white/60" : "text-gray-600"}`}>Email</label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-white/40" : "text-gray-400"}`} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl ${
                    isDark
                      ? "bg-white/5 border border-white/10 text-white"
                      : "bg-gray-50 border border-gray-200 text-black"
                  }`}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${isDark ? "text-white/60" : "text-gray-600"}`}>Phone Number</label>
              <div className="relative">
                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-white/40" : "text-gray-400"}`} />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl ${
                    isDark
                      ? "bg-white/5 border border-white/10 text-white"
                      : "bg-gray-50 border border-gray-200 text-black"
                  }`}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl text-white font-semibold disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Submit Booking Request"
              )}
            </button>
          </form>
        </div>
      ) : (
        // Date Selection
        <div className="space-y-6">
          <button
            onClick={() => {
              setSelectedVehicle(null)
              setStartDate(null)
              setEndDate(null)
            }}
            className={`flex items-center gap-2 ${isDark ? "text-white/60 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}
          >
            <ChevronLeft className="w-5 h-5" />
            Back to vehicles
          </button>

          <div className={`p-4 rounded-xl ${isDark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"}`}>
            <div className="flex items-center gap-4">
              <Car className="w-8 h-8" style={{ color: primaryColor }} />
              <div>
                <h3 className="font-semibold">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </h3>
                <p style={{ color: primaryColor }}>${selectedVehicle.daily_rate}/day</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Select Dates</h3>
            {renderCalendar()}
          </div>

          {startDate && endDate && (
            <div className={`p-4 rounded-xl ${isDark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={isDark ? "text-white/60" : "text-gray-500"}>Selected:</span>
                <span className="font-medium">
                  {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDark ? "text-white/60" : "text-gray-500"}>Total:</span>
                <span className="font-bold text-lg" style={{ color: primaryColor }}>
                  ${calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowBookingForm(true)}
            disabled={!startDate || !endDate}
            className="w-full py-4 rounded-xl text-white font-semibold disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}

export default function EmbedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    }>
      <EmbedContent />
    </Suspense>
  )
}
