"use client"

import { useState, useEffect } from "react"
import { Inter, Syne } from "next/font/google"
import Image from "next/image"

const syne = Syne({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

type SurveyAnswers = {
  fleetSize: string
  weekdayBookings: string
  bookingSource: string
  biggestBlocker: string
  fullName: string
  phoneNumber: string
}

type FunnelStep = 'landing' | 'survey' | 'thankyou'

export default function OfferPage() {
  const [funnelStep, setFunnelStep] = useState<FunnelStep>('landing')
  const [currentSurveyStep, setCurrentSurveyStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [answers, setAnswers] = useState<SurveyAnswers>({
    fleetSize: "",
    weekdayBookings: "",
    bookingSource: "",
    biggestBlocker: "",
    fullName: "",
    phoneNumber: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Handle viewport height for Instagram in-app browser
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    setVH()
    window.addEventListener('resize', setVH)
    window.addEventListener('orientationchange', setVH)
    return () => {
      window.removeEventListener('resize', setVH)
      window.removeEventListener('orientationchange', setVH)
    }
  }, [])

  const totalSteps = 5
  const progress = funnelStep === 'survey' ? ((currentSurveyStep + 1) / totalSteps) * 100 : 0

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/[^\d+]/g, "")
    const digitsOnly = cleaned.replace(/\D/g, "")
    return digitsOnly.length >= 10 && digitsOnly.length <= 15
  }

  const handleOptionSelect = (field: keyof SurveyAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }))
    setTimeout(() => {
      setCurrentSurveyStep(prev => prev + 1)
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
          phone: answers.phoneNumber,
          source: "offer-page"
        }),
      })

      setFunnelStep('thankyou')
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSurveyQuestion = () => {
    const questionStyles = `${syne.className} text-2xl md:text-4xl font-bold text-white text-center leading-tight`
    const optionStyles = (isSelected: boolean) => `
      w-full px-5 py-4 rounded-xl border transition-all duration-200 text-left text-base
      ${isSelected
        ? "bg-[#375DEE] border-[#375DEE] text-white shadow-[0_0_30px_rgba(55,93,238,0.3)]"
        : "bg-white/5 border-white/20 text-white active:bg-[#375DEE]/20 active:border-[#375DEE]/50"
      }
    `

    switch (currentSurveyStep) {
      case 0:
        return (
          <div className="flex flex-col items-center gap-8 animate-fade-in">
            <h2 className={questionStyles}>
              How many vehicles are in your fleet?
            </h2>
            <div className="w-full max-w-md flex flex-col gap-3">
              {["1–3", "4–7", "8–15", "16+"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect("fleetSize", option)}
                  className={optionStyles(answers.fleetSize === option)}
                >
                  {option} vehicles
                </button>
              ))}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="flex flex-col items-center gap-8 animate-fade-in">
            <h2 className={questionStyles}>
              What % of weekdays are typically booked?
            </h2>
            <div className="w-full max-w-md flex flex-col gap-3">
              {["<25%", "25–50%", "50–75%", "75%+"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect("weekdayBookings", option)}
                  className={optionStyles(answers.weekdayBookings === option)}
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
            <h2 className={questionStyles}>
              Where do most bookings come from?
            </h2>
            <div className="w-full max-w-md flex flex-col gap-3">
              {["Instagram DMs", "Website / Google", "Turo", "Referrals / brokers", "Mixed / unsure"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect("bookingSource", option)}
                  className={optionStyles(answers.bookingSource === option)}
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
            <h2 className={questionStyles}>
              What&apos;s holding back more bookings?
            </h2>
            <div className="w-full max-w-md flex flex-col gap-3">
              {[
                "Not enough leads",
                "Slow follow-ups",
                "Weak online presence",
                "Operational limits",
                "Not sure"
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect("biggestBlocker", option)}
                  className={optionStyles(answers.biggestBlocker === option)}
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
            <h2 className={questionStyles}>
              How should we reach you?
            </h2>
            <div className="w-full max-w-md flex flex-col gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={answers.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  autoComplete="name"
                  className={`${inter.className} w-full px-5 py-4 rounded-xl bg-white/5 border ${errors.fullName ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/40 focus:outline-none focus:border-[#375DEE] focus:bg-white/10 transition text-base`}
                />
                {errors.fullName && <p className="text-red-400 text-sm mt-2 ml-1">{errors.fullName}</p>}
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={answers.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  autoComplete="tel"
                  className={`${inter.className} w-full px-5 py-4 rounded-xl bg-white/5 border ${errors.phoneNumber ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/40 focus:outline-none focus:border-[#375DEE] focus:bg-white/10 transition text-base`}
                />
                {errors.phoneNumber && <p className="text-red-400 text-sm mt-2 ml-1">{errors.phoneNumber}</p>}
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`${syne.className} w-full py-4 text-white text-lg font-semibold rounded-xl transition-all duration-300 mt-2 disabled:opacity-50 disabled:cursor-not-allowed bg-[#375DEE] active:bg-[#4169E1] shadow-[0_0_30px_rgba(55,93,238,0.3)]`}
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

  const renderLandingPage = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 safe-area-inset">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#375DEE]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[200px] h-[200px] bg-[#375DEE]/10 rounded-full blur-[80px]" />
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8">
        <Image
          src="/scalexoticslogo.png"
          alt="Scale Exotics"
          width={56}
          height={56}
          className="w-14 h-14 object-contain"
        />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center max-w-lg mx-auto animate-fade-in">
        <h1
          className={`${syne.className} text-4xl sm:text-5xl font-bold text-white mb-2 leading-[1.1]`}
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
        >
          Only Pay Us
        </h1>
        <h2
          className={`${syne.className} text-4xl sm:text-5xl font-bold mb-6 leading-[1.1]`}
          style={{
            background: 'linear-gradient(135deg, #375DEE 0%, #6B8CFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 20px rgba(55, 93, 238, 0.4))'
          }}
        >
          When You Get Paid
        </h2>
        <p className={`${inter.className} text-white/50 text-lg leading-relaxed mb-10 max-w-sm mx-auto`}>
          We send you prepaid, qualified renters. You only pay after they secure a deposit.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => setFunnelStep('survey')}
          className={`${syne.className} relative px-10 py-4 text-lg font-semibold text-white bg-[#375DEE] rounded-full transition-all duration-300 active:scale-95 border border-white/10 shadow-[0_0_40px_rgba(55,93,238,0.4)]`}
        >
          See If You Qualify →
        </button>
      </div>

      {/* Value Props */}
      <div className="relative z-10 mt-12 w-full max-w-sm space-y-3">
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-white/5 border border-white/10">
          <div className="w-6 h-6 rounded-md bg-[#375DEE]/20 border border-[#375DEE]/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className={`${inter.className} text-white/70 text-base`}>Pre Qualified Renters Only</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-white/5 border border-white/10">
          <div className="w-6 h-6 rounded-md bg-[#375DEE]/20 border border-[#375DEE]/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className={`${inter.className} text-white/70 text-base`}>Fill Your Weekday Gaps</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-white/5 border border-white/10">
          <div className="w-6 h-6 rounded-md bg-[#375DEE]/20 border border-[#375DEE]/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className={`${inter.className} text-white/70 text-base`}>Your Cars Stay Booked, Not Parked</p>
        </div>
      </div>
    </div>
  )

  const renderSurvey = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 safe-area-inset">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#375DEE]/15 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {renderSurveyQuestion()}

        {/* Back button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => {
              if (currentSurveyStep > 0) {
                setCurrentSurveyStep(prev => prev - 1)
              } else {
                setFunnelStep('landing')
              }
            }}
            className={`${inter.className} text-sm text-white/40 active:text-white/60 transition py-2 px-4`}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  )

  const renderThankYou = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 safe-area-inset">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#375DEE]/20 rounded-full blur-[120px]" />
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8">
        <Image
          src="/scalexoticslogo.png"
          alt="Scale Exotics"
          width={56}
          height={56}
          className="w-14 h-14 object-contain"
        />
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto animate-fade-in">
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#375DEE]/20 border border-[#375DEE]/40 flex items-center justify-center shadow-[0_0_40px_rgba(55,93,238,0.3)]">
          <svg className="w-10 h-10 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1
          className={`${syne.className} text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight`}
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
        >
          You&apos;re In!
        </h1>

        <p className={`${inter.className} text-white/50 text-lg leading-relaxed mb-8`}>
          We&apos;ll review your application and reach out within 24 hours to discuss next steps.
        </p>

        {/* What's Next Section */}
        <div className="space-y-3 text-left">
          <p className={`${syne.className} text-white/70 text-sm font-semibold uppercase tracking-wider mb-4 text-center`}>
            What happens next
          </p>
          {[
            { step: "1", text: "We review your fleet details" },
            { step: "2", text: "Quick call to confirm fit" },
            { step: "3", text: "Start receiving qualified renters" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className={`${syne.className} w-8 h-8 rounded-lg bg-[#375DEE]/20 border border-[#375DEE]/30 flex items-center justify-center text-[#375DEE] font-bold text-sm`}>
                {item.step}
              </div>
              <p className={`${inter.className} text-white/70 text-base`}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className={`${inter.className} min-h-screen bg-black text-white flex flex-col overflow-x-hidden relative`} style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Progress Bar (only show during survey) */}
      {funnelStep === 'survey' && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
          <div
            className="h-full bg-[#375DEE] transition-all duration-500 ease-out shadow-[0_0_10px_rgba(55,93,238,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Main Content */}
      {funnelStep === 'landing' && renderLandingPage()}
      {funnelStep === 'survey' && renderSurvey()}
      {funnelStep === 'thankyou' && renderThankYou()}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .safe-area-inset {
          padding-top: max(env(safe-area-inset-top), 1rem);
          padding-bottom: max(env(safe-area-inset-bottom), 1rem);
        }
      `}</style>
    </div>
  )
}
