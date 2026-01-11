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
    // SECTION 1: INTRO + SOCIAL PROOF
    { id: 1, section: "intro", type: "hero", content: {
      title: "Scale Exotics",
      subtitle: "Your Growth Partner",
      tagline: "The proven system that fills your fleet with premium bookings—on autopilot."
    }},
    { id: 2, section: "intro", type: "social-proof", content: {
      title: "Trusted by Fleet Owners Like You",
      stats: [
        { value: "$2.4M+", label: "Revenue Generated", detail: "for our partners" },
        { value: "47", label: "Fleet Owners", detail: "currently scaling" },
        { value: "12,000+", label: "Bookings Closed", detail: "through our system" }
      ],
      quote: "We went from scrambling for bookings to turning people away. Scale Exotics changed everything.",
      author: "Miami Fleet Owner"
    }},
    { id: 3, section: "intro", type: "agenda", content: {
      title: "What We'll Cover",
      items: [
        { num: "01", title: "The Problem", desc: "Why most rentals plateau" },
        { num: "02", title: "The Solution", desc: "Our proven system" },
        { num: "03", title: "Live Demo", desc: "See it in action" },
        { num: "04", title: "Your Next Step", desc: "How to get started" }
      ]
    }},

    // SECTION 2: THE PROBLEM (Create urgency)
    { id: 4, section: "problem", type: "section-header", content: {
      number: "01",
      title: "The Problem",
      subtitle: "Why talented fleet owners stay stuck"
    }},
    { id: 5, section: "problem", type: "daily-chaos", content: {
      title: "Your Day-to-Day Right Now",
      morning: {
        label: "Morning",
        items: [
          "Wake up to 14 unread DMs across 3 platforms",
          "3 of them are \"just looking\" or asking for free photoshoots",
          "One serious lead messaged at 2am—already booked elsewhere"
        ]
      },
      afternoon: {
        label: "Afternoon",
        items: [
          "Spend 2 hours going back and forth with a tire-kicker",
          "They ghost after you send the deposit link",
          "Meanwhile, your cars are sitting in the garage"
        ]
      },
      evening: {
        label: "Evening",
        items: [
          "Finally close a booking—but it took 47 messages",
          "Realize you forgot to follow up with 5 other leads",
          "Too exhausted to respond to the new inquiries coming in"
        ]
      }
    }},
    { id: 6, section: "problem", type: "real-problems", content: {
      title: "The Real Problems Nobody Talks About",
      problems: [
        { main: "Leads Are Scattered Everywhere", sub: "Instagram DMs. Facebook messages. Website forms. Turo inquiries. Text messages. Phone calls. You're checking 6 different places and still missing people." },
        { main: "You Can't Respond Fast Enough", sub: "You have a life. You sleep. You're detailing a car. By the time you see that message, they've already booked with your competitor who responded in 5 minutes." },
        { main: "Tire-Kickers Drain Your Energy", sub: "For every real customer, there are 10 people who want to \"just look,\" ask a million questions, then disappear. You can't tell who's serious until you've wasted an hour on them." },
        { main: "No Way to Track Anything", sub: "Who did you quote last week? Who needs a follow-up? Which leads went cold? It's all in your head, scattered notes, or buried in message threads." }
      ]
    }},
    { id: 7, section: "problem", type: "brutal-truth", content: {
      title: "The Bottom Line",
      main: "You didn't start this business to answer DMs all day.",
      sub: "But right now, you're spending more time chasing leads than actually growing your fleet.",
      points: [
        "Every hour spent chasing leads is an hour not growing your business",
        "Every slow response is a booking going to your competition",
        "Every missed follow-up is money walking out the door"
      ],
      closing: "There's a better way."
    }},

    // SECTION 3: THE SOLUTION
    { id: 8, section: "solution", type: "section-header", content: {
      number: "02",
      title: "The Solution",
      subtitle: "What the top 1% of fleet owners do differently"
    }},
    { id: 9, section: "solution", type: "solution-intro", content: {
      label: "INTRODUCING",
      title: "A Complete Growth Engine",
      subtitle: "Built specifically for exotic car rentals",
      highlight: "Everything you need. Nothing you don't."
    }},
    { id: 10, section: "solution", type: "differentiator", content: {
      title: "This Isn't Another Marketing Agency",
      antiPoints: [
        "Agencies that disappear after setup",
        "Generic leads with zero follow-up",
        "Cookie-cutter campaigns that don't convert",
        "Long contracts with no accountability"
      ],
      proTitle: "This Is a Growth Partnership",
      proPoints: [
        "Done-for-you systems built for YOUR fleet",
        "24/7 AI that knows your vehicles and pricing",
        "Real-time dashboard so you always know what's working",
        "We only win when you win"
      ]
    }},

    // SECTION 4: DEEP DIVE (Live Demo)
    { id: 11, section: "demo", type: "section-header", content: {
      number: "03",
      title: "Live Demo",
      subtitle: "Let me show you exactly how it works"
    }},
    { id: 12, section: "demo", type: "system-overview", content: {
      title: "The Four Pillars of Predictable Growth",
      subtitle: "Each piece works together to create a booking machine.",
      pillars: [
        { icon: "target", name: "Attract", module: "Paid Ads", desc: "Bring qualified traffic" },
        { icon: "funnel", name: "Capture", module: "Landing Pages", desc: "Convert visitors to leads" },
        { icon: "robot", name: "Nurture", module: "AI Assistant", desc: "Engage & qualify 24/7" },
        { icon: "calendar", name: "Convert", module: "CRM + Booking", desc: "Close & manage deals" }
      ]
    }},
    { id: 13, section: "demo", type: "module-detail", content: {
      moduleNum: "01",
      moduleName: "Paid Advertising",
      tagline: "Stop wasting money on ads that don't convert",
      features: [
        "Custom audiences built around YOUR ideal customer",
        "Platform selection based on where YOUR renters actually are",
        "Creative that showcases YOUR fleet and brand",
        "Weekly optimization based on real performance data"
      ],
      visual: "ads",
      result: "Average 4.2x ROAS for our partners"
    }},
    { id: 14, section: "demo", type: "module-detail", content: {
      moduleNum: "02",
      moduleName: "High-Converting Funnels",
      tagline: "Turn clicks into qualified leads",
      features: [
        "Landing pages featuring YOUR vehicles and pricing",
        "Mobile-first design (because 80%+ of traffic is mobile)",
        "Lightning-fast load times for better ad performance",
        "Lead capture optimized for YOUR booking process"
      ],
      visual: "funnel",
      result: "2-3x higher conversion than generic pages"
    }},
    { id: 15, section: "demo", type: "module-detail", content: {
      moduleNum: "03",
      moduleName: "AI Booking Assistant",
      tagline: "Never miss another lead—even at 3am",
      features: [
        "Trained on YOUR fleet, pricing, policies, and FAQs",
        "Responds in under 60 seconds, 24 hours a day",
        "Qualifies leads based on YOUR criteria",
        "Follows up automatically until they book or say no"
      ],
      visual: "chat",
      result: "85% of leads engaged within 60 seconds"
    }},
    { id: 16, section: "demo", type: "module-detail", content: {
      moduleNum: "04",
      moduleName: "Your Command Center",
      tagline: "See everything. Control everything.",
      features: [
        "Track every lead from first click to completed booking",
        "Visual pipeline shows exactly where each prospect is",
        "Automated email and SMS sequences run in the background",
        "Real-time metrics so you know what's working"
      ],
      visual: "dashboard",
      result: "Full visibility into your entire operation"
    }},

    // SECTION 5: RESULTS & PROOF
    { id: 17, section: "results", type: "section-header", content: {
      number: "04",
      title: "Real Results",
      subtitle: "What this actually looks like"
    }},
    { id: 18, section: "results", type: "case-study", content: {
      label: "CASE STUDY",
      title: "From $18K to $67K Months",
      before: {
        title: "Before Scale Exotics",
        points: ["Inconsistent $15-20K months", "Spending $3K/month on ads with no tracking", "Responding to leads 2-4 hours later", "Managing everything in spreadsheets and DMs"]
      },
      after: {
        title: "After 90 Days",
        points: ["Consistent $60-70K months", "4.1x return on every ad dollar", "Every lead responded to in under 60 seconds", "Complete visibility into pipeline and revenue"]
      }
    }},
    { id: 19, section: "results", type: "testimonials", content: {
      title: "What Fleet Owners Are Saying",
      testimonials: [
        { quote: "I was skeptical at first—I'd been burned by agencies before. But within 30 days, I had more qualified leads than I knew what to do with.", author: "Alex R.", location: "Los Angeles, CA" },
        { quote: "The AI assistant is a game-changer. I woke up to 3 bookings last Tuesday. All closed while I was sleeping.", author: "Marcus T.", location: "Miami, FL" },
        { quote: "Finally, a team that actually understands the exotic rental business. They speak our language.", author: "David K.", location: "Las Vegas, NV" }
      ]
    }},
    { id: 20, section: "results", type: "guarantee", content: {
      title: "The Guarantee",
      main: "Qualified leads in 30 days—or your money back.",
      sub: "We've done this 47 times. We know it works. That's why we guarantee it.",
      details: ["No long-term contracts", "Cancel anytime", "100% money-back guarantee"]
    }},

    // SECTION 6: INVESTMENT & NEXT STEPS
    { id: 21, section: "close", type: "section-header", content: {
      number: "05",
      title: "Investment",
      subtitle: "Two ways to get started"
    }},
    { id: 22, section: "close", type: "pricing", content: {
      title: "Choose Your Path",
      options: [
        {
          name: "Performance",
          price: "$125",
          unit: "per booking",
          desc: "Pay only when you win",
          highlight: false,
          details: ["No monthly retainer", "Pay per completed booking", "Full system access", "All features included", "Cancel anytime"],
          best: "Best for: Getting started risk-free"
        },
        {
          name: "Growth",
          price: "$1,500",
          unit: "per month",
          desc: "Unlimited scale potential",
          highlight: true,
          details: ["Flat monthly fee", "Unlimited bookings", "Priority support", "Weekly strategy calls", "Dedicated account manager"],
          best: "Best for: Serious scaling"
        }
      ],
      note: "Ad spend is separate and managed transparently. Recommended starting budget: $50-100/day."
    }},
    { id: 23, section: "close", type: "timeline", content: {
      title: "Here's What Happens Next",
      steps: [
        { num: "1", title: "Strategy Call", desc: "We map out your growth plan", time: "Today" },
        { num: "2", title: "Custom Build", desc: "We build your entire system", time: "3-5 days" },
        { num: "3", title: "Launch", desc: "Ads go live, leads start flowing", time: "Week 1" },
        { num: "4", title: "Scale", desc: "We optimize and you grow", time: "Ongoing" }
      ]
    }},
    { id: 24, section: "close", type: "urgency", content: {
      title: "Why Now?",
      points: [
        { icon: "calendar", text: "Peak season is coming—get your system running before the rush" },
        { icon: "users", text: "We only take on 5 new partners per month to ensure quality" },
        { icon: "clock", text: "Every day without this system is bookings going to competitors" }
      ],
      cta: "The best time to start was 6 months ago. The second best time is today."
    }},
    { id: 25, section: "close", type: "deposit", content: {
      title: "Not Ready to Decide Today?",
      subtitle: "No problem.",
      main: "$100 fully refundable deposit",
      details: [
        "Holds your onboarding slot for 7 days",
        "100% refundable if you decide it's not for you",
        "Applied to your first invoice if you move forward"
      ],
      cta: "Zero risk. Just keeps your spot warm."
    }},
    { id: 26, section: "close", type: "final", content: {
      title: "Let's Build Your Empire",
      subtitle: "You've got the fleet. We've got the system. Let's make it happen.",
      cta: "Ready when you are."
    }}
  ]

  const sections = ["intro", "problem", "solution", "demo", "results", "close"]
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

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1 && !isAnimating) {
      setIsAnimating(true)
      setSlideDirection('next')
      setCurrentSlide(prev => prev + 1)
      setTimeout(() => setIsAnimating(false), 400)
    }
  }, [currentSlide, slides.length, isAnimating])

  const prevSlide = useCallback(() => {
    if (currentSlide > 0 && !isAnimating) {
      setIsAnimating(true)
      setSlideDirection('prev')
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
          <div className="h-full flex flex-col items-center justify-center text-center relative overflow-hidden px-8">
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#375DEE]/20 rounded-full blur-[200px] -translate-y-1/3 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#375DEE]/10 rounded-full blur-[150px] translate-y-1/3 -translate-x-1/4" />
            </div>
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }} />
            <div className="relative z-10 max-w-5xl">
              <div className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 fade-up">
                <span className="text-sm text-white/60 tracking-wide">For Exotic Car Rental Fleet Owners</span>
              </div>
              <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold mb-6 tracking-tight fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>
                {content.title}
              </h1>
              <p className="text-3xl md:text-4xl text-[#375DEE] font-medium mb-8 fade-up delay-2" style={{ fontFamily: 'var(--font-display)' }}>
                {content.subtitle}
              </p>
              <p className="text-xl text-white/50 max-w-2xl mx-auto fade-up delay-3">{content.tagline}</p>
            </div>
          </div>
        )

      case "social-proof":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24">
            <h2 className="text-4xl lg:text-5xl font-bold mb-16 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="grid grid-cols-3 gap-8 max-w-5xl mb-16">
              {content.stats.map((stat: any, i: number) => (
                <div key={i} className={`fade-up delay-${i + 1}`}>
                  <div className="border-l-2 border-[#375DEE] pl-8">
                    <div className="text-5xl lg:text-6xl font-bold text-[#375DEE] mb-2" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</div>
                    <div className="text-lg font-medium text-white mb-1">{stat.label}</div>
                    <div className="text-sm text-white/40">{stat.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="max-w-3xl fade-up delay-4">
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 relative">
                <svg className="absolute -top-4 left-8 w-8 h-8 text-[#375DEE]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-2xl text-white/80 italic mb-4 pt-4">{content.quote}</p>
                <p className="text-[#375DEE] font-medium">— {content.author}</p>
              </div>
            </div>
          </div>
        )

      case "agenda":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24">
            <h2 className="text-5xl lg:text-6xl font-bold mb-16 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl">
              {content.items.map((item: any, i: number) => (
                <div key={i} className={`group fade-up delay-${i + 1}`}>
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 h-full hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300">
                    <div className="text-4xl font-bold text-[#375DEE]/50 mb-4" style={{ fontFamily: 'var(--font-display)' }}>{item.num}</div>
                    <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-white/40 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
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

      case "daily-chaos":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-20">
            <h2 className="text-4xl lg:text-5xl font-bold mb-12 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="grid grid-cols-3 gap-6 max-w-6xl">
              {[content.morning, content.afternoon, content.evening].map((period: any, i: number) => (
                <div key={i} className={`bg-white/[0.02] border border-white/10 rounded-2xl p-8 fade-up delay-${i + 1}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      i === 0 ? 'bg-orange-500/20 text-orange-400' :
                      i === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {i === 0 && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" /></svg>}
                      {i === 1 && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" /></svg>}
                      {i === 2 && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                    </div>
                    <span className="text-lg font-semibold text-white">{period.label}</span>
                  </div>
                  <div className="space-y-4">
                    {period.items.map((item: string, j: number) => (
                      <div key={j} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400/60 mt-2 flex-shrink-0" />
                        <p className="text-white/50 text-sm leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-white/30 text-center mt-10 fade-up delay-4">Sound familiar?</p>
          </div>
        )

      case "real-problems":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-20">
            <h2 className="text-4xl lg:text-5xl font-bold mb-10 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="grid grid-cols-2 gap-6 max-w-6xl">
              {content.problems.map((problem: any, i: number) => (
                <div key={i} className={`bg-white/[0.02] border border-white/10 rounded-2xl p-8 fade-up delay-${i + 1}`}>
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-3">{problem.main}</h3>
                      <p className="text-white/40 text-sm leading-relaxed">{problem.sub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case "brutal-truth":
        return (
          <div className="h-full flex flex-col justify-center items-center text-center px-8">
            <h2 className="text-4xl lg:text-5xl font-bold mb-8 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <p className="text-4xl lg:text-5xl font-bold text-red-400 mb-6 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.main}</p>
            <p className="text-xl text-white/50 mb-12 max-w-3xl fade-up delay-2">{content.sub}</p>
            <div className="space-y-4 max-w-2xl mb-12">
              {content.points.map((point: string, i: number) => (
                <div key={i} className={`flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-xl p-5 fade-up delay-${i + 3}`}>
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <p className="text-white/60 text-left">{point}</p>
                </div>
              ))}
            </div>
            <p className="text-2xl text-[#375DEE] font-bold fade-up delay-6" style={{ fontFamily: 'var(--font-display)' }}>{content.closing}</p>
          </div>
        )

      case "solution-intro":
        return (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <span className="text-[#375DEE] text-sm tracking-[0.3em] mb-6 fade-up">{content.label}</span>
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 max-w-4xl fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <p className="text-xl text-white/50 mb-12 max-w-2xl fade-up delay-2">{content.subtitle}</p>
            <div className="bg-[#375DEE]/10 border border-[#375DEE]/30 rounded-2xl px-10 py-6 fade-up delay-3">
              <p className="text-2xl text-[#375DEE] font-medium" style={{ fontFamily: 'var(--font-display)' }}>{content.highlight}</p>
            </div>
          </div>
        )

      case "system-overview":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              <p className="text-lg text-white/40 fade-up delay-1">{content.subtitle}</p>
            </div>
            <div className="flex items-center justify-center gap-4 lg:gap-8">
              {content.pillars.map((pillar: any, i: number) => (
                <div key={i} className="flex items-center">
                  <div className={`flex flex-col items-center fade-up delay-${i + 2}`}>
                    <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-3xl bg-[#375DEE] flex flex-col items-center justify-center mb-4">
                      {pillar.icon === "target" && <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.5} /><circle cx="12" cy="12" r="6" strokeWidth={1.5} /><circle cx="12" cy="12" r="2" strokeWidth={1.5} /></svg>}
                      {pillar.icon === "funnel" && <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>}
                      {pillar.icon === "robot" && <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                      {pillar.icon === "calendar" && <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    </div>
                    <p className="text-lg font-semibold text-white">{pillar.name}</p>
                    <p className="text-xs text-[#375DEE] font-medium">{pillar.module}</p>
                    <p className="text-xs text-white/40 mt-1">{pillar.desc}</p>
                  </div>
                  {i < content.pillars.length - 1 && (
                    <svg className="w-8 h-8 text-[#375DEE]/50 mx-2 lg:mx-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case "differentiator":
        return (
          <div className="h-full grid grid-cols-2 gap-12 px-16 lg:px-24 items-center">
            <div className="fade-up">
              <h2 className="text-4xl lg:text-5xl font-bold mb-10" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
              <div className="space-y-4">
                {content.antiPoints.map((point: string, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-white/50">{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="fade-up delay-2">
              <h2 className="text-4xl lg:text-5xl font-bold mb-10 text-[#375DEE]" style={{ fontFamily: 'var(--font-display)' }}>{content.proTitle}</h2>
              <div className="space-y-4">
                {content.proPoints.map((point: string, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-5 bg-[#375DEE]/5 border border-[#375DEE]/20 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-[#375DEE]/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-white">{point}</p>
                  </div>
                ))}
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

      case "case-study":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24">
            <span className="text-[#375DEE] text-sm tracking-[0.3em] mb-4 fade-up">{content.label}</span>
            <h2 className="text-4xl lg:text-5xl font-bold mb-12 fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="grid grid-cols-2 gap-8 max-w-5xl">
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 fade-up delay-2">
                <h3 className="text-sm text-white/30 tracking-wider mb-6">{content.before.title}</h3>
                <div className="space-y-4">
                  {content.before.points.map((point: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2" />
                      <p className="text-white/50">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#375DEE]/10 border border-[#375DEE]/30 rounded-2xl p-8 fade-up delay-3">
                <h3 className="text-sm text-[#375DEE] tracking-wider mb-6">{content.after.title}</h3>
                <div className="space-y-4">
                  {content.after.points.map((point: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[#375DEE] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-white">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "testimonials":
        return (
          <div className="h-full flex flex-col justify-center px-16 lg:px-24">
            <h2 className="text-4xl lg:text-5xl font-bold mb-12 fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="grid grid-cols-3 gap-6 max-w-6xl">
              {content.testimonials.map((testimonial: any, i: number) => (
                <div key={i} className={`bg-white/[0.03] border border-white/10 rounded-2xl p-8 fade-up delay-${i + 1}`}>
                  <svg className="w-8 h-8 text-[#375DEE]/50 mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-white/70 mb-6 leading-relaxed">{testimonial.quote}</p>
                  <div>
                    <p className="text-white font-medium">{testimonial.author}</p>
                    <p className="text-white/40 text-sm">{testimonial.location}</p>
                  </div>
                </div>
              ))}
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

      case "pricing":
        return (
          <div className="h-full flex flex-col justify-center px-12 lg:px-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-12 text-center fade-up" style={{ fontFamily: 'var(--font-display)' }}>{content.title}</h2>
            <div className="flex gap-8 justify-center mb-8">
              {content.options.map((option: any, i: number) => (
                <div key={i} className={`w-[400px] rounded-3xl overflow-hidden fade-up delay-${i + 1} ${option.highlight ? 'scale-105' : ''}`}>
                  {option.highlight && <div className="bg-[#375DEE] text-center py-2 text-sm font-bold text-white">MOST POPULAR</div>}
                  <div className={`p-10 h-full ${option.highlight ? 'bg-[#375DEE]' : 'bg-white/[0.03] border border-white/10'}`}>
                    <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>{option.name}</h3>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className={`text-5xl font-bold ${option.highlight ? 'text-white' : 'text-[#375DEE]'}`}>{option.price}</span>
                      <span className={option.highlight ? 'text-white/70' : 'text-white/40'}>{option.unit}</span>
                    </div>
                    <p className={`mb-8 ${option.highlight ? 'text-white/70' : 'text-white/40'}`}>{option.desc}</p>
                    <div className="space-y-4 mb-8">
                      {option.details.map((detail: string, j: number) => (
                        <div key={j} className="flex items-center gap-3">
                          <svg className={`w-5 h-5 ${option.highlight ? 'text-white' : 'text-[#375DEE]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className={option.highlight ? 'text-white/90' : 'text-white/60'}>{detail}</p>
                        </div>
                      ))}
                    </div>
                    <p className={`text-sm ${option.highlight ? 'text-white/60' : 'text-white/30'}`}>{option.best}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-white/30 text-sm fade-up delay-3">{content.note}</p>
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
              <img src={LOGO_URL} alt="Scale Exotics" className="h-14 w-auto mx-auto mb-12 fade-up" />
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
    <div className="h-screen bg-black text-white overflow-hidden select-none" style={{ fontFamily: 'var(--font-sans)' }}>
      <style>{animationStyles}</style>

      <div className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between">
        <img src={LOGO_URL} alt="Scale Exotics" className="h-7 w-auto opacity-50" />
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
