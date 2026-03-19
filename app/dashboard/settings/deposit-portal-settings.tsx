"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  CreditCard,
  Loader2,
  Save,
  DollarSign,
  Percent,
  FileText,
  MessageSquare,
  Link as LinkIcon,
  Upload,
  X,
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Palette,
} from "lucide-react"

interface DepositPortalConfig {
  id?: string
  stripe_publishable_key: string
  stripe_secret_key: string
  default_deposit_type: 'percentage' | 'fixed'
  default_deposit_value: number
  min_deposit_amount: number
  max_deposit_amount: number | null
  portal_title: string
  portal_subtitle: string
  logo_url: string
  accent_color: string
  terms_enabled: boolean
  terms_text: string
  success_message: string
  success_redirect_url: string
  send_confirmation_sms: boolean
  confirmation_sms_template: string
  require_id_upload: boolean
  require_insurance_upload: boolean
  custom_domain: string
}

const defaultConfig: DepositPortalConfig = {
  stripe_publishable_key: '',
  stripe_secret_key: '',
  default_deposit_type: 'percentage',
  default_deposit_value: 25,
  min_deposit_amount: 100,
  max_deposit_amount: null,
  portal_title: 'Secure Deposit',
  portal_subtitle: 'Complete your rental deposit to confirm your booking',
  logo_url: '',
  accent_color: '#FFFFFF',
  terms_enabled: true,
  terms_text: 'I agree to the rental terms and conditions and understand that this deposit is non-refundable within 48 hours of the rental start date.',
  success_message: 'Your deposit has been received! You will receive a confirmation via SMS shortly.',
  success_redirect_url: '',
  send_confirmation_sms: true,
  confirmation_sms_template: 'Your deposit of {amount} for {vehicle} has been confirmed! Rental dates: {dates}. We will contact you with pickup details.',
  require_id_upload: false,
  require_insurance_upload: false,
  custom_domain: '',
}

export default function DepositPortalSettings() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<DepositPortalConfig>(defaultConfig)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeSection, setActiveSection] = useState<'stripe' | 'deposit' | 'branding' | 'terms' | 'notifications'>('stripe')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("deposit_portal_config")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (data && !error) {
      setConfig({
        ...defaultConfig,
        ...data,
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from("deposit_portal_config")
      .upsert({
        user_id: user.id,
        ...config,
      }, { onConflict: 'user_id' })

    if (error) {
      alert("Failed to save settings. Please try again.")
    }
    setSaving(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setUploadingLogo(false)
      return
    }

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/portal-logo-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(fileName, file)

      if (uploadError) {
        // Try vehicle-images bucket as fallback
        const { error: fallbackError } = await supabase.storage
          .from('vehicle-images')
          .upload(fileName, file)

        if (fallbackError) throw fallbackError
        const { data: { publicUrl } } = supabase.storage.from('vehicle-images').getPublicUrl(fileName)
        setConfig({ ...config, logo_url: publicUrl })
      } else {
        const { data: { publicUrl } } = supabase.storage.from('business-assets').getPublicUrl(fileName)
        setConfig({ ...config, logo_url: publicUrl })
      }
    } catch (err) {
      alert('Failed to upload logo.')
    }
    setUploadingLogo(false)
  }

  const copyPortalLink = () => {
    const domain = config.custom_domain || 'rentalcapture.xyz'
    navigator.clipboard.writeText(`https://${domain}/deposit`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Deposit Portal</h2>
          <p className="text-sm text-white/50 mt-1">
            Configure your customer-facing deposit payment page
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      {/* Portal Link Preview */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/50 mb-1">Your deposit portal link</p>
            <p className="text-sm font-mono text-white">
              https://{config.custom_domain || 'rentalcapture.xyz'}/deposit/[token]
            </p>
          </div>
          <button
            onClick={copyPortalLink}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'stripe', label: 'Stripe', icon: CreditCard },
          { id: 'deposit', label: 'Deposit Settings', icon: DollarSign },
          { id: 'branding', label: 'Branding', icon: Palette },
          { id: 'terms', label: 'Terms & Success', icon: FileText },
          { id: 'notifications', label: 'Notifications', icon: MessageSquare },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as typeof activeSection)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeSection === section.id
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Stripe Configuration */}
      {activeSection === 'stripe' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-400">Secure Payment Processing</p>
                <p className="text-xs text-amber-400/70 mt-1">
                  Your Stripe keys are encrypted and never exposed to customers. Get your API keys from the{' '}
                  <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">
                    Stripe Dashboard
                  </a>.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Publishable Key</label>
              <input
                type="text"
                placeholder="pk_live_..."
                value={config.stripe_publishable_key}
                onChange={(e) => setConfig({ ...config, stripe_publishable_key: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Secret Key</label>
              <div className="relative">
                <input
                  type={showSecretKey ? "text" : "password"}
                  placeholder="sk_live_..."
                  value={config.stripe_secret_key}
                  onChange={(e) => setConfig({ ...config, stripe_secret_key: e.target.value })}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 text-white/40"
                >
                  {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Settings */}
      {activeSection === 'deposit' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Deposit Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfig({ ...config, default_deposit_type: 'percentage' })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                    config.default_deposit_type === 'percentage'
                      ? 'bg-white/10 border-white/30 text-white'
                      : 'border-white/[0.08] text-white/50 hover:border-white/20'
                  }`}
                >
                  <Percent className="w-4 h-4" />
                  Percentage
                </button>
                <button
                  onClick={() => setConfig({ ...config, default_deposit_type: 'fixed' })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                    config.default_deposit_type === 'fixed'
                      ? 'bg-white/10 border-white/30 text-white'
                      : 'border-white/[0.08] text-white/50 hover:border-white/20'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Fixed Amount
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">
                Default {config.default_deposit_type === 'percentage' ? 'Percentage' : 'Amount'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  {config.default_deposit_type === 'percentage' ? '%' : '$'}
                </span>
                <input
                  type="number"
                  min="1"
                  value={config.default_deposit_value}
                  onChange={(e) => setConfig({ ...config, default_deposit_value: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Minimum Deposit</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                <input
                  type="number"
                  min="0"
                  value={config.min_deposit_amount}
                  onChange={(e) => setConfig({ ...config, min_deposit_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Maximum Deposit (optional)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                <input
                  type="number"
                  min="0"
                  placeholder="No limit"
                  value={config.max_deposit_amount || ''}
                  onChange={(e) => setConfig({ ...config, max_deposit_amount: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/[0.08]">
            <label className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] cursor-pointer hover:bg-white/[0.05] transition-colors">
              <div>
                <p className="font-medium">Require ID Upload</p>
                <p className="text-sm text-white/50">Customer must upload driver's license before paying</p>
              </div>
              <input
                type="checkbox"
                checked={config.require_id_upload}
                onChange={(e) => setConfig({ ...config, require_id_upload: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-white focus:ring-white/20"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] cursor-pointer hover:bg-white/[0.05] transition-colors">
              <div>
                <p className="font-medium">Require Insurance Upload</p>
                <p className="text-sm text-white/50">Customer must upload proof of insurance</p>
              </div>
              <input
                type="checkbox"
                checked={config.require_insurance_upload}
                onChange={(e) => setConfig({ ...config, require_insurance_upload: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-white focus:ring-white/20"
              />
            </label>
          </div>
        </div>
      )}

      {/* Branding */}
      {activeSection === 'branding' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Portal Title</label>
            <input
              type="text"
              placeholder="Secure Deposit"
              value={config.portal_title}
              onChange={(e) => setConfig({ ...config, portal_title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Portal Subtitle</label>
            <input
              type="text"
              placeholder="Complete your rental deposit to confirm your booking"
              value={config.portal_subtitle}
              onChange={(e) => setConfig({ ...config, portal_subtitle: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Logo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            {config.logo_url ? (
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/[0.08] overflow-hidden">
                  <img src={config.logo_url} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                  >
                    {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change'}
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, logo_url: '' })}
                    className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="w-full px-4 py-8 rounded-xl bg-white/5 border border-white/[0.08] border-dashed hover:border-white/30 transition-colors flex flex-col items-center justify-center gap-2"
              >
                {uploadingLogo ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-white/40" />
                    <span className="text-sm text-white/50">Upload logo</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.accent_color}
                onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                value={config.accent_color}
                onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white font-mono text-sm focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Custom Domain (optional)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">https://</span>
              <input
                type="text"
                placeholder="pay.yourcompany.com"
                value={config.custom_domain}
                onChange={(e) => setConfig({ ...config, custom_domain: e.target.value })}
                className="w-full pl-20 pr-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
            </div>
            <p className="text-xs text-white/40 mt-2">
              Default: rentalcapture.xyz • Contact support to set up a custom domain
            </p>
          </div>
        </div>
      )}

      {/* Terms & Success */}
      {activeSection === 'terms' && (
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] cursor-pointer hover:bg-white/[0.05] transition-colors">
            <div>
              <p className="font-medium">Require Terms Agreement</p>
              <p className="text-sm text-white/50">Customer must agree to terms before paying</p>
            </div>
            <input
              type="checkbox"
              checked={config.terms_enabled}
              onChange={(e) => setConfig({ ...config, terms_enabled: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-white focus:ring-white/20"
            />
          </label>

          {config.terms_enabled && (
            <div>
              <label className="block text-sm text-white/60 mb-2">Terms Text</label>
              <textarea
                rows={3}
                value={config.terms_text}
                onChange={(e) => setConfig({ ...config, terms_text: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-white/60 mb-2">Success Message</label>
            <textarea
              rows={2}
              value={config.success_message}
              onChange={(e) => setConfig({ ...config, success_message: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Success Redirect URL (optional)</label>
            <input
              type="url"
              placeholder="https://yourwebsite.com/thank-you"
              value={config.success_redirect_url}
              onChange={(e) => setConfig({ ...config, success_redirect_url: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
            <p className="text-xs text-white/40 mt-2">
              Leave empty to show success message on portal
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeSection === 'notifications' && (
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] cursor-pointer hover:bg-white/[0.05] transition-colors">
            <div>
              <p className="font-medium">Send Confirmation SMS</p>
              <p className="text-sm text-white/50">Automatically text the customer when payment is received</p>
            </div>
            <input
              type="checkbox"
              checked={config.send_confirmation_sms}
              onChange={(e) => setConfig({ ...config, send_confirmation_sms: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-white focus:ring-white/20"
            />
          </label>

          {config.send_confirmation_sms && (
            <div>
              <label className="block text-sm text-white/60 mb-2">Confirmation SMS Template</label>
              <textarea
                rows={3}
                value={config.confirmation_sms_template}
                onChange={(e) => setConfig({ ...config, confirmation_sms_template: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none font-mono text-sm"
              />
              <p className="text-xs text-white/40 mt-2">
                Available variables: {'{amount}'}, {'{vehicle}'}, {'{dates}'}, {'{customer_name}'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
