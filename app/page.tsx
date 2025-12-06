"use client"

import { useState } from "react"

export default function Home() {
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation - minimal on mobile */}
      <nav className="flex items-center justify-between px-4 md:px-6 py-2 md:py-4 border-b border-white/10">
        <div className="flex items-center">
          <img src="/scalexoticslogo.png" alt="Scale Exotics" className="h-14 md:h-16 w-auto" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-0 md:px-8 py-0 md:py-4 flex items-center justify-center">
        <div className="w-full md:max-w-[67vw] mx-auto h-full md:h-auto">
          <div className="relative w-full md:rounded-2xl overflow-hidden h-[calc(100vh-80px)] md:h-auto md:aspect-video">
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
            {/* Dark overlay - stronger on mobile for readability */}
            <div className="absolute inset-0 bg-black/70 md:bg-black/60 pointer-events-none" />
            
            {/* Dynamic Island CTA */}
            <div className="absolute inset-0 flex items-center justify-center px-4 md:p-0">
              <div className="bg-black/50 backdrop-blur-xl rounded-2xl md:rounded-[2rem] px-6 md:px-10 py-6 md:py-8 flex flex-col items-center gap-4 md:gap-6 max-w-sm md:max-w-xl mx-0 md:mx-4 border border-white/10 shadow-2xl">
                {/* Logo */}
                <img 
                  src="/scalexotics.png" 
                  alt="Scale Exotics" 
                  className="h-7 md:h-12 w-auto"
                />
                
                {!showForm ? (
                  <div className="flex flex-col items-center gap-5 md:gap-6 animate-fade-in">
                    {/* Main heading */}
                    <h2 className="text-xl md:text-3xl font-bold text-white text-center leading-tight">
                      <span className="md:hidden">Proven Systems for Exotic Rental Businesses</span>
                      <span className="hidden md:inline">Proven Systems for Exotic and Luxury Rental Businesses</span>
                    </h2>
                    
                    {/* Features - horizontal on mobile, cleaner layout */}
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:gap-8 text-white/70 text-sm md:text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#375DEE]" />
                        <span>Booking Engine</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#375DEE]" />
                        <span>ProfitStack</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#375DEE]" />
                        <span>24/7 Support</span>
                      </div>
                    </div>
                    
                    {/* CTA Button - larger on mobile */}
                    <button
                      onClick={() => setShowForm(true)}
                      className="w-full md:w-auto px-10 py-4 md:py-3.5 font-semibold text-white text-base rounded-2xl md:rounded-xl transition hover:scale-105 hover:shadow-lg shadow-lg cursor-pointer bg-[#375DEE]"
                    >
                      Get Started
                    </button>
                    
                    {/* Trust text */}
                    <p className="text-xs md:text-xs text-white/50 text-center">
                      Trusted by 50+ exotic rental businesses nationwide
                    </p>
                  </div>
                ) : isSubmitted ? (
                  <div className="flex flex-col items-center gap-5 animate-fade-in text-center">
                    <div className="w-20 h-20 md:w-16 md:h-16 rounded-full bg-[#375DEE]/20 flex items-center justify-center">
                      <svg className="w-10 h-10 md:w-8 md:h-8 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl md:text-xl font-bold text-white">Thank You!</h3>
                    <p className="text-white/60 text-base md:text-sm">We&apos;ll be in touch with you shortly.</p>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center gap-4 md:gap-4 animate-fade-in">
                    {/* Lead Form */}
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 md:gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Your Name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className={`w-full px-4 py-3.5 md:py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border ${errors.name ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-base md:text-sm`}
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1 ml-1">{errors.name}</p>}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Business Name"
                          value={formData.business}
                          onChange={(e) => handleInputChange("business", e.target.value)}
                          className={`w-full px-4 py-3.5 md:py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border ${errors.business ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-base md:text-sm`}
                        />
                        {errors.business && <p className="text-red-400 text-xs mt-1 ml-1">{errors.business}</p>}
                      </div>
                      <div>
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className={`w-full px-4 py-3.5 md:py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border ${errors.email ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-base md:text-sm`}
                        />
                        {errors.email && <p className="text-red-400 text-xs mt-1 ml-1">{errors.email}</p>}
                      </div>
                      <div>
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          className={`w-full px-4 py-3.5 md:py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border ${errors.phone ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-base md:text-sm`}
                        />
                        {errors.phone && <p className="text-red-400 text-xs mt-1 ml-1">{errors.phone}</p>}
                      </div>
                      
                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 md:py-3 font-semibold text-white text-base rounded-2xl md:rounded-xl transition hover:scale-105 hover:shadow-lg shadow-lg cursor-pointer mt-2 md:mt-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-[#375DEE]"
                      >
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </button>
                    </form>
                    
                    {/* Back link */}
                    <button
                      onClick={() => setShowForm(false)}
                      className="text-sm md:text-xs text-white/50 hover:text-white/70 transition cursor-pointer py-2"
                    >
                      ← Back
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - hidden on mobile, full on desktop */}
      <footer className="hidden md:block px-6 py-12 border-t border-border/30 mt-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">Scale Exotics Marketing</p>
              <p>932 SW 1st Ave</p>
              <p>Miami, FL 33130</p>
              <p>
                Support:{" "}
                <a href="mailto:info@scalexotics.com" className="hover:text-foreground transition">
                  info@scalexotics.com
                </a>
              </p>
            </div>
            <div className="text-sm text-muted-foreground flex gap-3">
              <a href="/tos" className="hover:text-foreground transition underline underline-offset-2">
                Terms of Service
              </a>
              <span>|</span>
              <a href="/privacy-policy" className="hover:text-foreground transition underline underline-offset-2">
                Privacy Policy
              </a>
            </div>
          </div>

          {/* Facebook Disclaimer */}
          <div className="border-t border-border/30 pt-6">
            <p className="text-xs text-muted-foreground leading-relaxed text-center">
              NOT FACEBOOK: This site is not a part of the Facebook website or Facebook Inc. Additionally, this site is
              NOT endorsed by Facebook in any way. FACEBOOK is a trademark of FACEBOOK, Inc.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Mobile Footer - minimal inline links */}
      <footer className="md:hidden px-4 py-3 border-t border-border/30">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <a href="mailto:info@scalexotics.com" className="hover:text-foreground transition">
            Contact
          </a>
          <span className="text-white/20">•</span>
          <a href="/tos" className="hover:text-foreground transition">
            Terms
          </a>
          <span className="text-white/20">•</span>
          <a href="/privacy-policy" className="hover:text-foreground transition">
            Privacy
          </a>
        </div>
      </footer>
    </div>
  )
}
