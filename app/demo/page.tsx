"use client"

import { useState, useEffect, useCallback } from "react"

export default function Demo() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const CORRECT_PASSWORD = "calder123"

  const slides = [
    {
      id: 1,
      type: "hero",
      content: {
        title: "Scale Exotics",
        subtitle: "Growth Partnership",
        tagline: "The system that fills your fleet with premium bookings on autopilot."
      }
    },
    {
      id: 2,
      type: "agenda",
      content: {
        title: "What We'll Cover Today",
        items: [
          "Your goals & where you want to be",
          "Why most marketing fails for exotic rentals",
          "Our proven system (live demo)",
          "Partnership options",
          "Next steps to get started"
        ]
      }
    },
    {
      id: 3,
      type: "image-left",
      content: {
        image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=2670&auto=format&fit=crop",
        label: "THE PROBLEM",
        title: "You're Leaving Money on the Table",
        points: [
          "Weekdays sitting empty",
          "Chasing leads that never convert",
          "Missing inquiries while you sleep",
          "No predictable way to grow"
        ]
      }
    },
    {
      id: 4,
      type: "big-statement",
      content: {
        label: "THE TRUTH",
        statement: "It's not your fault.",
        subtext: "Traditional marketing wasn't built for exotic rentals. Generic agencies don't understand your buyer."
      }
    },
    {
      id: 5,
      type: "not-this",
      content: {
        title: "This Is NOT Another Agency",
        bad: [
          "No unqualified leads that waste your time",
          "No $5,000/month retainers with zero accountability",
          "No cookie-cutter campaigns",
          "No disappearing after the contract is signed"
        ]
      }
    },
    {
      id: 6,
      type: "big-promise",
      content: {
        label: "OUR PROMISE",
        title: "We Fill Your Fleet With Premium, Prepaid Bookings",
        subtitle: "Or you don't pay.",
        points: [
          "Pre-qualified renters ready to book",
          "24/7 automated follow-up",
          "You only pay for results"
        ]
      }
    },
    {
      id: 7,
      type: "image-right",
      content: {
        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2670&auto=format&fit=crop",
        label: "THE SYSTEM",
        title: "How It Works",
        points: [
          "We attract high-intent renters",
          "AI qualifies & follows up instantly",
          "You close ready-to-book deals",
          "Repeat. Scale. Dominate."
        ]
      }
    },
    {
      id: 8,
      type: "stats",
      content: {
        label: "REAL RESULTS",
        title: "What Our Partners See",
        stats: [
          { value: "$47K", label: "Average Monthly Revenue" },
          { value: "3X", label: "Booking Increase" },
          { value: "90%", label: "Weekday Utilization" }
        ]
      }
    },
    {
      id: 9,
      type: "testimonial",
      content: {
        quote: "We went from struggling to fill weekdays to being fully booked 3 weeks out. The lead quality is insane.",
        name: "Marcus J.",
        title: "12-Vehicle Fleet, Miami",
        result: "$47K/month"
      }
    },
    {
      id: 10,
      type: "comparison",
      content: {
        title: "Why This Is Different",
        left: {
          label: "TRADITIONAL AGENCY",
          points: [
            "Pay $3-10K/month regardless of results",
            "Generic leads that don't convert",
            "They win even when you lose",
            "No skin in the game"
          ]
        },
        right: {
          label: "SCALE EXOTICS",
          points: [
            "Pay based on performance",
            "Pre-qualified, ready-to-book renters",
            "We only win when you win",
            "100% aligned incentives"
          ]
        }
      }
    },
    {
      id: 11,
      type: "demo-preview",
      content: {
        label: "LIVE DEMO",
        title: "Inside Your Growth Engine",
        features: [
          { title: "Smart Pipeline", desc: "Every lead tracked & scored" },
          { title: "AI Follow-Up", desc: "Instant 24/7 engagement" },
          { title: "Booking System", desc: "Seamless conversion flow" },
          { title: "Revenue Dashboard", desc: "Real-time performance" }
        ],
        note: "We'll walk through your actual system on our next call"
      }
    },
    {
      id: 12,
      type: "guarantee",
      content: {
        label: "ZERO RISK",
        title: "The Performance Guarantee",
        guarantee: "If we don't deliver the agreed number of qualified bookings in 30 days, you get full credit.",
        subtext: "We're so confident this works, we put our money where our mouth is."
      }
    },
    {
      id: 13,
      type: "bonuses",
      content: {
        label: "INCLUDED FREE",
        title: "Bonus Quick Wins",
        bonuses: [
          { title: "Google Review Blitz", value: "$1,500 value", desc: "10-20 new 5-star reviews in 30 days" },
          { title: "Past Customer Revival", value: "$2,000 value", desc: "Reactivate 15-20% of old customers" }
        ]
      }
    },
    {
      id: 14,
      type: "referral",
      content: {
        label: "PARTNER PROGRAM",
        title: "Earn While You Grow",
        amount: "$500/month",
        description: "For every fleet owner you refer who becomes a partner. No cap. Lifetime commissions."
      }
    },
    {
      id: 15,
      type: "options",
      content: {
        title: "Choose Your Path",
        option1: {
          name: "Performance Model",
          highlight: "RECOMMENDED",
          desc: "Pay per qualified booking. Zero risk.",
          points: ["No monthly minimums", "Performance guarantee", "Full system access"]
        },
        option2: {
          name: "Retainer Model",
          desc: "Fixed monthly investment for unlimited leads.",
          points: ["Flat rate", "Priority support", "Aggressive scaling"]
        },
        question: "Which sounds more aligned with where you are right now?"
      }
    },
    {
      id: 16,
      type: "investment",
      content: {
        label: "AD SPEND TIERS",
        title: "Choose Your Growth Speed",
        tiers: [
          { name: "Steady", daily: "$50/day", leads: "15-25 leads/mo", highlight: false },
          { name: "Accelerated", daily: "$100/day", leads: "35-50 leads/mo", highlight: true },
          { name: "Aggressive", daily: "$200/day", leads: "75-100+ leads/mo", highlight: false }
        ],
        note: "Ad spend goes directly to platforms. Separate from partnership fee."
      }
    },
    {
      id: 17,
      type: "next-steps",
      content: {
        title: "Let's Get Started",
        steps: [
          { num: "1", text: "30-min onboarding call" },
          { num: "2", text: "System setup (3-5 days)" },
          { num: "3", text: "Campaigns go live" },
          { num: "4", text: "Bookings start flowing" }
        ]
      }
    },
    {
      id: 18,
      type: "safety-net",
      content: {
        label: "NEED MORE TIME?",
        title: "The Safety Net",
        offer: "$250 Fully Refundable Deposit",
        benefits: [
          "Locks in current pricing",
          "Reserves your spot",
          "100% refundable if not right for you",
          "Talk to a current partner first"
        ]
      }
    },
    {
      id: 19,
      type: "final",
      content: {
        title: "Ready to Fill Your Fleet?",
        subtitle: "The only question is: how fast do you want to grow?",
        cta: "Let's do this."
      }
    }
  ]

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true)
      setError("")
    } else {
      setError("Incorrect password")
    }
  }

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1 && !isAnimating) {
      setIsAnimating(true)
      setCurrentSlide(prev => prev + 1)
      setTimeout(() => setIsAnimating(false), 400)
    }
  }, [currentSlide, slides.length, isAnimating])

  const prevSlide = useCallback(() => {
    if (currentSlide > 0 && !isAnimating) {
      setIsAnimating(true)
      setCurrentSlide(prev => prev - 1)
      setTimeout(() => setIsAnimating(false), 400)
    }
  }, [currentSlide, isAnimating])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault()
        nextSlide()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        prevSlide()
      }
    }

    if (isAuthenticated) {
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isAuthenticated, nextSlide, prevSlide])

  const renderSlide = (slide: typeof slides[0]) => {
    const content = slide.content as any

    switch (slide.type) {
      case "hero":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#375DEE]/20 via-transparent to-transparent" />
            <div className="relative z-10">
              <div className="w-32 h-1 bg-[#375DEE] mx-auto mb-12" />
              <h1 className="text-7xl md:text-9xl font-bold mb-6 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                {content.title}
              </h1>
              <p className="text-4xl md:text-5xl text-[#375DEE] font-semibold mb-8" style={{ fontFamily: 'var(--font-display)' }}>
                {content.subtitle}
              </p>
              <p className="text-2xl md:text-3xl text-white/60 max-w-4xl">
                {content.tagline}
              </p>
            </div>
          </div>
        )

      case "agenda":
        return (
          <div className="h-full flex flex-col justify-center px-16 md:px-24">
            <h2 className="text-5xl md:text-7xl font-bold mb-16" style={{ fontFamily: 'var(--font-display)' }}>
              {content.title}
            </h2>
            <div className="space-y-8">
              {content.items.map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-8">
                  <div className="w-16 h-16 rounded-full bg-[#375DEE] flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{i + 1}</span>
                  </div>
                  <p className="text-3xl md:text-4xl text-white/80">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case "image-left":
        return (
          <div className="h-full grid grid-cols-2 gap-0">
            <div className="relative">
              <img src={content.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black" />
            </div>
            <div className="flex flex-col justify-center px-16">
              <span className="text-[#375DEE] text-xl tracking-widest mb-6">{content.label}</span>
              <h2 className="text-5xl md:text-6xl font-bold mb-12 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                {content.title}
              </h2>
              <div className="space-y-6">
                {content.points.map((point: string, i: number) => (
                  <div key={i} className="flex items-center gap-6">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0" />
                    <p className="text-2xl md:text-3xl text-white/70">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "big-statement":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center px-16">
            <span className="text-[#375DEE] text-2xl tracking-widest mb-8">{content.label}</span>
            <h2 className="text-7xl md:text-9xl font-bold mb-8" style={{ fontFamily: 'var(--font-display)' }}>
              {content.statement}
            </h2>
            <p className="text-3xl md:text-4xl text-white/50 max-w-4xl leading-relaxed">
              {content.subtext}
            </p>
          </div>
        )

      case "not-this":
        return (
          <div className="h-full flex flex-col justify-center px-16 md:px-24">
            <h2 className="text-5xl md:text-7xl font-bold mb-16" style={{ fontFamily: 'var(--font-display)' }}>
              {content.title}
            </h2>
            <div className="space-y-8">
              {content.bad.map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-8">
                  <div className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-2xl md:text-3xl text-white/70">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case "big-promise":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center px-16">
            <span className="text-[#375DEE] text-2xl tracking-widest mb-8">{content.label}</span>
            <h2 className="text-5xl md:text-7xl font-bold mb-4 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              {content.title}
            </h2>
            <p className="text-4xl md:text-6xl text-[#375DEE] font-bold mb-16" style={{ fontFamily: 'var(--font-display)' }}>
              {content.subtitle}
            </p>
            <div className="flex gap-12">
              {content.points.map((point: string, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <svg className="w-10 h-10 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-2xl text-white/80">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case "image-right":
        return (
          <div className="h-full grid grid-cols-2 gap-0">
            <div className="flex flex-col justify-center px-16">
              <span className="text-[#375DEE] text-xl tracking-widest mb-6">{content.label}</span>
              <h2 className="text-5xl md:text-6xl font-bold mb-12 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                {content.title}
              </h2>
              <div className="space-y-8">
                {content.points.map((point: string, i: number) => (
                  <div key={i} className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-[#375DEE] flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-white">{i + 1}</span>
                    </div>
                    <p className="text-2xl md:text-3xl text-white/80">{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img src={content.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black" />
            </div>
          </div>
        )

      case "stats":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center px-16">
            <span className="text-[#375DEE] text-2xl tracking-widest mb-6">{content.label}</span>
            <h2 className="text-5xl md:text-7xl font-bold mb-20" style={{ fontFamily: 'var(--font-display)' }}>
              {content.title}
            </h2>
            <div className="flex gap-24">
              {content.stats.map((stat: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="text-8xl md:text-9xl font-bold text-[#375DEE] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                    {stat.value}
                  </div>
                  <p className="text-2xl text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case "testimonial":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center px-16 md:px-32">
            <div className="text-[#375DEE] text-9xl mb-8">&ldquo;</div>
            <p className="text-4xl md:text-5xl text-white leading-relaxed mb-12 max-w-5xl">
              {content.quote}
            </p>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#375DEE] to-[#375DEE]/50" />
              <div className="text-left">
                <p className="text-3xl font-bold text-white">{content.name}</p>
                <p className="text-xl text-white/50">{content.title}</p>
              </div>
              <div className="ml-12 px-8 py-4 bg-[#375DEE]/20 rounded-full">
                <span className="text-3xl font-bold text-[#375DEE]">{content.result}</span>
              </div>
            </div>
          </div>
        )

      case "comparison":
        return (
          <div className="h-full flex flex-col justify-center px-16 md:px-24">
            <h2 className="text-5xl md:text-7xl font-bold mb-16 text-center" style={{ fontFamily: 'var(--font-display)' }}>
              {content.title}
            </h2>
            <div className="grid grid-cols-2 gap-12">
              <div className="p-12 rounded-3xl bg-white/5 border border-white/10">
                <span className="text-xl text-white/40 tracking-widest">{content.left.label}</span>
                <div className="mt-8 space-y-6">
                  {content.left.points.map((point: string, i: number) => (
                    <div key={i} className="flex items-start gap-4">
                      <svg className="w-8 h-8 text-white/30 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                      <p className="text-2xl text-white/50">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-12 rounded-3xl bg-[#375DEE]/10 border-2 border-[#375DEE]">
                <span className="text-xl text-[#375DEE] tracking-widest">{content.right.label}</span>
                <div className="mt-8 space-y-6">
                  {content.right.points.map((point: string, i: number) => (
                    <div key={i} className="flex items-start gap-4">
                      <svg className="w-8 h-8 text-[#375DEE] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-2xl text-white">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "demo-preview":
        return (
          <div className="h-full flex flex-col justify-center px-16 md:px-24">
            <span className="text-[#375DEE] text-2xl tracking-widest mb-6">{content.label}</span>
            <h2 className="text-5xl md:text-7xl font-bold mb-16" style={{ fontFamily: 'var(--font-display)' }}>
              {content.title}
            </h2>
            <div className="grid grid-cols-2 gap-8">
              {content.features.map((feature: any, i: number) => (
                <div key={i} className="p-10 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>{feature.title}</h3>
                  <p className="text-xl text-white/50">{feature.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 p-6 rounded-xl bg-[#375DEE]/20 border border-[#375DEE]/50 text-center">
              <p className="text-2xl text-[#375DEE]">{content.note}</p>
            </div>
          </div>
        )

      case "guarantee":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center px-16">
            <span className="text-[#375DEE] text-2xl tracking-widest mb-8">{content.label}</span>
            <h2 className="text-5xl md:text-7xl font-bold mb-12" style={{ fontFamily: 'var(--font-display)' }}>
              {content.title}
            </h2>
            <div className="p-12 md:p-16 rounded-3xl bg-[#375DEE]/10 border-2 border-[#375DEE] max-w-5xl">
              <p className="text-3xl md:text-4xl text-white leading-relaxed">
                {content.guarantee}
              </p>
            </div>
            <p className="text-2xl text-white/50 mt-12 max-w-3xl">
              {content.subtext}
            </p>
          </div>
        )

      case "bonuses":
        return (
          <div className="h-full flex flex-col justify-center px-16 md:px-24">
            <span className="text-[#375DEE] text-2xl tracking-widest mb-6">{content.label}</span>
            <h2 className="text-5xl md:text-7xl font-bold mb-16" style={{ fontFamily: 'var(--font-display)' }}>
              {content.title}
            </h2>
            <div className="grid grid-cols-2 gap-12">
              {content.bonuses.map((bonus: any, i: number) => (
                <div key={i} className="p-12 rounded-3xl bg-white/5 border border-white/10 relative">
                  <div className="absolute top-8 right-8 px-6 py-2 bg-[#375DEE] rounded-full">
                    <span className="text-xl font-bold text-white">{bonus.value}</span>
                  </div>
                  <h3 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-display)' }}>{bonus.title}</h3>
                  <p className="text-2xl text-white/60">{bonus.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case "referral":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center px-16">
            <span className="text-[#375DEE] text-2xl tracking-widest mb-8">{content.label}</span>
            <h2 className="text-5xl md:text-7xl font-bold mb-12" style={{ fontFamily: 'var(--font-display)' }}>
              {content.title}
            </h2>
            <div className="text-9xl font-bold text-[#375DEE] mb-8" style={{ fontFamily: 'var(--font-display)' }}>
              {content.amount}
            </div>
            <p className="text-3xl text-white/60 max-w-3xl">
              {content.description}
            </p>
          </div>
        )

      case "options":
        return (
          <div className="h-full flex flex-col justify-center px-16 md:px-24">
            <h2 className="text-5xl md:text-7xl font-bold mb-16 text-center" style={{ fontFamily: 'var(--font-display)' }}>
              {content.title}
            </h2>
            <div className="grid grid-cols-2 gap-12">
              <div className="p-12 rounded-3xl bg-[#375DEE]/10 border-2 border-[#375DEE] relative">
                <div className="absolute -top-5 left-12 px-6 py-2 bg-[#375DEE] rounded-full">
                  <span className="text-lg font-bold text-white">{content.option1.highlight}</span>
                </div>
                <h3 className="text-4xl font-bold text-[#375DEE] mb-4" style={{ fontFamily: 'var(--font-display)' }}>{content.option1.name}</h3>
                <p className="text-2xl text-white/60 mb-8">{content.option1.desc}</p>
                <div className="space-y-4">
                  {content.option1.points.map((point: string, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <svg className="w-8 h-8 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-xl text-white">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-12 rounded-3xl bg-white/5 border border-white/10">
                <h3 className="text-4xl font-bold text-white mb-4 mt-6" style={{ fontFamily: 'var(--font-display)' }}>{content.option2.name}</h3>
                <p className="text-2xl text-white/40 mb-8">{content.option2.desc}</p>
                <div className="space-y-4">
                  {content.option2.points.map((point: string, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-xl text-white/50">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-3xl text-white/70 text-center mt-16 italic">"{content.question}"</p>
          </div>
        )

      case "investment":
        return (
          <div className="h-full flex flex-col justify-center px-16 md:px-24">
            <span className="text-[#375DEE] text-2xl tracking-widest mb-6 text-center">{content.label}</span>
            <h2 className="text-5xl md:text-7xl font-bold mb-16 text-center" style={{ fontFamily: 'var(--font-display)' }}>
              {content.title}
            </h2>
            <div className="grid grid-cols-3 gap-8">
              {content.tiers.map((tier: any, i: number) => (
                <div key={i} className={`p-10 rounded-3xl text-center relative ${tier.highlight ? 'bg-[#375DEE]/10 border-2 border-[#375DEE] scale-105' : 'bg-white/5 border border-white/10'}`}>
                  {tier.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-[#375DEE] rounded-full">
                      <span className="text-lg font-bold text-white">MOST POPULAR</span>
                    </div>
                  )}
                  <h3 className={`text-3xl font-bold mb-6 ${tier.highlight ? 'text-[#375DEE]' : 'text-white/60'}`} style={{ fontFamily: 'var(--font-display)' }}>{tier.name}</h3>
                  <div className={`text-5xl font-bold mb-4 ${tier.highlight ? 'text-[#375DEE]' : 'text-white'}`} style={{ fontFamily: 'var(--font-display)' }}>{tier.daily}</div>
                  <p className={`text-2xl ${tier.highlight ? 'text-white' : 'text-white/50'}`}>{tier.leads}</p>
                </div>
              ))}
            </div>
            <p className="text-xl text-white/40 text-center mt-12">{content.note}</p>
          </div>
        )

      case "next-steps":
        return (
          <div className="h-full flex flex-col justify-center px-16 md:px-24">
            <h2 className="text-5xl md:text-7xl font-bold mb-20 text-center" style={{ fontFamily: 'var(--font-display)' }}>
              {content.title}
            </h2>
            <div className="flex justify-center gap-8">
              {content.steps.map((step: any, i: number) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-[#375DEE] flex items-center justify-center mb-6">
                    <span className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{step.num}</span>
                  </div>
                  <p className="text-2xl text-white text-center max-w-[200px]">{step.text}</p>
                  {i < content.steps.length - 1 && (
                    <div className="absolute mt-12 ml-[220px]">
                      <svg className="w-12 h-12 text-[#375DEE]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case "safety-net":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center px-16">
            <span className="text-[#375DEE] text-2xl tracking-widest mb-8">{content.label}</span>
            <h2 className="text-5xl md:text-7xl font-bold mb-12" style={{ fontFamily: 'var(--font-display)' }}>
              {content.title}
            </h2>
            <div className="p-12 rounded-3xl bg-[#375DEE]/10 border-2 border-[#375DEE] mb-12">
              <div className="text-6xl font-bold text-[#375DEE] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {content.offer}
              </div>
            </div>
            <div className="flex gap-8 justify-center">
              {content.benefits.map((benefit: string, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-xl text-white/80">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case "final":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#375DEE]/30 via-transparent to-transparent" />
            <div className="relative z-10">
              <h2 className="text-6xl md:text-8xl font-bold mb-8" style={{ fontFamily: 'var(--font-display)' }}>
                {content.title}
              </h2>
              <p className="text-3xl md:text-4xl text-white/60 mb-16 max-w-4xl">
                {content.subtitle}
              </p>
              <div className="text-5xl md:text-6xl font-bold text-[#375DEE]" style={{ fontFamily: 'var(--font-display)' }}>
                {content.cta}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center px-4" style={{ fontFamily: 'var(--font-sans)' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <img src="/scalexoticslong.png" alt="Scale Exotics" className="h-10 w-auto mx-auto mb-8" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Demo Access
            </h1>
            <p className="text-xl text-white/50">Enter password to continue</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-6 py-5 rounded-xl bg-white/5 border ${error ? 'border-red-500' : 'border-white/20'} text-white text-xl placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition`}
            />
            {error && <p className="text-red-400 text-lg">{error}</p>}
            <button
              type="submit"
              className="w-full py-5 bg-[#375DEE] hover:bg-[#4169E1] text-white text-xl font-semibold rounded-xl transition-all"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black text-white overflow-hidden" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Slide Content */}
      <main className="h-full">
        <div
          key={currentSlide}
          className={`h-full transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
        >
          {renderSlide(slides[currentSlide])}
        </div>
      </main>

    </div>
  )
}
