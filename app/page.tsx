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
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center">
          <img src="/scalexoticslogo.png" alt="Scale Exotics" className="h-16 w-auto" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-4 flex items-center justify-center">
        <div className="w-full max-w-[67vw] mx-auto">
          <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <iframe
              src="https://customer-d0ejbh5tg4plprv9.cloudflarestream.com/51c203f4112210e3cec774edc299a14f/iframe?autoplay=true&muted=true&controls=false&defaultQuality=max&loop=true"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/60 pointer-events-none" />
            
            {/* Dynamic Island CTA */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/60 backdrop-blur-xl rounded-[2rem] px-10 py-8 flex flex-col items-center gap-6 max-w-xl mx-4 border border-white/10 shadow-2xl">
                {/* Logo */}
                <img 
                  src="/scalexotics.png" 
                  alt="Scale Exotics" 
                  className="h-10 md:h-12 w-auto"
                />
                
                {!showForm ? (
                  <div className="flex flex-col items-center gap-6 animate-fade-in">
                    {/* Main heading */}
                    <h2 className="text-2xl md:text-3xl font-bold text-white text-center leading-tight">
                      Proven Systems for Exotic and Luxury Rental Businesses
                    </h2>
                    
                    {/* Features */}
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-white/80 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#375DEE" }} />
                        <span>Booking Engine</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#375DEE" }} />
                        <span>Profit Stack</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#375DEE" }} />
                        <span>24/7 Support</span>
                      </div>
                    </div>
                    
                    {/* CTA Button */}
                    <button
                      onClick={() => setShowForm(true)}
                      className="px-10 py-3.5 font-semibold text-white rounded-xl transition hover:scale-105 hover:shadow-lg shadow-md cursor-pointer"
                      style={{ backgroundColor: "#375DEE" }}
                    >
                      Get Started
                    </button>
                    
                    {/* Trust text */}
                    <p className="text-xs text-white/40">
                      Trusted by 50+ exotic rental businesses nationwide
                    </p>
                  </div>
                ) : isSubmitted ? (
                  <div className="flex flex-col items-center gap-4 animate-fade-in text-center">
                    <div className="w-16 h-16 rounded-full bg-[#375DEE]/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#375DEE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Thank You!</h3>
                    <p className="text-white/60 text-sm">We&apos;ll be in touch with you shortly.</p>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
                    {/* Lead Form */}
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Your Name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl bg-white/10 border ${errors.name ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-sm`}
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1 ml-1">{errors.name}</p>}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Business Name"
                          value={formData.business}
                          onChange={(e) => handleInputChange("business", e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl bg-white/10 border ${errors.business ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-sm`}
                        />
                        {errors.business && <p className="text-red-400 text-xs mt-1 ml-1">{errors.business}</p>}
                      </div>
                      <div>
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl bg-white/10 border ${errors.email ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-sm`}
                        />
                        {errors.email && <p className="text-red-400 text-xs mt-1 ml-1">{errors.email}</p>}
                      </div>
                      <div>
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl bg-white/10 border ${errors.phone ? "border-red-500" : "border-white/20"} text-white placeholder:text-white/50 focus:outline-none focus:border-[#375DEE] transition text-sm`}
                        />
                        {errors.phone && <p className="text-red-400 text-xs mt-1 ml-1">{errors.phone}</p>}
                      </div>
                      
                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full px-10 py-3 font-semibold text-white rounded-xl transition hover:scale-105 hover:shadow-lg shadow-md cursor-pointer mt-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        style={{ backgroundColor: "#375DEE" }}
                      >
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </button>
                    </form>
                    
                    {/* Back link */}
                    <button
                      onClick={() => setShowForm(false)}
                      className="text-xs text-white/40 hover:text-white/60 transition cursor-pointer"
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

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border/30 mt-auto">
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
    </div>
  )
}
