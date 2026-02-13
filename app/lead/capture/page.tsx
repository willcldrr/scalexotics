"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, CheckCircle, Car } from "lucide-react"

interface FormData {
  name: string
  email: string
  phone: string
  vehicleInterest: string
  smsConsent: boolean
}

export default function LeadCapturePage() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    vehicleInterest: "",
    smsConsent: false,
  })

  const primaryColor = "#375DEE"
  const backgroundColor = "#0a0a0a"

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: formatPhone(e.target.value) })
  }

  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.email.includes("@") &&
      formData.phone.replace(/\D/g, "").length >= 10 &&
      formData.vehicleInterest !== "" &&
      formData.smsConsent
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ""),
          vehicle_interest: formData.vehicleInterest,
          source: "lead-capture-a2p",
          sms_consent: formData.smsConsent,
          consent_timestamp: new Date().toISOString(),
        }),
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

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor }}>
        <div className="max-w-md w-full text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Thank You!</h1>
          <p className="text-white/60 mb-6">
            We&apos;ve received your inquiry and will be in touch shortly via text message.
          </p>
          <p className="text-white/40 text-sm">
            You can opt out at any time by replying STOP to any message.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor }}>
      {/* Header */}
      <header className="p-6 lg:p-8 border-b border-white/10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2">
            <Car className="w-7 h-7" style={{ color: primaryColor }} />
            <span className="text-white font-bold text-xl">Scale Exotics</span>
          </div>
          <p className="text-white/50 text-sm text-center mt-2">Exotic & Luxury Vehicle Rentals</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Get Started</h1>
            <p className="text-white/60">Complete the form below to inquire about our exotic vehicle rentals.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-2">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
            </div>

            {/* Vehicle Interest */}
            <div>
              <label htmlFor="vehicleInterest" className="block text-sm font-medium text-white/80 mb-2">
                Vehicle Interest <span className="text-red-400">*</span>
              </label>
              <select
                id="vehicleInterest"
                name="vehicleInterest"
                required
                value={formData.vehicleInterest}
                onChange={(e) => setFormData({ ...formData, vehicleInterest: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                <option value="" className="bg-neutral-900">Select a vehicle type</option>
                <option value="Lamborghini" className="bg-neutral-900">Lamborghini</option>
                <option value="Ferrari" className="bg-neutral-900">Ferrari</option>
                <option value="McLaren" className="bg-neutral-900">McLaren</option>
                <option value="Porsche" className="bg-neutral-900">Porsche</option>
                <option value="Rolls-Royce" className="bg-neutral-900">Rolls-Royce</option>
                <option value="Other Exotic" className="bg-neutral-900">Other Exotic</option>
              </select>
            </div>

            {/* Age Disclosure */}
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-200 text-sm">
                <strong>Age Requirement:</strong> Renters must be at least 25 years old with a valid driver&apos;s license. By submitting this form, you confirm that you are 25 years of age or older.
              </p>
            </div>

            {/* SMS Consent Checkbox - CTIA/Twilio Compliant */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.smsConsent}
                  onChange={(e) => setFormData({ ...formData, smsConsent: e.target.checked })}
                  className="mt-1 w-5 h-5 rounded border-white/30 bg-white/5 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-white/80 leading-relaxed">
                  I consent to receive promotional SMS from Scale Exotics about vehicle rentals, availability, offers, confirmations, and reminders (up to 10 messages per month). Message and data rates may apply. Reply STOP to unsubscribe.
                </span>
              </label>
              <p className="text-xs text-white/50 mt-3 ml-8">
                By checking this box, you agree to our{" "}
                <Link
                  href="/lead/privacy-policy"
                  className="text-blue-400 underline hover:text-blue-300"
                  target="_blank"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/lead/tos"
                  className="text-blue-400 underline hover:text-blue-300"
                  target="_blank"
                >
                  SMS Terms
                </Link>
                . Consent is not required to rent a vehicle.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid() || submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg text-white font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Submit Inquiry"
              )}
            </button>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-center text-sm">
                {error}
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Footer with Full Disclosures */}
      <footer className="p-6 lg:p-8 border-t border-white/10">
        <div className="max-w-lg mx-auto text-center">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Car className="w-5 h-5" style={{ color: primaryColor }} />
            <span className="text-white font-semibold">Scale Exotics</span>
          </div>

          {/* SMS Program Summary */}
          <div className="text-xs text-white/50 space-y-2 mb-4">
            <p>
              <strong className="text-white/70">SMS Program:</strong> Scale Exotics Vehicle Alerts
            </p>
            <p>
              <strong className="text-white/70">Message Frequency:</strong> Up to 10 messages/month
            </p>
            <p>
              <strong className="text-white/70">Message & Data Rates:</strong> May apply
            </p>
            <p>
              <strong className="text-white/70">Opt-Out:</strong> Reply STOP to any message
            </p>
            <p>
              <strong className="text-white/70">Help:</strong> Reply HELP or email support@scaleexotics.com
            </p>
          </div>

          {/* Policy Links */}
          <div className="flex items-center justify-center gap-4 text-sm mb-4">
            <Link
              href="/lead/privacy-policy"
              className="text-white/50 hover:text-white/80 underline transition-colors"
              target="_blank"
            >
              Privacy Policy
            </Link>
            <Link
              href="/lead/tos"
              className="text-white/50 hover:text-white/80 underline transition-colors"
              target="_blank"
            >
              SMS Terms
            </Link>
          </div>

          {/* Copyright and Additional Disclosures */}
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Scale Exotics. All rights reserved.
          </p>
          <p className="text-xs text-white/40 mt-2">
            Exotic vehicle rentals require renters to be 25+ years old with valid insurance and driver&apos;s license.
          </p>
        </div>
      </footer>
    </div>
  )
}
