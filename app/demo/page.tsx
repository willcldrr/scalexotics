"use client"

import { useState, useEffect, useCallback } from "react"

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
    { id: 1, type: "hero", content: { title: "Scale Exotics", subtitle: "Growth Partnership", tagline: "The system that fills your fleet with premium bookings on autopilot." } },
    { id: 2, type: "agenda", content: { title: "Today's Agenda", items: ["Where you are now", "The system that works", "Live walkthrough", "Next steps"] } },
    { id: 3, type: "problem", content: { title: "The Reality", points: [{ main: "Inconsistent Bookings", sub: "One month you're fully booked, the next you're scrambling. No predictability means no peace of mind—and no way to plan for growth." }, { main: "Marketing That Doesn't Convert", sub: "You've tried ads, maybe even hired someone. Money goes out, but qualified leads don't come back. It feels like throwing cash into the void." }, { main: "Leads That Ghost", sub: "People reach out interested, then disappear. Without instant follow-up and nurturing, hot leads go cold before you can close them." }, { main: "No Clear Path to Scale", sub: "You know there's more potential, but without systems in place, growing means more chaos—not more profit." }] } },
    { id: 4, type: "not-agency", content: { title: "What We're NOT", points: ["A marketing agency that disappears after setup", "Selling you leads with zero follow-up system", "A one-size-fits-all cookie-cutter solution", "Taking your money without accountability for results"], bottom: "We're a growth partner. Everything is customized to your fleet, your market, and your goals." } },
    { id: 5, type: "solution-intro", content: { label: "YOUR CUSTOM SYSTEM", title: "A Modular Growth Engine", subtitle: "Every piece tailored to your specific needs", pillars: [{ icon: "target", name: "Ads", desc: "Attract" }, { icon: "funnel", name: "Funnel", desc: "Capture" }, { icon: "robot", name: "AI", desc: "Nurture" }, { icon: "calendar", name: "Book", desc: "Close" }] } },
    { id: 6, type: "demo-ads", content: { label: "LIVE WALKTHROUGH", title: "The Ads", subtitle: "Customized for your market", points: ["Platform selection based on where YOUR customers are", "Creative built around YOUR fleet and brand", "Targeting refined for YOUR local market", "Budget optimized for YOUR goals"], cta: "Let me show you real examples..." } },
    { id: 7, type: "demo-funnel", content: { label: "LIVE WALKTHROUGH", title: "The Funnel", subtitle: "Built around your business", points: ["Landing pages featuring YOUR vehicles", "Lead capture tailored to YOUR booking process", "Mobile-first for 80%+ of traffic", "Speed-to-lead that beats competition"], cta: "Let me show you a live funnel..." } },
    { id: 8, type: "demo-ai", content: { label: "LIVE WALKTHROUGH", title: "The AI Agent", subtitle: "Trained on your fleet", points: ["Knows YOUR vehicles, pricing, and policies", "Responds in under 60 seconds, 24/7", "Qualifies leads based on YOUR criteria", "Follows up until they convert"], cta: "Let me demonstrate..." } },
    { id: 9, type: "demo-crm", content: { label: "LIVE WALKTHROUGH", title: "Your Command Center", subtitle: "Everything in one place", points: ["Every lead tracked from click to booking", "See exactly where each prospect is in your pipeline", "Automated sequences run in the background", "Real-time metrics show what's working"] } },
    { id: 10, type: "case-study-intro", content: { label: "REAL RESULTS", title: "Case Study", subtitle: "Let me show you what this looks like in action..." } },
    { id: 11, type: "case-study-before", content: { label: "THE BEFORE", title: "Where They Started", placeholder: "Share the client's starting point here" } },
    { id: 12, type: "case-study-after", content: { label: "THE AFTER", title: "Where They Are Now", placeholder: "Share the results and transformation here" } },
    { id: 13, type: "comparison", content: { title: "Two Paths Forward", left: { label: "DIY", points: ["Trial and error marketing", "Build systems from scratch", "Manual follow-up (when you remember)", "Hope for the best"] }, right: { label: "WITH SCALE EXOTICS", points: ["Proven strategies customized to you", "Done-for-you systems built for YOUR fleet", "AI handles follow-up 24/7", "Predictable, scalable growth"] } } },
    { id: 14, type: "included", content: { label: "EVERYTHING YOU GET", title: "Your Complete System", subtitle: "Each component built specifically for your business" } },
    { id: 15, type: "guarantee", content: { title: "The Guarantee", main: "Qualified leads in 30 days or you get a full credit.", sub: "We've done this before. Multiple times. We're confident it works." } },
    { id: 16, type: "investment", content: { label: "INVESTMENT", title: "Two Options", options: [{ name: "Performance", price: "$125", unit: "per booking", desc: "Pay only when you win", highlight: false, details: ["No monthly retainer", "Pay per completed booking", "Full system access", "Cancel anytime"] }, { name: "Growth", price: "$1,500", unit: "per month", desc: "Unlimited scale potential", highlight: true, details: ["Flat monthly fee", "Unlimited bookings", "Priority support", "Dedicated account manager"] }], note: "Ad spend is separate. We recommend starting at $50-100/day." } },
    { id: 17, type: "timeline", content: { label: "GETTING STARTED", title: "Your Path Forward", steps: [{ num: "1", title: "Onboarding Call", desc: "30 min deep-dive" }, { num: "2", title: "System Setup", desc: "3-5 business days" }, { num: "3", title: "Launch", desc: "Ads go live" }, { num: "4", title: "Optimize", desc: "Weekly improvements" }] } },
    { id: 18, type: "deposit", content: { title: "Need to Think It Over?", subtitle: "Totally understand.", main: "Reserve your spot with a $100 fully refundable deposit.", details: ["Holds your onboarding slot for 7 days", "100% refundable if you decide it's not for you", "Applied to your first invoice if you move forward"], cta: "No pressure. No risk." } },
    { id: 19, type: "final", content: { title: "Let's Build Your Growth Engine", subtitle: "Questions?", cta: "I'm here to help." } }
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
      setSlideDirection('next')
      setCurrentSlide(prev => prev + 1)
      setTimeout(() => setIsAnimating(false), 300)
    }
  }, [currentSlide, slides.length, isAnimating])

  const prevSlide = useCallback(() => {
    if (currentSlide > 0 && !isAnimating) {
      setIsAnimating(true)
      setSlideDirection('prev')
      setCurrentSlide(prev => prev - 1)
      setTimeout(() => setIsAnimating(false), 300)
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
      // HERO - Centered with gradient mesh background, no duplicate logo
      case "hero":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#375DEE]/20 via-transparent to-[#375DEE]/10" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#375DEE]/15 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#375DEE]/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#375DEE]/5 rounded-full blur-[80px]" />
            <div className="relative z-10 flex flex-col items-center">
              <h1 className="text-8xl md:text-9xl font-bold mb-4 tracking-tighter fade-up" style={{ fontFamily: 'var(--font-display)' }}>
                {content.title}
              </h1>
              <p className="text-4xl md:text-5xl text-[#375DEE] font-medium mb-8 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>
                {content.subtitle}
              </p>
              <p className="text-xl text-white/50 max-w-2xl fade-up delay-2">{content.tagline}</p>
            </div>
          </div>
        )

      // AGENDA - Fixed timeline below cards
      case "agenda":
        return (
          <div className="h-full flex flex-col justify-center px-20">
            <h2 className="text-7xl font-bold mb-16 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="flex justify-between items-start max-w-5xl">
              {content.items.map((item: string, i: number) => (
                <div key={i} className={`flex flex-col items-center fade-up delay-${i + 1}`} style={{ width: '200px' }}>
                  <div className="w-24 h-24 rounded-2xl bg-[#375DEE] flex items-center justify-center mb-6">
                    <span className="text-4xl font-bold text-white">{i + 1}</span>
                  </div>
                  <p className="text-xl text-center text-white/80 leading-tight">{item}</p>
                </div>
              ))}
            </div>
            <div className="max-w-5xl mt-8 px-12">
              <div className="h-1 bg-gradient-to-r from-[#375DEE] via-[#375DEE]/50 to-[#375DEE]/20 rounded-full" />
            </div>
          </div>
        )

      // PROBLEM - No red, clean cards with detailed pain points
      case "problem":
        return (
          <div className="h-full flex flex-col justify-center px-16">
            <h2 className="text-6xl font-bold mb-12 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="grid grid-cols-2 gap-6">
              {content.points.map((point: any, i: number) => (
                <div key={i} className={`p-8 bg-white/5 rounded-2xl border border-white/10 fade-up delay-${i + 1}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#375DEE]/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-[#375DEE] font-bold">{i + 1}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">{point.main}</h3>
                  </div>
                  <p className="text-base text-white/50 leading-relaxed pl-14">{point.sub}</p>
                </div>
              ))}
            </div>
          </div>
        )

      // NOT AGENCY - Vertical stack with customization emphasis
      case "not-agency":
        return (
          <div className="h-full flex flex-col justify-center px-20">
            <h2 className="text-6xl font-bold mb-12 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="space-y-4 mb-12 max-w-4xl">
              {content.points.map((point: string, i: number) => (
                <div key={i} className={`flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-xl fade-up delay-${i + 1}`}>
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-xl text-white/70">{point}</p>
                </div>
              ))}
            </div>
            <div className="py-10 px-12 bg-[#375DEE]/10 rounded-2xl border border-[#375DEE]/30 max-w-4xl fade-up delay-5">
              <p className="text-3xl text-[#375DEE] font-semibold text-center" style={{ fontFamily: 'var(--font-display)' }}>{content.bottom}</p>
            </div>
          </div>
        )

      // SOLUTION INTRO - With customization messaging
      case "solution-intro":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <span className="text-[#375DEE] text-base tracking-widest mb-4 fade-up">{content.label}</span>
            <h2 className="text-6xl font-bold mb-4 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <p className="text-xl text-white/50 mb-20 fade-up delay-2">{content.subtitle}</p>
            <div className="flex items-center gap-6">
              {content.pillars.map((pillar: any, i: number) => (
                <div key={i} className="flex items-center">
                  <div className={`flex flex-col items-center fade-up delay-${i + 3}`}>
                    <div className="w-36 h-36 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                      {pillar.icon === "target" && <svg className="w-16 h-16 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.5} /><circle cx="12" cy="12" r="6" strokeWidth={1.5} /><circle cx="12" cy="12" r="2" strokeWidth={1.5} /></svg>}
                      {pillar.icon === "funnel" && <svg className="w-16 h-16 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>}
                      {pillar.icon === "robot" && <svg className="w-16 h-16 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                      {pillar.icon === "calendar" && <svg className="w-16 h-16 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    </div>
                    <p className="text-2xl font-bold text-white">{pillar.name}</p>
                    <p className="text-base text-white/40">{pillar.desc}</p>
                  </div>
                  {i < content.pillars.length - 1 && (
                    <svg className="w-10 h-10 text-[#375DEE]/50 mx-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      // DEMO ADS - With customization emphasis
      case "demo-ads":
        return (
          <div className="h-full grid grid-cols-5 gap-0">
            <div className="col-span-3 flex flex-col justify-center px-16">
              <span className="text-[#375DEE] text-sm tracking-widest mb-2 fade-up">{content.label}</span>
              <h2 className="text-5xl font-bold mb-2 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              <p className="text-lg text-white/40 mb-8 fade-up delay-2">{content.subtitle}</p>
              <div className="space-y-4 mb-8">
                {content.points.map((point: string, i: number) => (
                  <div key={i} className={`flex items-center gap-3 fade-up delay-${i + 3}`}>
                    <div className="w-2 h-2 rounded-full bg-[#375DEE]" />
                    <p className="text-xl text-white/70">{point}</p>
                  </div>
                ))}
              </div>
              <p className="text-lg text-[#375DEE] font-medium fade-up delay-7">{content.cta}</p>
            </div>
            <div className="col-span-2 flex items-center justify-center bg-gradient-to-bl from-[#375DEE]/10 to-transparent">
              <div className="w-64 h-[500px] bg-black rounded-[3rem] border-4 border-white/20 p-2 fade-up delay-3">
                <div className="w-full h-full bg-gradient-to-b from-[#375DEE]/20 to-[#375DEE]/5 rounded-[2.5rem] flex flex-col items-center justify-center">
                  <svg className="w-16 h-16 text-[#375DEE]/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-white/30 text-sm">Ad Preview</p>
                </div>
              </div>
            </div>
          </div>
        )

      // DEMO FUNNEL - With customization emphasis
      case "demo-funnel":
        return (
          <div className="h-full grid grid-cols-2 gap-0">
            <div className="flex items-center justify-center bg-gradient-to-r from-transparent to-[#375DEE]/5">
              <div className="relative fade-up delay-2">
                <div className="w-80 h-20 bg-[#375DEE]/30 rounded-t-lg flex items-center justify-center border border-[#375DEE]/40">
                  <span className="text-white/60 text-sm">Traffic</span>
                </div>
                <div className="w-64 h-20 bg-[#375DEE]/25 mx-auto flex items-center justify-center border-x border-[#375DEE]/30">
                  <span className="text-white/60 text-sm">Landing Page</span>
                </div>
                <div className="w-48 h-20 bg-[#375DEE]/20 mx-auto flex items-center justify-center border-x border-[#375DEE]/25">
                  <span className="text-white/60 text-sm">Lead Capture</span>
                </div>
                <div className="w-32 h-20 bg-[#375DEE]/40 mx-auto rounded-b-lg flex items-center justify-center border border-[#375DEE]/50">
                  <span className="text-white font-bold text-sm">Booking</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center px-12">
              <span className="text-[#375DEE] text-sm tracking-widest mb-2 fade-up">{content.label}</span>
              <h2 className="text-5xl font-bold mb-2 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              <p className="text-lg text-white/40 mb-8 fade-up delay-2">{content.subtitle}</p>
              <div className="space-y-4 mb-8">
                {content.points.map((point: string, i: number) => (
                  <div key={i} className={`flex items-start gap-3 fade-up delay-${i + 3}`}>
                    <svg className="w-6 h-6 text-[#375DEE] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-lg text-white/70">{point}</p>
                  </div>
                ))}
              </div>
              <p className="text-lg text-[#375DEE] font-medium fade-up delay-7">{content.cta}</p>
            </div>
          </div>
        )

      // DEMO AI - With customization emphasis
      case "demo-ai":
        return (
          <div className="h-full grid grid-cols-2 gap-0">
            <div className="flex flex-col justify-center px-16">
              <span className="text-[#375DEE] text-sm tracking-widest mb-2 fade-up">{content.label}</span>
              <h2 className="text-5xl font-bold mb-2 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              <p className="text-lg text-white/40 mb-8 fade-up delay-2">{content.subtitle}</p>
              <div className="space-y-4 mb-8">
                {content.points.map((point: string, i: number) => (
                  <div key={i} className={`flex items-start gap-3 fade-up delay-${i + 3}`}>
                    <svg className="w-6 h-6 text-[#375DEE] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-lg text-white/70">{point}</p>
                  </div>
                ))}
              </div>
              <p className="text-lg text-[#375DEE] font-medium fade-up delay-7">{content.cta}</p>
            </div>
            <div className="flex items-center justify-center bg-gradient-to-l from-transparent to-[#375DEE]/5 px-8">
              <div className="w-full max-w-md space-y-4 fade-up delay-3">
                <div className="flex justify-end"><div className="bg-[#375DEE] rounded-2xl rounded-br-sm px-5 py-3 max-w-[80%]"><p className="text-white text-sm">Hi, I'm interested in renting a Lamborghini this weekend</p></div></div>
                <div className="flex justify-start"><div className="bg-white/10 rounded-2xl rounded-bl-sm px-5 py-3 max-w-[80%]"><p className="text-white/80 text-sm">Hey! Great choice. We have a Huracán available Saturday-Sunday. $1,500/day with 100 miles included. Want me to check exact times?</p></div></div>
                <div className="flex justify-end"><div className="bg-[#375DEE] rounded-2xl rounded-br-sm px-5 py-3 max-w-[80%]"><p className="text-white text-sm">Yes, Saturday 10am - Sunday 10am</p></div></div>
                <div className="flex justify-start"><div className="bg-white/10 rounded-2xl rounded-bl-sm px-5 py-3 max-w-[80%]"><p className="text-white/80 text-sm">Perfect, it's available! I can send you a booking link right now. Just need your email.</p></div></div>
              </div>
            </div>
          </div>
        )

      // DEMO CRM
      case "demo-crm":
        return (
          <div className="h-full flex flex-col justify-center px-20">
            <span className="text-[#375DEE] text-sm tracking-widest mb-2 fade-up">{content.label}</span>
            <h2 className="text-5xl font-bold mb-3 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <p className="text-xl text-white/40 mb-12 fade-up delay-2">{content.subtitle}</p>
            <div className="grid grid-cols-2 gap-6 max-w-5xl">
              {content.points.map((point: string, i: number) => (
                <div key={i} className={`flex items-start gap-4 p-6 bg-white/5 rounded-xl border border-white/10 fade-up delay-${i + 3}`}>
                  <div className="w-10 h-10 rounded-lg bg-[#375DEE]/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg text-white/70 pt-2">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )

      // CASE STUDY INTRO
      case "case-study-intro":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#375DEE]/10 via-transparent to-transparent" />
            <div className="relative z-10">
              <span className="text-[#375DEE] text-base tracking-widest mb-6 block fade-up">{content.label}</span>
              <h2 className="text-8xl font-bold mb-8 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              <p className="text-2xl text-white/50 fade-up delay-2">{content.subtitle}</p>
            </div>
          </div>
        )

      // CASE STUDY BEFORE
      case "case-study-before":
        return (
          <div className="h-full flex flex-col justify-center px-20">
            <span className="text-white/30 text-sm tracking-widest mb-4 fade-up">{content.label}</span>
            <h2 className="text-6xl font-bold mb-12 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 max-w-4xl fade-up delay-2">
              <p className="text-2xl text-white/40 italic">{content.placeholder}</p>
            </div>
          </div>
        )

      // CASE STUDY AFTER
      case "case-study-after":
        return (
          <div className="h-full flex flex-col justify-center px-20">
            <span className="text-[#375DEE] text-sm tracking-widest mb-4 fade-up">{content.label}</span>
            <h2 className="text-6xl font-bold mb-12 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="bg-[#375DEE]/10 border border-[#375DEE]/30 rounded-2xl p-12 max-w-4xl fade-up delay-2">
              <p className="text-2xl text-white/40 italic">{content.placeholder}</p>
            </div>
          </div>
        )

      // COMPARISON - With customization emphasis
      case "comparison":
        return (
          <div className="h-full flex flex-col justify-center px-16">
            <h2 className="text-6xl font-bold mb-16 text-center fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="flex items-stretch gap-0 max-w-5xl mx-auto">
              <div className="flex-1 p-10 bg-white/5 rounded-l-3xl border border-white/10 border-r-0 fade-up delay-1">
                <p className="text-sm text-white/30 tracking-widest mb-8 text-center">{content.left.label}</p>
                <div className="space-y-4">
                  {content.left.points.map((point: string, i: number) => (
                    <div key={i} className="flex items-center gap-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <span className="text-white/20">—</span>
                      </div>
                      <p className="text-lg text-white/40">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center bg-gradient-to-r from-white/5 to-[#375DEE]/10 px-8 fade-up delay-2">
                <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center border-4 border-[#375DEE]">
                  <span className="text-2xl font-bold text-[#375DEE]">VS</span>
                </div>
              </div>
              <div className="flex-1 p-10 bg-[#375DEE]/10 rounded-r-3xl border-2 border-[#375DEE] fade-up delay-3">
                <p className="text-sm text-[#375DEE] tracking-widest mb-8 text-center">{content.right.label}</p>
                <div className="space-y-4">
                  {content.right.points.map((point: string, i: number) => (
                    <div key={i} className="flex items-center gap-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-[#375DEE]/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <p className="text-lg text-white">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      // INCLUDED - Completely redesigned for clarity
      case "included":
        return (
          <div className="h-full flex flex-col justify-center px-20">
            <span className="text-[#375DEE] text-sm tracking-widest mb-4 fade-up">{content.label}</span>
            <h2 className="text-6xl font-bold mb-3 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <p className="text-xl text-white/40 mb-12 fade-up delay-2">{content.subtitle}</p>

            <div className="grid grid-cols-2 gap-x-16 gap-y-6 max-w-5xl">
              <div className="flex items-center gap-4 fade-up delay-3">
                <div className="w-14 h-14 rounded-xl bg-[#375DEE] flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.5} /><circle cx="12" cy="12" r="3" strokeWidth={1.5} /></svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">Custom Ad Campaigns</p>
                  <p className="text-sm text-white/40">Built for your market</p>
                </div>
              </div>

              <div className="flex items-center gap-4 fade-up delay-3">
                <div className="w-14 h-14 rounded-xl bg-[#375DEE] flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" /></svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">Landing Pages</p>
                  <p className="text-sm text-white/40">High-converting designs</p>
                </div>
              </div>

              <div className="flex items-center gap-4 fade-up delay-4">
                <div className="w-14 h-14 rounded-xl bg-[#375DEE] flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">AI Chatbot</p>
                  <p className="text-sm text-white/40">24/7 instant response</p>
                </div>
              </div>

              <div className="flex items-center gap-4 fade-up delay-4">
                <div className="w-14 h-14 rounded-xl bg-[#375DEE] flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">SMS Sequences</p>
                  <p className="text-sm text-white/40">Automated follow-up</p>
                </div>
              </div>

              <div className="flex items-center gap-4 fade-up delay-5">
                <div className="w-14 h-14 rounded-xl bg-[#375DEE] flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">Email Automation</p>
                  <p className="text-sm text-white/40">Nurture on autopilot</p>
                </div>
              </div>

              <div className="flex items-center gap-4 fade-up delay-5">
                <div className="w-14 h-14 rounded-xl bg-[#375DEE] flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">Full CRM Access</p>
                  <p className="text-sm text-white/40">Track everything</p>
                </div>
              </div>

              <div className="flex items-center gap-4 fade-up delay-6">
                <div className="w-14 h-14 rounded-xl bg-[#375DEE] flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">Performance Dashboard</p>
                  <p className="text-sm text-white/40">Real-time metrics</p>
                </div>
              </div>

              <div className="flex items-center gap-4 fade-up delay-6">
                <div className="w-14 h-14 rounded-xl bg-[#375DEE] flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">Strategy Calls</p>
                  <p className="text-sm text-white/40">Ongoing optimization</p>
                </div>
              </div>
            </div>
          </div>
        )

      // GUARANTEE - Bigger
      case "guarantee":
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-4xl">
              <div className="w-40 h-40 mx-auto mb-10 fade-up">
                <svg className="w-full h-full text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-6xl font-bold mb-10 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              <p className="text-4xl text-white mb-6 leading-relaxed fade-up delay-2">{content.main}</p>
              <p className="text-2xl text-white/40 fade-up delay-3">{content.sub}</p>
            </div>
          </div>
        )

      // INVESTMENT - Much bigger containers with full details
      case "investment":
        return (
          <div className="h-full flex flex-col justify-center px-12">
            <span className="text-[#375DEE] text-sm tracking-widest mb-4 text-center fade-up">{content.label}</span>
            <h2 className="text-6xl font-bold mb-12 text-center fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="flex gap-8 justify-center mb-8">
              {content.options.map((option: any, i: number) => (
                <div key={i} className={`w-[420px] p-10 rounded-3xl ${option.highlight ? 'bg-[#375DEE] scale-105' : 'bg-white/5 border border-white/10'} fade-up delay-${i + 2}`}>
                  {option.highlight && <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-sm font-bold text-white mb-6">RECOMMENDED</span>}
                  <h3 className={`text-4xl font-bold mb-2 ${option.highlight ? 'text-white' : 'text-white'}`} style={{ fontFamily: 'var(--font-display)' }}>{option.name}</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className={`text-5xl font-bold ${option.highlight ? 'text-white' : 'text-[#375DEE]'}`}>{option.price}</span>
                    <span className={`text-xl ${option.highlight ? 'text-white/70' : 'text-white/40'}`}>{option.unit}</span>
                  </div>
                  <p className={`text-lg mb-8 ${option.highlight ? 'text-white/70' : 'text-white/40'}`}>{option.desc}</p>
                  <div className="space-y-4">
                    {option.details.map((detail: string, j: number) => (
                      <div key={j} className="flex items-center gap-3">
                        <svg className={`w-6 h-6 ${option.highlight ? 'text-white' : 'text-[#375DEE]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <p className={`text-lg ${option.highlight ? 'text-white/90' : 'text-white/60'}`}>{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-white/30 text-base fade-up delay-4">{content.note}</p>
          </div>
        )

      // TIMELINE - Fixed, line below cards
      case "timeline":
        return (
          <div className="h-full flex flex-col justify-center px-16">
            <span className="text-[#375DEE] text-sm tracking-widest mb-4 fade-up">{content.label}</span>
            <h2 className="text-6xl font-bold mb-16 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="max-w-5xl mx-auto w-full">
              <div className="flex justify-between mb-6">
                {content.steps.map((step: any, i: number) => (
                  <div key={i} className={`flex flex-col items-center fade-up delay-${i + 2}`} style={{ width: '180px' }}>
                    <div className="w-28 h-28 rounded-2xl bg-[#375DEE] flex items-center justify-center mb-4">
                      <span className="text-4xl font-bold text-white">{step.num}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 text-center">{step.title}</h3>
                    <p className="text-sm text-white/40 text-center">{step.desc}</p>
                  </div>
                ))}
              </div>
              <div className="px-14">
                <div className="h-2 bg-gradient-to-r from-[#375DEE] via-[#375DEE]/70 to-[#375DEE]/30 rounded-full" />
              </div>
            </div>
          </div>
        )

      // DEPOSIT - New slide for prospects who need to think
      case "deposit":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <h2 className="text-6xl font-bold mb-4 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <p className="text-2xl text-white/50 mb-12 fade-up delay-1">{content.subtitle}</p>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-12 max-w-2xl mb-8 fade-up delay-2">
              <p className="text-4xl font-bold text-[#375DEE] mb-8" style={{ fontFamily: 'var(--font-display)' }}>{content.main}</p>
              <div className="space-y-4">
                {content.details.map((detail: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 justify-center">
                    <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-lg text-white/70">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xl text-white/40 fade-up delay-3">{content.cta}</p>
          </div>
        )

      // FINAL - Minimal powerful CTA
      case "final":
        return (
          <div className="h-full flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[#375DEE]/20 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#375DEE]/10 rounded-t-full blur-[100px]" />
            <div className="relative z-10 text-center">
              <img src={LOGO_URL} alt="Scale Exotics" className="h-16 w-auto mx-auto mb-12 fade-up" />
              <h2 className="text-6xl font-bold mb-6 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              <p className="text-2xl text-white/50 mb-10 fade-up delay-2">{content.subtitle}</p>
              <p className="text-4xl text-[#375DEE] font-bold fade-up delay-3" style={{ fontFamily: 'var(--font-display)' }}>{content.cta}</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const animationStyles = `
    @keyframes fadeUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes slideInLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
    .fade-up { animation: fadeUp 0.3s ease-out both; }
    .slide-in-right { animation: slideInRight 0.25s ease-out both; }
    .slide-in-left { animation: slideInLeft 0.25s ease-out both; }
    .delay-1 { animation-delay: 0.03s; } .delay-2 { animation-delay: 0.06s; } .delay-3 { animation-delay: 0.09s; }
    .delay-4 { animation-delay: 0.12s; } .delay-5 { animation-delay: 0.15s; } .delay-6 { animation-delay: 0.18s; } .delay-7 { animation-delay: 0.21s; }
  `

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center px-4" style={{ fontFamily: 'var(--font-sans)' }}>
        <style>{animationStyles}</style>
        <div className="w-full max-w-md fade-up">
          <div className="text-center mb-12">
            <img src={LOGO_URL} alt="Scale Exotics" className="h-12 w-auto mx-auto mb-8" />
            <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>Demo Access</h1>
            <p className="text-lg text-white/50">Enter password to continue</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-5 py-4 rounded-xl bg-white/5 border ${error ? 'border-red-500' : 'border-white/20'} text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors`} />
            {error && <p className="text-red-400">{error}</p>}
            <button type="submit" className="w-full py-4 bg-[#375DEE] hover:bg-[#4169E1] text-white text-lg font-semibold rounded-xl transition-colors" style={{ fontFamily: 'var(--font-display)' }}>Enter</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black text-white overflow-hidden" style={{ fontFamily: 'var(--font-sans)' }}>
      <style>{animationStyles}</style>
      <div className="fixed top-6 left-6 z-50"><img src={LOGO_URL} alt="Scale Exotics" className="h-8 w-auto opacity-60" /></div>
      <main className="h-full">
        <div key={currentSlide} className={`h-full ${slideDirection === 'next' ? 'slide-in-right' : 'slide-in-left'}`}>
          {renderSlide(slides[currentSlide])}
        </div>
      </main>
    </div>
  )
}
