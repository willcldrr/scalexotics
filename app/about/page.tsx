"use client"

import { useState, useEffect, useRef } from "react"

export default function About() {
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    email: "",
    phone: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
    return phoneRegex.test(phone.replace(/\s/g, ""))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.business.trim()) newErrors.business = "Business name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!validateEmail(formData.email)) newErrors.email = "Please enter a valid email"
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
    else if (!validatePhone(formData.phone)) newErrors.phone = "Please enter a valid phone number"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      await fetch("https://willcldrr.app.n8n.cloud/webhook/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      setIsSubmitted(true)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }))
  }

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
                  <a href="/services" className="px-5 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] rounded-full transition-all duration-300">Services</a>
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

      {/* Hero Section with Video */}
      <section className="relative min-h-screen flex items-center">
        {/* Video Background */}
        <div className="absolute inset-0">
          <iframe
            src="https://customer-d0ejbh5tg4plprv9.cloudflarestream.com/51c203f4112210e3cec774edc299a14f/iframe?autoplay=true&muted=true&controls=false&defaultQuality=max&loop=true"
            className="absolute inset-0 w-full h-full hidden md:block"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
          <iframe
            src="https://customer-d0ejbh5tg4plprv9.cloudflarestream.com/0be1cc7d9f67938db82c2b20665cb194/iframe?autoplay=true&muted=true&controls=false&defaultQuality=max&loop=true"
            className="absolute inset-0 w-full h-full block md:hidden object-cover"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-[#375DEE]/10 mix-blend-overlay" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20 w-full">
          {!showForm ? (
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-20 h-1 bg-[#375DEE] mx-auto mb-8 animate-fade-in" />
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-8 animate-fade-in" style={{ animationDelay: "0.1s", fontFamily: 'var(--font-display)' }}>
                About <span className="text-[#375DEE]">Scale Exotics</span>
              </h1>
              <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-12 animate-fade-in font-light" style={{ animationDelay: "0.2s" }}>
                We help exotic car rental fleet owners build automated systems that generate consistent $50k+ months on autopilot.
              </p>

              {/* Stats */}
              <div className="flex flex-row items-center justify-center text-white mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                {[
                  { value: "$2.4M+", label: "Revenue Generated" },
                  { value: "50+", label: "Fleet Partners" },
                  { value: "3X", label: "Avg. Growth" }
                ].map((stat, i) => (
                  <div key={stat.label} className="flex flex-col items-center px-4 md:px-12">
                    <span className="text-2xl md:text-5xl font-bold text-[#375DEE]" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</span>
                    <span className="text-[10px] md:text-sm text-white/50 mt-1">{stat.label}</span>
                    {i < 2 && <div className="hidden" />}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-3 px-10 py-5 bg-[#375DEE] hover:bg-[#4169E1] text-white text-lg rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(55,93,238,0.4)] animate-fade-in"
                style={{ animationDelay: "0.4s", fontFamily: 'var(--font-display)' }}
              >
                Work With Us
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          ) : isSubmitted ? (
            <div className="max-w-md mx-auto text-center animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-[#375DEE]/20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Thank You!</h3>
              <p className="text-white/60 text-lg">We&apos;ll be in touch with you shortly.</p>
            </div>
          ) : (
            <div className="max-w-md mx-auto animate-fade-in">
              <div className="w-12 h-1 bg-[#375DEE] mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-8" style={{ fontFamily: 'var(--font-display)' }}>Get Started</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { field: "name", type: "text", placeholder: "Your Name" },
                  { field: "business", type: "text", placeholder: "Business Name" },
                  { field: "email", type: "email", placeholder: "Email Address" },
                  { field: "phone", type: "tel", placeholder: "Phone Number" }
                ].map(({ field, type, placeholder }) => (
                  <div key={field}>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={formData[field as keyof typeof formData]}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      className={`w-full px-5 py-4 rounded-xl bg-white/5 backdrop-blur-md border ${errors[field] ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-base`}
                    />
                    {errors[field] && <p className="text-red-400 text-xs mt-1 ml-1">{errors[field]}</p>}
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 text-white text-lg rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(55,93,238,0.4)] disabled:opacity-50 disabled:cursor-not-allowed bg-[#375DEE] hover:bg-[#4169E1] mt-4"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </form>
              <button onClick={() => setShowForm(false)} className="w-full text-center text-sm text-white/50 hover:text-white/70 transition mt-6 py-2">
                ← Back
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Mission Section */}
      <section
        id="mission"
        ref={setRef("mission")}
        className="relative py-24 md:py-32"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`transition-all duration-1000 ${isVisible("mission") ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}`}>
              <div className="w-12 h-1 bg-[#375DEE] mb-6" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                Our <span className="text-[#375DEE]">Mission</span>
              </h2>
              <p className="text-white/50 text-lg leading-relaxed mb-6">
                We believe exotic car rental businesses deserve better than manual lead chasing and inconsistent revenue. Our mission is to give every fleet owner the automated systems they need to scale predictably.
              </p>
              <p className="text-white/50 text-lg leading-relaxed">
                We&apos;ve generated over $2.4M in revenue for our partners by building systems that attract, convert, and retain high-intent renters automatically.
              </p>
            </div>
            <div className={`relative transition-all duration-1000 ${isVisible("mission") ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`} style={{ transitionDelay: "200ms" }}>
              <div className="relative rounded-3xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=2670&auto=format&fit=crop"
                  alt="Exotic car"
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute inset-0 bg-[#375DEE]/10" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-[#375DEE] rounded-2xl p-6 shadow-2xl shadow-[#375DEE]/20">
                <div className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>90 Days</div>
                <div className="text-sm text-white/70">To Results</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section
        id="services"
        ref={setRef("services")}
        className="relative py-24 md:py-32 bg-gradient-to-b from-[#375DEE]/5 to-transparent"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible("services") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <span className="text-[#375DEE] text-sm tracking-widest uppercase mb-4 block">What We Offer</span>
            <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Our <span className="text-[#375DEE]">Services</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Lead Magnet", desc: "Targeted acquisition systems that pull high-intent renters toward your fleet.", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
              { title: "Conversion System", desc: "AI-powered systems that qualify leads and book rentals automatically.", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
              { title: "Insight Engine", desc: "Real-time dashboards and forecasting to maximize every vehicle.", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" }
            ].map((service, i) => (
              <div
                key={service.title}
                className={`group p-8 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-[#375DEE]/30 transition-all duration-700 ${isVisible("services") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: `${(i + 1) * 150}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-[#375DEE]/10 border border-[#375DEE]/30 flex items-center justify-center text-[#375DEE] mb-6 group-hover:bg-[#375DEE]/20 transition-colors">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={service.icon} />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>{service.title}</h3>
                <p className="text-white/50 leading-relaxed">{service.desc}</p>
                <div className="w-12 h-[2px] bg-[#375DEE] mt-6 group-hover:w-20 transition-all duration-300" />
              </div>
            ))}
          </div>

          <div className={`text-center mt-12 transition-all duration-1000 ${isVisible("services") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`} style={{ transitionDelay: "600ms" }}>
            <a href="/services" className="inline-flex items-center gap-2 text-[#375DEE] hover:text-white transition-colors">
              View All Services
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="cta"
        ref={setRef("cta")}
        className="relative py-24 md:py-32"
      >
        <div className={`max-w-4xl mx-auto px-6 lg:px-8 text-center transition-all duration-1000 ${isVisible("cta") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <div className="p-12 md:p-16 rounded-3xl border border-white/[0.06] bg-gradient-to-b from-[#375DEE]/10 to-transparent">
            <div className="w-20 h-1 bg-[#375DEE] mx-auto mb-8" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              Ready to <span className="text-[#375DEE]">Grow</span>?
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto mb-10">
              Book a call to see how we can help scale your rental business to $50k+/month.
            </p>
            <a
              href="/survey"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[#375DEE] hover:bg-[#4169E1] text-white text-lg rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(55,93,238,0.4)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Get Started
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 md:py-20 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 md:gap-8 mb-12">
            <div className="md:col-span-2">
              <img src="/scalexoticslong.png" alt="Scale Exotics" className="h-7 w-auto mb-4" />
              <p className="text-white/40 text-sm max-w-sm leading-relaxed">
                Helping exotic car rental fleet owners build automated systems that generate consistent $50k+ months.
              </p>
              <div className="w-16 h-1 bg-[#375DEE] mt-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-medium mb-4">Quick Links</h4>
              <div className="flex flex-col gap-3">
                <a href="/" className="text-white/40 text-sm hover:text-[#375DEE] transition-colors">Home</a>
                <a href="/services" className="text-white/40 text-sm hover:text-[#375DEE] transition-colors">Services</a>
                <a href="/survey" className="text-white/40 text-sm hover:text-[#375DEE] transition-colors">Get Started</a>
              </div>
            </div>
            <div>
              <h4 className="text-white text-sm font-medium mb-4">Legal</h4>
              <div className="flex flex-col gap-3">
                <a href="/privacy-policy" className="text-white/40 text-sm hover:text-[#375DEE] transition-colors">Privacy Policy</a>
                <a href="/tos" className="text-white/40 text-sm hover:text-[#375DEE] transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-xs">© {new Date().getFullYear()} Scale Exotics. All rights reserved.</p>
            <p className="text-white/20 text-[10px] max-w-lg text-center md:text-right">
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
