"use client"

import { useState, useEffect, use } from "react"
import { Loader2, CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Calendar, Car, User, Phone, Mail, Shield, Check } from "lucide-react"

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
  smsConsent: boolean
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
    smsConsent: false,
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

  // Calculate total steps based on enabled fields - new order: name, phone, vehicle, dates, email, age, consent
  const getSteps = () => {
    if (!config) return []
    const steps: string[] = []
    if (config.fields.name) steps.push("name")
    if (config.fields.phone) steps.push("phone")
    if (config.fields.vehicle && vehicles.length > 0) steps.push("vehicle")
    if (config.fields.dates) steps.push("dates")
    if (config.fields.email) steps.push("email")
    if (config.fields.age) steps.push("age")
    // Always add SMS consent as final step (required for Twilio compliance)
    steps.push("consent")
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
        <div className="p-6 lg:p-8 text-center">
          {config.logo_url && (
            <img src={config.logo_url} alt={config.business_name} className="h-10 lg:h-12 mx-auto" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8">
          <div className="max-w-md lg:max-w-lg w-full text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              {config.welcome_title}
            </h1>
            <p className="text-white/60 mb-8 lg:text-lg">{config.welcome_subtitle}</p>

            {/* Name Input */}
            <div className="text-left mb-6">
              <label className="block text-sm lg:text-base text-white/60 mb-2">What&apos;s your name?</label>
              <input
                type="text"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-4 lg:py-5 rounded-xl bg-white/5 border border-white/10 text-white text-lg lg:text-xl placeholder:text-white/30 focus:outline-none focus:border-white/30"
                autoFocus
              />
            </div>

            <button
              onClick={nextStep}
              disabled={!formData.name.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 lg:py-5 rounded-xl text-white font-semibold text-lg lg:text-xl transition-all disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              Continue
              <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="p-6 lg:p-8">
          <div className="max-w-md lg:max-w-lg mx-auto">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundColor: primaryColor }}
              />
            </div>
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
        <div className="p-4 lg:p-6 flex items-center justify-between border-b border-white/10 max-w-7xl mx-auto w-full">
          {config.logo_url ? (
            <img src={config.logo_url} alt={config.business_name} className="h-8 lg:h-10" />
          ) : (
            <span className="text-white font-semibold text-lg">{config.business_name}</span>
          )}
          <span className="text-white/40 text-sm">{step + 1} of {steps.length}</span>
        </div>

        {/* Title */}
        <div className="p-6 lg:p-8 text-center">
          <Car className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3" style={{ color: primaryColor }} />
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-1">Which car interests you?</h2>
          <p className="text-white/60 text-sm lg:text-base">Select a vehicle to continue</p>
        </div>

        {/* Vehicle Grid - Responsive */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => handleVehicleSelect(vehicle)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all overflow-hidden text-left group"
                >
                  {vehicle.image_url && (
                    <div className="aspect-video w-full bg-black/30 overflow-hidden">
                      <img
                        src={vehicle.image_url}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4 lg:p-5">
                    <h3 className="text-lg lg:text-xl font-semibold text-white">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-white/60 lg:text-lg">${vehicle.daily_rate}/day</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Skip Button */}
        <div className="p-4 lg:p-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
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
        <div className="p-4 lg:p-6 flex items-center justify-between border-b border-white/10 max-w-4xl mx-auto w-full">
          {config.logo_url ? (
            <img src={config.logo_url} alt={config.business_name} className="h-8 lg:h-10" />
          ) : (
            <span className="text-white font-semibold text-lg">{config.business_name}</span>
          )}
          <span className="text-white/40 text-sm">{step + 1} of {steps.length}</span>
        </div>

        {/* Content Container - Centered on Desktop */}
        <div className="flex-1 flex flex-col lg:justify-center overflow-y-auto">
          <div className="max-w-lg mx-auto w-full px-4 lg:px-6 py-6">
            {/* Title */}
            <div className="text-center mb-6">
              <Calendar className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3" style={{ color: primaryColor }} />
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                {selectingEndDate ? "Select end date" : "Select start date"}
              </h2>
              <p className="text-white/60 text-sm lg:text-base">
                {formData.vehicle_interest
                  ? `For ${formData.vehicle_interest}`
                  : "When do you need the car?"}
              </p>
            </div>

            {/* Selected Dates Display */}
            {(formData.start_date || formData.end_date) && (
              <div className="mb-6">
                <div className="flex items-center justify-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-center">
                    <p className="text-xs lg:text-sm text-white/40 mb-1">Start</p>
                    <p className="text-white font-medium lg:text-lg">
                      {formData.start_date ? formatDateDisplay(formData.start_date) : "—"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                  <div className="text-center">
                    <p className="text-xs lg:text-sm text-white/40 mb-1">End</p>
                    <p className="text-white font-medium lg:text-lg">
                      {formData.end_date ? formatDateDisplay(formData.end_date) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-4 lg:p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  disabled={!canGoPrev}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <span className="text-white font-semibold lg:text-lg">{monthYear}</span>
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
                  <div key={day} className="text-center text-xs lg:text-sm text-white/40 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 lg:gap-2">
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
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm lg:text-base font-medium transition-all relative
                        ${past && !blocked ? "text-white/20 cursor-not-allowed" : ""}
                        ${blocked ? "bg-red-500/20 text-red-400/60 cursor-not-allowed" : ""}
                        ${!disabled ? "hover:bg-white/10 text-white/70" : ""}
                        ${inRange && !isStart && !isEnd ? "bg-white/10 text-white" : ""}
                        ${isStart || isEnd ? "text-white" : ""}
                      `}
                      style={{
                        backgroundColor: isStart || isEnd ? primaryColor : undefined,
                      }}
                    >
                      {blocked && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-6 h-[2px] bg-red-400/60 rotate-[-45deg] absolute" />
                        </span>
                      )}
                      <span className={blocked ? "relative" : ""}>{day}</span>
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-6 text-xs lg:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                    <span className="text-white text-[10px] font-medium">1</span>
                  </div>
                  <span className="text-white/60">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-red-500/20 flex items-center justify-center relative">
                    <span className="w-3 h-[2px] bg-red-400/60 rotate-[-45deg] absolute" />
                    <span className="text-red-400/60 text-[10px] font-medium relative">1</span>
                  </div>
                  <span className="text-white/60">Unavailable</span>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="mt-6">
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
            </div>
          </div>
        </div>

        {/* Progress - Fixed at bottom */}
        <div className="p-4 lg:p-6 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundColor: primaryColor }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Form steps (phone, email, age)
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor }}>
      {/* Header */}
      <div className="p-6 lg:p-8 flex items-center justify-between max-w-lg lg:max-w-xl mx-auto w-full">
        {config.logo_url ? (
          <img src={config.logo_url} alt={config.business_name} className="h-8 lg:h-10" />
        ) : (
          <span className="text-white font-semibold text-lg">{config.business_name}</span>
        )}
        <span className="text-white/40 text-sm">{step + 1} of {steps.length}</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8">
        <div className="max-w-md lg:max-w-lg w-full">
          {/* Phone Step */}
          {currentStepName === "phone" && (
            <div className="text-center">
              <Phone className="w-12 h-12 lg:w-14 lg:h-14 mx-auto mb-4" style={{ color: primaryColor }} />
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">What&apos;s your phone number?</h2>
              <p className="text-white/60 mb-6 lg:text-lg">We&apos;ll text you about availability</p>
              <input
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="w-full px-4 py-4 lg:py-5 rounded-xl bg-white/5 border border-white/10 text-white text-lg lg:text-xl text-center placeholder:text-white/30 focus:outline-none focus:border-white/30"
                autoFocus
              />
              <button
                onClick={nextStep}
                disabled={formData.phone.replace(/\D/g, "").length < 10}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 lg:py-5 rounded-xl text-white font-semibold text-lg lg:text-xl transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                Continue
                <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
          )}

          {/* Email Step */}
          {currentStepName === "email" && (
            <div className="text-center">
              <Mail className="w-12 h-12 lg:w-14 lg:h-14 mx-auto mb-4" style={{ color: primaryColor }} />
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">What&apos;s your email?</h2>
              <p className="text-white/60 mb-6 lg:text-lg">{config.require_email ? "Required for booking confirmation" : "Optional, but helps us send you details"}</p>
              <input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-4 lg:py-5 rounded-xl bg-white/5 border border-white/10 text-white text-lg lg:text-xl text-center placeholder:text-white/30 focus:outline-none focus:border-white/30"
                autoFocus
              />
              <button
                onClick={isLastStep ? handleSubmit : nextStep}
                disabled={config.require_email && !formData.email.includes("@")}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 lg:py-5 rounded-xl text-white font-semibold text-lg lg:text-xl transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 lg:w-6 lg:h-6 animate-spin" />
                ) : isLastStep ? (
                  "Submit"
                ) : (
                  <>{config.require_email || formData.email ? "Continue" : "Skip"}<ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" /></>
                )}
              </button>
            </div>
          )}

          {/* Age Step */}
          {currentStepName === "age" && (
            <div className="text-center">
              <User className="w-12 h-12 lg:w-14 lg:h-14 mx-auto mb-4" style={{ color: primaryColor }} />
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">How old are you?</h2>
              <p className="text-white/60 mb-6 lg:text-lg">Renters must be at least {config.minimum_age} years old</p>
              <input
                type="number"
                placeholder="25"
                min="18"
                max="99"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-4 lg:py-5 rounded-xl bg-white/5 border border-white/10 text-white text-lg lg:text-xl text-center placeholder:text-white/30 focus:outline-none focus:border-white/30"
                autoFocus
              />
              <button
                onClick={isLastStep ? handleSubmit : handleAgeCheck}
                disabled={!formData.age || parseInt(formData.age) < 18 || submitting}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 lg:py-5 rounded-xl text-white font-semibold text-lg lg:text-xl transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 lg:w-6 lg:h-6 animate-spin" />
                ) : isLastStep ? (
                  "Submit"
                ) : (
                  <>Continue<ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" /></>
                )}
              </button>
            </div>
          )}

          {/* SMS Consent Step */}
          {currentStepName === "consent" && (
            <div className="text-center">
              <Shield className="w-12 h-12 lg:w-14 lg:h-14 mx-auto mb-4" style={{ color: primaryColor }} />
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">Almost done!</h2>
              <p className="text-white/60 mb-6 lg:text-lg">Please review and agree to receive text messages</p>

              {/* SMS Consent Disclosure Box */}
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-left mb-4">
                <h3 className="text-white font-semibold mb-3">SMS/Text Message Consent</h3>
                <div className="text-sm text-white/70 leading-relaxed space-y-3">
                  <p>
                    By checking the box below and submitting this form, you expressly consent to receive recurring automated marketing and informational text messages from <strong className="text-white">{config.business_name}</strong> at the phone number you provided above.
                  </p>
                  <p>
                    <strong className="text-white">Message Types:</strong> Promotional offers, booking confirmations, rental availability, appointment reminders, and customer service communications related to exotic and luxury vehicle rentals.
                  </p>
                  <p>
                    <strong className="text-white">Message Frequency:</strong> Message frequency varies. You may receive up to 10 messages per month.
                  </p>
                  <p>
                    <strong className="text-white">Rates:</strong> Message and data rates may apply. Check with your mobile carrier for details.
                  </p>
                  <p>
                    <strong className="text-white">Opt-Out:</strong> You can opt out at any time by replying <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">STOP</span> to any message. For help, reply <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">HELP</span> or contact us at info@scalexotics.com.
                  </p>
                  <p>
                    <strong className="text-white">Consent Not Required:</strong> Consent to receive text messages is not a condition of purchasing any goods or services.
                  </p>
                  <p className="text-white/60">
                    By providing your phone number, you confirm you are at least 18 years old and the account holder or have authorization from the account holder to receive text messages at this number.
                  </p>
                </div>
              </div>

              {/* SMS Consent Checkbox - Not pre-checked */}
              <label className="flex items-start gap-4 p-5 rounded-xl bg-white/5 border border-white/10 text-left cursor-pointer hover:bg-white/10 transition-colors mb-4">
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                    formData.smsConsent
                      ? "border-transparent"
                      : "border-white/30"
                  }`}
                  style={{ backgroundColor: formData.smsConsent ? primaryColor : "transparent" }}
                >
                  {formData.smsConsent && <Check className="w-4 h-4 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={formData.smsConsent}
                  onChange={(e) => setFormData({ ...formData, smsConsent: e.target.checked })}
                  className="sr-only"
                />
                <span className="text-sm text-white/70 leading-relaxed">
                  I agree to receive recurring automated text messages from {config.business_name} at the phone number provided. I understand message and data rates may apply. I can reply STOP to opt out at any time.
                </span>
              </label>

              {/* Policy Links */}
              <div className="text-xs text-white/50 mb-6">
                By submitting, you also agree to our{" "}
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70 transition-colors">
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a href="/sms-terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70 transition-colors">
                  SMS Terms & Conditions
                </a>.
              </div>

              <button
                onClick={handleSubmit}
                disabled={!formData.smsConsent || submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 lg:py-5 rounded-xl text-white font-semibold text-lg lg:text-xl transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 lg:w-6 lg:h-6 animate-spin" />
                ) : (
                  "Submit Inquiry"
                )}
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-center lg:text-lg">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="p-6 lg:p-8">
        <div className="max-w-md lg:max-w-lg mx-auto">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: primaryColor }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
