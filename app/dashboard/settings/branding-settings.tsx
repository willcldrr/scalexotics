"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import {
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
  Upload,
  LayoutDashboard,
  Users,
  CalendarCheck,
  Settings,
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
  const fileInputRef = useRef<HTMLInputElement>(null)
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
  const [uploading, setUploading] = useState(false)
  const [logoInputMode, setLogoInputMode] = useState<'url' | 'upload'>('upload')
  const [userId, setUserId] = useState<string | null>(null)

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

    setUserId(user.id)

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
      // Notify branding context to refresh
      window.dispatchEvent(new CustomEvent("brandingChanged"))
    }

    setSaving(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setUploading(true)
    setError(null)

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      if (!['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(fileExt || '')) {
        setError('Please upload a PNG, JPG, SVG, or WebP image')
        setUploading(false)
        return
      }

      if (file.size > 2 * 1024 * 1024) {
        setError('File size must be less than 2MB')
        setUploading(false)
        return
      }

      const fileName = `${userId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('brand-logos')
        .upload(fileName, file)

      if (uploadError) {
        // Try vehicle-images bucket as fallback
        const { error: fallbackError } = await supabase.storage
          .from('vehicle-images')
          .upload(`logos/${fileName}`, file)

        if (fallbackError) {
          setError('Failed to upload logo. Please try entering a URL instead.')
          setUploading(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('vehicle-images')
          .getPublicUrl(`logos/${fileName}`)

        setBranding({ ...branding, logo_url: publicUrl })
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('brand-logos')
          .getPublicUrl(fileName)

        setBranding({ ...branding, logo_url: publicUrl })
      }
    } catch (err) {
      setError('Failed to upload logo. Please try entering a URL instead.')
    }

    setUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
        <h2 className="text-xl font-bold mb-1">Dashboard Branding</h2>
        <p className="text-white/50 text-sm">
          Customize your dashboard with your own logo and accent color. These settings apply to your sidebar navigation and dashboard elements.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Custom Domain Section */}
      <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-6 space-y-6">
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
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#375DEE] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
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
                  <div className="ml-8 pt-4 border-t border-white/[0.08]">
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
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] text-lg"
                />
                <button
                  onClick={handleAddDomain}
                  disabled={domainSaving || !newDomain.trim()}
                  className="px-6 py-3 bg-[#375DEE] hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
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

      <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-6 space-y-6">
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
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
            placeholder="Miami Exotic Rentals"
          />
          <p className="text-xs text-white/40 mt-1">This appears on invoices, booking pages, and email communications</p>
        </div>

        {/* Logo Upload/URL */}
        <div>
          <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
            <ImageIcon className="w-4 h-4" />
            Company Logo
          </label>
          <p className="text-xs text-white/40 mb-3">This logo appears in your dashboard sidebar and on customer-facing pages</p>

          {/* Toggle between upload and URL */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setLogoInputMode('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                logoInputMode === 'upload'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => setLogoInputMode('url')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                logoInputMode === 'url'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              URL
            </button>
          </div>

          {logoInputMode === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-white/5 border border-white/[0.08] border-dashed text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Click to upload logo (PNG, JPG, SVG, max 2MB)
                  </>
                )}
              </button>
            </div>
          ) : (
            <input
              type="url"
              value={branding.logo_url || ""}
              onChange={(e) => setBranding({ ...branding, logo_url: e.target.value || null })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
              placeholder="https://yoursite.com/logo.png"
            />
          )}

          {branding.logo_url && (
            <div className="mt-3 p-4 bg-white/5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 mb-2">Current Logo:</p>
                <Image
                  src={branding.logo_url}
                  alt="Logo preview"
                  width={150}
                  height={48}
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setBranding({ ...branding, logo_url: null })}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Remove logo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="pt-4 border-t border-white/[0.08]">
          <h3 className="text-sm font-bold mb-2">Contact Information</h3>
          <p className="text-xs text-white/40 mb-4">Displayed on invoices, booking confirmations, and other customer communications</p>
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
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
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
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
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
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
              placeholder="https://miamiexoticrentals.com"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="pt-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-white/60" />
            <h3 className="text-sm font-bold">Dashboard Preview</h3>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-white/50 font-medium">Sidebar Navigation</p>
            <div className="bg-black rounded-xl border border-white/10 p-4 w-full max-w-[200px]">
              {/* Logo */}
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                {branding.logo_url ? (
                  <Image
                    src={branding.logo_url}
                    alt=""
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Building className="w-5 h-5 text-white/40" />
                  </div>
                )}
              </div>
              {/* Nav Items */}
              <div className="pt-3 space-y-1">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm bg-[#375DEE]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="font-medium">Overview</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 text-sm">
                  <Users className="w-4 h-4" />
                  <span>Leads</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 text-sm">
                  <CalendarCheck className="w-4 h-4" />
                  <span>Bookings</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 text-sm">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || !branding.company_name}
        className="flex items-center gap-2 px-6 py-3 bg-[#375DEE] hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
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
          <li>• <strong className="text-white/80">Sidebar navigation</strong> - Your logo appears at the top</li>
          <li>• <strong className="text-white/80">Contact information</strong> - Shown on invoices and customer pages</li>
        </ul>
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-white/50">
            <strong className="text-white/70">Note:</strong> Customer-facing survey pages have their own branding settings.
            Configure survey appearance in <strong className="text-white/70">Lead Capture → Edit Survey → Branding</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
