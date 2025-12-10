"use client"

import { useState } from "react"
import { bebasNeue } from "./fonts"

export default function Home() {
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    email: "",
    phone: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string) => {
    // Accepts formats: (123) 456-7890, 123-456-7890, 1234567890, +1234567890
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
    return phoneRegex.test(phone.replace(/\s/g, ""))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.business.trim()) {
      newErrors.business = "Business name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      await fetch("https://willcldrr.app.n8n.cloud/webhook-test/lead-capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Navigation - glass effect on mobile, clean on desktop */}
      <nav className="absolute top-0 left-0 right-0 z-20 md:relative flex items-center justify-between px-6 md:px-8 py-4 md:py-5 bg-black/50 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none">
        <div className="flex items-center">
          <img src="/scalexoticslong.png" alt="Scale Exotics" className="h-8 md:h-10 w-auto" />
          </div>
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="/about" className="text-sm text-white/60 hover:text-white transition">About</a>
          <a href="/services" className="text-sm text-white/60 hover:text-white transition">Services</a>
        </div>
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden relative w-10 h-10 flex items-center justify-center"
          aria-label="Toggle menu"
        >
          <div className={`relative w-5 h-5 transition-all duration-300 ${mobileMenuOpen ? "rotate-180" : ""}`}>
            <span
              className={`absolute left-0 block h-[2px] w-full bg-white rounded-full transition-all duration-300 ease-out ${
                mobileMenuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 -translate-y-1/2 block h-[2px] bg-white rounded-full transition-all duration-300 ease-out ${
                mobileMenuOpen ? "w-0 opacity-0" : "w-full"
              }`}
            />
            <span
              className={`absolute left-0 block h-[2px] w-full bg-white rounded-full transition-all duration-300 ease-out ${
                mobileMenuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
              }`}
            />
          </div>
        </button>
      </nav>

      {/* Mobile Menu Button - Fixed X that stays on top of overlay */}
      <button
        onClick={() => setMobileMenuOpen(false)}
        className={`md:hidden fixed top-4 right-6 z-[60] w-10 h-10 flex items-center justify-center transition-all duration-300 ${
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        aria-label="Close menu"
      >
        <div className="relative w-6 h-6">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 block h-[2px] w-full bg-white rounded-full rotate-45 transition-transform" />
          <span className="absolute left-0 top-1/2 -translate-y-1/2 block h-[2px] w-full bg-white rounded-full -rotate-45 transition-transform" />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ease-out ${
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
        <div className="relative h-full flex flex-col items-center justify-center gap-10">
          <a
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={`${bebasNeue.className} text-4xl text-white hover:text-[#375DEE] transition-all duration-300 ${
              mobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: mobileMenuOpen ? "100ms" : "0ms" }}
          >
            ABOUT
          </a>
          <a
            href="/services"
            onClick={() => setMobileMenuOpen(false)}
            className={`${bebasNeue.className} text-4xl text-white hover:text-[#375DEE] transition-all duration-300 ${
              mobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: mobileMenuOpen ? "200ms" : "0ms" }}
          >
            SERVICES
          </a>
        </div>
      </div>

      {/* Header Divider - 1px, full width across page */}
      <div className="hidden md:block h-px bg-white/10 w-full" />

      {/* Main Content - full viewport hero with video background */}
      <main className="relative h-screen w-full overflow-hidden -mt-px">
            {/* Desktop Video (1920x1080) - hidden on mobile */}
            <iframe
              src="https://customer-d0ejbh5tg4plprv9.cloudflarestream.com/51c203f4112210e3cec774edc299a14f/iframe?autoplay=true&muted=true&controls=false&defaultQuality=max&loop=true"
              className="absolute inset-0 w-full h-full hidden md:block"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
            {/* Mobile Video (1080x1920) - hidden on desktop */}
            <iframe
              src="https://customer-d0ejbh5tg4plprv9.cloudflarestream.com/0be1cc7d9f67938db82c2b20665cb194/iframe?autoplay=true&muted=true&controls=false&defaultQuality=max&loop=true"
              className="absolute inset-0 w-full h-full block md:hidden object-cover"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
            {/* Dark overlay - gradient 45-55% for readable text */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 to-black/45 pointer-events-none" />
            
            {/* Content overlay - text directly on video */}
            <div className="absolute inset-0 flex items-center justify-center px-6 md:px-8">
                
                {!showForm ? (
                  <div className="flex flex-col items-center gap-8 md:gap-12 animate-fade-in text-center max-w-5xl">
                    {/* Main heading - much larger, bold display font */}
                    <h1 className={`${bebasNeue.className} text-5xl md:text-8xl lg:text-9xl text-white leading-[0.9] tracking-tight`}>
                      <span className="md:hidden">GROW YOUR<br />RENTAL EMPIRE</span>
                      <span className="hidden md:block">GROW YOUR<br />RENTAL EMPIRE</span>
            </h1>
                    
                    {/* Social proof stats - side by side on all devices */}
                    <div className="flex flex-row items-center text-white">
                      <div className="flex flex-col items-center px-3 md:px-12">
                        <span className={`${bebasNeue.className} text-2xl md:text-6xl text-[#375DEE]`}>$2.4M+</span>
                        <span className="text-[10px] md:text-sm text-white/60 mt-1">Revenue Generated</span>
                      </div>
                      <div className="w-px h-10 md:h-16 bg-white/20" />
                      <div className="flex flex-col items-center px-3 md:px-12">
                        <span className={`${bebasNeue.className} text-2xl md:text-6xl text-[#375DEE]`}>50+</span>
                        <span className="text-[10px] md:text-sm text-white/60 mt-1">Fleet Partners</span>
                      </div>
                      <div className="w-px h-10 md:h-16 bg-white/20" />
                      <div className="flex flex-col items-center px-3 md:px-12">
                        <span className={`${bebasNeue.className} text-2xl md:text-6xl text-[#375DEE]`}>3X</span>
                        <span className="text-[10px] md:text-sm text-white/60 mt-1">Avg. Revenue Growth</span>
                      </div>
          </div>

                    {/* CTA Button - larger */}
                    <button
                      onClick={() => setShowForm(true)}
                      className={`${bebasNeue.className} px-12 md:px-16 py-4 md:py-5 text-white text-xl md:text-2xl tracking-wider rounded-xl transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(55,93,238,0.5)] shadow-2xl cursor-pointer bg-gradient-to-r from-[#375DEE] to-[#5B7FFF] border border-white/25`}
                    >
                      WORK WITH US
                    </button>
                    
                  </div>
                ) : isSubmitted ? (
                  <div className="flex flex-col items-center gap-6 animate-fade-in text-center">
                    <div className="w-24 h-24 rounded-full bg-[#375DEE]/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-12 h-12 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className={`${bebasNeue.className} text-4xl md:text-5xl text-white`}>THANK YOU!</h3>
                    <p className="text-white/60 text-lg">We&apos;ll be in touch with you shortly.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6 animate-fade-in max-w-md w-full">
                    <h2 className={`${bebasNeue.className} text-3xl md:text-4xl text-white text-center`}>GET STARTED</h2>
                    
                    {/* Lead Form */}
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                      <div>
                        <input
                          type="text"
                          placeholder="Your Name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className={`w-full px-5 py-4 rounded-xl bg-black/40 backdrop-blur-md border ${errors.name ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-base`}
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1 ml-1">{errors.name}</p>}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Business Name"
                          value={formData.business}
                          onChange={(e) => handleInputChange("business", e.target.value)}
                          className={`w-full px-5 py-4 rounded-xl bg-black/40 backdrop-blur-md border ${errors.business ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-base`}
                        />
                        {errors.business && <p className="text-red-400 text-xs mt-1 ml-1">{errors.business}</p>}
                      </div>
                      <div>
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className={`w-full px-5 py-4 rounded-xl bg-black/40 backdrop-blur-md border ${errors.email ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-base`}
                        />
                        {errors.email && <p className="text-red-400 text-xs mt-1 ml-1">{errors.email}</p>}
                      </div>
                      <div>
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          className={`w-full px-5 py-4 rounded-xl bg-black/40 backdrop-blur-md border ${errors.phone ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-base`}
                        />
                        {errors.phone && <p className="text-red-400 text-xs mt-1 ml-1">{errors.phone}</p>}
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`${bebasNeue.className} w-full py-5 text-white text-xl tracking-wider rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(55,93,238,0.5)] shadow-2xl cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-gradient-to-r from-[#375DEE] to-[#5B7FFF] border border-white/20`}
                      >
                        {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
                      </button>
                    </form>
                    
                    {/* Back link */}
                    <button
                      onClick={() => setShowForm(false)}
                      className="text-sm text-white/50 hover:text-white/70 transition cursor-pointer py-2"
                    >
                      ← Back
                    </button>
                  </div>
                )}
            </div>
      </main>

      {/* Services Section */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-black">
        <div className="max-w-5xl mx-auto">
          <h2 className={`${bebasNeue.className} text-4xl md:text-5xl text-white text-center mb-12 md:mb-16`}>
            OUR SERVICES
          </h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            
            {/* Lead Magnet */}
            <div className="bg-white/[0.03] rounded-2xl p-6 md:p-8 border border-white/10 hover:border-[#375DEE]/30 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-[#375DEE]/20 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className={`${bebasNeue.className} text-2xl text-white mb-3`}>LEAD MAGNET</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                Build nonstop inbound demand. This system pulls high intent renters toward your fleet.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-white/40 text-xs">
                  <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Targeted acquisition systems
                </li>
                <li className="flex items-center gap-2 text-white/40 text-xs">
                  <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Automated inbound capture
                </li>
                <li className="flex items-center gap-2 text-white/40 text-xs">
                  <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  High-intent traffic funnels
                </li>
              </ul>
            </div>

            {/* Conversion System */}
            <div className="bg-white/[0.03] rounded-2xl p-6 md:p-8 border border-white/10 hover:border-[#375DEE]/30 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-[#375DEE]/20 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className={`${bebasNeue.className} text-2xl text-white mb-3`}>CONVERSION SYSTEM</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                Convert every inquiry into revenue with a frictionless booking path.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-white/40 text-xs">
                  <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Instant response + follow-ups
                </li>
                <li className="flex items-center gap-2 text-white/40 text-xs">
                  <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  AI-driven qualification
                </li>
                <li className="flex items-center gap-2 text-white/40 text-xs">
                  <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Booking flow optimization
                </li>
              </ul>
            </div>

            {/* Insight Engine */}
            <div className="bg-white/[0.03] rounded-2xl p-6 md:p-8 border border-white/10 hover:border-[#375DEE]/30 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-[#375DEE]/20 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className={`${bebasNeue.className} text-2xl text-white mb-3`}>INSIGHT ENGINE</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                See the entire business with absolute clarity. Track performance and forecast demand.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-white/40 text-xs">
                  <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Live performance dashboards
                </li>
                <li className="flex items-center gap-2 text-white/40 text-xs">
                  <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Revenue + demand forecasting
                </li>
                <li className="flex items-center gap-2 text-white/40 text-xs">
                  <svg className="w-4 h-4 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Actionable insights and alerts
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-8 py-16 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white/[0.03] rounded-2xl p-8 md:p-12 border border-white/10">
            <h2 className={`${bebasNeue.className} text-3xl md:text-4xl text-white mb-4`}>
              READY TO GROW?
            </h2>
            <p className="text-white/50 text-sm md:text-base mb-6">
              Book a call to see how we can help scale your rental business.
            </p>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setShowForm(true), 500);
              }}
              className={`${bebasNeue.className} px-10 py-3.5 text-white text-lg tracking-wider rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(55,93,238,0.4)] shadow-lg cursor-pointer bg-gradient-to-r from-[#375DEE] to-[#5B7FFF] border border-white/25`}
            >
              WORK WITH US
            </button>
          </div>
        </div>
      </section>

      {/* Footer - below the fold, scroll to see, mt-64px mb-64px on contact block */}
      <footer className="px-6 md:px-8 py-16 md:py-16 bg-black border-t border-white/[0.06] mt-16 md:mt-0">
        <div className="max-w-4xl mx-auto space-y-8 md:space-y-8">
          {/* Logo and info - mt-64px mb-64px */}
          <div className="flex flex-col items-center gap-4 md:gap-5 text-center my-8 md:my-16">
            <img src="/scalexoticslong.png" alt="Scale Exotics" className="h-6 md:h-7 w-auto opacity-60" />
            <div className="text-xs md:text-sm text-white/40 space-y-1">
              <p>932 SW 1st Ave, Miami, FL 33130</p>
              <p>
                <a href="mailto:info@scalexotics.com" className="hover:text-white/60 transition-colors">
                  info@scalexotics.com
                </a>
              </p>
            </div>
            </div>
          
          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          {/* Links */}
          <div className="flex justify-center gap-6 text-xs text-white/30 my-8 md:my-16">
            <a href="/about" className="hover:text-white/50 transition-colors">About</a>
            <span className="text-white/10">•</span>
            <a href="/services" className="hover:text-white/50 transition-colors">Services</a>
            <span className="text-white/10">•</span>
            <a href="/tos" className="hover:text-white/50 transition-colors">Terms of Service</a>
            <span className="text-white/10">•</span>
            <a href="/privacy-policy" className="hover:text-white/50 transition-colors">Privacy Policy</a>
          </div>

          {/* Facebook Disclaimer */}
          <p className="text-[10px] text-white/20 leading-relaxed text-center max-w-2xl mx-auto">
            This site is not a part of the Facebook website or Facebook Inc. Additionally, this site is
              NOT endorsed by Facebook in any way. FACEBOOK is a trademark of FACEBOOK, Inc.
            </p>
          
          {/* Copyright */}
          <p className="text-[10px] text-white/20 text-center">
            © {new Date().getFullYear()} Scale Exotics. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
