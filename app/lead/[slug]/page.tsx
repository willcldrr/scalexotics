"use client"

import { useState, useEffect, use } from "react"
import { Loader2, CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Calendar, Car, User, Phone, Mail } from "lucide-react"

interface SurveyConfig {
  business_name: string
  logo_url: string | null
  primary_color: string
  background_color: string
  welcome_title: string
  welcome_subtitle: string
  success_title: string
  success_subtitle: string
  minimum_age: number
  fields: {
    name: boolean
    email: boolean
    phone: boolean
    age: boolean
    dates: boolean
    vehicle: boolean
  }
  require_email: boolean
}

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  year: number
  type: string
  daily_rate: number
  image_url: string | null
}

interface Availability {
  vehicle_id: string
  start_date: string
  end_date: string
}

interface FormData {
  name: string
  email: string
  phone: string
  age: string
  vehicle_interest: string
  vehicle_id: string
  start_date: string
  end_date: string
}

export default function LeadCapturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [underAge, setUnderAge] = useState(false)

  const [config, setConfig] = useState<SurveyConfig | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])

  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    age: "",
    vehicle_interest: "",
    vehicle_id: "",
    start_date: "",
    end_date: "",
  })

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingEndDate, setSelectingEndDate] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [slug])

  const fetchConfig = async () => {
    try {
      const response = await fetch(`/api/survey-config/${slug}`)

      if (!response.ok) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const data = await response.json()
      setConfig(data.config)
      setApiKey(data.api_key)
      setVehicles(data.vehicles || [])
      setAvailability(data.availability || [])
      setLoading(false)
    } catch (err) {
      console.error("Error fetching survey config:", err)
      setNotFound(true)
      setLoading(false)
    }
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: formatPhone(e.target.value) })
  }

  const handleAgeCheck = () => {
    const age = parseInt(formData.age)
    if (age < (config?.minimum_age || 25)) {
      setUnderAge(true)
      return
    }
    nextStep()
  }

  const nextStep = () => {
    setStep(step + 1)
  }

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setFormData({
      ...formData,
      vehicle_interest: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      vehicle_id: vehicle.id,
      start_date: "",
      end_date: "",
    })
    setSelectingEndDate(false)
    nextStep()
  }

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDateISO = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const isDateBlocked = (date: Date) => {
    if (!formData.vehicle_id) return false
    const dateStr = formatDateISO(date)
    return availability.some(
      (booking) =>
        booking.vehicle_id === formData.vehicle_id &&
        dateStr >= booking.start_date &&
        dateStr <= booking.end_date
    )
  }

  const isDateInPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const isDateInRange = (date: Date) => {
    if (!formData.start_date || !formData.end_date) return false
    const dateStr = formatDateISO(date)
    return dateStr >= formData.start_date && dateStr <= formData.end_date
  }

  const isStartDate = (date: Date) => {
    return formData.start_date === formatDateISO(date)
  }

  const isEndDate = (date: Date) => {
    return formData.end_date === formatDateISO(date)
  }

  const handleDateClick = (date: Date) => {
    if (isDateBlocked(date) || isDateInPast(date)) return

    const dateStr = formatDateISO(date)

    if (!formData.start_date || !selectingEndDate) {
      setFormData({ ...formData, start_date: dateStr, end_date: "" })
      setSelectingEndDate(true)
    } else {
      if (dateStr < formData.start_date) {
        setFormData({ ...formData, start_date: dateStr, end_date: "" })
      } else {
        // Check if any date in range is blocked
        const start = new Date(formData.start_date + "T00:00:00")
        const end = new Date(dateStr + "T00:00:00")
        let hasBlockedDate = false
        const checkDate = new Date(start)
        while (checkDate <= end) {
          if (isDateBlocked(checkDate)) {
            hasBlockedDate = true
            break
          }
          checkDate.setDate(checkDate.getDate() + 1)
        }
        if (hasBlockedDate) {
          setFormData({ ...formData, start_date: dateStr, end_date: "" })
        } else {
          setFormData({ ...formData, end_date: dateStr })
          setSelectingEndDate(false)
        }
      }
    }
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleSubmit = async () => {
    if (!apiKey) {
      setError("Configuration error. Please try again later.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const payload: any = {
        name: formData.name,
        phone: formData.phone.replace(/\D/g, ""),
        source: `lead-capture-${slug}`,
      }

      if (formData.email) {
        payload.email = formData.email
      }

      if (formData.vehicle_interest) {
        payload.vehicle_interest = formData.vehicle_interest
      }

      if (formData.start_date && formData.end_date) {
        payload.notes = `Dates: ${formatDateDisplay(formData.start_date)} - ${formatDateDisplay(formData.end_date)}`
      } else if (formData.start_date) {
        payload.notes = `Date: ${formatDateDisplay(formData.start_date)}`
      }

      const response = await fetch("/api/leads/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit")
      }

      setSubmitted(true)
    } catch (err: any) {
      console.error("Error submitting lead:", err)
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate total steps based on enabled fields - new order: name, phone, vehicle, dates, email, age
  const getSteps = () => {
    if (!config) return []
    const steps: string[] = []
    if (config.fields.name) steps.push("name")
    if (config.fields.phone) steps.push("phone")
    if (config.fields.vehicle && vehicles.length > 0) steps.push("vehicle")
    if (config.fields.dates) steps.push("dates")
    if (config.fields.email) steps.push("email")
    if (config.fields.age) steps.push("age")
    return steps
  }

  const steps = getSteps()
  const currentStepName = steps[step]
  const isLastStep = step === steps.length - 1
  const progress = steps.length > 0 ? ((step + 1) / steps.length) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Survey Not Found</h1>
          <p className="text-white/60">This survey doesn&apos;t exist or has been deactivated.</p>
        </div>
      </div>
    )
  }

  if (!config) return null

  const primaryColor = config.primary_color || "#375DEE"
  const backgroundColor = config.background_color || "#0a0a0a"

  // Under age screen
  if (underAge) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor }}>
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: primaryColor }} />
          <h1 className="text-2xl font-bold text-white mb-2">Age Requirement Not Met</h1>
          <p className="text-white/60">
            Sorry, you must be at least {config.minimum_age} years old to rent with us.
          </p>
        </div>
      </div>
    )
  }

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor }}>
        <div className="max-w-md w-full text-center">
          {config.logo_url && (
            <img src={config.logo_url} alt={config.business_name} className="h-12 mx-auto mb-6" />
          )}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{config.success_title}</h1>
          <p className="text-white/60">{config.success_subtitle}</p>
        </div>
      </div>
    )
  }

  // Welcome screen (step === 0 before form starts)
  if (step === 0 && currentStepName === "name") {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor }}>
        {/* Header */}
        <div className="p-6 text-center">
          {config.logo_url && (
            <img src={config.logo_url} alt={config.business_name} className="h-10 mx-auto" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              {config.welcome_title}
            </h1>
            <p className="text-white/60 mb-8">{config.welcome_subtitle}</p>

            {/* Name Input */}
            <div className="text-left mb-6">
              <label className="block text-sm text-white/60 mb-2">What&apos;s your name?</label>
              <input
                type="text"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-white/30"
                autoFocus
              />
            </div>

            <button
              onClick={nextStep}
              disabled={!formData.name.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-semibold text-lg transition-all disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="p-6">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: primaryColor }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Fullscreen Vehicle Selection
  if (currentStepName === "vehicle") {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor }}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          {config.logo_url ? (
            <img src={config.logo_url} alt={config.business_name} className="h-8" />
          ) : (
            <span className="text-white font-semibold">{config.business_name}</span>
          )}
          <span className="text-white/40 text-sm">{step + 1} of {steps.length}</span>
        </div>

        {/* Title */}
        <div className="p-6 text-center">
          <Car className="w-10 h-10 mx-auto mb-3" style={{ color: primaryColor }} />
          <h2 className="text-2xl font-bold text-white mb-1">Which car interests you?</h2>
          <p className="text-white/60 text-sm">Tap to select a vehicle</p>
        </div>

        {/* Vehicle Grid - Full Height Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid gap-4">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => handleVehicleSelect(vehicle)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all overflow-hidden text-left"
              >
                {vehicle.image_url && (
                  <div className="aspect-video w-full bg-black/30">
                    <img
                      src={vehicle.image_url}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="text-white/60">${vehicle.daily_rate}/day</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Skip Button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={nextStep}
            className="w-full py-3 text-white/60 hover:text-white transition-colors"
          >
            Skip - Not sure yet
          </button>
          <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: primaryColor }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Calendar Date Selection
  if (currentStepName === "dates") {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const monthYear = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    const today = new Date()
    const canGoPrev = currentMonth.getFullYear() > today.getFullYear() ||
      (currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() > today.getMonth())

    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor }}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          {config.logo_url ? (
            <img src={config.logo_url} alt={config.business_name} className="h-8" />
          ) : (
            <span className="text-white font-semibold">{config.business_name}</span>
          )}
          <span className="text-white/40 text-sm">{step + 1} of {steps.length}</span>
        </div>

        {/* Title */}
        <div className="p-6 text-center">
          <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: primaryColor }} />
          <h2 className="text-2xl font-bold text-white mb-1">
            {selectingEndDate ? "Select end date" : "Select start date"}
          </h2>
          <p className="text-white/60 text-sm">
            {formData.vehicle_interest
              ? `For ${formData.vehicle_interest}`
              : "When do you need the car?"}
          </p>
        </div>

        {/* Selected Dates Display */}
        {(formData.start_date || formData.end_date) && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-center">
                <p className="text-xs text-white/40 mb-1">Start</p>
                <p className="text-white font-medium">
                  {formData.start_date ? formatDateDisplay(formData.start_date) : "—"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40" />
              <div className="text-center">
                <p className="text-xs text-white/40 mb-1">End</p>
                <p className="text-white font-medium">
                  {formData.end_date ? formatDateDisplay(formData.end_date) : "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="flex-1 px-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              disabled={!canGoPrev}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-white font-semibold">{monthYear}</span>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs text-white/40 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before first of month */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
              const blocked = isDateBlocked(date)
              const past = isDateInPast(date)
              const inRange = isDateInRange(date)
              const isStart = isStartDate(date)
              const isEnd = isEndDate(date)
              const disabled = blocked || past

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(date)}
                  disabled={disabled}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                    ${disabled ? "text-white/20 cursor-not-allowed" : "hover:bg-white/10"}
                    ${blocked ? "line-through" : ""}
                    ${inRange && !isStart && !isEnd ? "bg-white/10 text-white" : ""}
                    ${isStart || isEnd ? "text-white" : "text-white/70"}
                  `}
                  style={{
                    backgroundColor: isStart || isEnd ? primaryColor : undefined,
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: primaryColor }} />
              <span className="text-white/60">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white/20 flex items-center justify-center">
                <span className="text-white/40 line-through text-[10px]">X</span>
              </div>
              <span className="text-white/60">Unavailable</span>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={isLastStep ? handleSubmit : nextStep}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-semibold text-lg transition-all disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLastStep ? (
              "Submit"
            ) : formData.start_date && formData.end_date ? (
              <>Continue<ChevronRight className="w-5 h-5" /></>
            ) : (
              "Skip"
            )}
          </button>
          <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: primaryColor }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Form steps (phone, email, age)
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor }}>
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        {config.logo_url ? (
          <img src={config.logo_url} alt={config.business_name} className="h-8" />
        ) : (
          <span className="text-white font-semibold">{config.business_name}</span>
        )}
        <span className="text-white/40 text-sm">{step + 1} of {steps.length}</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Phone Step */}
          {currentStepName === "phone" && (
            <div className="text-center">
              <Phone className="w-12 h-12 mx-auto mb-4" style={{ color: primaryColor }} />
              <h2 className="text-2xl font-bold text-white mb-2">What&apos;s your phone number?</h2>
              <p className="text-white/60 mb-6">We&apos;ll text you about availability</p>
              <input
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg text-center placeholder:text-white/30 focus:outline-none focus:border-white/30"
                autoFocus
              />
              <button
                onClick={nextStep}
                disabled={formData.phone.replace(/\D/g, "").length < 10}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-semibold text-lg transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Email Step */}
          {currentStepName === "email" && (
            <div className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-4" style={{ color: primaryColor }} />
              <h2 className="text-2xl font-bold text-white mb-2">What&apos;s your email?</h2>
              <p className="text-white/60 mb-6">{config.require_email ? "Required for booking confirmation" : "Optional, but helps us send you details"}</p>
              <input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg text-center placeholder:text-white/30 focus:outline-none focus:border-white/30"
                autoFocus
              />
              <button
                onClick={isLastStep ? handleSubmit : nextStep}
                disabled={config.require_email && !formData.email.includes("@")}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-semibold text-lg transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLastStep ? (
                  "Submit"
                ) : (
                  <>{config.require_email || formData.email ? "Continue" : "Skip"}<ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          )}

          {/* Age Step */}
          {currentStepName === "age" && (
            <div className="text-center">
              <User className="w-12 h-12 mx-auto mb-4" style={{ color: primaryColor }} />
              <h2 className="text-2xl font-bold text-white mb-2">How old are you?</h2>
              <p className="text-white/60 mb-6">Renters must be at least {config.minimum_age} years old</p>
              <input
                type="number"
                placeholder="25"
                min="18"
                max="99"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg text-center placeholder:text-white/30 focus:outline-none focus:border-white/30"
                autoFocus
              />
              <button
                onClick={isLastStep ? handleSubmit : handleAgeCheck}
                disabled={!formData.age || parseInt(formData.age) < 18 || submitting}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-semibold text-lg transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLastStep ? (
                  "Submit"
                ) : (
                  <>Continue<ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-center">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="p-6">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: primaryColor }}
          />
        </div>
      </div>
    </div>
  )
}
