"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

type SurveyAnswers = {
  fleetSize: string
  weekdayBookings: string
  bookingSource: string
  biggestBlocker: string
  fullName: string
  phoneNumber: string
}

export default function Survey() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
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

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/[^\d+]/g, "")
    const digitsOnly = cleaned.replace(/\D/g, "")
    return digitsOnly.length >= 10 && digitsOnly.length <= 15
  }

  const handleOptionSelect = (field: keyof SurveyAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }))
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
      newErrors.phoneNumber = "Please enter a valid 10-digit phone number"
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
          <div className="flex flex-col items-center gap-6 md:gap-8 animate-fade-in">
            <h2 className="text-2xl md:text-4xl font-bold text-white text-center px-2" style={{ fontFamily: 'var(--font-display)' }}>
              How many vehicles are currently in your fleet?
            </h2>
            <div className="w-full max-w-md flex flex-col gap-2 md:gap-3">
              {["1–3", "4–7", "8–15", "16+"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect("fleetSize", option)}
                  className={`w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl border transition-all duration-200 text-left text-base md:text-lg
                    ${answers.fleetSize === option
                      ? "bg-[#375DEE] border-[#375DEE] text-white"
                      : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-[#375DEE]/50"
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
          <div className="flex flex-col items-center gap-6 md:gap-8 animate-fade-in">
            <h2 className="text-2xl md:text-4xl font-bold text-white text-center px-2" style={{ fontFamily: 'var(--font-display)' }}>
              What percentage of weekdays are typically booked?
            </h2>
            <div className="w-full max-w-md flex flex-col gap-2 md:gap-3">
              {["<25%", "25–50%", "50–75%", "75%+"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect("weekdayBookings", option)}
                  className={`w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl border transition-all duration-200 text-left text-base md:text-lg
                    ${answers.weekdayBookings === option
                      ? "bg-[#375DEE] border-[#375DEE] text-white"
                      : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-[#375DEE]/50"
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
          <div className="flex flex-col items-center gap-6 md:gap-8 animate-fade-in">
            <h2 className="text-2xl md:text-4xl font-bold text-white text-center px-2" style={{ fontFamily: 'var(--font-display)' }}>
              Where do most of your bookings come from today?
            </h2>
            <div className="w-full max-w-md flex flex-col gap-2 md:gap-3">
              {["Instagram DMs", "Website / Google", "Turo", "Referrals / brokers", "Mixed / unsure"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect("bookingSource", option)}
                  className={`w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl border transition-all duration-200 text-left text-base md:text-lg
                    ${answers.bookingSource === option
                      ? "bg-[#375DEE] border-[#375DEE] text-white"
                      : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-[#375DEE]/50"
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
          <div className="flex flex-col items-center gap-6 md:gap-8 animate-fade-in">
            <h2 className="text-2xl md:text-4xl font-bold text-white text-center px-2" style={{ fontFamily: 'var(--font-display)' }}>
              What&apos;s the biggest thing holding back more bookings right now?
            </h2>
            <div className="w-full max-w-md flex flex-col gap-2 md:gap-3">
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
                  className={`w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl border transition-all duration-200 text-left text-base md:text-lg
                    ${answers.biggestBlocker === option
                      ? "bg-[#375DEE] border-[#375DEE] text-white"
                      : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-[#375DEE]/50"
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
          <div className="flex flex-col items-center gap-6 md:gap-8 animate-fade-in">
            <h2 className="text-2xl md:text-4xl font-bold text-white text-center px-2" style={{ fontFamily: 'var(--font-display)' }}>
              Name + best phone number to reach you
            </h2>
            <div className="w-full max-w-md flex flex-col gap-3 md:gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={answers.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className={`w-full px-4 md:px-5 py-3.5 md:py-4 rounded-xl bg-white/5 border ${errors.fullName ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-base md:text-lg`}
                />
                {errors.fullName && <p className="text-red-400 text-xs md:text-sm mt-1.5 md:mt-2 ml-1">{errors.fullName}</p>}
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={answers.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  className={`w-full px-4 md:px-5 py-3.5 md:py-4 rounded-xl bg-white/5 border ${errors.phoneNumber ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-base md:text-lg`}
                />
                {errors.phoneNumber && <p className="text-red-400 text-xs md:text-sm mt-1.5 md:mt-2 ml-1">{errors.phoneNumber}</p>}
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 md:py-5 text-white text-lg md:text-xl rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(55,93,238,0.4)] mt-2 md:mt-4 disabled:opacity-50 disabled:cursor-not-allowed bg-[#375DEE] hover:bg-[#4169E1]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-x-hidden" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-[70]">
        <div
          className="h-full bg-[#375DEE] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-1 left-0 right-0 z-50">
        <div className={`transition-all duration-700 ${scrollY > 50 ? "bg-black/60 backdrop-blur-2xl border-b border-white/[0.08]" : ""}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <a href="/" className="relative group">
                <Image src="/scalexoticslong.png" alt="Scale Exotics" width={140} height={28} className="h-7 w-auto" priority />
                <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#375DEE] group-hover:w-full transition-all duration-300" />
              </a>
              <nav className="hidden md:flex items-center">
                <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-full border border-white/[0.06]">
                  <a href="/" className="px-5 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] rounded-full transition-all duration-300">Home</a>
                  <a href="/about" className="px-5 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] rounded-full transition-all duration-300">About</a>
                  <a href="/services" className="px-5 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] rounded-full transition-all duration-300">Services</a>
                </div>
              </nav>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.05] border border-white/[0.1]"
                aria-label="Toggle menu"
              >
                <div className="relative w-4 h-3 flex flex-col justify-between">
                  <span className={`block h-[1.5px] bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-[5px]" : ""}`} />
                  <span className={`block h-[1.5px] bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`} />
                  <span className={`block h-[1.5px] bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-[5px]" : ""}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-[60] md:hidden transition-all duration-500 ${mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" />
        <div className="relative h-full flex flex-col items-center justify-center gap-6">
          {["Home", "About", "Services"].map((item, i) => (
            <a
              key={item}
              href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-4xl font-light text-white/80 hover:text-[#375DEE] transition-all duration-500 ${mobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
              style={{ transitionDelay: mobileMenuOpen ? `${i * 100}ms` : "0ms", fontFamily: 'var(--font-display)' }}
            >
              {item}
            </a>
          ))}
        </div>
        <button onClick={() => setMobileMenuOpen(false)} className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center" aria-label="Close menu">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Content - Survey */}
      <main className="flex-1 flex items-center justify-center px-4 md:px-8 py-8 md:py-12 pt-28 md:pt-32">
        {isSubmitted ? (
          <div className="flex flex-col items-center gap-4 md:gap-6 animate-fade-in text-center px-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#375DEE]/20 flex items-center justify-center">
              <svg className="w-10 h-10 md:w-12 md:h-12 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl md:text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Thank You!</h3>
            <p className="text-white/60 text-base md:text-lg max-w-md">
              We&apos;ve received your information and will be in touch shortly to discuss how we can help grow your fleet.
            </p>
            <a
              href="/"
              className="mt-2 md:mt-4 inline-flex items-center gap-2 text-[#375DEE] hover:text-white transition-colors text-sm md:text-base"
            >
              ← Back to Home
            </a>
          </div>
        ) : (
          <div className="w-full max-w-2xl">
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
      <footer className="relative py-6 md:py-8 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
            <Image src="/scalexoticslong.png" alt="Scale Exotics" width={100} height={20} className="h-4 md:h-5 w-auto opacity-40" loading="lazy" />
            <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs text-white/30">
              <a href="/about" className="hover:text-[#375DEE] transition-colors">About</a>
              <span className="text-white/10">•</span>
              <a href="/services" className="hover:text-[#375DEE] transition-colors">Services</a>
              <span className="text-white/10">•</span>
              <a href="/tos" className="hover:text-[#375DEE] transition-colors">Terms</a>
              <span className="text-white/10">•</span>
              <a href="/privacy-policy" className="hover:text-[#375DEE] transition-colors">Privacy</a>
            </div>
            <span className="text-white/20 text-[10px] md:text-xs">© {new Date().getFullYear()} Scale Exotics</span>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}
