"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Globe,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Link as LinkIcon,
  Palette,
  Mail,
  Phone,
  Building2,
} from "lucide-react"

interface Business {
  id: string
  name: string
  slug: string
  payment_domain: string | null
  domain_status: "pending" | "active" | "suspended"
  stripe_connected: boolean
  logo_url: string | null
  primary_color: string
  secondary_color: string
  phone: string | null
  email: string | null
  deposit_percentage: number
  status: string
}

export default function ConnectionsPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [testLinkUrl, setTestLinkUrl] = useState("")

  const supabase = createClient()

  useEffect(() => {
    fetchBusiness()
  }, [])

  const fetchBusiness = async () => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // Get business for this user
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_user_id", user.id)
      .single()

    if (error) {
      console.error("Error fetching business:", error)
    } else {
      setBusiness(data)
      if (data?.payment_domain) {
        setTestLinkUrl(`https://${data.payment_domain}/checkout/TEST-LINK-PREVIEW`)
      }
    }
    setLoading(false)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const getDomainStatus = () => {
    if (!business?.payment_domain) {
      return {
        icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
        text: "No domain configured",
        description: "Contact support to set up your payment domain",
        color: "amber",
      }
    }

    switch (business.domain_status) {
      case "active":
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-400" />,
          text: "Domain Active",
          description: "Your payment domain is live and ready",
          color: "green",
        }
      case "pending":
        return {
          icon: <Clock className="w-5 h-5 text-amber-400" />,
          text: "Domain Pending",
          description: "Your domain is being set up (usually 24-48 hours)",
          color: "amber",
        }
      case "suspended":
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-400" />,
          text: "Domain Suspended",
          description: "Contact support to resolve this issue",
          color: "red",
        }
      default:
        return {
          icon: <AlertCircle className="w-5 h-5 text-white/40" />,
          text: "Unknown Status",
          description: "Contact support",
          color: "white",
        }
    }
  }

  const getStripeStatus = () => {
    if (business?.stripe_connected) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-400" />,
        text: "Stripe Connected",
        description: "Payments will go directly to your Stripe account",
        color: "green",
      }
    }
    return {
      icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
      text: "Stripe Not Connected",
      description: "Contact support to connect your Stripe account",
      color: "amber",
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    )
  }

  if (!business) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Business Found</h2>
        <p className="text-white/40 max-w-md mx-auto">
          Your account isn't connected to a business yet. Contact support to get set up.
        </p>
      </div>
    )
  }

  const domainStatus = getDomainStatus()
  const stripeStatus = getStripeStatus()

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Connections</h1>
        <p className="text-sm text-white/40">Your payment domain and integration status</p>
      </div>

      {/* Business Card */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={business.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold"
              style={{ backgroundColor: business.primary_color + "20", color: business.primary_color }}
            >
              {business.name.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">{business.name}</h2>
            <p className="text-sm text-white/40">Business ID: {business.slug}</p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Domain Status */}
          <div className={`p-4 rounded-xl border ${
            domainStatus.color === "green" ? "bg-green-500/10 border-green-500/30" :
            domainStatus.color === "amber" ? "bg-amber-500/10 border-amber-500/30" :
            domainStatus.color === "red" ? "bg-red-500/10 border-red-500/30" :
            "bg-white/5 border-white/10"
          }`}>
            <div className="flex items-center gap-3 mb-2">
              {domainStatus.icon}
              <div>
                <p className="font-medium">{domainStatus.text}</p>
                <p className="text-xs text-white/50">{domainStatus.description}</p>
              </div>
            </div>
            {business.payment_domain && (
              <div className="mt-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-white/40" />
                <a
                  href={`https://${business.payment_domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1"
                >
                  {business.payment_domain}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => copyToClipboard(business.payment_domain!, "domain")}
                  className="p-1 text-white/40 hover:text-white rounded"
                >
                  {copied === "domain" ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>

          {/* Stripe Status */}
          <div className={`p-4 rounded-xl border ${
            stripeStatus.color === "green" ? "bg-green-500/10 border-green-500/30" :
            stripeStatus.color === "amber" ? "bg-amber-500/10 border-amber-500/30" :
            "bg-white/5 border-white/10"
          }`}>
            <div className="flex items-center gap-3 mb-2">
              {stripeStatus.icon}
              <div>
                <p className="font-medium">{stripeStatus.text}</p>
                <p className="text-xs text-white/50">{stripeStatus.description}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-white/40" />
              <span className="text-sm text-white/60">
                Deposit: {business.deposit_percentage}% of rental total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* How Payment Links Work */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          How Payment Links Work
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-white/60">
            When your AI chatbot collects booking details and the customer confirms, a secure payment link is generated:
          </p>

          {business.payment_domain && business.domain_status === "active" ? (
            <div className="p-4 bg-black/50 rounded-lg border border-white/10">
              <p className="text-xs text-white/40 mb-2">Example payment link:</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-green-400 flex-1 break-all">
                  https://{business.payment_domain}/checkout/ABC1234-XYZ5678-12345
                </code>
                <button
                  onClick={() => copyToClipboard(`https://${business.payment_domain}/checkout/ABC1234-XYZ5678-12345`, "example")}
                  className="p-2 text-white/40 hover:text-white rounded"
                >
                  {copied === "example" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <p className="text-sm text-amber-400">
                Payment links will use the default domain until your custom domain is active.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <p className="text-sm font-medium">Customer Confirms</p>
              <p className="text-xs text-white/40 mt-1">AI collects vehicle, dates, and customer info</p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 font-bold">2</span>
              </div>
              <p className="text-sm font-medium">Link Generated</p>
              <p className="text-xs text-white/40 mt-1">Secure payment link sent to customer</p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 font-bold">3</span>
              </div>
              <p className="text-sm font-medium">Payment Received</p>
              <p className="text-xs text-white/40 mt-1">Deposit goes directly to your Stripe</p>
            </div>
          </div>
        </div>
      </div>

      {/* Branding Preview */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Your Branding
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-white/40 mb-2">Primary Color</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg border border-white/20"
                  style={{ backgroundColor: business.primary_color }}
                />
                <span className="font-mono text-sm">{business.primary_color}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-2">Secondary Color</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg border border-white/20"
                  style={{ backgroundColor: business.secondary_color }}
                />
                <span className="font-mono text-sm">{business.secondary_color}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-white/40">Contact Info (shown on checkout)</p>
            {business.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-white/40" />
                {business.email}
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-white/40" />
                {business.phone}
              </div>
            )}
            {!business.email && !business.phone && (
              <p className="text-sm text-white/40">No contact info set</p>
            )}
          </div>
        </div>

        <p className="text-xs text-white/30 mt-4">
          Need to update your branding? Contact support.
        </p>
      </div>
    </div>
  )
}
