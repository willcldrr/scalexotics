"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Palette,
  Image as ImageIcon,
  Building,
  Mail,
  Phone,
  Globe,
  Save,
  Loader2,
  Check,
  Eye,
  AlertCircle,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react"

interface BrandingSettings {
  id?: string
  company_name: string
  logo_url: string | null
  primary_color: string
  background_color: string
  support_email: string | null
  support_phone: string | null
  website_url: string | null
}

interface CustomDomain {
  id: string
  domain: string
  verified: boolean
  verification_token: string
  ssl_status: string
  created_at: string
}

const defaultBranding: BrandingSettings = {
  company_name: "",
  logo_url: null,
  primary_color: "#375DEE",
  background_color: "#000000",
  support_email: null,
  support_phone: null,
  website_url: null,
}

export default function BrandingSettings() {
  const supabase = createClient()
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding)
  const [customDomain, setCustomDomain] = useState<CustomDomain | null>(null)
  const [newDomain, setNewDomain] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [domainSaving, setDomainSaving] = useState(false)
  const [domainError, setDomainError] = useState<string | null>(null)
  const [domainVerifying, setDomainVerifying] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchBranding()
  }, [])

  const fetchBranding = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Fetch existing branding
    const { data } = await supabase
      .from("business_branding")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (data) {
      setBranding(data)
    } else {
      // Try to get defaults from profile/ai_settings
      const [profileRes, aiRes] = await Promise.all([
        supabase.from("profiles").select("company_name, email").eq("id", user.id).single(),
        supabase.from("ai_settings").select("business_name, business_phone").eq("user_id", user.id).single(),
      ])

      setBranding({
        ...defaultBranding,
        company_name: aiRes.data?.business_name || profileRes.data?.company_name || "",
        support_email: profileRes.data?.email || null,
        support_phone: aiRes.data?.business_phone || null,
      })
    }

    // Fetch custom domain
    const { data: domainData } = await supabase
      .from("custom_domains")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (domainData) {
      setCustomDomain(domainData)
    }

    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError("Not authenticated")
      setSaving(false)
      return
    }

    // Check if branding exists
    const { data: existing } = await supabase
      .from("business_branding")
      .select("id")
      .eq("user_id", user.id)
      .single()

    const brandingData = {
      user_id: user.id,
      company_name: branding.company_name,
      logo_url: branding.logo_url || null,
      primary_color: branding.primary_color,
      background_color: branding.background_color,
      support_email: branding.support_email || null,
      support_phone: branding.support_phone || null,
      website_url: branding.website_url || null,
    }

    let result
    if (existing) {
      result = await supabase
        .from("business_branding")
        .update(brandingData)
        .eq("user_id", user.id)
    } else {
      result = await supabase
        .from("business_branding")
        .insert(brandingData)
    }

    if (result.error) {
      setError(result.error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }

    setSaving(false)
  }

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return

    setDomainSaving(true)
    setDomainError(null)

    try {
      const response = await fetch("/api/domains/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setDomainError(data.error || "Failed to add domain")
      } else {
        setCustomDomain(data.domain)
        setNewDomain("")
        if (data.vercelError) {
          setDomainError(data.vercelError)
        }
      }
    } catch (err) {
      setDomainError("Failed to add domain. Please try again.")
    }

    setDomainSaving(false)
  }

  const handleVerifyDomain = async () => {
    if (!customDomain) return

    setDomainVerifying(true)
    setDomainError(null)

    try {
      const response = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()
      console.log("Domain verification response:", data)

      if (data.domain) {
        setCustomDomain(data.domain)
      }

      if (data.error) {
        setDomainError(data.error)
      } else if (data.status === "added_to_vercel") {
        // Domain was just added to Vercel
        setDomainError("Domain registered with Vercel! Please wait 2-5 minutes for DNS to propagate, then verify again.")
      } else if (data.status === "vercel_error") {
        setDomainError(data.message || "Error communicating with Vercel. Please try again.")
      } else if (!data.domain?.verified) {
        // Show verification requirements if available
        if (data.vercelData?.verification) {
          const v = data.vercelData.verification
          setDomainError(`DNS propagating... Vercel is checking for your CNAME record. This can take up to 48 hours, but usually completes within 10-30 minutes.`)
        } else {
          setDomainError(data.message || "DNS not configured yet. Please wait a few minutes and try again.")
        }
      }
    } catch (err) {
      console.error("Verification error:", err)
      setDomainError("Failed to verify domain. Please try again.")
    }

    setDomainVerifying(false)
  }

  const handleRemoveDomain = async () => {
    if (!customDomain) return

    const { error } = await supabase
      .from("custom_domains")
      .delete()
      .eq("id", customDomain.id)

    if (!error) {
      setCustomDomain(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#375DEE]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Business Branding</h2>
        <p className="text-white/50 text-sm">
          Customize how your business appears on customer-facing pages like invoices, booking confirmations, and agreements.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Custom Domain Section */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-6">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-[#375DEE]" />
          <h3 className="text-lg font-bold">Custom Domain</h3>
        </div>
        <p className="text-white/50 text-sm">
          Use your own domain for all customer-facing pages. Your customers will never see Scale Exotics branding.
        </p>

        {customDomain ? (
          <div className="space-y-4">
            {/* Domain Status Card */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                {customDomain.verified ? (
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{customDomain.domain}</p>
                  <p className="text-xs text-white/40">
                    {customDomain.verified ? "Connected & Active" : "Waiting for DNS setup..."}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveDomain}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Remove domain"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Domain Error Display */}
            {domainError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {domainError}
              </div>
            )}

            {/* DNS Setup Instructions */}
            {!customDomain.verified && (
              <div className="space-y-4">
                {/* Progress Steps */}
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">1</div>
                    <span className="text-green-400">Domain Added</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-white/20" />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-white">2</div>
                    <span className="text-yellow-400">Configure DNS</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-white/20" />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white/40">3</div>
                    <span className="text-white/40">Verified</span>
                  </div>
                </div>

                {/* Safety Notice */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-400 mb-1">Your main website will NOT be affected</p>
                    <p className="text-white/60">
                      You're adding a <span className="text-white font-medium">new subdomain</span> ({customDomain.domain.split(".")[0]}) that points to Scale Exotics.
                      Your existing website at <span className="text-white font-mono">{customDomain.domain.split(".").slice(1).join(".")}</span> will continue working normally.
                    </p>
                  </div>
                </div>

                {/* Step by Step Instructions */}
                <div className="bg-[#375DEE]/10 border border-[#375DEE]/30 rounded-xl p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#375DEE]" />
                    <h4 className="font-bold text-[#375DEE]">Complete These Steps to Connect Your Domain</h4>
                  </div>

                  {/* Step 1 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#375DEE] flex items-center justify-center text-xs font-bold text-white">1</div>
                      <h5 className="font-bold text-white">Log in to your domain provider</h5>
                    </div>
                    <p className="text-white/60 text-sm ml-8">
                      Go to where you bought your domain (GoDaddy, Namecheap, Google Domains, Cloudflare, etc.) and find the DNS settings.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#375DEE] flex items-center justify-center text-xs font-bold text-white">2</div>
                      <h5 className="font-bold text-white">Add a new CNAME record</h5>
                    </div>
                    <p className="text-white/60 text-sm ml-8">
                      Click "Add Record" or "Add DNS Record" and create a <span className="text-white font-medium">new</span> record with these exact values.
                      <span className="text-yellow-400"> Do NOT edit any existing records.</span>
                    </p>
                    <div className="ml-8 bg-black/30 rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-white/40 text-xs mb-1">Type</p>
                          <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                            <span className="font-mono font-bold text-white">CNAME</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs mb-1">Name / Host</p>
                          <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                            <span className="font-mono font-bold text-white">{customDomain.domain.split(".")[0]}</span>
                            <button
                              onClick={() => copyToClipboard(customDomain.domain.split(".")[0])}
                              className="p-1 hover:bg-white/10 rounded ml-2"
                              title="Copy"
                            >
                              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/40" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs mb-1">Value / Points to</p>
                          <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                            <span className="font-mono font-bold text-white text-xs">cname.vercel-dns.com</span>
                            <button
                              onClick={() => copyToClipboard("cname.vercel-dns.com")}
                              className="p-1 hover:bg-white/10 rounded ml-2"
                              title="Copy"
                            >
                              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/40" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="text-white/40 text-xs">
                        If asked for TTL, use "Auto" or "3600"
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#375DEE] flex items-center justify-center text-xs font-bold text-white">3</div>
                      <h5 className="font-bold text-white">Save and verify your DNS</h5>
                    </div>
                    <p className="text-white/60 text-sm ml-8">
                      Save your DNS changes, then click the button below to verify. DNS propagation usually takes 5-15 minutes, but can take up to 48 hours.
                    </p>
                    <div className="ml-8 mt-3">
                      <button
                        onClick={handleVerifyDomain}
                        disabled={domainVerifying}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                      >
                        {domainVerifying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Checking DNS...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Verify DNS Configuration
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Provider-specific help */}
                  <div className="ml-8 pt-4 border-t border-white/10">
                    <p className="text-white/40 text-xs mb-2">Quick links to DNS settings:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: "GoDaddy", url: "https://dcc.godaddy.com/manage-dns" },
                        { name: "Namecheap", url: "https://ap.www.namecheap.com/domains/list" },
                        { name: "Google Domains", url: "https://domains.google.com/registrar" },
                        { name: "Cloudflare", url: "https://dash.cloudflare.com" },
                      ].map((provider) => (
                        <a
                          key={provider.name}
                          href={provider.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                        >
                          {provider.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Help text */}
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/50">
                    <p className="font-medium text-white/70 mb-1">Need help?</p>
                    <p>If you're not sure how to add DNS records, contact your domain provider's support or send us a message and we'll help you set it up.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success State - Domain Verified */}
            {customDomain.verified && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-400 font-semibold">Your custom domain is live!</p>
                </div>
                <p className="text-white/60 text-sm">All customer-facing pages now use your branded domain:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { path: "/lead/...", label: "Lead Capture Surveys" },
                    { path: "/book/...", label: "Booking Portal" },
                    { path: "/invoice/...", label: "Invoice Pages" },
                    { path: "/inspection/...", label: "Inspection Forms" },
                    { path: "/sign/...", label: "Agreement Signing" },
                    { path: "/embed", label: "Booking Widget" },
                  ].map((item) => (
                    <div key={item.path} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white/80 text-sm truncate">{item.label}</p>
                        <p className="text-white/40 text-xs font-mono truncate">{customDomain.domain}{item.path}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* No Domain - Add Domain Form */
          <div className="space-y-4">
            {/* Benefits */}
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: "🎨", title: "Your Brand", desc: "Customers see your domain" },
                { icon: "🔒", title: "Free SSL", desc: "Automatic HTTPS security" },
                { icon: "⚡", title: "Instant Setup", desc: "Works in minutes" },
              ].map((benefit) => (
                <div key={benefit.title} className="p-3 bg-white/5 rounded-xl text-center">
                  <span className="text-2xl">{benefit.icon}</span>
                  <p className="font-medium text-white mt-1">{benefit.title}</p>
                  <p className="text-white/50 text-xs">{benefit.desc}</p>
                </div>
              ))}
            </div>

            {domainError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {domainError}
              </div>
            )}

            <div>
              <label className="block text-sm text-white/60 mb-2">Enter your subdomain</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="book.yourdomain.com"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] text-lg"
                />
                <button
                  onClick={handleAddDomain}
                  disabled={domainSaving || !newDomain.trim()}
                  className="px-6 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
                >
                  {domainSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LinkIcon className="w-5 h-5" />
                      Connect Domain
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Examples */}
            <div className="p-4 bg-white/5 rounded-xl space-y-3">
              <div>
                <p className="text-white/70 text-sm font-medium mb-1">Why a subdomain?</p>
                <p className="text-white/50 text-xs">
                  Using a subdomain (like book.yoursite.com) keeps your main website working normally while giving your customers a branded booking experience.
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-2">Popular subdomain choices:</p>
                <div className="flex flex-wrap gap-2">
                  {["book", "rentals", "reserve", "cars", "fleet"].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setNewDomain(`${sub}.yourdomain.com`)}
                      className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors font-mono"
                    >
                      {sub}.yourdomain.com
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-6">
        {/* Company Name */}
        <div>
          <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
            <Building className="w-4 h-4" />
            Company Name *
          </label>
          <input
            type="text"
            value={branding.company_name}
            onChange={(e) => setBranding({ ...branding, company_name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
            placeholder="Miami Exotic Rentals"
          />
          <p className="text-xs text-white/40 mt-1">This appears on invoices, booking pages, and email communications</p>
        </div>

        {/* Logo URL */}
        <div>
          <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
            <ImageIcon className="w-4 h-4" />
            Logo URL
          </label>
          <input
            type="url"
            value={branding.logo_url || ""}
            onChange={(e) => setBranding({ ...branding, logo_url: e.target.value || null })}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
            placeholder="https://yoursite.com/logo.png"
          />
          <p className="text-xs text-white/40 mt-1">Direct URL to your logo image (PNG, JPG, or SVG recommended)</p>
          {branding.logo_url && (
            <div className="mt-3 p-4 bg-white/5 rounded-xl">
              <p className="text-xs text-white/40 mb-2">Preview:</p>
              <img
                src={branding.logo_url}
                alt="Logo preview"
                className="h-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Colors */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
              <Palette className="w-4 h-4" />
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.primary_color}
                onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                className="w-12 h-12 rounded-lg cursor-pointer border-0"
              />
              <input
                type="text"
                value={branding.primary_color}
                onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm"
                placeholder="#375DEE"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
              <Palette className="w-4 h-4" />
              Background Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.background_color}
                onChange={(e) => setBranding({ ...branding, background_color: e.target.value })}
                className="w-12 h-12 rounded-lg cursor-pointer border-0"
              />
              <input
                type="text"
                value={branding.background_color}
                onChange={(e) => setBranding({ ...branding, background_color: e.target.value })}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="pt-4 border-t border-white/10">
          <h3 className="text-sm font-bold mb-4">Contact Information (shown on customer pages)</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                <Mail className="w-4 h-4" />
                Support Email
              </label>
              <input
                type="email"
                value={branding.support_email || ""}
                onChange={(e) => setBranding({ ...branding, support_email: e.target.value || null })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
                placeholder="rentals@yourcompany.com"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                <Phone className="w-4 h-4" />
                Support Phone
              </label>
              <input
                type="tel"
                value={branding.support_phone || ""}
                onChange={(e) => setBranding({ ...branding, support_phone: e.target.value || null })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
                placeholder="(305) 555-1234"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
              <Globe className="w-4 h-4" />
              Website URL
            </label>
            <input
              type="url"
              value={branding.website_url || ""}
              onChange={(e) => setBranding({ ...branding, website_url: e.target.value || null })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
              placeholder="https://miamiexoticrentals.com"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-white/60" />
            <h3 className="text-sm font-bold">Preview</h3>
          </div>
          <div
            className="rounded-xl p-6 border"
            style={{
              backgroundColor: branding.background_color,
              borderColor: `${branding.primary_color}30`,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              {branding.logo_url ? (
                <img src={branding.logo_url} alt="" className="h-8 object-contain" />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${branding.primary_color}20` }}
                >
                  <Building className="w-5 h-5" style={{ color: branding.primary_color }} />
                </div>
              )}
              <span className="font-semibold text-white">
                {branding.company_name || "Your Company Name"}
              </span>
            </div>
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: branding.primary_color }}
            >
              Sample Button
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || !branding.company_name}
        className="flex items-center gap-2 px-6 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : saved ? (
          <>
            <Check className="w-5 h-5" />
            Saved!
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Branding
          </>
        )}
      </button>

      {/* Info Box */}
      <div className="bg-[#375DEE]/10 border border-[#375DEE]/30 rounded-xl p-4">
        <h4 className="font-bold text-[#375DEE] mb-2">Where is this branding used?</h4>
        <ul className="text-sm text-white/60 space-y-1">
          <li>• Lead capture surveys (/lead/...)</li>
          <li>• Online booking portal (/book/...)</li>
          <li>• Invoice payment pages (/invoice/...)</li>
          <li>• Rental agreement signing pages (/sign/...)</li>
          <li>• Vehicle inspection confirmations (/inspection/...)</li>
          <li>• Booking widget embed (/embed)</li>
          <li>• Payment success/confirmation pages</li>
        </ul>
      </div>
    </div>
  )
}
