"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const [initialVh, setInitialVh] = useState<number | null>(null)
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})
  const ticking = useRef(false)

  // Capture initial viewport height to prevent layout shift from in-app browser UI
  useEffect(() => {
    setInitialVh(window.innerHeight)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50)
          ticking.current = false
        })
        ticking.current = true
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]))
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    )

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  const setRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el
  }

  const isVisible = (id: string) => visibleSections.has(id)

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden overscroll-none" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Ultra-Modern Header */}
      <header className="fixed top-0 left-0 right-0 z-[70]" style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>
        <div className={`transition-[background-color,border-color] duration-300 ${isScrolled ? "bg-black/90 border-b border-white/[0.08]" : ""}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Logo */}
              <a href="/" className="relative group">
                <Image src="/scalexoticslong.png" alt="Scale Exotics" width={140} height={28} className="h-7 w-auto" priority />
                <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#375DEE] group-hover:w-full transition-all duration-300" />
              </a>

              {/* Desktop Nav - Minimal */}
              <nav className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-full border border-white/[0.06]">
                  {[
                    { label: "About", href: "/about" },
                    { label: "Services", href: "/services" },
                  ].map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="px-5 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] rounded-full transition-all duration-300"
                    >
                      {item.label}
                    </a>
                  ))}
                  <a
                    href="/survey"
                    className="px-6 py-2 text-sm text-white bg-[#375DEE] hover:bg-[#4169E1] rounded-full transition-all duration-300 ml-1"
                  >
                    Get Started
                  </a>
                </div>
                <a
                  href="/login"
                  className="px-5 py-2 text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/30 rounded-full transition-all duration-300"
                >
                  Login
                </a>
              </nav>

              {/* Mobile Menu Button */}
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
      {mobileMenuOpen && (
      <div className="fixed inset-0 z-[60] md:hidden animate-fade-in">
        <div className="absolute inset-0 bg-black/98 backdrop-blur-xl" />
        <div className="relative h-full flex flex-col items-center justify-center gap-6">
          {["Home", "About", "Services"].map((item, i) => (
            <a
              key={item}
              href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
              onClick={() => setMobileMenuOpen(false)}
              className="text-4xl font-light text-white/80 hover:text-[#375DEE] transition-colors duration-300"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {item}
            </a>
          ))}
          <a
            href="/survey"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-6 px-10 py-4 text-lg bg-[#375DEE] rounded-full transition-colors duration-300"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Get Started
          </a>
          <a
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="px-8 py-3 text-base text-white/60 border border-white/20 rounded-full transition-colors duration-300"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Client Login
          </a>
        </div>
      </div>
      )}

      {/* Hero Section with Image */}
      <section
        className="relative flex items-center"
        style={{ minHeight: initialVh ? `${initialVh}px` : '100vh' }}
      >
        {/* Background Image - Exotic Car */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=2574&auto=format&fit=crop"
            alt="Luxury exotic car"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
          {/* Blue accent overlay */}
          <div className="absolute inset-0 bg-[#375DEE]/10 mix-blend-overlay" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20 w-full">
          <div className="max-w-3xl">
            {/* Blue accent line */}
            <div className="w-20 h-1 bg-[#375DEE] mb-8 animate-fade-in" />

            {/* Headline */}
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-8 animate-fade-in"
              style={{ animationDelay: "0.1s", fontFamily: 'var(--font-display)' }}
            >
              Scale Your
              <br />
              <span className="text-[#375DEE]">Rental Empire</span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-lg md:text-xl text-white/60 max-w-xl leading-relaxed mb-12 animate-fade-in font-light"
              style={{ animationDelay: "0.2s" }}
            >
              The all in one growth engine for rental fleets. Lead capture, automated follow up, and booking management trusted by 20+ fleet owners nationwide.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <a
                href="/survey"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-[#375DEE] hover:bg-[#4169E1] text-white rounded-full transition-all duration-300"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Start Scaling
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="/about"
                className="inline-flex items-center gap-2 px-8 py-4 text-white/80 hover:text-white border border-white/20 hover:border-[#375DEE]/50 rounded-full transition-all duration-300"
              >
                Learn More
              </a>
            </div>
          </div>

        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <div className="w-[1px] h-16 bg-gradient-to-b from-[#375DEE] to-transparent" />
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-6 md:py-8 bg-[#375DEE]/5 border-y border-[#375DEE]/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:flex md:flex-row items-center justify-between gap-4 md:gap-8">
            {[
              { value: "$2.4M+", label: "Revenue Generated" },
              { value: "20+", label: "Fleet Partners" },
              { value: "3X", label: "Avg Revenue Growth" },
              { value: "90", label: "Days to Results" }
            ].map((stat, i) => (
              <div key={stat.label} className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-4 text-center md:text-left">
                <span className="text-2xl md:text-4xl font-bold text-[#375DEE]" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</span>
                <span className="text-xs md:text-sm text-white/40">{stat.label}</span>
                {i < 3 && <div className="hidden md:block w-[1px] h-8 bg-white/10 ml-8" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section
        id="transformation"
        ref={setRef("transformation")}
        className="relative py-16 md:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className={`text-center mb-10 md:mb-20 transition-all duration-1000 overflow-visible ${isVisible("transformation") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <span className="text-[#375DEE] text-xs md:text-sm tracking-widest uppercase mb-3 md:mb-4 block">The Transformation</span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-normal" style={{ fontFamily: 'var(--font-display)' }}>
              Stop Leaving Money <span className="text-[#375DEE]">On The Table</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto text-base md:text-lg">
              Most fleet owners are stuck doing everything manually. We change that.
            </p>
          </div>

          {/* Before/After Comparison */}
          <div className={`grid md:grid-cols-2 gap-6 md:gap-8 transition-all duration-1000 ${isVisible("transformation") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`} style={{ transitionDelay: "200ms" }}>
            {/* Before */}
            <div className="relative p-6 md:p-10 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="absolute top-0 left-6 md:left-8 -translate-y-1/2 px-3 md:px-4 py-1 bg-black border border-white/20 rounded-full">
                <span className="text-[10px] md:text-xs text-white/50 tracking-widest uppercase">Without Us</span>
              </div>
              <div className="space-y-4 md:space-y-5 mt-4">
                {[
                  "Chasing leads manually through DMs",
                  "Missing inquiries while you sleep",
                  "Inconsistent monthly revenue",
                  "Hours wasted on tire-kickers",
                  "No idea what's working or not",
                  "Weekdays sitting empty"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 md:gap-4">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="text-white/60 text-sm md:text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div className="relative p-6 md:p-10 rounded-2xl border border-[#375DEE]/30 bg-[#375DEE]/5">
              <div className="absolute top-0 left-6 md:left-8 -translate-y-1/2 px-3 md:px-4 py-1 bg-[#375DEE] rounded-full">
                <span className="text-[10px] md:text-xs text-white tracking-widest uppercase">With Scale Exotics</span>
              </div>
              <div className="space-y-4 md:space-y-5 mt-4">
                {[
                  "Leads captured and qualified automatically",
                  "24/7 instant response to every inquiry",
                  "Predictable revenue with automated booking",
                  "Only talk to ready-to-book renters",
                  "Real-time dashboard shows what converts",
                  "Full fleet utilization, weekdays included"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 md:gap-4">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#375DEE]/20 border border-[#375DEE]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-white text-sm md:text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className={`text-center mt-12 transition-all duration-1000 ${isVisible("transformation") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`} style={{ transitionDelay: "400ms" }}>
            <a
              href="/survey"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#375DEE] hover:bg-[#4169E1] text-white rounded-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(55,93,238,0.3)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              See How It Works For You
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section
        id="dashboard"
        ref={setRef("dashboard")}
        className="relative py-16 md:py-32 bg-gradient-to-b from-transparent via-[#375DEE]/5 to-transparent"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className={`text-center mb-10 md:mb-16 transition-all duration-1000 ${isVisible("dashboard") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <span className="text-[#375DEE] text-xs md:text-sm tracking-widest uppercase mb-3 md:mb-4 block">Your Command Center</span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              One Dashboard to <span className="text-[#375DEE]">Rule It All</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto text-base md:text-lg">
              Everything you need to manage leads, bookings, customers, and revenue in one powerful platform.
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className={`relative transition-all duration-1000 ${isVisible("dashboard") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`} style={{ transitionDelay: "200ms" }}>
            {/* Browser Frame */}
            <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-[#375DEE]/10">
              {/* Browser Bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-black/50 rounded-lg px-4 py-1.5 text-xs text-white/40 max-w-md mx-auto">
                    app.scalexotics.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Content Mock */}
              <div className="p-4 md:p-6 bg-black">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
                  {[
                    { label: "Monthly Revenue", value: "$48,250", change: "+12.5%", up: true },
                    { label: "Active Leads", value: "127", change: "+23", up: true },
                    { label: "Bookings", value: "34", change: "+8", up: true },
                    { label: "Fleet Utilization", value: "87%", change: "+5%", up: true },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/10">
                      <p className="text-white/40 text-[10px] md:text-xs mb-1">{stat.label}</p>
                      <p className="text-lg md:text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</p>
                      <p className={`text-[10px] md:text-xs mt-1 ${stat.up ? "text-green-400" : "text-red-400"}`}>
                        {stat.change} this month
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chart placeholder */}
                <div className="grid md:grid-cols-3 gap-3 md:gap-4">
                  <div className="md:col-span-2 bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                    <p className="text-white/60 text-xs md:text-sm mb-4">Revenue Over Time</p>
                    <div className="h-32 md:h-48 flex items-end gap-1 md:gap-2">
                      {[40, 65, 55, 80, 70, 90, 85, 95, 75, 100, 90, 110].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-[#375DEE]/60 rounded-t transition-all hover:bg-[#375DEE]"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                    <p className="text-white/60 text-xs md:text-sm mb-4">Lead Sources</p>
                    <div className="space-y-3">
                      {[
                        { source: "Instagram", pct: 45, color: "#E1306C" },
                        { source: "Google Ads", pct: 30, color: "#4285F4" },
                        { source: "Referrals", pct: 15, color: "#34A853" },
                        { source: "Website", pct: 10, color: "#375DEE" },
                      ].map((item) => (
                        <div key={item.source}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/60">{item.source}</span>
                            <span className="text-white">{item.pct}%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glow effect */}
            <div className="absolute -inset-4 bg-[#375DEE]/10 blur-3xl -z-10 rounded-3xl" />
          </div>

          {/* Features Grid */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-10 md:mt-16 transition-all duration-1000 ${isVisible("dashboard") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`} style={{ transitionDelay: "400ms" }}>
            {[
              {
                icon: <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                title: "Analytics",
                desc: "Real-time business insights"
              },
              {
                icon: <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
                title: "Inbox",
                desc: "All conversations in one place"
              },
              {
                icon: <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
                title: "Bookings",
                desc: "Calendar & scheduling"
              },
              {
                icon: <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h8M8 17l-2-5h12l-2 5M8 17H6a1 1 0 01-1-1v-1a1 1 0 011-1h1M16 17h2a1 1 0 001-1v-1a1 1 0 00-1-1h-1M6 12l1.5-4.5A2 2 0 019.4 6h5.2a2 2 0 011.9 1.5L18 12M7 17a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" /></svg>,
                title: "Fleet",
                desc: "Vehicle management"
              },
              {
                icon: <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
                title: "Customers",
                desc: "CRM & lifetime value"
              },
              {
                icon: <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                title: "Agreements",
                desc: "Digital contracts & e-sign"
              },
              {
                icon: <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
                title: "Invoices",
                desc: "Billing & payments"
              },
              {
                icon: <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
                title: "AI Assistant",
                desc: "Smart automation"
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 md:p-5 hover:border-[#375DEE]/30 transition-colors">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#375DEE]/10 border border-[#375DEE]/30 flex items-center justify-center text-[#375DEE] mb-3 md:mb-4">
                  {feature.icon}
                </div>
                <h4 className="text-white font-medium text-sm md:text-base mb-1">{feature.title}</h4>
                <p className="text-white/40 text-xs md:text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className={`text-center mt-10 md:mt-12 transition-all duration-1000 ${isVisible("dashboard") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`} style={{ transitionDelay: "600ms" }}>
            <p className="text-white/50 mb-4">Already a client?</p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-[#375DEE]/50 rounded-full transition-all duration-300"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Access Your Dashboard
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section
        id="process"
        ref={setRef("process")}
        className="relative py-16 md:py-32 bg-gradient-to-b from-[#375DEE]/5 to-transparent"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className={`text-center mb-12 md:mb-20 transition-all duration-1000 ${isVisible("process") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <span className="text-[#375DEE] text-xs md:text-sm tracking-widest uppercase mb-3 md:mb-4 block">Our Process</span>
            <h2 className="text-3xl md:text-6xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              How We <span className="text-[#375DEE]">Scale</span> Your Fleet
            </h2>
          </div>

          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
            {[
              {
                num: "01",
                title: "Attract",
                desc: "We build multi-channel acquisition systems across Instagram, Google, and referral networks that bring high-intent renters directly to your fleet. No more waiting for leads to find you.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              {
                num: "02",
                title: "Convert",
                desc: "Our AI-powered response system engages leads instantly, qualifies them automatically, and guides them through a frictionless booking flow—24/7, even while you sleep.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )
              },
              {
                num: "03",
                title: "Optimize",
                desc: "Real-time dashboards show exactly what's working. We help you forecast demand, adjust pricing dynamically, and maximize utilization across your entire fleet.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )
              }
            ].map((step, i) => (
              <div
                key={step.num}
                className={`group relative p-6 md:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-[#375DEE]/30 transition-all duration-700 ${isVisible("process") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: `${(i + 1) * 150}ms` }}
              >
                {/* Number - Large and visible */}
                <div className="absolute top-4 right-4 md:top-6 md:right-6 text-5xl md:text-7xl font-bold text-[#375DEE]/20" style={{ fontFamily: 'var(--font-display)' }}>
                  {step.num}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-[#375DEE]/10 border border-[#375DEE]/30 flex items-center justify-center text-[#375DEE] mb-4 md:mb-6 group-hover:bg-[#375DEE]/20 transition-colors duration-300">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-3 md:mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                  {step.title}
                </h3>
                <p className="text-white/50 leading-relaxed text-sm md:text-base">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section
        id="services"
        ref={setRef("services")}
        className="relative py-16 md:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Left - Image */}
            <div className={`relative transition-all duration-1000 ${isVisible("services") ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}`}>
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden aspect-[4/5]">
                <Image
                  src="https://images.unsplash.com/photo-1593219535889-7873a100874a?q=80&w=2670&auto=format&fit=crop"
                  alt="Luxury car interior"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute inset-0 bg-[#375DEE]/10" />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-4 right-4 md:-bottom-8 md:-right-8 bg-[#375DEE] rounded-xl md:rounded-2xl p-4 md:p-6 shadow-2xl shadow-[#375DEE]/20">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>20+</div>
                <div className="text-xs md:text-sm text-white/70">Fleet Partners</div>
              </div>
            </div>

            {/* Right - Content */}
            <div className={`transition-all duration-1000 ${isVisible("services") ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`} style={{ transitionDelay: "200ms" }}>
              <div className="w-10 md:w-12 h-1 bg-[#375DEE] mb-4 md:mb-6" />
              <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                Complete Growth <span className="text-[#375DEE]">Systems</span>
              </h2>
              <p className="text-white/50 text-base md:text-lg mb-8 md:mb-10 leading-relaxed">
                Everything you need to dominate your market and scale with confidence.
              </p>

              {/* Services List */}
              <div className="space-y-5 md:space-y-6">
                {[
                  { title: "Lead Generation Engine", desc: "Automated 24/7 capture across Instagram, Google & referrals" },
                  { title: "Conversion Automation", desc: "AI-powered instant responses and booking optimization" },
                  { title: "Revenue Intelligence", desc: "Real-time dashboards and demand forecasting" },
                  { title: "Fleet Operations", desc: "Streamlined booking management and customer CRM" }
                ].map((service, i) => (
                  <div key={service.title} className="group flex gap-3 md:gap-4 items-start">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[#375DEE]/10 border border-[#375DEE]/30 flex items-center justify-center flex-shrink-0 group-hover:bg-[#375DEE]/20 transition-colors">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-medium text-white mb-1">{service.title}</h4>
                      <p className="text-white/40 text-xs md:text-sm">{service.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        ref={setRef("testimonials")}
        className="relative py-16 md:py-32 bg-gradient-to-b from-transparent via-[#375DEE]/5 to-transparent"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className={`text-center mb-10 md:mb-16 transition-all duration-1000 ${isVisible("testimonials") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <span className="text-[#375DEE] text-xs md:text-sm tracking-widest uppercase mb-3 md:mb-4 block">Testimonials</span>
            <h2 className="text-3xl md:text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              What Fleet <span className="text-[#375DEE]">Owners</span> Say
            </h2>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                quote: "We went from struggling to fill weekdays to being fully booked 3 weeks out. The lead quality is insane.",
                name: "Marcus J.",
                role: "12-Vehicle Fleet, Miami",
                img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
              },
              {
                quote: "The automation alone saved me 20+ hours a week. Now I focus on growing the fleet instead of chasing leads.",
                name: "David R.",
                role: "8-Vehicle Fleet, LA",
                img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop"
              },
              {
                quote: "Went from $18k to $52k/month in 90 days. Scale Exotics knows exactly what works in this industry.",
                name: "Anthony M.",
                role: "6-Vehicle Fleet, Vegas",
                img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
              }
            ].map((testimonial, i) => (
              <div
                key={testimonial.name}
                className={`group p-6 md:p-8 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-[#375DEE]/30 transition-all duration-700 ${
                  isVisible("testimonials") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                }`}
                style={{ transitionDelay: `${(i + 1) * 150}ms` }}
              >
                {/* Quote */}
                <div className="text-[#375DEE] text-3xl md:text-4xl mb-3 md:mb-4">&ldquo;</div>
                <p className="text-white/70 leading-relaxed mb-6 md:mb-8 text-sm md:text-base">{testimonial.quote}</p>

                {/* Author */}
                <div className="flex items-center gap-3 md:gap-4">
                  <img
                    src={testimonial.img}
                    alt={testimonial.name}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-[#375DEE]/30"
                  />
                  <div>
                    <div className="text-white font-medium text-sm md:text-base">{testimonial.name}</div>
                    <div className="text-white/40 text-xs md:text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Background Image */}
      <section
        id="cta"
        ref={setRef("cta")}
        className="relative py-20 md:py-40 overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1571001437100-9d282569809b?q=80&w=2670&auto=format&fit=crop"
            alt="Exotic car fleet"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#375DEE]/20 to-transparent" />
        </div>

        {/* Content */}
        <div className={`relative z-10 max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center transition-all duration-1000 ${isVisible("cta") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <div className="w-16 md:w-20 h-1 bg-[#375DEE] mx-auto mb-6 md:mb-8" />
          <h2 className="text-3xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to <span className="text-[#375DEE]">Dominate</span>
            <br />Your Market?
          </h2>
          <p className="text-white/50 text-base md:text-xl max-w-xl mx-auto mb-8 md:mb-10">
            Take the first step toward scaling your exotic rental business.
          </p>
          <a
            href="/survey"
            className="inline-flex items-center gap-2 md:gap-3 px-8 md:px-10 py-4 md:py-5 bg-[#375DEE] hover:bg-[#4169E1] text-white text-base md:text-lg rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(55,93,238,0.4)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Get Your Growth Plan
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 md:py-20 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-8 mb-10 md:mb-12">
            {/* Brand */}
            <div className="col-span-2">
              <Image src="/scalexoticslong.png" alt="Scale Exotics" width={140} height={28} className="h-6 md:h-7 w-auto mb-3 md:mb-4" />
              <p className="text-white/40 text-xs md:text-sm max-w-sm leading-relaxed">
                AI-powered lead capture and booking platform built for exotic car rental fleets.
              </p>
              {/* Blue accent */}
              <div className="w-12 md:w-16 h-1 bg-[#375DEE] mt-4 md:mt-6" />
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white text-xs md:text-sm font-medium mb-3 md:mb-4">Quick Links</h4>
              <div className="flex flex-col gap-2 md:gap-3">
                <a href="/about" className="text-white/40 text-xs md:text-sm hover:text-[#375DEE] transition-colors">About</a>
                <a href="/services" className="text-white/40 text-xs md:text-sm hover:text-[#375DEE] transition-colors">Services</a>
                <a href="/survey" className="text-white/40 text-xs md:text-sm hover:text-[#375DEE] transition-colors">Get Started</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white text-xs md:text-sm font-medium mb-3 md:mb-4">Legal</h4>
              <div className="flex flex-col gap-2 md:gap-3">
                <a href="/privacy-policy" className="text-white/40 text-xs md:text-sm hover:text-[#375DEE] transition-colors">Privacy Policy</a>
                <a href="/tos" className="text-white/40 text-xs md:text-sm hover:text-[#375DEE] transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 md:pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
            <p className="text-white/30 text-[10px] md:text-xs">
              © {new Date().getFullYear()} Scale Exotics. All rights reserved.
            </p>
            <p className="text-white/20 text-[9px] md:text-[10px] max-w-lg text-center md:text-right">
              This site is not a part of the Facebook website or Facebook Inc. Additionally, this site is NOT endorsed by Facebook in any way. FACEBOOK is a trademark of FACEBOOK, Inc.
            </p>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}
