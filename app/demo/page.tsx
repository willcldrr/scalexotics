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
    // SECTION 1: INTRO + CREDIBILITY
    { id: 1, section: "intro", type: "hero", content: {
      title: "Scale Exotics",
      subtitle: "Your Growth Partner",
      tagline: "The system behind 20+ exotic rental fleets doing $50K+ months",
      credibility: "Trusted by fleet owners in Miami, LA, Vegas, and beyond"
    }},
    { id: 2, section: "intro", type: "social-proof-screenshots", content: {
      title: "What Our Partners Are Saying",
      subtitle: "Real feedback from real fleet owners",
      placeholders: [
        { type: "google-review", label: "Google Review Screenshot" },
        { type: "instagram-dm", label: "Instagram DM Screenshot" },
        { type: "text-message", label: "Text Message Screenshot" },
        { type: "google-review", label: "Google Review Screenshot" }
      ]
    }},
    { id: 3, section: "intro", type: "agenda", content: {
      title: "What We'll Cover",
      items: [
        { num: "01", title: "The Opportunity", desc: "The math behind $50K+ months" },
        { num: "02", title: "The System", desc: "How top fleets operate" },
        { num: "03", title: "Live Demo", desc: "See it in action" },
        { num: "04", title: "Your Path Forward", desc: "Getting started" }
      ]
    }},

    // SECTION 2: THE OPPORTUNITY (Not problems - show the gap)
    { id: 4, section: "opportunity", type: "section-header", content: {
      number: "01",
      title: "The Opportunity",
      subtitle: "The math behind $50K+ months"
    }},
    { id: 5, section: "opportunity", type: "revenue-math", content: {
      title: "The Revenue Gap",
      subtitle: "Most fleets leave 40-60% of potential revenue on the table",
      scenario: {
        fleetSize: "5-car fleet",
        avgDaily: "$800/day average",
        current: {
          label: "Current (40% utilization)",
          weekday: "1.5 cars/day weekdays",
          weekend: "4 cars/day weekends",
          monthly: "$38,400/month"
        },
        potential: {
          label: "Optimized (75% utilization)",
          weekday: "3 cars/day weekdays",
          weekend: "5 cars/day weekends",
          monthly: "$72,000/month"
        },
        gap: "$33,600/month left on the table"
      }
    }},
    { id: 6, section: "opportunity", type: "top-performers", content: {
      title: "What 6-Figure Fleets Do Differently",
      subtitle: "The 4 things that separate $20K months from $70K months",
      items: [
        { icon: "speed", metric: "<60 sec", label: "Response Time", desc: "They respond to every inquiry in under 60 seconds—not hours" },
        { icon: "pipeline", metric: "100%", label: "Lead Tracking", desc: "Every lead is tracked from first click to deposit secured" },
        { icon: "calendar", metric: "70%+", label: "Weekday Bookings", desc: "They fill weekdays, not just weekends" },
        { icon: "direct", metric: "0%", label: "Platform Fees", desc: "They own the customer relationship—no Turo cuts" }
      ]
    }},
    { id: 7, section: "opportunity", type: "gap-analysis", content: {
      title: "The 3 Revenue Killers",
      subtitle: "Data from analyzing 20+ rental operations",
      gaps: [
        {
          stat: "80%",
          label: "of leads go cold",
          detail: "when response time exceeds 5 minutes",
          insight: "Speed wins. Period."
        },
        {
          stat: "35%",
          label: "of leads fall through",
          detail: "without a proper tracking system",
          insight: "If it's not tracked, it's lost."
        },
        {
          stat: "40%",
          label: "weekday vacancy",
          detail: "is the industry average",
          insight: "Weekdays are where margin lives."
        }
      ],
      cta: "We solve all three. Here's how."
    }},

    // SECTION 3: THE SYSTEM
    { id: 8, section: "solution", type: "section-header", content: {
      number: "02",
      title: "The System",
      subtitle: "Built for exotic rentals. Proven 47 times."
    }},
    { id: 9, section: "solution", type: "system-flow", content: {
      title: "From Ad Click to Deposit Secured",
      subtitle: "The complete journey—fully automated",
      steps: [
        { num: "1", label: "Attract", desc: "Targeted ads reach your ideal renter", icon: "ad" },
        { num: "2", label: "Capture", desc: "They land on your custom booking page", icon: "page" },
        { num: "3", label: "Nurture", desc: "AI qualifies and follows up instantly", icon: "ai" },
        { num: "4", label: "Convert", desc: "Deposit secured, lead handed to you", icon: "money" }
      ],
      outcome: "You get deposit-secured leads. We handle everything else."
    }},
    { id: 10, section: "solution", type: "differentiator", content: {
      title: "Why This Is Different",
      comparison: {
        left: {
          title: "Typical Marketing Agency",
          items: [
            { text: "Charges monthly regardless of results", icon: "x" },
            { text: "Generic campaigns, not rental-specific", icon: "x" },
            { text: "Hands you leads, disappears", icon: "x" },
            { text: "No accountability for bookings", icon: "x" }
          ]
        },
        right: {
          title: "Scale Exotics",
          items: [
            { text: "Pay only when you get paid", icon: "check" },
            { text: "Built specifically for exotic rentals", icon: "check" },
            { text: "Nurtures leads until deposit secured", icon: "check" },
            { text: "We only win when you win", icon: "check" }
          ]
        }
      }
    }},

    // SECTION 4: LIVE DEMO
    { id: 11, section: "demo", type: "section-header", content: {
      number: "03",
      title: "Live Demo",
      subtitle: "Let me show you exactly what you'll get"
    }},
    { id: 12, section: "demo", type: "system-overview", content: {
      title: "The Four Pillars",
      subtitle: "Each piece works together to create a booking machine",
      pillars: [
        { icon: "target", name: "Attract", module: "Paid Ads", desc: "Bring qualified traffic" },
        { icon: "funnel", name: "Capture", module: "Landing Pages", desc: "Convert visitors to leads" },
        { icon: "robot", name: "Nurture", module: "AI Assistant", desc: "Engage & qualify 24/7" },
        { icon: "calendar", name: "Convert", module: "CRM + Booking", desc: "Close & manage deals" }
      ]
    }},
    { id: 13, section: "demo", type: "module-with-screenshot", content: {
      moduleNum: "01",
      moduleName: "Paid Advertising",
      tagline: "Targeted ads that reach renters ready to book",
      features: [
        "Custom audiences built around YOUR ideal customer",
        "Platform selection based on where YOUR renters are",
        "Creative that showcases YOUR fleet and brand",
        "Weekly optimization based on real performance data"
      ],
      result: "Average 4.2x ROAS for our partners",
      screenshot: {
        type: "ad-dashboard",
        label: "Meta Ads Dashboard Screenshot",
        secondaryLabel: "Ad Creative Example"
      }
    }},
    { id: 14, section: "demo", type: "module-with-screenshot", content: {
      moduleNum: "02",
      moduleName: "High-Converting Funnels",
      tagline: "Landing pages that turn clicks into leads",
      features: [
        "Custom pages featuring YOUR vehicles and pricing",
        "Mobile-first design (80%+ of traffic is mobile)",
        "Lightning-fast load times for better conversions",
        "Lead capture optimized for YOUR booking process"
      ],
      result: "2-3x higher conversion than generic pages",
      screenshot: {
        type: "landing-page",
        label: "Landing Page Screenshot",
        secondaryLabel: "Mobile View"
      }
    }},
    { id: 15, section: "demo", type: "module-with-screenshot", content: {
      moduleNum: "03",
      moduleName: "AI Booking Assistant",
      tagline: "Never miss another lead—even at 3am",
      features: [
        "Trained on YOUR fleet, pricing, policies, and FAQs",
        "Responds in under 60 seconds, 24 hours a day",
        "Qualifies leads based on YOUR criteria",
        "Follows up automatically until they book or say no"
      ],
      result: "85% of leads engaged within 60 seconds",
      screenshot: {
        type: "conversation",
        label: "Real AI Conversation Screenshot",
        secondaryLabel: "Shows timestamps"
      }
    }},
    { id: 16, section: "demo", type: "module-with-screenshot", content: {
      moduleNum: "04",
      moduleName: "Your Command Center",
      tagline: "Full visibility into your pipeline",
      features: [
        "Track every lead from first click to booking",
        "Visual pipeline shows where each prospect is",
        "Automated follow-up sequences run 24/7",
        "Real-time metrics so you know what's working"
      ],
      result: "Complete control over your entire operation",
      screenshot: {
        type: "dashboard",
        label: "Dashboard Screenshot",
        secondaryLabel: "Pipeline View"
      }
    }},

    // SECTION 5: RESULTS & PROOF
    { id: 17, section: "results", type: "section-header", content: {
      number: "04",
      title: "Real Results",
      subtitle: "From real partners, in their own words"
    }},
    { id: 18, section: "results", type: "case-study-with-proof", content: {
      label: "CASE STUDY",
      title: "From $18K to $67K Months",
      client: "5-car fleet in Miami",
      timeline: "90 days",
      before: {
        title: "Before",
        metrics: [
          { label: "Monthly Revenue", value: "$15-20K", subtext: "inconsistent" },
          { label: "Response Time", value: "2-4 hours", subtext: "leads going cold" },
          { label: "Ad Tracking", value: "None", subtext: "$3K/mo wasted" }
        ]
      },
      after: {
        title: "After 90 Days",
        metrics: [
          { label: "Monthly Revenue", value: "$60-70K", subtext: "consistent" },
          { label: "Response Time", value: "<60 sec", subtext: "24/7 coverage" },
          { label: "Ad ROAS", value: "4.1x", subtext: "every dollar tracked" }
        ]
      },
      proofPlaceholders: [
        { type: "revenue", label: "Revenue Screenshot (Stripe/Square)" },
        { type: "calendar", label: "Booking Calendar Comparison" }
      ]
    }},
    { id: 19, section: "results", type: "testimonial-screenshots", content: {
      title: "Straight From Our Partners",
      subtitle: "Real messages. Unedited.",
      placeholders: [
        { type: "instagram-dm", label: "Instagram DM Screenshot" },
        { type: "text-message", label: "Text Message Screenshot" },
        { type: "google-review", label: "Google Review Screenshot" },
        { type: "instagram-dm", label: "Instagram DM Screenshot" },
        { type: "text-message", label: "Text Message Screenshot" },
        { type: "google-review", label: "Google Review Screenshot" }
      ]
    }},
    { id: 20, section: "results", type: "guarantee", content: {
      title: "The Guarantee",
      main: "Qualified leads in 30 days—or your money back.",
      sub: "We've done this 47 times. We know it works. That's why we guarantee it.",
      details: ["No long-term contracts", "Cancel anytime", "100% money-back guarantee"]
    }},

    // SECTION 6: NEXT STEPS
    { id: 21, section: "close", type: "section-header", content: {
      number: "05",
      title: "Next Steps",
      subtitle: "Two ways to get started"
    }},
    { id: 22, section: "close", type: "pricing", content: {
      title: "Choose Your Path",
      subtitle: "Both include the complete system. Pick what fits your stage.",
      options: [
        {
          name: "Performance",
          price: "$125",
          unit: "per deposit-secured lead",
          desc: "You only pay when you get paid",
          highlight: false,
          details: [
            "No upfront cost",
            "Pay per qualified, deposit-secured lead",
            "Full system access",
            "All features included",
            "Cancel anytime"
          ],
          best: "Best for: Testing the waters risk-free"
        },
        {
          name: "Growth",
          price: "$1,500",
          unit: "per month",
          desc: "Unlimited leads, maximum scale",
          highlight: true,
          details: [
            "Flat monthly fee",
            "Unlimited deposit-secured leads",
            "Priority support",
            "Weekly strategy calls",
            "Dedicated account manager"
          ],
          best: "Best for: Ready to scale aggressively"
        }
      ],
      note: "Ad spend is separate and transparent. Recommended: $50-100/day to start."
    }},
    { id: 23, section: "close", type: "timeline", content: {
      title: "Here's What Happens Next",
      subtitle: "From today to leads flowing",
      steps: [
        { num: "1", title: "Strategy Call", desc: "We map your growth plan together", time: "Today", icon: "phone" },
        { num: "2", title: "System Build", desc: "We build your custom system", time: "Days 1-5", icon: "build" },
        { num: "3", title: "Launch", desc: "Ads go live, leads start flowing", time: "Day 6", icon: "rocket" },
        { num: "4", title: "Optimize & Scale", desc: "We refine and you grow", time: "Ongoing", icon: "chart" }
      ]
    }},
    { id: 24, section: "close", type: "urgency", content: {
      title: "Why Start Now?",
      points: [
        { icon: "chart", text: "Every day without this system = leads going to competitors with faster response" },
        { icon: "calendar", text: "Peak season is approaching—build momentum before the rush" },
        { icon: "shield", text: "Zero risk with our performance model—you only pay when you get paid" }
      ],
      cta: "The math is simple: waiting costs you money."
    }},
    { id: 25, section: "close", type: "deposit", content: {
      title: "Not Ready to Decide Today?",
      subtitle: "No pressure.",
      main: "$100 fully refundable deposit",
      details: [
        "Holds your onboarding slot for 7 days",
        "100% refundable if you decide it's not for you",
        "Applied to your first invoice if you move forward"
      ],
      cta: "Zero risk. Just keeps your spot warm."
    }},
    { id: 26, section: "close", type: "final", content: {
      title: "Ready to Scale?",
      subtitle: "You've got the fleet. We've got the system.",
      cta: "Let's talk."
    }}
  ]

  const sections = ["intro", "opportunity", "solution", "demo", "results", "close"]
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
            {/* Enhanced background effects */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#375DEE]/20 rounded-full blur-[200px] -translate-y-1/3 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#375DEE]/10 rounded-full blur-[150px] translate-y-1/3 -translate-x-1/4" />
              {/* Additional center glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#375DEE]/5 rounded-full blur-[100px]" />
            </div>
            {/* Grid background */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }} />
            {/* Radial gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />

            <div className="relative z-10 max-w-5xl">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-full mb-8 fade-up">
                <div className="w-2 h-2 rounded-full bg-[#375DEE] animate-pulse" />
                <span className="text-sm text-white/60 tracking-wide">For Exotic Car Rental Fleet Owners</span>
              </div>
              <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold mb-6 tracking-tight fade-up delay-1" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">{content.title}</span>
              </h1>
              <p className="text-3xl md:text-4xl font-medium mb-8 fade-up delay-2" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="bg-gradient-to-r from-[#375DEE] to-[#6B8DFF] bg-clip-text text-transparent">{content.subtitle}</span>
              </p>
              <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 fade-up delay-3">{content.tagline}</p>
              {/* Status indicators */}
              <div className="flex items-center justify-center gap-8 fade-up delay-4">
                <div className="flex items-center gap-2 text-white/30 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span>AI-Powered</span>
                </div>
                <div className="flex items-center gap-2 text-white/30 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span>24/7 Automated</span>
                </div>
                <div className="flex items-center gap-2 text-white/30 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span>Performance-Based</span>
                </div>
              </div>
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
                        <div className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#375DEE] to-[#6B8DFF] bg-clip-text text-transparent mb-3" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</div>
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
                        <div className="text-4xl font-bold bg-gradient-to-r from-[#375DEE] to-[#6B8DFF] bg-clip-text text-transparent mb-2" style={{ fontFamily: 'var(--font-display)' }}>{item.metric}</div>
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
                          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-blue-500/20 flex items-center justify-center">
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
                  <p className="text-2xl bg-gradient-to-r from-[#375DEE] to-[#6B8DFF] bg-clip-text text-transparent font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{content.highlight}</p>
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
            {/* Left side - Comparison left */}
            <div className="flex flex-col justify-center px-12 lg:px-16 relative bg-gradient-to-r from-white/[0.02] to-transparent">
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #fff, #fff 1px, transparent 1px, transparent 8px)'
              }} />
              <div className="relative fade-up">
                <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-white/60" style={{ fontFamily: 'var(--font-display)' }}>{content.comparison.left.title}</h2>
                <div className="space-y-3">
                  {content.comparison.left.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <p className="text-white/40 text-sm">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center divider with title */}
            <div className="absolute left-1/2 top-0 bottom-0 flex flex-col items-center justify-center -translate-x-1/2 z-10">
              <div className="w-[2px] flex-1 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
              <div className="py-4">
                <span className="text-xl font-bold text-white/20 rotate-90 block" style={{ fontFamily: 'var(--font-display)' }}>VS</span>
              </div>
              <div className="w-[2px] flex-1 bg-gradient-to-b from-transparent via-[#375DEE]/30 to-transparent" />
            </div>

            {/* Right side - Comparison right */}
            <div className="flex flex-col justify-center px-12 lg:px-16 relative bg-gradient-to-l from-[#375DEE]/10 to-transparent">
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[300px] h-[300px] bg-[#375DEE]/20 rounded-full blur-[100px]" />
              <div className="relative fade-up delay-2">
                <h2 className="text-2xl lg:text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                  <span className="bg-gradient-to-r from-[#375DEE] to-[#6B8DFF] bg-clip-text text-transparent">{content.comparison.right.title}</span>
                </h2>
                <div className="space-y-3">
                  {content.comparison.right.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-[#375DEE]/5 border border-[#375DEE]/20 rounded-xl hover:border-[#375DEE]/40 hover:bg-[#375DEE]/10 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-[#375DEE]/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-white text-sm">{item.text}</p>
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
