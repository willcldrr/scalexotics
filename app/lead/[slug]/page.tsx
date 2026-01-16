"use client"

import { useState, useEffect, use } from "react"
import { Loader2, CheckCircle, AlertCircle, ChevronRight, Calendar, Car, User, Phone, Mail, Clock } from "lucide-react"
import Image from "next/image"

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

interface FormData {
  name: string
  email: string
  phone: string
  age: string
  vehicle_interest: string
  dates: string
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

  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    age: "",
    vehicle_interest: "",
    dates: "",
  })

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

      if (formData.dates) {
        payload.notes = `Dates: ${formData.dates}`
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

  // Calculate total steps based on enabled fields
  const getSteps = () => {
    if (!config) return []
    const steps: string[] = []
    if (config.fields.name) steps.push("name")
    if (config.fields.phone) steps.push("phone")
    if (config.fields.email) steps.push("email")
    if (config.fields.age) steps.push("age")
    if (config.fields.vehicle && vehicles.length > 0) steps.push("vehicle")
    if (config.fields.dates) steps.push("dates")
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

  // Form steps
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
                onClick={nextStep}
                disabled={config.require_email && !formData.email.includes("@")}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-semibold text-lg transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {config.require_email || formData.email ? "Continue" : "Skip"}
                <ChevronRight className="w-5 h-5" />
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
                onClick={handleAgeCheck}
                disabled={!formData.age || parseInt(formData.age) < 18}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-semibold text-lg transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Vehicle Step */}
          {currentStepName === "vehicle" && (
            <div>
              <div className="text-center mb-6">
                <Car className="w-12 h-12 mx-auto mb-4" style={{ color: primaryColor }} />
                <h2 className="text-2xl font-bold text-white mb-2">Which car interests you?</h2>
                <p className="text-white/60">Select one or skip if you&apos;re not sure</p>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto mb-6">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => setFormData({ ...formData, vehicle_interest: `${vehicle.year} ${vehicle.make} ${vehicle.model}` })}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      formData.vehicle_interest === `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                        ? "border-white/30 bg-white/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {vehicle.image_url && (
                        <img src={vehicle.image_url} alt={vehicle.name} className="w-16 h-12 object-cover rounded-lg" />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                        <p className="text-white/50 text-sm">${vehicle.daily_rate}/day</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
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
                ) : (
                  <>
                    {formData.vehicle_interest ? "Continue" : "Skip"}
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Dates Step */}
          {currentStepName === "dates" && (
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: primaryColor }} />
              <h2 className="text-2xl font-bold text-white mb-2">When do you need the car?</h2>
              <p className="text-white/60 mb-6">Tell us your preferred dates</p>
              <input
                type="text"
                placeholder="e.g., This Saturday to Sunday"
                value={formData.dates}
                onChange={(e) => setFormData({ ...formData, dates: e.target.value })}
                className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg text-center placeholder:text-white/30 focus:outline-none focus:border-white/30"
                autoFocus
              />
              <button
                onClick={isLastStep ? handleSubmit : nextStep}
                disabled={submitting}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-semibold text-lg transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLastStep ? (
                  "Submit"
                ) : (
                  <>
                    {formData.dates ? "Continue" : "Skip"}
                    <ChevronRight className="w-5 h-5" />
                  </>
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
