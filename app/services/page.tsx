"use client"

import { useState, useEffect, useRef } from "react"

export default function Services() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
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
    <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className={`transition-all duration-700 ${scrollY > 50 ? "bg-black/60 backdrop-blur-2xl border-b border-white/[0.08]" : ""}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <a href="/" className="relative group">
                <img src="/scalexoticslong.png" alt="Scale Exotics" className="h-7 w-auto" />
                <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#375DEE] group-hover:w-full transition-all duration-300" />
              </a>
              <nav className="hidden md:flex items-center">
                <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-full border border-white/[0.06]">
                  <a href="/" className="px-5 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] rounded-full transition-all duration-300">Home</a>
                  <a href="/about" className="px-5 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] rounded-full transition-all duration-300">About</a>
                  <a href="/survey" className="px-6 py-2 text-sm text-white bg-[#375DEE] hover:bg-[#4169E1] rounded-full transition-all duration-300 ml-1">Get Started</a>
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
          <a
            href="/survey"
            onClick={() => setMobileMenuOpen(false)}
            className={`mt-6 px-10 py-4 text-lg bg-[#375DEE] rounded-full transition-all duration-500 ${mobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
            style={{ transitionDelay: mobileMenuOpen ? "300ms" : "0ms", fontFamily: 'var(--font-display)' }}
          >
            Get Started
          </a>
        </div>
        <button onClick={() => setMobileMenuOpen(false)} className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center" aria-label="Close menu">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 md:pt-40 md:pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-[#375DEE]/10 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <div className="w-16 md:w-20 h-1 bg-[#375DEE] mx-auto mb-6 md:mb-8 animate-fade-in" />
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-6 md:mb-8 animate-fade-in" style={{ animationDelay: "0.1s", fontFamily: 'var(--font-display)' }}>
            Our <span className="text-[#375DEE]">Services</span>
          </h1>
          <p className="text-base md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed animate-fade-in font-light" style={{ animationDelay: "0.2s" }}>
            Everything you need to scale your exotic rental business — from lead generation to automated booking systems.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section
        id="services"
        ref={setRef("services")}
        className="relative py-12 md:py-24"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="space-y-6 md:space-y-8">
            {[
              {
                num: "01",
                title: "Lead Magnet",
                desc: "Build nonstop inbound demand. This system pulls high intent renters toward your fleet using targeted acquisition loops, automated funnels, and content that attracts people already ready to book.",
                features: ["Targeted acquisition systems", "Automated inbound capture", "High-intent traffic funnels", "Multi-channel lead generation"],
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
                image: "https://images.unsplash.com/photo-1709085599581-03e868266a56?q=80&w=2574&auto=format&fit=crop"
              },
              {
                num: "02",
                title: "Conversion System",
                desc: "Convert every inquiry into revenue. This circuit handles responses instantly, qualifies prospects, and moves them through a frictionless booking path built specifically for exotic and luxury rentals.",
                features: ["Instant response + follow-ups", "AI-driven qualification", "Booking flow optimization", "Automated nurture sequences"],
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2574&auto=format&fit=crop"
              },
              {
                num: "03",
                title: "Insight Engine",
                desc: "See the entire business with absolute clarity. This engine tracks performance, forecasts demand, and exposes revenue opportunities before your competitors even notice.",
                features: ["Live performance dashboards", "Revenue + demand forecasting", "Actionable insights and alerts", "ROI tracking per channel"],
                icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop"
              }
            ].map((service, i) => (
              <div
                key={service.num}
                className={`group transition-all duration-1000 ${isVisible("services") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: `${i * 200}ms` }}
              >
                <div className="grid lg:grid-cols-2 gap-6 md:gap-12 items-center p-5 md:p-12 rounded-2xl md:rounded-3xl border border-white/[0.06] bg-white/[0.02] hover:border-[#375DEE]/30 transition-colors duration-500">
                  {/* Content */}
                  <div className={`${i % 2 === 1 ? "lg:order-2" : ""}`}>
                    <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                      <span className="text-xs md:text-sm text-[#375DEE] tracking-widest">{service.num}</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-[#375DEE]/50 to-transparent" />
                    </div>
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-[#375DEE]/10 border border-[#375DEE]/30 flex items-center justify-center text-[#375DEE] mb-4 md:mb-6 group-hover:bg-[#375DEE]/20 transition-colors">
                      <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={service.icon} />
                      </svg>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                      {service.title}
                    </h2>
                    <p className="text-white/50 text-sm md:text-lg leading-relaxed mb-5 md:mb-8">
                      {service.desc}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {service.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 md:gap-3">
                          <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#375DEE]/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-white/60 text-xs md:text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Image */}
                  <div className={`relative ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                    <div className="relative rounded-xl md:rounded-2xl overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute inset-0 bg-[#375DEE]/10" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
          <div className={`text-center mb-10 md:mb-16 transition-all duration-1000 ${isVisible("process") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <span className="text-[#375DEE] text-xs md:text-sm tracking-widest uppercase mb-3 md:mb-4 block">How It Works</span>
            <h2 className="text-3xl md:text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Simple <span className="text-[#375DEE]">Process</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { num: "1", title: "Discovery Call", desc: "We learn about your fleet, goals, and current challenges." },
              { num: "2", title: "Custom Strategy", desc: "We build a tailored growth plan for your specific market." },
              { num: "3", title: "System Setup", desc: "We implement your automated lead and booking systems." },
              { num: "4", title: "Scale & Optimize", desc: "We continuously improve to maximize your revenue." }
            ].map((step, i) => (
              <div
                key={step.num}
                className={`relative transition-all duration-1000 ${isVisible("process") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: `${(i + 1) * 150}ms` }}
              >
                <div className="text-4xl md:text-6xl font-bold text-white/[0.03] absolute -top-2 md:-top-4 left-0" style={{ fontFamily: 'var(--font-display)' }}>
                  {step.num}
                </div>
                <div className="relative pt-6 md:pt-8">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#375DEE] flex items-center justify-center text-white text-sm md:text-base font-bold mb-3 md:mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                    {step.num}
                  </div>
                  <h3 className="text-base md:text-xl font-semibold text-white mb-1 md:mb-2" style={{ fontFamily: 'var(--font-display)' }}>{step.title}</h3>
                  <p className="text-white/50 text-xs md:text-sm leading-relaxed">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-[#375DEE]/50 to-transparent -translate-x-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="cta"
        ref={setRef("cta")}
        className="relative py-16 md:py-32"
      >
        <div className={`max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center transition-all duration-1000 ${isVisible("cta") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <div className="p-8 md:p-16 rounded-2xl md:rounded-3xl border border-white/[0.06] bg-gradient-to-b from-[#375DEE]/10 to-transparent">
            <div className="w-16 md:w-20 h-1 bg-[#375DEE] mx-auto mb-6 md:mb-8" />
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              Ready to <span className="text-[#375DEE]">Scale</span>?
            </h2>
            <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto mb-8 md:mb-10">
              Book a call to discuss how Scale Exotics can help your fleet reach $50k+/month.
            </p>
            <a
              href="/survey"
              className="inline-flex items-center gap-2 md:gap-3 px-8 md:px-10 py-4 md:py-5 bg-[#375DEE] hover:bg-[#4169E1] text-white text-base md:text-lg rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(55,93,238,0.4)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Get Started
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 md:py-20 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 md:mb-12">
            <div className="col-span-2">
              <img src="/scalexoticslong.png" alt="Scale Exotics" className="h-6 md:h-7 w-auto mb-3 md:mb-4" />
              <p className="text-white/40 text-xs md:text-sm max-w-sm leading-relaxed">
                Helping exotic car rental fleet owners build automated systems that generate consistent $50k+ months.
              </p>
              <div className="w-12 md:w-16 h-1 bg-[#375DEE] mt-4 md:mt-6" />
            </div>
            <div>
              <h4 className="text-white text-xs md:text-sm font-medium mb-3 md:mb-4">Quick Links</h4>
              <div className="flex flex-col gap-2 md:gap-3">
                <a href="/" className="text-white/40 text-xs md:text-sm hover:text-[#375DEE] transition-colors">Home</a>
                <a href="/about" className="text-white/40 text-xs md:text-sm hover:text-[#375DEE] transition-colors">About</a>
                <a href="/survey" className="text-white/40 text-xs md:text-sm hover:text-[#375DEE] transition-colors">Get Started</a>
              </div>
            </div>
            <div>
              <h4 className="text-white text-xs md:text-sm font-medium mb-3 md:mb-4">Legal</h4>
              <div className="flex flex-col gap-2 md:gap-3">
                <a href="/privacy-policy" className="text-white/40 text-xs md:text-sm hover:text-[#375DEE] transition-colors">Privacy Policy</a>
                <a href="/tos" className="text-white/40 text-xs md:text-sm hover:text-[#375DEE] transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="pt-6 md:pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
            <p className="text-white/30 text-[10px] md:text-xs">© {new Date().getFullYear()} Scale Exotics. All rights reserved.</p>
            <p className="text-white/20 text-[9px] md:text-[10px] max-w-lg text-center md:text-right">
              This site is not a part of the Facebook website or Facebook Inc. Additionally, this site is NOT endorsed by Facebook in any way. FACEBOOK is a trademark of FACEBOOK, Inc.
            </p>
          </div>
        </div>
      </footer>

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
