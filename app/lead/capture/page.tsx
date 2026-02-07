"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, CheckCircle, ChevronRight, Phone, User, Mail, Shield, Check, Car } from "lucide-react"

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
  const [step, setStep] = useState(0)

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

  const nextStep = () => setStep(step + 1)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      // Submit to your API endpoint
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

  const steps = ["name", "phone", "email", "vehicle", "consent"]
  const currentStepName = steps[step]
  const progress = ((step + 1) / steps.length) * 100

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
      <div className="p-6 lg:p-8 flex items-center justify-between max-w-lg lg:max-w-xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Car className="w-6 h-6" style={{ color: primaryColor }} />
          <span className="text-white font-semibold text-lg">Exotic Car Rentals</span>
        </div>
        <span className="text-white/40 text-sm">{step + 1} of {steps.length}</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8">
        <div className="max-w-md lg:max-w-lg w-full">
          {/* Name Step */}
          {currentStepName === "name" && (
            <div className="text-center">
              <User className="w-12 h-12 lg:w-14 lg:h-14 mx-auto mb-4" style={{ color: primaryColor }} />
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">What&apos;s your name?</h2>
              <p className="text-white/60 mb-6 lg:text-lg">Let&apos;s get started with your rental inquiry</p>
              <input
                type="text"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-4 lg:py-5 rounded-xl bg-white/5 border border-white/10 text-white text-lg lg:text-xl text-center placeholder:text-white/30 focus:outline-none focus:border-white/30"
                autoFocus
              />
              <button
                onClick={nextStep}
                disabled={!formData.name.trim()}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 lg:py-5 rounded-xl text-white font-semibold text-lg lg:text-xl transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                Continue
                <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
          )}

          {/* Phone Step */}
          {currentStepName === "phone" && (
            <div className="text-center">
              <Phone className="w-12 h-12 lg:w-14 lg:h-14 mx-auto mb-4" style={{ color: primaryColor }} />
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">What&apos;s your phone number?</h2>
              <p className="text-white/60 mb-6 lg:text-lg">We&apos;ll text you about vehicle availability</p>
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
              <p className="text-white/60 mb-6 lg:text-lg">For booking confirmations and receipts</p>
              <input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-4 lg:py-5 rounded-xl bg-white/5 border border-white/10 text-white text-lg lg:text-xl text-center placeholder:text-white/30 focus:outline-none focus:border-white/30"
                autoFocus
              />
              <button
                onClick={nextStep}
                disabled={!formData.email.includes("@")}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 lg:py-5 rounded-xl text-white font-semibold text-lg lg:text-xl transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                Continue
                <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
          )}

          {/* Vehicle Interest Step */}
          {currentStepName === "vehicle" && (
            <div className="text-center">
              <Car className="w-12 h-12 lg:w-14 lg:h-14 mx-auto mb-4" style={{ color: primaryColor }} />
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">What type of vehicle interests you?</h2>
              <p className="text-white/60 mb-6 lg:text-lg">Help us find the perfect car for you</p>
              <div className="grid grid-cols-1 gap-3 mb-6">
                {["Lamborghini", "Ferrari", "McLaren", "Porsche", "Rolls-Royce", "Other Exotic"].map((vehicle) => (
                  <button
                    key={vehicle}
                    onClick={() => setFormData({ ...formData, vehicleInterest: vehicle })}
                    className={`w-full px-4 py-4 rounded-xl border text-left transition-all ${
                      formData.vehicleInterest === vehicle
                        ? "border-white/50 bg-white/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {vehicle}
                  </button>
                ))}
              </div>
              <button
                onClick={nextStep}
                disabled={!formData.vehicleInterest}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 lg:py-5 rounded-xl text-white font-semibold text-lg lg:text-xl transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                Continue
                <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
          )}

          {/* SMS Consent Step */}
          {currentStepName === "consent" && (
            <div>
              <div className="text-center mb-6">
                <Shield className="w-12 h-12 lg:w-14 lg:h-14 mx-auto mb-4" style={{ color: primaryColor }} />
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">Almost done!</h2>
                <p className="text-white/60 lg:text-lg">Please review and agree to receive text messages</p>
              </div>

              {/* SMS Consent Disclosure Box */}
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-left mb-4">
                <h3 className="text-white font-semibold mb-3">SMS/Text Message Consent</h3>
                <div className="text-sm text-white/70 leading-relaxed space-y-3">
                  <p>
                    By checking the box below and submitting this form, you expressly consent to receive recurring automated marketing and informational text messages from <strong className="text-white">Exotic Car Rentals</strong> at the phone number you provided.
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
                    <strong className="text-white">Opt-Out:</strong> You can opt out at any time by replying <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">STOP</span> to any message. For help, reply <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">HELP</span> or contact us at support@example.com.
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
                    formData.smsConsent ? "border-transparent" : "border-white/30"
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
                  I agree to receive recurring automated text messages from Exotic Car Rentals at the phone number provided. I understand message and data rates may apply. I can reply STOP to opt out at any time.
                </span>
              </label>

              {/* Policy Links */}
              <div className="text-xs text-white/50 mb-6 text-center">
                By submitting, you also agree to our{" "}
                <Link
                  href="/lead/privacy-policy"
                  className="underline hover:text-white/70 transition-colors"
                  target="_blank"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/lead/tos"
                  className="underline hover:text-white/70 transition-colors"
                  target="_blank"
                >
                  SMS Terms &amp; Conditions
                </Link>.
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

              {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-center">
                  {error}
                </div>
              )}
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
