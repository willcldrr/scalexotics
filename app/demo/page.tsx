"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"

export default function Demo() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next')

  const CORRECT_PASSWORD = "calder123"
  const LOGO_URL = "https://imagedelivery.net/CVEJyzst_6io-ETn1V_PSw/3bdba65e-fb1a-4a3e-ff6f-1aa89b081f00/public"

  const slides = [
    // SECTION 1: OPENING & PROCESS
    { id: 1, section: "intro", type: "hero", content: {
      title: "Scale Exotics",
      subtitle: "Partner Demo"
    }},
    { id: 2, section: "intro", type: "process-timeline", content: {
      title: "The 14-Day Process",
      subtitle: "From this call to leads flowing in just two weeks",
      steps: [
        { num: "1", title: "Intro Call", desc: "Learn about your business", status: "completed", day: "Day 1" },
        { num: "2", title: "Demo Call", desc: "See the system in action", status: "current", day: "Day 1" },
        { num: "3", title: "Technical Setup", desc: "Connect your accounts", status: "upcoming", day: "Days 2-3" },
        { num: "4", title: "System Buildout", desc: "Build your custom system", status: "upcoming", day: "Days 4-10" },
        { num: "5", title: "Launch Call", desc: "Review & go-live prep", status: "upcoming", day: "Day 13" },
        { num: "6", title: "Go Live", desc: "Leads start flowing", status: "upcoming", day: "Day 14" }
      ]
    }},

    // SECTION 2: WHAT THIS IS NOT
    { id: 3, section: "clarity", type: "section-header", content: {
      number: "01",
      title: "What This Is NOT",
      subtitle: "Let's clear the air first"
    }},
    { id: 4, section: "clarity", type: "problems-list", content: {
      title: "This Is NOT...",
      problems: [
        { main: "Another marketing agency", sub: "We don't charge you monthly and disappear. We only get paid when you get paid." },
        { main: "A lead generation service", sub: "We don't hand you cold leads and wish you luck. We nurture them until deposit secured." },
        { main: "A course or coaching program", sub: "We don't teach you how to do it yourself. We do it FOR you." },
        { main: "A quick fix or magic button", sub: "This is a real system that requires a real partnership. Results take 30-90 days." }
      ]
    }},

    // SECTION 3: WHAT THIS IS (Big Bold Claim)
    { id: 5, section: "solution", type: "section-header", content: {
      number: "02",
      title: "What This IS",
      subtitle: "The system that changes everything"
    }},
    { id: 6, section: "solution", type: "solution-intro", content: {
      label: "THE BIG IDEA",
      title: "A Done-For-You Booking Machine",
      subtitle: "We build, manage, and optimize your entire lead-to-booking system",
      highlight: "You get deposit-secured leads. We handle everything else."
    }},

    // SECTION 4: US VS THEM
    { id: 7, section: "comparison", type: "section-header", content: {
      number: "03",
      title: "Why We're Different",
      subtitle: "This isn't your typical agency"
    }},
    { id: 8, section: "comparison", type: "differentiator", content: {
      title: "Scale Exotics vs Everyone Else",
      comparison: {
        left: {
          title: "Other Agencies",
          items: [
            { text: "Charge $2-5K/month regardless of results", icon: "x" },
            { text: "Hand you leads and disappear", icon: "x" },
            { text: "Generic campaigns that don't convert", icon: "x" },
            { text: "No accountability for actual bookings", icon: "x" },
            { text: "You still do all the follow-up", icon: "x" }
          ]
        },
        right: {
          title: "Scale Exotics",
          items: [
            { text: "Pay per deposit-secured lead only", icon: "check" },
            { text: "We nurture until booking is secured", icon: "check" },
            { text: "Built specifically for exotic rentals", icon: "check" },
            { text: "We only win when you win", icon: "check" },
            { text: "AI handles follow-up 24/7", icon: "check" }
          ]
        }
      }
    }},

    // SECTION 5: THE SYSTEM (Show & Tell)
    { id: 9, section: "demo", type: "section-header", content: {
      number: "04",
      title: "The System",
      subtitle: "Let me show you exactly how it works"
    }},
    { id: 10, section: "demo", type: "system-overview", content: {
      title: "Three Steps to More Bookings",
      subtitle: "A complete system that works while you sleep",
      pillars: [
        { icon: "target", name: "Step 1: Attract", module: "Paid Ads", desc: "We bring qualified renters to you" },
        { icon: "robot", name: "Step 2: Engage", module: "AI Assistant", desc: "We qualify and nurture 24/7" },
        { icon: "calendar", name: "Step 3: Convert", module: "Booking System", desc: "We secure deposits automatically" }
      ]
    }},
    { id: 11, section: "demo", type: "module-detail", content: {
      moduleNum: "01",
      moduleName: "Attract",
      tagline: "Targeted ads that reach renters ready to book",
      features: [
        "Custom audiences built for YOUR market (locals, tourists, events)",
        "Platform selection based on YOUR ideal renter (Instagram, TikTok, Google)",
        "Creative that showcases YOUR exact fleet and brand",
        "Weekly optimization—we cut what doesn't work, scale what does"
      ],
      result: "Average 4-6x return on ad spend for our partners",
      visual: "ads"
    }},
    { id: 12, section: "demo", type: "module-detail", content: {
      moduleNum: "02",
      moduleName: "Engage",
      tagline: "AI that responds in seconds, not hours",
      features: [
        "Trained on YOUR fleet, pricing, policies, and FAQs",
        "Responds to every inquiry in under 60 seconds—24/7",
        "Qualifies leads (budget, dates, requirements) automatically",
        "Follows up until they book or say no—never drops a lead"
      ],
      result: "85% of leads engaged within 60 seconds",
      visual: "chat"
    }},
    { id: 13, section: "demo", type: "module-detail", content: {
      moduleNum: "03",
      moduleName: "Convert",
      tagline: "Deposits secured before leads reach your inbox",
      features: [
        "Seamless booking flow optimized for conversions",
        "Automatic deposit collection—no chasing payments",
        "You only see leads who've already put money down",
        "Full pipeline visibility so you know exactly what's coming"
      ],
      result: "You focus on the rentals. We handle the rest.",
      visual: "dashboard"
    }},

    // SECTION 6: FAQs
    { id: 14, section: "faq", type: "section-header", content: {
      number: "05",
      title: "Common Questions",
      subtitle: "Let me address what you're probably thinking"
    }},
    { id: 15, section: "faq", type: "problems-list", content: {
      title: "You Might Be Wondering...",
      problems: [
        { main: "\"How much ad spend do I need?\"", sub: "We recommend starting with $50-100/day. This gives us enough data to optimize quickly. You control the budget—scale up when you see results." },
        { main: "\"How long until I see results?\"", sub: "Most partners see their first deposit-secured leads within 7-14 days. Full optimization takes 30-90 days as we learn what works best for your market." },
        { main: "\"What if the leads don't convert?\"", sub: "You only pay for deposit-secured leads. If someone inquires but doesn't put down a deposit, that's on us—not you." },
        { main: "\"Do I need to do anything?\"", sub: "Just approve rentals and hand over the keys. We handle everything from ad to deposit. You'll have a dashboard to see what's coming." }
      ]
    }},

    // SECTION 7: GUARANTEE
    { id: 16, section: "guarantee", type: "guarantee", content: {
      title: "The Guarantee",
      main: "Deposit-secured leads in 30 days—or your money back.",
      sub: "We've done this with 47+ fleets. We know it works. That's why we can guarantee it.",
      details: ["No long-term contracts", "Cancel anytime", "100% money-back if we don't deliver"]
    }},

    // SECTION 8: WHAT'S INCLUDED
    { id: 17, section: "bonuses", type: "section-header", content: {
      number: "06",
      title: "What's Included",
      subtitle: "Everything you get when you partner with us"
    }},
    { id: 18, section: "bonuses", type: "package-grid", content: {
      title: "The Complete Package",
      subtitle: "Everything built, managed, and optimized for you",
      items: [
        { icon: "target", title: "Paid Ads", desc: "Custom campaigns on Meta, TikTok & Google" },
        { icon: "robot", title: "AI Assistant", desc: "24/7 lead engagement & qualification" },
        { icon: "funnel", title: "Funnels", desc: "High-converting landing pages" },
        { icon: "calendar", title: "CRM", desc: "Full pipeline visibility & tracking" }
      ]
    }},
    { id: 19, section: "bonuses", type: "case-study", content: {
      label: "BONUS",
      title: "Dedicated Account Manager",
      before: {
        title: "Without Scale Exotics",
        points: [
          "You manage ads yourself (or pay an agency $2-5K/mo)",
          "You answer every DM and inquiry manually",
          "You follow up with leads who ghost you",
          "You have no idea which ads are working"
        ]
      },
      after: {
        title: "With Scale Exotics",
        points: [
          "Dedicated expert manages everything for you",
          "Weekly strategy calls to review performance",
          "Direct line to your account manager",
          "Full transparency on every dollar spent"
        ]
      }
    }},

    // SECTION 9: BONUSES
    { id: 20, section: "bonuses", type: "section-header", content: {
      number: "07",
      title: "Bonuses",
      subtitle: "Extra value included with every partnership"
    }},
    { id: 21, section: "bonuses", type: "bonus-card", content: {
      badge: "BONUS #1",
      title: "Google SEO Optimization",
      subtitle: "Get found by renters searching for exotic cars in your area",
      description: "We optimize your Google Business Profile and local SEO so you rank higher in searches like \"exotic car rental [your city]\" — bringing you free, organic leads on top of paid ads.",
      highlights: [
        "Google Business Profile optimization",
        "Local SEO keyword targeting",
        "Review generation strategy",
        "Map pack ranking improvement"
      ],
      value: "$2,000+ value"
    }},
    { id: 22, section: "bonuses", type: "bonus-card", content: {
      badge: "BONUS #2",
      title: "Client Reactivation Campaign",
      subtitle: "Turn your past renters into repeat customers",
      description: "We build automated campaigns that re-engage your previous customers with personalized offers, bringing back renters who already trust you.",
      highlights: [
        "Automated email/SMS sequences",
        "Personalized offers based on history",
        "Birthday & anniversary campaigns",
        "Win-back sequences for cold leads"
      ],
      value: "$1,500+ value"
    }},
    { id: 23, section: "bonuses", type: "referral-program", content: {
      badge: "BONUS #3",
      title: "Let Us Pay You",
      subtitle: "Referral Program",
      description: "Know other exotic rental owners? For every fleet owner you refer who invests a minimum of $1,500/month with us, we send you $500 cash per month — as long as they stay.",
      example: {
        referrals: "3",
        monthly: "$1,500",
        yearly: "$18,000"
      },
      cta: "Refer 3 friends = $1,500/month passive income"
    }},

    // SECTION 10: PRICING
    { id: 24, section: "close", type: "section-header", content: {
      number: "08",
      title: "Investment",
      subtitle: "Two options to get started"
    }},
    { id: 25, section: "close", type: "pricing", content: {
      title: "Choose Your Path",
      cta: "Which option sounds best for you?",
      options: [
        {
          name: "Performance Model",
          highlight: true,
          badge: "MOST POPULAR",
          mainPrice: "$150",
          mainUnit: "per deposit-secured booking",
          details: [
            { label: "Setup Fee", value: "$0" },
            { label: "Per Booking", value: "$150" },
            { label: "Minimum", value: "10 booking credit" }
          ],
          toStart: "$1,497",
          toStartNote: "to get started + adspend"
        },
        {
          name: "Retainer",
          highlight: false,
          badge: null,
          mainPrice: "$1,997",
          mainUnit: "per month",
          details: [
            { label: "Monthly Fee", value: "$1,997" },
            { label: "Per Booking", value: "$0" },
            { label: "Bookings", value: "Unlimited" }
          ],
          toStart: "$1,997",
          toStartNote: "to get started + adspend"
        }
      ]
    }},
    { id: 26, section: "close", type: "adspend-tiers", content: {
      title: "Ad Spend Options",
      subtitle: "You control the budget. Scale up as you see results.",
      tiers: [
        { level: "Good", daily: "$50", monthly: "$1,500/mo", desc: "Test & learn phase", results: "5-10 leads/month" },
        { level: "Better", daily: "$75", monthly: "$2,250/mo", desc: "Steady growth", results: "10-18 leads/month", recommended: true },
        { level: "Best", daily: "$100", monthly: "$3,000/mo", desc: "Aggressive scale", results: "18-30 leads/month" }
      ],
      note: "These are estimates. Actual results vary by market and season."
    }},

    // SECTION 11: DOWNSELL DEPOSIT (Hidden - only via up arrow)
    { id: 27, section: "close", type: "deposit", content: {
      title: "Not Ready to Decide Today?",
      subtitle: "That's completely fine.",
      main: "$100 fully refundable deposit",
      details: [
        "Holds your onboarding slot for 7 days",
        "100% refundable if you decide it's not for you",
        "Applied to your first invoice if you move forward"
      ],
      cta: "Zero risk. Just keeps your spot warm while you think."
    }},

    // SECTION 12: NEXT STEPS
    { id: 28, section: "close", type: "process-timeline", content: {
      title: "What Happens Next",
      subtitle: "From today to leads flowing in just two weeks",
      steps: [
        { num: "1", title: "Onboarding Call", desc: "We gather your fleet info", status: "upcoming", day: "Day 1" },
        { num: "2", title: "Technical Setup", desc: "Connect your accounts", status: "upcoming", day: "Days 2-3" },
        { num: "3", title: "System Buildout", desc: "Build your custom system", status: "upcoming", day: "Days 4-10" },
        { num: "4", title: "Launch Call", desc: "Review & go-live prep", status: "upcoming", day: "Day 13" },
        { num: "5", title: "Go Live", desc: "Leads start flowing", status: "upcoming", day: "Day 14" }
      ]
    }},
    { id: 29, section: "close", type: "urgency", content: {
      title: "Why Start Now?",
      points: [
        { icon: "clock", text: "Every day without this system = leads going to competitors who respond faster" },
        { icon: "calendar", text: "Peak season is coming—build momentum before the rush" },
        { icon: "users", text: "We only onboard 3 new partners per month to maintain quality" }
      ],
      cta: "The math is simple: waiting costs you money."
    }},
    { id: 30, section: "close", type: "final", content: {
      title: "Ready to Scale?",
      subtitle: "You've got the fleet. We've got the system.",
      cta: "Let's do this."
    }}
  ]

  const sections = ["intro", "clarity", "solution", "comparison", "demo", "faq", "guarantee", "bonuses", "close"]
  const currentSection = slides[currentSlide].section

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true)
      setError("")
    } else {
      setError("Incorrect password")
    }
  }

  // Find deposit slide index (hidden from normal navigation)
  const depositSlideIndex = slides.findIndex(s => s.type === "deposit")

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1 && !isAnimating) {
      setIsAnimating(true)
      setSlideDirection('next')
      // Skip deposit slide in normal navigation
      let nextIndex = currentSlide + 1
      if (nextIndex === depositSlideIndex) {
        nextIndex = depositSlideIndex + 1
      }
      if (nextIndex < slides.length) {
        setCurrentSlide(nextIndex)
      }
      setTimeout(() => setIsAnimating(false), 400)
    }
  }, [currentSlide, slides.length, isAnimating, depositSlideIndex])

  const prevSlide = useCallback(() => {
    if (currentSlide > 0 && !isAnimating) {
      setIsAnimating(true)
      setSlideDirection('prev')
      // Skip deposit slide in normal navigation
      let prevIndex = currentSlide - 1
      if (prevIndex === depositSlideIndex) {
        prevIndex = depositSlideIndex - 1
      }
      if (prevIndex >= 0) {
        setCurrentSlide(prevIndex)
      }
      setTimeout(() => setIsAnimating(false), 400)
    }
  }, [currentSlide, isAnimating, depositSlideIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault()
        nextSlide()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        prevSlide()
      } else if (e.key === "ArrowUp") {
        // Special: On pricing slide, up arrow jumps to deposit slide
        const currentSlideType = slides[currentSlide]?.type
        if (currentSlideType === "pricing") {
          e.preventDefault()
          const depositIndex = slides.findIndex(s => s.type === "deposit")
          if (depositIndex !== -1 && !isAnimating) {
            setIsAnimating(true)
            setSlideDirection('next')
            setCurrentSlide(depositIndex)
            setTimeout(() => setIsAnimating(false), 400)
          }
        }
      } else if (e.key === "ArrowDown") {
        // Special: On deposit slide, down arrow jumps back to pricing slide
        const currentSlideType = slides[currentSlide]?.type
        if (currentSlideType === "deposit") {
          e.preventDefault()
          const pricingIndex = slides.findIndex(s => s.type === "pricing")
          if (pricingIndex !== -1 && !isAnimating) {
            setIsAnimating(true)
            setSlideDirection('prev')
            setCurrentSlide(pricingIndex)
            setTimeout(() => setIsAnimating(false), 400)
          }
        }
      }
    }
    if (isAuthenticated) {
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isAuthenticated, nextSlide, prevSlide, currentSlide, isAnimating])

  const renderSlide = (slide: typeof slides[0]) => {
    const content = slide.content as any

    switch (slide.type) {
      case "hero":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center relative overflow-hidden px-8">
            {/* Premium background effects */}
            <div className="absolute inset-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#375DEE]/15 rounded-full blur-[200px]" />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#375DEE]/5 via-transparent to-transparent" />
            </div>
            {/* Subtle grid */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '80px 80px'
            }} />

            <div className="relative z-10 max-w-4xl">
              {/* Logo */}
              <Image src={LOGO_URL} alt="Scale Exotics" width={200} height={64} className="h-16 w-auto mx-auto mb-12 fade-up" />

              {/* Main title */}
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent">{content.title}</span>
              </h1>

              {/* Subtitle */}
              <p className="text-2xl md:text-3xl font-medium fade-up delay-2" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="bg-gradient-to-r from-[#375DEE] to-[#375DEE] bg-clip-text text-transparent">{content.subtitle}</span>
              </p>
            </div>
          </div>
        )

      case "social-proof":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#375DEE]/10 rounded-full blur-[150px]" />
              <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#375DEE]/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              <p className="text-white/40 text-lg mb-12 fade-up delay-1">Real numbers from real fleet owners</p>

              <div className="grid grid-cols-3 gap-6 max-w-5xl mb-14">
                {content.stats.map((stat: any, i: number) => (
                  <div key={i} className={`group fade-up delay-${i + 1}`}>
                    <div className="relative bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8 overflow-hidden hover:border-[#375DEE]/30 transition-all duration-500">
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#375DEE]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {/* Top accent line */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#375DEE] to-transparent" />
                      <div className="relative">
                        <div className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#375DEE] to-[#375DEE] bg-clip-text text-transparent mb-3" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</div>
                        <div className="text-lg font-semibold text-white mb-1">{stat.label}</div>
                        <div className="text-sm text-white/40">{stat.detail}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="max-w-3xl fade-up delay-4">
                <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8 overflow-hidden">
                  {/* Quote icon with glow */}
                  <div className="absolute -top-2 left-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#375DEE] blur-xl opacity-50" />
                      <svg className="relative w-10 h-10 text-[#375DEE]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl text-white/90 italic mb-6 pt-6 leading-relaxed">{content.quote}</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#375DEE] to-[#375DEE]/50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{content.author}</p>
                      <p className="text-[#375DEE] text-sm">Verified Partner</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case "agenda":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24 relative overflow-hidden">
            {/* Subtle background */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />

            <div className="relative z-10">
              <h2 className="text-5xl lg:text-6xl font-bold mb-4 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              <p className="text-white/40 text-lg mb-12 fade-up delay-1">Your roadmap to consistent revenue</p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl relative">
                {/* Connecting line */}
                <div className="absolute top-1/2 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-[#375DEE]/30 via-[#375DEE]/50 to-[#375DEE]/30 hidden lg:block" />

                {content.items.map((item: any, i: number) => (
                  <div key={i} className={`group fade-up delay-${i + 1}`}>
                    <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8 h-full hover:border-[#375DEE]/30 transition-all duration-500">
                      {/* Glow on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#375DEE]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      {/* Top accent */}
                      <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-[#375DEE]/50 to-transparent" />

                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-[#375DEE]/10 border border-[#375DEE]/20 flex items-center justify-center mb-5">
                          <span className="text-2xl font-bold text-[#375DEE]" style={{ fontFamily: 'var(--font-display)' }}>{item.num}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-white/40 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "section-header":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
              <span className="text-[40rem] font-bold text-white select-none" style={{ fontFamily: 'var(--font-display)' }}>{content.number}</span>
            </div>
            <div className="relative z-10">
              <span className="text-[#375DEE] text-sm tracking-[0.3em] mb-6 block fade-up">SECTION {content.number}</span>
              <h2 className="text-7xl lg:text-8xl font-bold mb-6 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              <p className="text-xl text-white/40 fade-up delay-2">{content.subtitle}</p>
            </div>
          </div>
        )

      case "process-timeline":
        return (
          <div className="h-full flex flex-col justify-center px-8 lg:px-16 relative overflow-hidden">
            {/* Premium background */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-[#375DEE]/8 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto w-full">
              {/* Header */}
              <div className="text-center mb-12 fade-up">
                <h2 className="text-4xl lg:text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
                <p className="text-white/40 text-lg">{content.subtitle}</p>
              </div>

              {/* Timeline container */}
              <div className="relative bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl p-8 lg:p-10 overflow-hidden">
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-[#375DEE]/5 to-white/5 pointer-events-none" />

                {/* Connection line */}
                <div className="absolute top-[72px] left-[8%] right-[8%] h-[3px] rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-white/10" />
                  {/* Progress fill - first step complete, second is current */}
                  <div className="absolute left-0 top-0 bottom-0 w-[10%] bg-gradient-to-r from-green-500 to-green-400" />
                  <div className="absolute left-[10%] top-0 bottom-0 w-[8%] bg-gradient-to-r from-green-400 to-[#375DEE]" />
                </div>

                <div className="relative flex justify-between">
                  {content.steps.map((step: any, i: number) => {
                    const isCompleted = step.status === 'completed';
                    const isCurrent = step.status === 'current';

                    return (
                      <div key={i} className={`flex flex-col items-center fade-up delay-${i + 1}`} style={{ width: '15%' }}>
                        {/* Step indicator */}
                        <div className="relative mb-5">
                          {/* Outer glow for current */}
                          {isCurrent && (
                            <div className="absolute inset-[-6px] bg-[#375DEE] rounded-full blur-lg opacity-50 animate-pulse" />
                          )}

                          {/* Circle */}
                          <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30'
                              : isCurrent
                                ? 'bg-gradient-to-br from-[#375DEE] to-[#375DEE] shadow-lg shadow-[#375DEE]/40 ring-4 ring-[#375DEE]/20'
                                : 'bg-white/5 border-2 border-white/10'
                          }`}>
                            {isCompleted ? (
                              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : isCurrent ? (
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            ) : (
                              <span className="text-xl font-bold text-white/20" style={{ fontFamily: 'var(--font-display)' }}>{step.num}</span>
                            )}
                          </div>

                          {/* Status badge */}
                          {(isCurrent || isCompleted) && (
                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full ${
                              isCompleted ? 'bg-green-500' : 'bg-[#375DEE]'
                            }`}>
                              <span className="text-[9px] text-white font-bold uppercase tracking-wider whitespace-nowrap">
                                {isCompleted ? 'Done' : 'Now'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Step content */}
                        <div className="text-center mt-3">
                          <h3 className={`text-sm lg:text-base font-bold mb-1 ${
                            isCompleted ? 'text-green-400' :
                            isCurrent ? 'text-white' : 'text-white/30'
                          }`}>{step.title}</h3>
                          <p className={`text-xs leading-relaxed mb-2 ${
                            isCompleted || isCurrent ? 'text-white/50' : 'text-white/20'
                          }`}>{step.desc}</p>
                          {/* Day label */}
                          <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                            isCompleted ? 'bg-green-500/20 text-green-400' :
                            isCurrent ? 'bg-[#375DEE]/20 text-[#375DEE]' : 'bg-white/5 text-white/30'
                          }`}>{step.day}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 14-day guarantee badge */}
              <div className="flex justify-center mt-8 fade-up delay-7">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#375DEE]/10 border border-[#375DEE]/20 rounded-full">
                  <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[#375DEE] font-semibold">Full system live in just 14 days</span>
                </div>
              </div>
            </div>
          </div>
        )

      case "package-grid":
        return (
          <div className="h-full flex flex-col justify-center px-12 lg:px-20 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#375DEE]/8 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-16 fade-up">
                <h2 className="text-4xl lg:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
                <p className="text-white/40 text-xl">{content.subtitle}</p>
              </div>

              {/* Horizontal cards */}
              <div className="flex justify-center gap-6 max-w-5xl mx-auto">
                {content.items.map((item: any, i: number) => (
                  <div key={i} className={`flex-1 fade-up delay-${i + 1}`}>
                    <div className="group relative text-center">
                      {/* Icon container */}
                      <div className="relative mx-auto mb-6">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-[#375DEE] rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity" />
                        <div className="relative w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#375DEE]/20 to-[#375DEE]/10 border border-[#375DEE]/30 flex items-center justify-center group-hover:border-[#375DEE]/50 transition-all">
                          {item.icon === "target" && <svg className="w-9 h-9 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.5} /><circle cx="12" cy="12" r="6" strokeWidth={1.5} /><circle cx="12" cy="12" r="2" strokeWidth={1.5} /></svg>}
                          {item.icon === "robot" && <svg className="w-9 h-9 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                          {item.icon === "funnel" && <svg className="w-9 h-9 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>}
                          {item.icon === "calendar" && <svg className="w-9 h-9 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        </div>
                      </div>

                      {/* Text */}
                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom tagline */}
              <div className="text-center mt-14 fade-up delay-5">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/[0.03] border border-white/10 rounded-full">
                  <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white/60">All built, managed, and optimized by our team</span>
                </div>
              </div>
            </div>
          </div>
        )

      case "problems-list":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[150px]" />
              <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-[#375DEE]/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto w-full">
              <h2 className="text-4xl lg:text-5xl font-bold mb-12 text-center fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>

              <div className="space-y-5">
                {content.problems.map((problem: any, i: number) => (
                  <div key={i} className={`fade-up delay-${i + 1}`}>
                    <div className="group relative bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all overflow-hidden">
                      {/* Subtle glow on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="relative flex items-start gap-5">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                          <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#375DEE] transition-colors">{problem.main}</h3>
                          <p className="text-white/50 text-sm leading-relaxed">{problem.sub}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "social-proof-screenshots":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#375DEE]/10 rounded-full blur-[150px]" />
            </div>
            <div className="relative z-10">
              <div className="mb-10 fade-up">
                <h2 className="text-4xl lg:text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
                <p className="text-white/40 text-lg">{content.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl">
                {content.placeholders.map((placeholder: any, i: number) => (
                  <div key={i} className={`fade-up delay-${i + 1}`}>
                    <div className="relative bg-white/[0.02] backdrop-blur-sm border border-dashed border-white/20 rounded-2xl p-4 h-[280px] flex flex-col items-center justify-center hover:border-[#375DEE]/40 transition-colors group">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#375DEE]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative text-center">
                        {placeholder.type === 'google-review' && (
                          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/5 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white/30" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                          </div>
                        )}
                        {placeholder.type === 'instagram-dm' && (
                          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/5 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white/30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/></svg>
                          </div>
                        )}
                        {placeholder.type === 'text-message' && (
                          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/5 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          </div>
                        )}
                        <p className="text-white/30 text-sm font-medium">[{placeholder.label}]</p>
                        <p className="text-white/20 text-xs mt-2">Drop screenshot here</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "revenue-math":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
            <div className="relative z-10">
              <div className="mb-10 fade-up">
                <h2 className="text-4xl lg:text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
                <p className="text-white/40 text-lg">{content.subtitle}</p>
              </div>
              <div className="flex items-center justify-center gap-8 max-w-5xl mx-auto">
                {/* Current State */}
                <div className="flex-1 fade-up delay-1">
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
                    <div className="text-center mb-6">
                      <span className="text-sm text-white/40 tracking-wider">{content.scenario.current.label}</span>
                    </div>
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between text-white/50">
                        <span>Weekdays</span>
                        <span>{content.scenario.current.weekday}</span>
                      </div>
                      <div className="flex justify-between text-white/50">
                        <span>Weekends</span>
                        <span>{content.scenario.current.weekend}</span>
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-4">
                      <div className="text-center">
                        <span className="text-3xl font-bold text-white/60" style={{ fontFamily: 'var(--font-display)' }}>{content.scenario.current.monthly}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center fade-up delay-2">
                  <svg className="w-12 h-12 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                {/* Optimized State */}
                <div className="flex-1 fade-up delay-3">
                  <div className="relative bg-gradient-to-br from-[#375DEE]/20 to-[#375DEE]/5 border border-[#375DEE]/30 rounded-2xl p-8 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#375DEE]/20 rounded-full blur-[50px]" />
                    <div className="relative">
                      <div className="text-center mb-6">
                        <span className="text-sm text-[#375DEE] tracking-wider font-medium">{content.scenario.potential.label}</span>
                      </div>
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between text-white/70">
                          <span>Weekdays</span>
                          <span className="text-[#375DEE]">{content.scenario.potential.weekday}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Weekends</span>
                          <span className="text-[#375DEE]">{content.scenario.potential.weekend}</span>
                        </div>
                      </div>
                      <div className="border-t border-[#375DEE]/30 pt-4">
                        <div className="text-center">
                          <span className="text-3xl font-bold text-[#375DEE]" style={{ fontFamily: 'var(--font-display)' }}>{content.scenario.potential.monthly}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gap callout */}
              <div className="mt-10 text-center fade-up delay-4">
                <div className="inline-flex items-center gap-3 px-8 py-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-xl font-bold text-green-400">{content.scenario.gap}</span>
                </div>
              </div>

              {/* Fleet context */}
              <div className="mt-6 text-center fade-up delay-5">
                <p className="text-white/30 text-sm">Based on a {content.scenario.fleetSize} at {content.scenario.avgDaily}</p>
              </div>
            </div>
          </div>
        )

      case "top-performers":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#375DEE]/5 rounded-full blur-[120px]" />
            </div>
            <div className="relative z-10">
              <div className="mb-10 fade-up">
                <h2 className="text-4xl lg:text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
                <p className="text-white/40 text-lg">{content.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl">
                {content.items.map((item: any, i: number) => (
                  <div key={i} className={`fade-up delay-${i + 1}`}>
                    <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-6 h-full hover:border-[#375DEE]/30 transition-all group">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#375DEE]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="text-4xl font-bold bg-gradient-to-r from-[#375DEE] to-[#375DEE] bg-clip-text text-transparent mb-2" style={{ fontFamily: 'var(--font-display)' }}>{item.metric}</div>
                        <div className="text-lg font-semibold text-white mb-2">{item.label}</div>
                        <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "gap-analysis":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }} />
            <div className="relative z-10">
              <div className="mb-10 fade-up">
                <h2 className="text-4xl lg:text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
                <p className="text-white/40 text-lg">{content.subtitle}</p>
              </div>
              <div className="grid grid-cols-3 gap-8 max-w-5xl mx-auto mb-10">
                {content.gaps.map((gap: any, i: number) => (
                  <div key={i} className={`fade-up delay-${i + 1}`}>
                    <div className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center h-full">
                      <div className="text-6xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>{gap.stat}</div>
                      <div className="text-lg text-white/70 mb-2">{gap.label}</div>
                      <div className="text-sm text-white/40 mb-4">{gap.detail}</div>
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-[#375DEE] text-sm font-medium">{gap.insight}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center fade-up delay-4">
                <div className="inline-flex items-center gap-3 px-8 py-4 bg-[#375DEE]/10 border border-[#375DEE]/30 rounded-2xl">
                  <div className="w-3 h-3 rounded-full bg-[#375DEE] animate-pulse" />
                  <span className="text-xl font-semibold text-[#375DEE]">{content.cta}</span>
                  <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )

      case "system-flow":
        return (
          <div className="h-full flex flex-col justify-center items-center px-16 lg:px-24 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#375DEE]/10 rounded-full blur-[120px]" />
            </div>
            <div className="relative z-10 w-full max-w-5xl">
              <div className="text-center mb-12 fade-up">
                <h2 className="text-4xl lg:text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
                <p className="text-white/40 text-lg">{content.subtitle}</p>
              </div>
              <div className="flex items-center justify-between relative">
                {/* Connecting line */}
                <div className="absolute top-1/2 left-[10%] right-[10%] h-[3px] bg-gradient-to-r from-[#375DEE] via-[#375DEE] to-[#375DEE] -translate-y-1/2" />

                {content.steps.map((step: any, i: number) => (
                  <div key={i} className={`relative z-10 flex flex-col items-center fade-up delay-${i + 1}`}>
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#375DEE] to-[#375DEE]/70 flex items-center justify-center mb-4 shadow-lg shadow-[#375DEE]/30">
                      <span className="text-2xl font-bold text-white">{step.num}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white mb-1">{step.label}</p>
                      <p className="text-sm text-white/40 max-w-[140px]">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12 text-center fade-up delay-5">
                <div className="inline-block px-8 py-4 bg-white/[0.03] border border-white/10 rounded-2xl">
                  <p className="text-lg text-white/70">{content.outcome}</p>
                </div>
              </div>
            </div>
          </div>
        )

      case "module-with-screenshot":
        return (
          <div className="h-full grid grid-cols-2 gap-0">
            <div className="flex flex-col justify-center px-12 lg:px-16">
              <div className="flex items-center gap-4 mb-4 fade-up">
                <span className="text-5xl font-bold text-white/10" style={{ fontFamily: 'var(--font-display)' }}>{content.moduleNum}</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-3 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.moduleName}</h2>
              <p className="text-lg text-white/40 mb-8 fade-up delay-2">{content.tagline}</p>
              <div className="space-y-3 mb-6">
                {content.features.map((feature: string, i: number) => (
                  <div key={i} className={`flex items-start gap-3 fade-up delay-${i + 3}`}>
                    <div className="w-5 h-5 rounded-full bg-[#375DEE]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-2.5 h-2.5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-white/60 text-sm">{feature}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#375DEE]/10 border border-[#375DEE]/30 rounded-xl px-5 py-3 fade-up delay-7">
                <p className="text-[#375DEE] font-medium text-sm">{content.result}</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center bg-gradient-to-l from-[#375DEE]/5 to-transparent p-8">
              <div className="w-full max-w-md fade-up delay-3">
                {/* Primary screenshot placeholder */}
                <div className="relative bg-white/[0.02] border border-dashed border-white/20 rounded-2xl p-6 h-[300px] flex flex-col items-center justify-center mb-4 hover:border-[#375DEE]/40 transition-colors group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#375DEE]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-white/30 text-sm font-medium">[{content.screenshot.label}]</p>
                    <p className="text-white/20 text-xs mt-2">Drop screenshot here</p>
                  </div>
                </div>
                {/* Secondary placeholder */}
                <div className="relative bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-4 h-[80px] flex items-center justify-center hover:border-[#375DEE]/30 transition-colors">
                  <p className="text-white/20 text-xs">[{content.screenshot.secondaryLabel}]</p>
                </div>
              </div>
            </div>
          </div>
        )

      case "case-study-with-proof":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-white/[0.02] to-transparent" />
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#375DEE]/10 to-transparent" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="fade-up">
                  <span className="inline-block px-4 py-1.5 bg-[#375DEE]/10 border border-[#375DEE]/20 rounded-full text-[#375DEE] text-sm font-medium mb-3">{content.label}</span>
                  <h2 className="text-3xl lg:text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
                  <p className="text-white/40 mt-2">{content.client} • {content.timeline}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 max-w-4xl mb-8">
                {/* Before */}
                <div className="fade-up delay-1">
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm text-white/40 tracking-wider mb-5 font-medium">{content.before.title}</h3>
                    <div className="space-y-4">
                      {content.before.metrics.map((metric: any, i: number) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-white/50 text-sm">{metric.label}</span>
                          <div className="text-right">
                            <span className="text-lg font-bold text-white/60">{metric.value}</span>
                            <span className="text-xs text-white/30 block">{metric.subtext}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* After */}
                <div className="fade-up delay-2">
                  <div className="relative bg-gradient-to-br from-[#375DEE]/20 to-[#375DEE]/5 border border-[#375DEE]/30 rounded-2xl p-6 overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#375DEE]/20 rounded-full blur-[40px]" />
                    <div className="relative">
                      <h3 className="text-sm text-[#375DEE] tracking-wider mb-5 font-medium">{content.after.title}</h3>
                      <div className="space-y-4">
                        {content.after.metrics.map((metric: any, i: number) => (
                          <div key={i} className="flex justify-between items-center">
                            <span className="text-white/70 text-sm">{metric.label}</span>
                            <div className="text-right">
                              <span className="text-lg font-bold text-[#375DEE]">{metric.value}</span>
                              <span className="text-xs text-[#375DEE]/60 block">{metric.subtext}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Proof placeholders */}
              <div className="grid grid-cols-2 gap-4 max-w-4xl fade-up delay-3">
                {content.proofPlaceholders.map((placeholder: any, i: number) => (
                  <div key={i} className="relative bg-white/[0.02] border border-dashed border-white/20 rounded-xl p-4 h-[120px] flex items-center justify-center hover:border-[#375DEE]/40 transition-colors group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#375DEE]/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative text-center">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-white/5 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-white/30 text-xs font-medium">[{placeholder.label}]</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "testimonial-screenshots":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#375DEE]/5 rounded-full blur-[120px]" />
              <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#375DEE]/5 rounded-full blur-[100px]" />
            </div>
            <div className="relative z-10">
              <div className="text-center mb-10 fade-up">
                <h2 className="text-4xl lg:text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
                <p className="text-white/40 text-lg">{content.subtitle}</p>
              </div>
              <div className="grid grid-cols-3 gap-5 max-w-5xl mx-auto">
                {content.placeholders.map((placeholder: any, i: number) => (
                  <div key={i} className={`fade-up delay-${(i % 3) + 1}`}>
                    <div className="relative bg-white/[0.02] border border-dashed border-white/20 rounded-2xl p-4 h-[200px] flex flex-col items-center justify-center hover:border-[#375DEE]/40 transition-colors group">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#375DEE]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative text-center">
                        {placeholder.type === 'instagram-dm' && (
                          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white/40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/></svg>
                          </div>
                        )}
                        {placeholder.type === 'text-message' && (
                          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          </div>
                        )}
                        {placeholder.type === 'google-review' && (
                          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white/40" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                          </div>
                        )}
                        <p className="text-white/30 text-sm font-medium">[{placeholder.label}]</p>
                        <p className="text-white/20 text-xs mt-1">Drop screenshot here</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "daily-chaos":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-20 relative overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5" />
            </div>

            <div className="relative z-10">
              <div className="mb-10 fade-up">
                <span className="inline-block px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm font-medium mb-4">The Reality Check</span>
                <h2 className="text-4xl lg:text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              </div>

              {/* Timeline-style layout */}
              <div className="relative max-w-6xl">
                {/* Connecting line */}
                <div className="absolute top-[52px] left-[60px] right-[60px] h-[2px] bg-gradient-to-r from-orange-500/50 via-yellow-500/50 to-purple-500/50 hidden lg:block" />

                <div className="grid grid-cols-3 gap-6">
                  {[content.morning, content.afternoon, content.evening].map((period: any, i: number) => (
                    <div key={i} className={`fade-up delay-${i + 1}`}>
                      {/* Time indicator */}
                      <div className="flex flex-col items-center mb-6">
                        <div className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center relative ${
                          i === 0 ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30' :
                          i === 1 ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30' :
                          'bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30'
                        }`}>
                          {/* Glow effect */}
                          <div className={`absolute inset-0 rounded-2xl blur-xl opacity-30 ${
                            i === 0 ? 'bg-orange-500' : i === 1 ? 'bg-yellow-500' : 'bg-purple-500'
                          }`} />
                          <div className="relative">
                            {i === 0 && <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" /></svg>}
                            {i === 1 && <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" /></svg>}
                            {i === 2 && <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                          </div>
                        </div>
                        <span className={`text-lg font-bold mt-3 ${
                          i === 0 ? 'text-orange-400' : i === 1 ? 'text-yellow-400' : 'text-purple-400'
                        }`}>{period.label}</span>
                      </div>

                      {/* Problems card */}
                      <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
                        {period.items.map((item: string, j: number) => (
                          <div key={j} className="flex items-start gap-3 group">
                            <div className="w-6 h-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                              </svg>
                            </div>
                            <p className="text-white/60 text-sm leading-relaxed">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 text-center fade-up delay-4">
                <p className="text-xl text-white/50 italic">Sound familiar?</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400/60 animate-pulse" />
                  <span className="text-red-400/80 text-sm">This cycle repeats. Every. Single. Day.</span>
                </div>
              </div>
            </div>
          </div>
        )

      case "real-problems":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-20 relative overflow-hidden">
            {/* Subtle grid background */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />

            <div className="relative z-10">
              <div className="mb-10 fade-up">
                <h2 className="text-4xl lg:text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
                <p className="text-white/40 text-lg">The silent killers eating your revenue</p>
              </div>

              <div className="grid grid-cols-2 gap-6 max-w-6xl">
                {content.problems.map((problem: any, i: number) => (
                  <div key={i} className={`group relative fade-up delay-${i + 1}`}>
                    {/* Card with hover effect */}
                    <div className="relative bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-2xl p-7 overflow-hidden hover:border-red-500/20 transition-all duration-500">
                      {/* Number indicator */}
                      <div className="absolute top-4 right-4 text-6xl font-bold text-white/[0.03]" style={{ fontFamily: 'var(--font-display)' }}>
                        0{i + 1}
                      </div>

                      {/* Warning pulse effect */}
                      <div className="absolute -top-1 -left-1 w-16 h-16 bg-red-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative flex items-start gap-5">
                        {/* Icon with animated ring */}
                        <div className="relative flex-shrink-0">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 flex items-center justify-center">
                            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {i === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />}
                              {i === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                              {i === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />}
                              {i === 3 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
                            </svg>
                          </div>
                          {/* Pulse ring */}
                          <div className="absolute inset-0 rounded-xl border border-red-500/20 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400/90 transition-colors">{problem.main}</h3>
                          <p className="text-white/50 text-sm leading-relaxed">{problem.sub}</p>
                        </div>
                      </div>

                      {/* Bottom accent */}
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "brutal-truth":
        return (
          <div className="h-full flex flex-col justify-center items-center text-center px-8 relative overflow-hidden">
            {/* Dramatic gradient background */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/5 rounded-full blur-[150px]" />
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#375DEE]/10 to-transparent" />
            </div>

            <div className="relative z-10 max-w-4xl">
              <div className="fade-up">
                <span className="inline-block px-5 py-2 bg-white/5 border border-white/10 rounded-full text-white/50 text-sm font-medium mb-8">{content.title}</span>
              </div>

              {/* Main statement with emphasis */}
              <div className="mb-8 fade-up delay-1">
                <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  <span className="text-white">{content.main.split("answer DMs")[0]}</span>
                  <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">answer DMs all day.</span>
                </h2>
              </div>

              <p className="text-xl lg:text-2xl text-white/50 mb-14 fade-up delay-2">{content.sub}</p>

              {/* Points as impactful statements */}
              <div className="grid grid-cols-3 gap-6 mb-14">
                {content.points.map((point: string, i: number) => (
                  <div key={i} className={`fade-up delay-${i + 3}`}>
                    <div className="relative group">
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-full hover:border-red-500/20 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                          {i === 0 && <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                          {i === 1 && <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
                          {i === 2 && <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed">{point}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Transition to solution */}
              <div className="fade-up delay-6">
                <div className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-[#375DEE]/20 to-[#375DEE]/10 border border-[#375DEE]/30 rounded-2xl">
                  <div className="w-3 h-3 rounded-full bg-[#375DEE] animate-pulse" />
                  <p className="text-2xl lg:text-3xl text-[#375DEE] font-bold" style={{ fontFamily: 'var(--font-display)' }}>{content.closing}</p>
                  <svg className="w-6 h-6 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )

      case "solution-intro":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center px-8 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#375DEE]/10 rounded-full blur-[150px]" />
            </div>
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }} />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#375DEE]/10 border border-[#375DEE]/20 rounded-full mb-8 fade-up">
                <div className="w-2 h-2 rounded-full bg-[#375DEE] animate-pulse" />
                <span className="text-[#375DEE] text-sm tracking-[0.2em] font-medium">{content.label}</span>
              </div>
              <h2 className="text-5xl lg:text-6xl font-bold mb-6 max-w-4xl fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">{content.title}</span>
              </h2>
              <p className="text-xl text-white/50 mb-12 max-w-2xl fade-up delay-2">{content.subtitle}</p>
              <div className="relative fade-up delay-3">
                <div className="absolute inset-0 bg-[#375DEE] blur-xl opacity-20 rounded-2xl" />
                <div className="relative bg-gradient-to-r from-[#375DEE]/20 to-[#375DEE]/10 border border-[#375DEE]/30 rounded-2xl px-10 py-6">
                  <p className="text-2xl bg-gradient-to-r from-[#375DEE] to-[#375DEE] bg-clip-text text-transparent font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{content.highlight}</p>
                </div>
              </div>
            </div>
          </div>
        )

      case "system-overview":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-20 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#375DEE]/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10">
              <div className="text-center mb-14">
                <h2 className="text-4xl lg:text-5xl font-bold mb-4 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
                <p className="text-lg text-white/40 fade-up delay-1">{content.subtitle}</p>
              </div>
              <div className="flex items-center justify-center gap-4 lg:gap-6 relative">
                {/* Connecting line */}
                <div className="absolute top-[70px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-[#375DEE]/50 to-transparent hidden lg:block" />

                {content.pillars.map((pillar: any, i: number) => (
                  <div key={i} className="flex items-center">
                    <div className={`flex flex-col items-center fade-up delay-${i + 2} group`}>
                      {/* Pillar box with glow */}
                      <div className="relative mb-5">
                        <div className="absolute inset-0 bg-[#375DEE] blur-xl opacity-30 rounded-3xl group-hover:opacity-50 transition-opacity" />
                        <div className="relative w-32 h-32 lg:w-36 lg:h-36 rounded-2xl bg-gradient-to-br from-[#375DEE] to-[#375DEE]/80 flex flex-col items-center justify-center border border-white/10">
                          {pillar.icon === "target" && <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.5} /><circle cx="12" cy="12" r="6" strokeWidth={1.5} /><circle cx="12" cy="12" r="2" strokeWidth={1.5} /></svg>}
                          {pillar.icon === "funnel" && <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>}
                          {pillar.icon === "robot" && <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                          {pillar.icon === "calendar" && <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        </div>
                      </div>
                      <p className="text-lg font-bold text-white">{pillar.name}</p>
                      <p className="text-xs text-[#375DEE] font-semibold tracking-wide">{pillar.module}</p>
                      <p className="text-xs text-white/40 mt-1 max-w-[140px] text-center">{pillar.desc}</p>
                    </div>
                    {i < content.pillars.length - 1 && (
                      <div className="mx-3 lg:mx-5 flex flex-col items-center">
                        <svg className="w-6 h-6 text-[#375DEE]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "differentiator":
        return (
          <div className="h-full grid grid-cols-2 gap-0 items-stretch relative overflow-hidden">
            {/* Left side - Other Agencies */}
            <div className="flex flex-col justify-center px-10 lg:px-14 relative bg-gradient-to-r from-red-500/[0.03] to-transparent">
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #fff, #fff 1px, transparent 1px, transparent 8px)'
              }} />
              <div className="relative fade-up">
                <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-white/50" style={{ fontFamily: 'var(--font-display)' }}>{content.comparison.left.title}</h2>
                <div className="space-y-4">
                  {content.comparison.left.items.map((item: any, i: number) => (
                    <div key={i} className={`flex items-center gap-5 p-5 bg-white/[0.02] border border-white/5 rounded-2xl fade-up delay-${i + 1}`}>
                      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-red-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <p className="text-white/50 text-lg">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center divider */}
            <div className="absolute left-1/2 top-0 bottom-0 flex flex-col items-center justify-center -translate-x-1/2 z-10">
              <div className="w-[2px] flex-1 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
              <div className="py-6 px-4 bg-black">
                <span className="text-2xl font-bold text-white/30" style={{ fontFamily: 'var(--font-display)' }}>VS</span>
              </div>
              <div className="w-[2px] flex-1 bg-gradient-to-b from-transparent via-[#375DEE]/40 to-transparent" />
            </div>

            {/* Right side - Scale Exotics */}
            <div className="flex flex-col justify-center px-10 lg:px-14 relative bg-gradient-to-l from-[#375DEE]/10 to-transparent">
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[400px] bg-[#375DEE]/20 rounded-full blur-[120px]" />
              <div className="relative fade-up delay-1">
                <h2 className="text-3xl lg:text-4xl font-bold mb-8" style={{ fontFamily: 'var(--font-display)' }}>
                  <span className="bg-gradient-to-r from-[#375DEE] to-[#375DEE] bg-clip-text text-transparent">{content.comparison.right.title}</span>
                </h2>
                <div className="space-y-4">
                  {content.comparison.right.items.map((item: any, i: number) => (
                    <div key={i} className={`flex items-center gap-5 p-5 bg-[#375DEE]/10 border border-[#375DEE]/30 rounded-2xl hover:border-[#375DEE]/50 hover:bg-[#375DEE]/15 transition-all fade-up delay-${i + 2}`}>
                      <div className="w-12 h-12 rounded-xl bg-[#375DEE]/20 border border-[#375DEE]/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-white text-lg">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "module-detail":
        return (
          <div className="h-full grid grid-cols-2 gap-0">
            <div className="flex flex-col justify-center px-16 lg:px-20">
              <div className="flex items-center gap-4 mb-4 fade-up">
                <span className="text-5xl font-bold text-white/10" style={{ fontFamily: 'var(--font-display)' }}>{content.moduleNum}</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-3 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.moduleName}</h2>
              <p className="text-lg text-white/40 mb-10 fade-up delay-2">{content.tagline}</p>
              <div className="space-y-4 mb-8">
                {content.features.map((feature: string, i: number) => (
                  <div key={i} className={`flex items-start gap-4 fade-up delay-${i + 3}`}>
                    <div className="w-6 h-6 rounded-full bg-[#375DEE]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-white/70">{feature}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#375DEE]/10 border border-[#375DEE]/30 rounded-xl px-6 py-4 fade-up delay-7">
                <p className="text-[#375DEE] font-medium">{content.result}</p>
              </div>
            </div>
            <div className="flex items-center justify-center bg-gradient-to-l from-[#375DEE]/5 to-transparent">
              {content.visual === "ads" && (
                <div className="w-72 h-[500px] bg-black rounded-[3rem] border-4 border-white/10 p-2 fade-up delay-3">
                  <div className="w-full h-full bg-gradient-to-b from-white/5 to-transparent rounded-[2.5rem] flex flex-col items-center justify-center">
                    <svg className="w-16 h-16 text-[#375DEE]/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-white/20 text-sm">Your Ad Here</p>
                  </div>
                </div>
              )}
              {content.visual === "funnel" && (
                <div className="relative fade-up delay-3">
                  <div className="w-80 h-24 bg-gradient-to-b from-[#375DEE]/20 to-[#375DEE]/10 rounded-t-xl flex items-center justify-center border border-[#375DEE]/20">
                    <span className="text-white/40 text-sm">1,000 visitors</span>
                  </div>
                  <div className="w-64 h-24 bg-gradient-to-b from-[#375DEE]/25 to-[#375DEE]/15 mx-auto flex items-center justify-center border-x border-[#375DEE]/25">
                    <span className="text-white/50 text-sm">300 engaged</span>
                  </div>
                  <div className="w-48 h-24 bg-gradient-to-b from-[#375DEE]/35 to-[#375DEE]/25 mx-auto flex items-center justify-center border-x border-[#375DEE]/35">
                    <span className="text-white/60 text-sm">75 leads</span>
                  </div>
                  <div className="w-32 h-24 bg-[#375DEE] mx-auto rounded-b-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">12 bookings</span>
                  </div>
                </div>
              )}
              {content.visual === "chat" && (
                <div className="w-full max-w-md space-y-4 px-8 fade-up delay-3">
                  <div className="flex justify-end"><div className="bg-[#375DEE] rounded-2xl rounded-br-md px-5 py-3 max-w-[80%]"><p className="text-white text-sm">Hi, I'm interested in renting a Lamborghini this weekend</p></div></div>
                  <div className="flex justify-start"><div className="bg-white/10 rounded-2xl rounded-bl-md px-5 py-3 max-w-[80%]"><p className="text-white/80 text-sm">Hey! Great choice. We have a Huracán available Saturday-Sunday. $1,500/day with 100 miles included. Want me to check exact availability?</p></div></div>
                  <div className="flex justify-end"><div className="bg-[#375DEE] rounded-2xl rounded-br-md px-5 py-3 max-w-[80%]"><p className="text-white text-sm">Yes, Saturday 10am - Sunday 10am</p></div></div>
                  <div className="flex justify-start"><div className="bg-white/10 rounded-2xl rounded-bl-md px-5 py-3 max-w-[80%]"><p className="text-white/80 text-sm">Perfect! It's available. I can send you a booking link right now. What email should I send it to?</p></div></div>
                </div>
              )}
              {content.visual === "dashboard" && (
                <div className="w-full max-w-lg bg-black/50 rounded-2xl border border-white/10 p-6 mx-8 fade-up delay-3">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/5 rounded-xl p-4"><p className="text-white/40 text-xs mb-1">Leads</p><p className="text-2xl font-bold text-white">47</p></div>
                    <div className="bg-white/5 rounded-xl p-4"><p className="text-white/40 text-xs mb-1">Bookings</p><p className="text-2xl font-bold text-[#375DEE]">12</p></div>
                    <div className="bg-white/5 rounded-xl p-4"><p className="text-white/40 text-xs mb-1">Revenue</p><p className="text-2xl font-bold text-green-400">$18k</p></div>
                  </div>
                  <div className="space-y-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-4 bg-white/5 rounded-lg p-3">
                        <div className="w-8 h-8 rounded-full bg-white/10" />
                        <div className="flex-1">
                          <div className="h-3 bg-white/10 rounded w-24 mb-1" />
                          <div className="h-2 bg-white/5 rounded w-32" />
                        </div>
                        <div className="h-6 w-16 bg-[#375DEE]/20 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case "bonus-card":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#375DEE]/8 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto w-full">
              {/* Badge */}
              <div className="flex justify-center mb-6 fade-up">
                <span className="px-4 py-2 bg-gradient-to-r from-[#375DEE] to-[#375DEE] rounded-full text-sm font-bold text-white tracking-wider">{content.badge}</span>
              </div>

              {/* Title */}
              <div className="text-center mb-10 fade-up delay-1">
                <h2 className="text-4xl lg:text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
                <p className="text-white/50 text-xl">{content.subtitle}</p>
              </div>

              {/* Card */}
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-3xl p-10 fade-up delay-2">
                <p className="text-white/70 text-lg leading-relaxed mb-8">{content.description}</p>

                {/* Highlights grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {content.highlights.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#375DEE]/20 border border-[#375DEE]/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-white/80">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Value badge */}
                <div className="flex justify-center">
                  <div className="px-6 py-3 bg-[#375DEE]/10 border border-[#375DEE]/30 rounded-full">
                    <span className="text-[#375DEE] font-bold text-lg">{content.value}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case "referral-program":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-green-500/10 rounded-full blur-[180px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto w-full">
              {/* Badge */}
              <div className="flex justify-center mb-4 fade-up">
                <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full text-sm font-bold text-white tracking-wider shadow-lg shadow-green-500/30">{content.badge}</span>
              </div>

              {/* Title */}
              <div className="text-center mb-8 fade-up delay-1">
                <h2 className="text-5xl lg:text-6xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">{content.title}</span>
                </h2>
                <p className="text-white/60 text-2xl font-medium">{content.subtitle}</p>
              </div>

              {/* Main card with cash background */}
              <div className="relative rounded-3xl overflow-hidden fade-up delay-2">
                {/* Cash background image */}
                <div className="absolute inset-0">
                  <Image
                    src="https://images.unsplash.com/photo-1561414927-6d86591d0c4f?w=1200&q=80"
                    alt=""
                    fill
                    sizes="100vw"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/85" />
                  {/* Green tint overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 to-emerald-900/20" />
                </div>

                {/* Content */}
                <div className="relative p-10 lg:p-12">
                  <p className="text-white/80 text-xl leading-relaxed mb-10 text-center max-w-2xl mx-auto">{content.description}</p>

                  {/* Example calculation - larger and more prominent */}
                  <div className="bg-black/40 backdrop-blur-sm border border-green-500/30 rounded-2xl p-8 mb-8">
                    <div className="flex items-center justify-center gap-6 lg:gap-10">
                      <div className="text-center">
                        <p className="text-6xl lg:text-7xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>{content.example.referrals}</p>
                        <p className="text-white/50 text-sm uppercase tracking-wider">Referrals</p>
                      </div>
                      <div className="text-4xl text-green-400/50">=</div>
                      <div className="text-center">
                        <p className="text-6xl lg:text-7xl font-bold text-green-400 mb-2" style={{ fontFamily: 'var(--font-display)' }}>{content.example.monthly}</p>
                        <p className="text-white/50 text-sm uppercase tracking-wider">Per Month</p>
                      </div>
                      <div className="text-4xl text-green-400/50">=</div>
                      <div className="text-center">
                        <p className="text-6xl lg:text-7xl font-bold text-green-400 mb-2" style={{ fontFamily: 'var(--font-display)' }}>{content.example.yearly}</p>
                        <p className="text-white/50 text-sm uppercase tracking-wider">Per Year</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg shadow-green-500/30">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xl font-bold text-white">{content.cta}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case "case-study":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-white/[0.02] to-transparent" />
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#375DEE]/10 to-transparent" />
            </div>

            <div className="relative z-10">
              <div className="text-center mb-12">
                <span className="inline-block px-4 py-1.5 bg-[#375DEE]/10 border border-[#375DEE]/20 rounded-full text-[#375DEE] text-sm font-medium mb-4 fade-up">{content.label}</span>
                <h2 className="text-4xl lg:text-5xl font-bold fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              </div>

              <div className="grid grid-cols-2 gap-0 max-w-5xl mx-auto relative">
                {/* Center arrow connector */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 fade-up delay-2">
                  <div className="w-16 h-16 rounded-full bg-[#375DEE] flex items-center justify-center shadow-lg shadow-[#375DEE]/30">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>

                {/* Before card */}
                <div className="fade-up delay-2">
                  <div className="bg-white/[0.02] border border-white/10 rounded-l-2xl p-8 pr-12 h-full relative overflow-hidden">
                    {/* Faded diagonal lines */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, #fff, #fff 1px, transparent 1px, transparent 10px)'
                    }} />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white/50">{content.before.title}</h3>
                      </div>
                      <div className="space-y-4">
                        {content.before.points.map((point: string, i: number) => (
                          <div key={i} className="flex items-start gap-4 group">
                            <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                            </div>
                            <p className="text-white/40 leading-relaxed">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* After card */}
                <div className="fade-up delay-3">
                  <div className="relative bg-gradient-to-br from-[#375DEE]/20 to-[#375DEE]/5 border border-[#375DEE]/30 rounded-r-2xl p-8 pl-12 h-full overflow-hidden">
                    {/* Glow effect */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#375DEE]/20 rounded-full blur-[100px]" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[#375DEE]/20 border border-[#375DEE]/30 flex items-center justify-center">
                          <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-[#375DEE]">{content.after.title}</h3>
                      </div>
                      <div className="space-y-4">
                        {content.after.points.map((point: string, i: number) => (
                          <div key={i} className="flex items-start gap-4 group">
                            <div className="w-6 h-6 rounded-lg bg-[#375DEE]/20 border border-[#375DEE]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p className="text-white leading-relaxed">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Growth indicator */}
              <div className="flex justify-center mt-10 fade-up delay-4">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-500/10 border border-green-500/20 rounded-full">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-green-400 font-bold">272% Revenue Growth in 90 Days</span>
                </div>
              </div>
            </div>
          </div>
        )

      case "testimonials":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#375DEE]/5 rounded-full blur-[120px]" />
              <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#375DEE]/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10">
              <div className="text-center mb-12">
                <h2 className="text-4xl lg:text-5xl font-bold mb-4 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
                <p className="text-white/40 text-lg fade-up delay-1">Real feedback from real partners</p>
              </div>

              <div className="grid grid-cols-3 gap-6 max-w-6xl mx-auto">
                {content.testimonials.map((testimonial: any, i: number) => (
                  <div key={i} className={`group fade-up delay-${i + 1}`}>
                    <div className="relative h-full">
                      {/* Card glow on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#375DEE]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />

                      <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8 h-full hover:border-[#375DEE]/30 transition-all duration-500 flex flex-col">
                        {/* Quote icon with glow */}
                        <div className="relative w-12 h-12 mb-6">
                          <div className="absolute inset-0 bg-[#375DEE] rounded-xl blur-xl opacity-30" />
                          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#375DEE] to-[#375DEE]/70 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                            </svg>
                          </div>
                        </div>

                        {/* Quote text */}
                        <p className="text-white/80 leading-relaxed mb-6 flex-1 text-[15px]">{testimonial.quote}</p>

                        {/* Author info */}
                        <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                            <span className="text-lg font-bold text-white/70">{testimonial.author.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-white font-semibold">{testimonial.author}</p>
                            <div className="flex items-center gap-2">
                              <svg className="w-3 h-3 text-[#375DEE]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                              </svg>
                              <p className="text-white/40 text-sm">{testimonial.location}</p>
                            </div>
                          </div>
                        </div>

                        {/* 5-star rating */}
                        <div className="flex items-center gap-1 mt-4">
                          {[...Array(5)].map((_, j) => (
                            <svg key={j} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "guarantee":
        return (
          <div className="h-full flex items-center justify-center px-8">
            <div className="text-center max-w-3xl">
              <div className="w-32 h-32 mx-auto mb-10 fade-up">
                <svg className="w-full h-full text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-5xl lg:text-6xl font-bold mb-8 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              <p className="text-3xl text-white mb-6 fade-up delay-2">{content.main}</p>
              <p className="text-xl text-white/40 mb-10 fade-up delay-3">{content.sub}</p>
              <div className="flex items-center justify-center gap-6 fade-up delay-4">
                {content.details.map((detail: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-white/50">
                    <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "adspend-tiers":
        return (
          <div className="h-full flex flex-col justify-center px-12 lg:px-20 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#375DEE]/8 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-12 fade-up">
                <h2 className="text-4xl lg:text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
                <p className="text-white/40 text-lg">{content.subtitle}</p>
              </div>

              {/* Tier cards */}
              <div className="flex justify-center gap-6 max-w-4xl mx-auto mb-10">
                {content.tiers.map((tier: any, i: number) => (
                  <div key={i} className={`flex-1 fade-up delay-${i + 1}`}>
                    <div className={`relative rounded-2xl overflow-hidden h-full ${
                      tier.recommended
                        ? 'ring-2 ring-[#375DEE] shadow-lg shadow-[#375DEE]/20'
                        : 'border border-white/10'
                    }`}>
                      {/* Recommended badge */}
                      {tier.recommended && (
                        <div className="bg-gradient-to-r from-[#375DEE] to-[#375DEE] text-center py-2">
                          <span className="text-xs font-bold text-white tracking-wider">RECOMMENDED</span>
                        </div>
                      )}

                      <div className={`p-8 h-full ${
                        tier.recommended
                          ? 'bg-gradient-to-br from-[#375DEE]/20 to-[#375DEE]/5'
                          : 'bg-white/[0.02]'
                      }`}>
                        {/* Level label */}
                        <p className={`text-sm font-medium mb-2 ${tier.recommended ? 'text-[#375DEE]' : 'text-white/40'}`}>{tier.level}</p>

                        {/* Daily amount */}
                        <div className="mb-1">
                          <span className={`text-5xl font-bold ${tier.recommended ? 'text-white' : 'text-white/80'}`} style={{ fontFamily: 'var(--font-display)' }}>{tier.daily}</span>
                          <span className="text-white/40 ml-2">/day</span>
                        </div>

                        {/* Monthly */}
                        <p className="text-white/30 text-sm mb-4">{tier.monthly}</p>

                        {/* Description */}
                        <p className={`mb-4 ${tier.recommended ? 'text-white/70' : 'text-white/50'}`}>{tier.desc}</p>

                        {/* Results estimate */}
                        <div className={`rounded-xl p-3 ${tier.recommended ? 'bg-[#375DEE]/20 border border-[#375DEE]/30' : 'bg-white/5 border border-white/10'}`}>
                          <p className={`text-sm font-medium ${tier.recommended ? 'text-[#375DEE]' : 'text-white/50'}`}>
                            Est. {tier.results}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Note */}
              <p className="text-center text-white/30 text-sm fade-up delay-4">{content.note}</p>
            </div>
          </div>
        )

      case "pricing":
        return (
          <div className="h-full flex flex-col justify-center px-12 lg:px-20 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#375DEE]/8 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto w-full">
              {/* Header */}
              <div className="text-center mb-10 fade-up">
                <h2 className="text-4xl lg:text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              </div>

              {/* Stacked pricing cards */}
              <div className="space-y-5">
                {content.options.map((option: any, i: number) => (
                  <div key={i} className={`fade-up delay-${i + 1}`}>
                    <div className={`relative rounded-2xl overflow-hidden transition-all ${
                      option.highlight
                        ? 'ring-2 ring-[#375DEE] shadow-xl shadow-[#375DEE]/20'
                        : 'border border-white/10'
                    }`}>
                      {/* Badge */}
                      {option.badge && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-[#375DEE] to-[#375DEE] rounded-full">
                          <span className="text-xs font-bold text-white tracking-wider">{option.badge}</span>
                        </div>
                      )}

                      {/* Card content */}
                      <div className={`p-6 lg:p-8 ${
                        option.highlight
                          ? 'bg-gradient-to-br from-[#375DEE]/15 to-[#375DEE]/5'
                          : 'bg-white/[0.02]'
                      }`}>
                        <div className="flex items-start justify-between gap-8">
                          {/* Left side - Plan info */}
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>{option.name}</h3>

                            {/* Details row */}
                            <div className="flex gap-6">
                              {option.details.map((detail: any, j: number) => (
                                <div key={j} className="text-center">
                                  <p className={`text-2xl font-bold ${option.highlight ? 'text-white' : 'text-white/80'}`} style={{ fontFamily: 'var(--font-display)' }}>{detail.value}</p>
                                  <p className="text-white/40 text-sm">{detail.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right side - To start */}
                          <div className={`text-right flex-shrink-0 pl-8 border-l ${option.highlight ? 'border-[#375DEE]/30' : 'border-white/10'}`}>
                            <p className={`text-4xl font-bold mb-1 ${option.highlight ? 'text-[#375DEE]' : 'text-white/70'}`} style={{ fontFamily: 'var(--font-display)' }}>{option.toStart}</p>
                            <p className="text-white/40 text-sm">{option.toStartNote}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center mt-10 fade-up delay-3">
                <p className="text-2xl text-white/70 font-medium" style={{ fontFamily: 'var(--font-display)' }}>{content.cta}</p>
              </div>
            </div>
          </div>
        )

      case "timeline":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-20">
            <h2 className="text-4xl lg:text-5xl font-bold mb-16 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="max-w-5xl">
              <div className="flex justify-between relative">
                <div className="absolute top-14 left-[60px] right-[60px] h-0.5 bg-gradient-to-r from-[#375DEE] via-[#375DEE]/50 to-[#375DEE]/20" />
                {content.steps.map((step: any, i: number) => (
                  <div key={i} className={`flex flex-col items-center fade-up delay-${i + 1}`} style={{ width: '200px' }}>
                    <div className="w-28 h-28 rounded-2xl bg-[#375DEE] flex items-center justify-center mb-4 relative z-10">
                      <span className="text-4xl font-bold text-white">{step.num}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1 text-center">{step.title}</h3>
                    <p className="text-sm text-white/40 text-center mb-2">{step.desc}</p>
                    <span className="text-xs text-[#375DEE]">{step.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "urgency":
        return (
          <div className="h-full flex flex-col justify-center items-center text-center px-8">
            <h2 className="text-4xl lg:text-5xl font-bold mb-12 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="space-y-6 max-w-2xl mb-12">
              {content.points.map((point: any, i: number) => (
                <div key={i} className={`flex items-center gap-6 bg-white/[0.03] border border-white/10 rounded-2xl p-6 fade-up delay-${i + 1}`}>
                  <div className="w-14 h-14 rounded-xl bg-[#375DEE]/20 flex items-center justify-center flex-shrink-0">
                    {point.icon === "calendar" && <svg className="w-7 h-7 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    {point.icon === "users" && <svg className="w-7 h-7 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    {point.icon === "clock" && <svg className="w-7 h-7 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  </div>
                  <p className="text-white/70 text-lg text-left">{point.text}</p>
                </div>
              ))}
            </div>
            <p className="text-xl text-[#375DEE] font-medium fade-up delay-4">{content.cta}</p>
          </div>
        )

      case "deposit":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <p className="text-xl text-white/50 mb-12 fade-up delay-1">{content.subtitle}</p>
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-12 max-w-xl mb-8 fade-up delay-2">
              <p className="text-4xl font-bold text-[#375DEE] mb-8" style={{ fontFamily: 'var(--font-display)' }}>{content.main}</p>
              <div className="space-y-4">
                {content.details.map((detail: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 justify-center">
                    <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-white/70">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-lg text-white/40 fade-up delay-3">{content.cta}</p>
          </div>
        )

      case "final":
        return (
          <div className="h-full flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[#375DEE]/15 rounded-t-full blur-[150px]" />
            </div>
            <div className="relative z-10 text-center max-w-3xl px-8">
              <Image src={LOGO_URL} alt="Scale Exotics" width={175} height={56} className="h-14 w-auto mx-auto mb-12 fade-up" />
              <h2 className="text-5xl lg:text-6xl font-bold mb-6 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              <p className="text-xl text-white/50 mb-12 fade-up delay-2">{content.subtitle}</p>
              <p className="text-3xl text-[#375DEE] font-bold fade-up delay-3" style={{ fontFamily: 'var(--font-display)' }}>{content.cta}</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const animationStyles = `
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideInRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes slideInLeft { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
    .fade-up { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .slide-in-left { animation: slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .delay-1 { animation-delay: 0.05s; } .delay-2 { animation-delay: 0.1s; } .delay-3 { animation-delay: 0.15s; }
    .delay-4 { animation-delay: 0.2s; } .delay-5 { animation-delay: 0.25s; } .delay-6 { animation-delay: 0.3s; } .delay-7 { animation-delay: 0.35s; }
  `

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center px-4" style={{ fontFamily: 'var(--font-sans)' }}>
        <style>{animationStyles}</style>
        <div className="w-full max-w-md fade-up">
          <div className="text-center mb-12">
            <Image src={LOGO_URL} alt="Scale Exotics" width={150} height={48} className="h-12 w-auto mx-auto mb-8" />
            <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>Demo Access</h1>
            <p className="text-lg text-white/50">Enter password to continue</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-5 py-4 rounded-xl bg-white/5 border ${error ? 'border-red-500' : 'border-white/20'} text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors`} />
            {error && <p className="text-red-400">{error}</p>}
            <button type="submit" className="w-full py-4 bg-[#375DEE] hover:opacity-90 text-white text-lg font-semibold rounded-xl transition-colors" style={{ fontFamily: 'var(--font-display)' }}>Enter</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black text-white overflow-hidden select-none" style={{ fontFamily: 'var(--font-sans)' }}>
      <style>{animationStyles}</style>

      <div className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between">
        <Image src={LOGO_URL} alt="Scale Exotics" width={88} height={28} priority className="h-7 w-auto opacity-50" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {sections.map((section, i) => (
              <div
                key={section}
                className={`w-8 h-1 rounded-full transition-all duration-300 ${
                  section === currentSection ? 'bg-[#375DEE]' :
                  sections.indexOf(currentSection) > i ? 'bg-white/30' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <span className="text-white/30 text-sm font-mono ml-4">{String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
        </div>
      </div>

      <button
        onClick={prevSlide}
        disabled={currentSlide === 0}
        className={`fixed left-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-all ${currentSlide === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/5 hover:border-white/20'}`}
      >
        <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        disabled={currentSlide === slides.length - 1}
        className={`fixed right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-all ${currentSlide === slides.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/5 hover:border-white/20'}`}
      >
        <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 text-white/20 text-xs">
        <span className="px-2 py-1 border border-white/10 rounded">←</span>
        <span className="px-2 py-1 border border-white/10 rounded">→</span>
        <span className="ml-2">or spacebar</span>
      </div>

      <main className="h-full pt-20">
        <div key={currentSlide} className={`h-full ${slideDirection === 'next' ? 'slide-in-right' : 'slide-in-left'}`}>
          {renderSlide(slides[currentSlide])}
        </div>
      </main>
    </div>
  )
}
