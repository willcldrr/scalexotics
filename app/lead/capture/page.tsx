"use client"

import { useState } from "react"
import { Loader2, CheckCircle, ChevronRight, ChevronDown, ChevronUp, Phone, User, Mail, Shield, Check, Car } from "lucide-react"

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
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [privacyExpanded, setPrivacyExpanded] = useState(true)
  const [termsExpanded, setTermsExpanded] = useState(true)

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
                <button
                  onClick={() => setShowPrivacyModal(true)}
                  className="underline hover:text-white/70 transition-colors"
                >
                  Privacy Policy
                </button>{" "}
                and{" "}
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="underline hover:text-white/70 transition-colors"
                >
                  SMS Terms &amp; Conditions
                </button>.
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

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowPrivacyModal(false)}>
          <div
            className="bg-[#111] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Privacy Policy</h2>
              <button onClick={() => setShowPrivacyModal(false)} className="text-white/60 hover:text-white">
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] text-sm text-white/70 space-y-6">
              <p className="text-white/50">Last updated: February 2026</p>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">1. Introduction</h3>
                <p>This Privacy Policy explains how we collect, use, and protect your personal information when you use our exotic and luxury vehicle rental inquiry services and opt-in to receive SMS/text messages.</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">2. Information We Collect</h3>
                <p className="mb-2">When you submit an inquiry through this form, we collect:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Full name</li>
                  <li>Mobile phone number</li>
                  <li>Email address</li>
                  <li>Vehicle preferences</li>
                  <li>SMS consent status and timestamp</li>
                  <li>IP address and device information (automatically collected)</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">3. How We Use Your Information</h3>
                <p className="mb-2">Your information is used to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Send promotional text messages about vehicle availability and special offers</li>
                  <li>Send booking confirmations and appointment reminders via SMS</li>
                  <li>Respond to your rental inquiries</li>
                  <li>Provide customer support</li>
                  <li>Process and manage your vehicle rental bookings</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">4. SMS/Text Message Data</h3>
                <p className="mb-2">For SMS communications specifically, we collect and maintain:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Your mobile phone number</li>
                  <li>Consent timestamp and method</li>
                  <li>Opt-in and opt-out history</li>
                  <li>Message delivery records</li>
                </ul>
                <p className="mt-2"><strong className="text-white">Important:</strong> We do NOT sell, rent, or share your phone number or SMS consent data with third parties for their marketing purposes. Your phone number is used solely for communications from our rental service.</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">5. Data Sharing</h3>
                <p className="mb-2">We only share your information with:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Our SMS service provider (for message delivery only)</li>
                  <li>Payment processors (for rental transactions)</li>
                  <li>Legal authorities (when required by law)</li>
                </ul>
                <p className="mt-2">These service providers are contractually prohibited from using your information for any purpose other than providing their specific services.</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">6. Opting Out of SMS</h3>
                <p className="mb-2">You can stop receiving text messages at any time:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Reply <strong className="text-white">STOP</strong> to any text message</li>
                  <li>Reply <strong className="text-white">CANCEL</strong>, <strong className="text-white">END</strong>, <strong className="text-white">QUIT</strong>, or <strong className="text-white">UNSUBSCRIBE</strong></li>
                  <li>Contact us at support@example.com</li>
                </ul>
                <p className="mt-2">After opting out, you will receive a confirmation message and no further promotional texts will be sent.</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">7. Data Retention</h3>
                <p>We retain your information for the duration of our business relationship and for a minimum of 4 years after to comply with legal and regulatory requirements. You may request deletion of your data by contacting us, subject to legal retention requirements.</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">8. Your Rights</h3>
                <p className="mb-2">You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Request access to your personal data</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt out of SMS communications at any time</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">9. Age Requirement</h3>
                <p>You must be at least 18 years old to use this service. Our vehicle rental services typically require renters to be 25 years or older. We do not knowingly collect information from individuals under 18.</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">10. Contact Us</h3>
                <p>For questions about this Privacy Policy or your data, contact us at: support@example.com</p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* SMS Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowTermsModal(false)}>
          <div
            className="bg-[#111] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">SMS Terms &amp; Conditions</h2>
              <button onClick={() => setShowTermsModal(false)} className="text-white/60 hover:text-white">
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] text-sm text-white/70 space-y-6">
              <p className="text-white/50">Last updated: February 2026</p>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">1. Program Overview</h3>
                <p><strong className="text-white">Program Name:</strong> Exotic Car Rental Alerts</p>
                <p className="mt-2"><strong className="text-white">Description:</strong> By opting in, you agree to receive recurring automated marketing and informational text messages about exotic and luxury vehicle rentals, including promotional offers, booking confirmations, availability updates, and customer service communications.</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">2. Message Types</h3>
                <p className="mb-2">You may receive:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong className="text-white">Promotional:</strong> Special offers, discounts, new vehicle availability</li>
                  <li><strong className="text-white">Transactional:</strong> Booking confirmations, rental reminders, payment receipts</li>
                  <li><strong className="text-white">Reminders:</strong> Pickup/drop-off appointments, inspection notices</li>
                  <li><strong className="text-white">Service:</strong> Responses to inquiries, support communications</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">3. Message Frequency</h3>
                <p>Message frequency varies based on your interactions. You may receive up to 10 promotional messages per month, plus transactional messages as needed for active bookings. Frequency may increase during special promotions.</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">4. Costs</h3>
                <p><strong className="text-white">Message and data rates may apply.</strong> You are responsible for any charges from your mobile carrier. We do not charge a fee for sending messages, but standard carrier rates apply.</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">5. How to Opt Out</h3>
                <p className="mb-2">Stop messages at any time by:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Replying <strong className="text-white">STOP</strong> to any message</li>
                  <li>Replying <strong className="text-white">CANCEL</strong>, <strong className="text-white">END</strong>, <strong className="text-white">QUIT</strong>, or <strong className="text-white">UNSUBSCRIBE</strong></li>
                  <li>Emailing support@example.com with your phone number</li>
                </ul>
                <p className="mt-2">You will receive a confirmation message after opting out. No further promotional messages will be sent.</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">6. How to Get Help</h3>
                <p className="mb-2">For assistance:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Reply <strong className="text-white">HELP</strong> to any message</li>
                  <li>Email support@example.com</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">7. Consent Requirements</h3>
                <p className="mb-2">By opting in, you confirm:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>You are at least 18 years old</li>
                  <li>You are the account holder or authorized to receive messages</li>
                  <li>You consent to automated marketing and informational texts</li>
                  <li>Consent is NOT required to make a purchase or rental</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">8. Supported Carriers</h3>
                <p>Supported on major U.S. carriers including AT&amp;T, Verizon, T-Mobile, and others. Carriers are not liable for delayed or undelivered messages.</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">9. Privacy</h3>
                <p>We do not sell, rent, or share your phone number with third parties for marketing. See our Privacy Policy for complete details on data handling.</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">10. Age-Restricted Services</h3>
                <p>Exotic vehicle rentals typically require renters to be 25 years or older. By providing your phone number, you confirm you meet minimum age requirements.</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">11. Contact</h3>
                <p>Questions? Email support@example.com or reply HELP to any message.</p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Visible Policy Sections for Crawler Verification */}
      <div className="border-t border-white/10" style={{ backgroundColor }}>
        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* Privacy Policy Section */}
          <section id="privacy-policy" className="mb-12">
            <button
              onClick={() => setPrivacyExpanded(!privacyExpanded)}
              className="w-full flex items-center justify-between text-left mb-4"
            >
              <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
              {privacyExpanded ? (
                <ChevronUp className="w-6 h-6 text-white/60" />
              ) : (
                <ChevronDown className="w-6 h-6 text-white/60" />
              )}
            </button>
            <div className={`text-sm text-white/70 space-y-4 ${privacyExpanded ? "" : "hidden"}`}>
              <p className="text-white/50">Last updated: February 2026</p>

              <h3 className="text-lg font-semibold text-white">1. Introduction</h3>
              <p>This Privacy Policy explains how we collect, use, and protect your personal information when you use our exotic and luxury vehicle rental inquiry services and opt-in to receive SMS/text messages.</p>

              <h3 className="text-lg font-semibold text-white">2. Information We Collect</h3>
              <p>When you submit an inquiry through this form, we collect: Full name, Mobile phone number, Email address, Vehicle preferences, SMS consent status and timestamp, IP address and device information (automatically collected).</p>

              <h3 className="text-lg font-semibold text-white">3. How We Use Your Information</h3>
              <p>Your information is used to: Send promotional text messages about vehicle availability and special offers, Send booking confirmations and appointment reminders via SMS, Respond to your rental inquiries, Provide customer support, Process and manage your vehicle rental bookings.</p>

              <h3 className="text-lg font-semibold text-white">4. SMS/Text Message Data</h3>
              <p>For SMS communications specifically, we collect and maintain: Your mobile phone number, Consent timestamp and method, Opt-in and opt-out history, Message delivery records.</p>
              <p className="font-semibold text-white">Important: We do NOT sell, rent, or share your phone number or SMS consent data with third parties for their marketing purposes. Your phone number is used solely for communications from our rental service.</p>

              <h3 className="text-lg font-semibold text-white">5. Data Sharing</h3>
              <p>We only share your information with: Our SMS service provider (for message delivery only), Payment processors (for rental transactions), Legal authorities (when required by law). These service providers are contractually prohibited from using your information for any purpose other than providing their specific services.</p>

              <h3 className="text-lg font-semibold text-white">6. Opting Out of SMS</h3>
              <p>You can stop receiving text messages at any time: Reply STOP to any text message, Reply CANCEL, END, QUIT, or UNSUBSCRIBE, Contact us at support@example.com. After opting out, you will receive a confirmation message and no further promotional texts will be sent.</p>

              <h3 className="text-lg font-semibold text-white">7. Data Retention</h3>
              <p>We retain your information for the duration of our business relationship and for a minimum of 4 years after to comply with legal and regulatory requirements. You may request deletion of your data by contacting us, subject to legal retention requirements.</p>

              <h3 className="text-lg font-semibold text-white">8. Your Rights</h3>
              <p>You have the right to: Request access to your personal data, Request correction of inaccurate data, Request deletion of your data, Opt out of SMS communications at any time.</p>

              <h3 className="text-lg font-semibold text-white">9. Age Requirement</h3>
              <p>You must be at least 18 years old to use this service. Our vehicle rental services typically require renters to be 25 years or older. We do not knowingly collect information from individuals under 18.</p>

              <h3 className="text-lg font-semibold text-white">10. Contact Us</h3>
              <p>For questions about this Privacy Policy or your data, contact us at: support@example.com</p>
            </div>
            {/* Always visible summary for crawlers */}
            <noscript>
              <div className="text-sm text-white/70 space-y-2">
                <p>This Privacy Policy explains how we collect, use, and protect your personal information when you use our exotic and luxury vehicle rental inquiry services and opt-in to receive SMS/text messages.</p>
                <p>We do NOT sell, rent, or share your phone number or SMS consent data with third parties for their marketing purposes.</p>
                <p>You can opt out of SMS at any time by replying STOP to any message.</p>
              </div>
            </noscript>
          </section>

          {/* SMS Terms Section */}
          <section id="sms-terms" className="mb-8">
            <button
              onClick={() => setTermsExpanded(!termsExpanded)}
              className="w-full flex items-center justify-between text-left mb-4"
            >
              <h2 className="text-2xl font-bold text-white">SMS Terms &amp; Conditions</h2>
              {termsExpanded ? (
                <ChevronUp className="w-6 h-6 text-white/60" />
              ) : (
                <ChevronDown className="w-6 h-6 text-white/60" />
              )}
            </button>
            <div className={`text-sm text-white/70 space-y-4 ${termsExpanded ? "" : "hidden"}`}>
              <p className="text-white/50">Last updated: February 2026</p>

              <h3 className="text-lg font-semibold text-white">1. Program Overview</h3>
              <p><strong>Program Name:</strong> Exotic Car Rental Alerts</p>
              <p><strong>Description:</strong> By opting in, you agree to receive recurring automated marketing and informational text messages about exotic and luxury vehicle rentals, including promotional offers, booking confirmations, availability updates, and customer service communications.</p>

              <h3 className="text-lg font-semibold text-white">2. Message Types</h3>
              <p>You may receive: Promotional messages (special offers, discounts, new vehicle availability), Transactional messages (booking confirmations, rental reminders, payment receipts), Appointment reminders (pickup/drop-off, inspection notices), Customer service responses.</p>

              <h3 className="text-lg font-semibold text-white">3. Message Frequency</h3>
              <p>Message frequency varies based on your interactions. You may receive up to 10 promotional messages per month, plus transactional messages as needed for active bookings.</p>

              <h3 className="text-lg font-semibold text-white">4. Costs</h3>
              <p>Message and data rates may apply. You are responsible for any charges from your mobile carrier. We do not charge a fee for sending messages, but standard carrier rates apply.</p>

              <h3 className="text-lg font-semibold text-white">5. How to Opt Out</h3>
              <p>Stop messages at any time by: Replying STOP to any message, Replying CANCEL, END, QUIT, or UNSUBSCRIBE, Emailing support@example.com with your phone number. You will receive a confirmation message after opting out.</p>

              <h3 className="text-lg font-semibold text-white">6. How to Get Help</h3>
              <p>For assistance: Reply HELP to any message, Email support@example.com</p>

              <h3 className="text-lg font-semibold text-white">7. Consent Requirements</h3>
              <p>By opting in, you confirm: You are at least 18 years old, You are the account holder or authorized to receive messages, You consent to automated marketing and informational texts, Consent is NOT required to make a purchase or rental.</p>

              <h3 className="text-lg font-semibold text-white">8. Supported Carriers</h3>
              <p>Supported on major U.S. carriers including AT&amp;T, Verizon, T-Mobile, and others. Carriers are not liable for delayed or undelivered messages.</p>

              <h3 className="text-lg font-semibold text-white">9. Privacy</h3>
              <p>We do not sell, rent, or share your phone number with third parties for marketing. See our Privacy Policy above for complete details on data handling.</p>

              <h3 className="text-lg font-semibold text-white">10. Age-Restricted Services</h3>
              <p>Exotic vehicle rentals typically require renters to be 25 years or older. By providing your phone number, you confirm you meet minimum age requirements.</p>

              <h3 className="text-lg font-semibold text-white">11. Contact</h3>
              <p>Questions? Email support@example.com or reply HELP to any message.</p>
            </div>
            {/* Always visible summary for crawlers */}
            <noscript>
              <div className="text-sm text-white/70 space-y-2">
                <p>Program: Exotic Car Rental Alerts - Receive promotional offers, booking confirmations, and customer service texts.</p>
                <p>Frequency: Up to 10 messages per month. Message and data rates may apply.</p>
                <p>Opt-out: Reply STOP to any message. Reply HELP for assistance.</p>
                <p>Consent is not required to make a purchase.</p>
              </div>
            </noscript>
          </section>

          {/* Quick Reference Box - Always Visible */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">SMS Program Quick Reference</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-white/70">
              <div>
                <p className="text-white font-medium">Program Name</p>
                <p>Exotic Car Rental Alerts</p>
              </div>
              <div>
                <p className="text-white font-medium">Message Frequency</p>
                <p>Up to 10 messages/month</p>
              </div>
              <div>
                <p className="text-white font-medium">To Opt Out</p>
                <p>Reply STOP to any message</p>
              </div>
              <div>
                <p className="text-white font-medium">For Help</p>
                <p>Reply HELP or email support@example.com</p>
              </div>
              <div>
                <p className="text-white font-medium">Message Rates</p>
                <p>Message &amp; data rates may apply</p>
              </div>
              <div>
                <p className="text-white font-medium">Data Sharing</p>
                <p>We do NOT sell your phone number</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/50">
            <p>&copy; 2026 Exotic Car Rentals. All rights reserved.</p>
            <p className="mt-2">
              <a href="#privacy-policy" className="hover:text-white/70">Privacy Policy</a>
              {" | "}
              <a href="#sms-terms" className="hover:text-white/70">SMS Terms</a>
              {" | "}
              <a href="mailto:support@example.com" className="hover:text-white/70">Contact</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
