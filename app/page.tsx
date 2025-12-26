"use client"

import { useState } from "react"
import { bebasNeue } from "./fonts"

type SurveyAnswers = {
  fleetSize: string
  weekdayBookings: string
  bookingSource: string
  biggestBlocker: string
  fullName: string
  phoneNumber: string
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [answers, setAnswers] = useState<SurveyAnswers>({
    fleetSize: "",
    weekdayBookings: "",
    bookingSource: "",
    biggestBlocker: "",
    fullName: "",
    phoneNumber: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
    return phoneRegex.test(phone.replace(/\s/g, ""))
  }

  const handleOptionSelect = (field: keyof SurveyAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }))
    // Auto-advance after selection (with slight delay for visual feedback)
    setTimeout(() => {
      setCurrentStep(prev => prev + 1)
    }, 300)
  }

  const handleInputChange = (field: keyof SurveyAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {}

    if (!answers.fullName.trim()) {
      newErrors.fullName = "Name is required"
    }

    if (!answers.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required"
    } else if (!validatePhone(answers.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      await fetch("https://willcldrr.app.n8n.cloud/webhook/lead-capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fleetSize: answers.fleetSize,
          weekdayBookings: answers.weekdayBookings,
          bookingSource: answers.bookingSource,
          biggestBlocker: answers.biggestBlocker,
          name: answers.fullName,
          phone: answers.phoneNumber
        }),
      })

      setIsSubmitted(true)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestion = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex flex-col items-center gap-8 animate-fade-in">
            <h2 className={`${bebasNeue.className} text-3xl md:text-4xl text-white text-center`}>
              How many vehicles are currently in your fleet?
            </h2>
            <div className="w-full max-w-md flex flex-col gap-3">
              {["1–3", "4–7", "8–15", "16+"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect("fleetSize", option)}
                  className={`w-full px-6 py-4 rounded-xl border transition-all duration-200 text-left text-lg
                    ${answers.fleetSize === option 
                      ? "bg-[#375DEE] border-[#375DEE] text-white" 
                      : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="flex flex-col items-center gap-8 animate-fade-in">
            <h2 className={`${bebasNeue.className} text-3xl md:text-4xl text-white text-center`}>
              What percentage of weekdays are typically booked?
            </h2>
            <div className="w-full max-w-md flex flex-col gap-3">
              {["<25%", "25–50%", "50–75%", "75%+"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect("weekdayBookings", option)}
                  className={`w-full px-6 py-4 rounded-xl border transition-all duration-200 text-left text-lg
                    ${answers.weekdayBookings === option 
                      ? "bg-[#375DEE] border-[#375DEE] text-white" 
                      : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="flex flex-col items-center gap-8 animate-fade-in">
            <h2 className={`${bebasNeue.className} text-3xl md:text-4xl text-white text-center`}>
              Where do most of your bookings come from today?
            </h2>
            <div className="w-full max-w-md flex flex-col gap-3">
              {["Instagram DMs", "Website / Google", "Turo", "Referrals / brokers", "Mixed / unsure"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect("bookingSource", option)}
                  className={`w-full px-6 py-4 rounded-xl border transition-all duration-200 text-left text-lg
                    ${answers.bookingSource === option 
                      ? "bg-[#375DEE] border-[#375DEE] text-white" 
                      : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="flex flex-col items-center gap-8 animate-fade-in">
            <h2 className={`${bebasNeue.className} text-3xl md:text-4xl text-white text-center px-4`}>
              What&apos;s the biggest thing holding back more bookings right now?
            </h2>
            <div className="w-full max-w-md flex flex-col gap-3">
              {[
                "Not enough inbound leads",
                "Slow response / missed follow-ups",
                "Low trust or weak online presence",
                "Operational limits",
                "Not sure"
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect("biggestBlocker", option)}
                  className={`w-full px-6 py-4 rounded-xl border transition-all duration-200 text-left text-lg
                    ${answers.biggestBlocker === option 
                      ? "bg-[#375DEE] border-[#375DEE] text-white" 
                      : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="flex flex-col items-center gap-8 animate-fade-in">
            <h2 className={`${bebasNeue.className} text-3xl md:text-4xl text-white text-center`}>
              Name + best phone number to reach you
            </h2>
            <div className="w-full max-w-md flex flex-col gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={answers.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className={`w-full px-5 py-4 rounded-xl bg-white/5 border ${errors.fullName ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-lg`}
                />
                {errors.fullName && <p className="text-red-400 text-sm mt-2 ml-1">{errors.fullName}</p>}
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={answers.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  className={`w-full px-5 py-4 rounded-xl bg-white/5 border ${errors.phoneNumber ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-lg`}
                />
                {errors.phoneNumber && <p className="text-red-400 text-sm mt-2 ml-1">{errors.phoneNumber}</p>}
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`${bebasNeue.className} w-full py-5 text-white text-xl tracking-wider rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(55,93,238,0.5)] shadow-2xl cursor-pointer mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-gradient-to-r from-[#375DEE] to-[#5B7FFF] border border-white/20`}
              >
                {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <div 
          className="h-full bg-[#375DEE] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-4 md:py-5 mt-1">
        <div className="flex items-center">
          <img src="/scalexoticslong.png" alt="Scale Exotics" className="h-8 md:h-10 w-auto" />
        </div>
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="/about" className="text-sm text-white/60 hover:text-white transition">About</a>
          <a href="/services" className="text-sm text-white/60 hover:text-white transition">Services</a>
        </div>
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden relative w-10 h-10 flex items-center justify-center"
          aria-label="Toggle menu"
        >
          <div className={`relative w-5 h-5 transition-all duration-300 ${mobileMenuOpen ? "rotate-180" : ""}`}>
            <span
              className={`absolute left-0 block h-[2px] w-full bg-white rounded-full transition-all duration-300 ease-out ${
                mobileMenuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 -translate-y-1/2 block h-[2px] bg-white rounded-full transition-all duration-300 ease-out ${
                mobileMenuOpen ? "w-0 opacity-0" : "w-full"
              }`}
            />
            <span
              className={`absolute left-0 block h-[2px] w-full bg-white rounded-full transition-all duration-300 ease-out ${
                mobileMenuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
              }`}
            />
          </div>
        </button>
      </nav>

      {/* Mobile Menu Button - Fixed X that stays on top of overlay */}
      <button
        onClick={() => setMobileMenuOpen(false)}
        className={`md:hidden fixed top-5 right-6 z-[60] w-10 h-10 flex items-center justify-center transition-all duration-300 ${
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        aria-label="Close menu"
      >
        <div className="relative w-6 h-6">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 block h-[2px] w-full bg-white rounded-full rotate-45 transition-transform" />
          <span className="absolute left-0 top-1/2 -translate-y-1/2 block h-[2px] w-full bg-white rounded-full -rotate-45 transition-transform" />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ease-out ${
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
        <div className="relative h-full flex flex-col items-center justify-center gap-10">
          <a
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={`${bebasNeue.className} text-4xl text-white hover:text-[#375DEE] transition-all duration-300 ${
              mobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: mobileMenuOpen ? "100ms" : "0ms" }}
          >
            ABOUT
          </a>
          <a
            href="/services"
            onClick={() => setMobileMenuOpen(false)}
            className={`${bebasNeue.className} text-4xl text-white hover:text-[#375DEE] transition-all duration-300 ${
              mobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: mobileMenuOpen ? "200ms" : "0ms" }}
          >
            SERVICES
          </a>
        </div>
      </div>

      {/* Main Content - Survey */}
      <main className="flex-1 flex items-center justify-center px-6 md:px-8 py-12">
        {isSubmitted ? (
          <div className="flex flex-col items-center gap-6 animate-fade-in text-center">
            <div className="w-24 h-24 rounded-full bg-[#375DEE]/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className={`${bebasNeue.className} text-4xl md:text-5xl text-white`}>THANK YOU!</h3>
            <p className="text-white/60 text-lg max-w-md">
              We&apos;ve received your information and will be in touch shortly to discuss how we can help grow your fleet.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-2xl">
            {/* Step indicator */}
            <div className="flex justify-center mb-8">
              <span className="text-white/40 text-sm">
                Question {currentStep + 1} of {totalSteps}
              </span>
            </div>
            
            {renderQuestion()}

            {/* Back button (not on first question) */}
            {currentStep > 0 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="text-sm text-white/50 hover:text-white/70 transition cursor-pointer py-2"
                >
                  ← Back
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-8 py-8 bg-black border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/30">
            <img src="/scalexoticslong.png" alt="Scale Exotics" className="h-5 w-auto opacity-40" />
            <div className="flex items-center gap-4">
              <a href="/about" className="hover:text-white/50 transition-colors">About</a>
              <span className="text-white/10">•</span>
              <a href="/services" className="hover:text-white/50 transition-colors">Services</a>
              <span className="text-white/10">•</span>
              <a href="/tos" className="hover:text-white/50 transition-colors">Terms</a>
              <span className="text-white/10">•</span>
              <a href="/privacy-policy" className="hover:text-white/50 transition-colors">Privacy</a>
            </div>
            <span className="text-white/20">© {new Date().getFullYear()} Scale Exotics</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
