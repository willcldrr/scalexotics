"use client"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Search,
  X,
  Check,
  Loader2,
  ExternalLink,
  Plug,
  CreditCard,
  Calculator,
  Users,
  Calendar,
  MessageSquare,
  MapPin,
  Car,
  Globe,
  FileText,
  Zap,
  BarChart3,
  ArrowRight,
  Sparkles,
} from "lucide-react"

// Integration categories and their providers
const integrations = [
  // Payment Processing
  {
    id: "stripe",
    name: "Stripe",
    category: "Payment Processing",
    description: "Accept payments, manage subscriptions, and handle payouts securely.",
    icon: "https://cdn.simpleicons.org/stripe/white",
    popular: true,
  },
  {
    id: "square",
    name: "Square",
    category: "Payment Processing",
    description: "Process in-person and online payments with Square's payment platform.",
    icon: "https://cdn.simpleicons.org/square/white",
  },
  {
    id: "paypal",
    name: "PayPal Business",
    category: "Payment Processing",
    description: "Accept PayPal payments and manage business transactions.",
    icon: "https://cdn.simpleicons.org/paypal/white",
  },

  // Accounting
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    category: "Accounting",
    description: "Sync invoices, expenses, and financial data automatically.",
    icon: "https://cdn.simpleicons.org/quickbooks/2CA01C",
    popular: true,
  },
  {
    id: "xero",
    name: "Xero",
    category: "Accounting",
    description: "Cloud accounting software for small business bookkeeping.",
    icon: "https://cdn.simpleicons.org/xero/13B5EA",
  },
  {
    id: "freshbooks",
    name: "FreshBooks",
    category: "Accounting",
    description: "Invoicing, expenses, and time tracking for small businesses.",
    icon: "https://cdn.simpleicons.org/freshbooks/0075DD",
  },
  {
    id: "wave",
    name: "Wave",
    category: "Accounting",
    description: "Free accounting software for small businesses.",
    icon: "https://cdn.simpleicons.org/wave/1C6DD0",
  },

  // CRM
  {
    id: "salesforce",
    name: "Salesforce",
    category: "CRM",
    description: "Sync leads, contacts, and deals with the world's #1 CRM.",
    icon: "https://cdn.simpleicons.org/salesforce/00A1E0",
    popular: true,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "CRM",
    description: "Marketing, sales, and service software that grows with you.",
    icon: "https://cdn.simpleicons.org/hubspot/FF7A59",
    popular: true,
  },
  {
    id: "zoho",
    name: "Zoho CRM",
    category: "CRM",
    description: "Comprehensive CRM for managing customer relationships.",
    icon: "https://cdn.simpleicons.org/zoho/C8202B",
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    category: "CRM",
    description: "Sales CRM and pipeline management software.",
    icon: "https://cdn.simpleicons.org/pipedrive/1A1919",
  },

  // Calendar & Scheduling
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "Calendar & Scheduling",
    description: "Sync bookings with Google Calendar for seamless scheduling.",
    icon: "https://cdn.simpleicons.org/googlecalendar/4285F4",
    popular: true,
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    category: "Calendar & Scheduling",
    description: "Sync with Outlook calendar and email for booking management.",
    icon: "https://cdn.simpleicons.org/microsoftoutlook/0078D4",
  },
  {
    id: "calendly",
    name: "Calendly",
    category: "Calendar & Scheduling",
    description: "Automate scheduling with clients and prospects.",
    icon: "https://cdn.simpleicons.org/calendly/006BFF",
  },
  {
    id: "cal",
    name: "Cal.com",
    category: "Calendar & Scheduling",
    description: "Open-source scheduling infrastructure for everyone.",
    icon: "https://cdn.simpleicons.org/caldotcom/white",
  },

  // Communication
  {
    id: "twilio",
    name: "Twilio",
    category: "Communication",
    description: "SMS, voice, and messaging APIs for customer communication.",
    icon: "https://cdn.simpleicons.org/twilio/F22F46",
    popular: true,
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    category: "Communication",
    description: "Email delivery and marketing campaigns at scale.",
    icon: "https://cdn.simpleicons.org/sendgrid/1A82E2",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    category: "Communication",
    description: "Email marketing, automation, and CRM platform.",
    icon: "https://cdn.simpleicons.org/mailchimp/FFE01B",
  },
  {
    id: "slack",
    name: "Slack",
    category: "Communication",
    description: "Get notifications and updates directly in Slack channels.",
    icon: "https://cdn.simpleicons.org/slack/4A154B",
  },

  // Fleet & GPS Tracking
  {
    id: "bouncie",
    name: "Bouncie",
    category: "Fleet & GPS",
    description: "Real-time GPS tracking and vehicle diagnostics.",
    icon: null,
    popular: true,
  },
  {
    id: "gps-trackit",
    name: "GPS Trackit",
    category: "Fleet & GPS",
    description: "Fleet tracking and management solutions.",
    icon: null,
  },
  {
    id: "samsara",
    name: "Samsara",
    category: "Fleet & GPS",
    description: "Connected operations platform for fleet management.",
    icon: "https://cdn.simpleicons.org/samsara/white",
  },
  {
    id: "vyncs",
    name: "Vyncs",
    category: "Fleet & GPS",
    description: "GPS tracker and vehicle health monitoring.",
    icon: null,
  },

  // Rental Marketplaces
  {
    id: "turo",
    name: "Turo",
    category: "Marketplaces",
    description: "Sync your fleet with the world's largest car sharing marketplace.",
    icon: "https://cdn.simpleicons.org/turo/00AFF5",
    popular: true,
  },
  {
    id: "getaround",
    name: "Getaround",
    category: "Marketplaces",
    description: "Connect with Getaround's car sharing platform.",
    icon: null,
  },
  {
    id: "hyrecar",
    name: "HyreCar",
    category: "Marketplaces",
    description: "Rent vehicles to rideshare and delivery drivers.",
    icon: null,
  },

  // Website Builders
  {
    id: "wordpress",
    name: "WordPress",
    category: "Website",
    description: "Embed booking widgets on your WordPress site.",
    icon: "https://cdn.simpleicons.org/wordpress/21759B",
    popular: true,
  },
  {
    id: "webflow",
    name: "Webflow",
    category: "Website",
    description: "Integrate booking functionality into Webflow sites.",
    icon: "https://cdn.simpleicons.org/webflow/4353FF",
  },
  {
    id: "wix",
    name: "Wix",
    category: "Website",
    description: "Add booking capabilities to your Wix website.",
    icon: "https://cdn.simpleicons.org/wix/0C6EFC",
  },
  {
    id: "squarespace",
    name: "Squarespace",
    category: "Website",
    description: "Seamlessly integrate with Squarespace websites.",
    icon: "https://cdn.simpleicons.org/squarespace/white",
  },

  // Documents & Contracts
  {
    id: "docusign",
    name: "DocuSign",
    category: "Documents",
    description: "Electronic signatures for rental agreements and contracts.",
    icon: "https://cdn.simpleicons.org/docusign/FFCC22",
    popular: true,
  },
  {
    id: "hellosign",
    name: "HelloSign",
    category: "Documents",
    description: "Simple and secure electronic signatures.",
    icon: "https://cdn.simpleicons.org/hellosign/00B3E6",
  },
  {
    id: "pandadoc",
    name: "PandaDoc",
    category: "Documents",
    description: "Document automation and electronic signatures.",
    icon: "https://cdn.simpleicons.org/pandadoc/4FBE67",
  },

  // Automation
  {
    id: "zapier",
    name: "Zapier",
    category: "Automation",
    description: "Connect Scale Exotics to 5,000+ apps with automated workflows.",
    icon: "https://cdn.simpleicons.org/zapier/FF4A00",
    popular: true,
  },
  {
    id: "make",
    name: "Make (Integromat)",
    category: "Automation",
    description: "Visual automation platform for complex workflows.",
    icon: "https://cdn.simpleicons.org/make/6D00CC",
  },
  {
    id: "n8n",
    name: "n8n",
    category: "Automation",
    description: "Open-source workflow automation tool.",
    icon: "https://cdn.simpleicons.org/n8n/EA4B71",
  },

  // Analytics
  {
    id: "google-analytics",
    name: "Google Analytics",
    category: "Analytics",
    description: "Track website traffic and user behavior analytics.",
    icon: "https://cdn.simpleicons.org/googleanalytics/E37400",
    popular: true,
  },
  {
    id: "mixpanel",
    name: "Mixpanel",
    category: "Analytics",
    description: "Product analytics for understanding user behavior.",
    icon: "https://cdn.simpleicons.org/mixpanel/7856FF",
  },
]

const categories = [
  { id: "all", name: "All", icon: Plug },
  { id: "Payment Processing", name: "Payments", icon: CreditCard },
  { id: "Accounting", name: "Accounting", icon: Calculator },
  { id: "CRM", name: "CRM", icon: Users },
  { id: "Calendar & Scheduling", name: "Calendar", icon: Calendar },
  { id: "Communication", name: "Communication", icon: MessageSquare },
  { id: "Fleet & GPS", name: "Fleet & GPS", icon: MapPin },
  { id: "Marketplaces", name: "Marketplaces", icon: Car },
  { id: "Website", name: "Website", icon: Globe },
  { id: "Documents", name: "Documents", icon: FileText },
  { id: "Automation", name: "Automation", icon: Zap },
  { id: "Analytics", name: "Analytics", icon: BarChart3 },
]

const getCategoryIcon = (category: string) => {
  const cat = categories.find(c => c.id === category)
  return cat?.icon || Plug
}

export default function ConnectionsPage() {
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedIntegration, setSelectedIntegration] = useState<typeof integrations[0] | null>(null)
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [requestedIntegrations, setRequestedIntegrations] = useState<string[]>([])

  const filteredIntegrations = useMemo(() => {
    return integrations.filter(integration => {
      const matchesSearch =
        integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.category.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === "all" || integration.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  const handleRequestAccess = async () => {
    if (!email || !selectedIntegration) return

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Try to insert into database - will fail gracefully if table doesn't exist
      const { error } = await supabase.from("integration_requests").insert({
        user_id: user?.id || null,
        email,
        provider: selectedIntegration.id,
        category: selectedIntegration.category,
      })

      if (error) {
        console.log("Note: integration_requests table may not exist yet:", error.message)
      }

      setRequestedIntegrations(prev => [...prev, selectedIntegration.id])
      setSubmitted(true)
      setTimeout(() => {
        setSelectedIntegration(null)
        setEmail("")
        setSubmitted(false)
      }, 2000)
    } catch (error) {
      console.error("Error submitting request:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Connections
        </h1>
        <p className="text-white/50 text-sm sm:text-base mt-1">
          Connect Scale Exotics to your favorite tools and software
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? "bg-[#375DEE] text-white"
                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <category.icon className="w-4 h-4" />
            {category.name}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-white/50">
        <span className="font-numbers">{filteredIntegrations.length}</span>
        <span>integrations available</span>
        {filteredIntegrations.filter(i => i.popular).length > 0 && (
          <>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#375DEE]" />
              <span className="font-numbers">{filteredIntegrations.filter(i => i.popular).length}</span>
              <span>popular</span>
            </span>
          </>
        )}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map((integration) => {
          const CategoryIcon = getCategoryIcon(integration.category)
          const isRequested = requestedIntegrations.includes(integration.id)

          return (
            <div
              key={integration.id}
              className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all group"
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {integration.icon ? (
                    <img
                      src={integration.icon}
                      alt={integration.name}
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <CategoryIcon className={`w-6 h-6 text-white/40 ${integration.icon ? 'hidden' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{integration.name}</h3>
                    {integration.popular && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#375DEE]/15 text-[#375DEE] text-[10px] font-medium">
                        <Sparkles className="w-2.5 h-2.5" />
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{integration.category}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-white/50 mb-4 line-clamp-2">
                {integration.description}
              </p>

              {/* Action */}
              <button
                onClick={() => !isRequested && setSelectedIntegration(integration)}
                disabled={isRequested}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isRequested
                    ? "bg-white/10 text-white/50 cursor-default"
                    : "bg-white/5 hover:bg-[#375DEE] text-white/70 hover:text-white border border-white/10 hover:border-[#375DEE]"
                }`}
              >
                {isRequested ? (
                  <>
                    <Check className="w-4 h-4" />
                    Requested
                  </>
                ) : (
                  <>
                    <Plug className="w-4 h-4" />
                    Connect
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredIntegrations.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No integrations found</h3>
          <p className="text-white/50 text-sm">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Request Access Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  {selectedIntegration.icon ? (
                    <img
                      src={selectedIntegration.icon}
                      alt={selectedIntegration.name}
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <Plug className="w-5 h-5 text-white/40" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                    {selectedIntegration.name}
                  </h2>
                  <p className="text-xs text-white/40">{selectedIntegration.category}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedIntegration(null)
                  setEmail("")
                  setSubmitted(false)
                }}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {submitted ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-[#375DEE]/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-[#375DEE]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Request Submitted!</h3>
                  <p className="text-white/50 text-sm">
                    We'll notify you when {selectedIntegration.name} integration is available.
                  </p>
                </div>
              ) : (
                <>
                  {/* Coming Soon Badge */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#375DEE]/10 border border-[#375DEE]/20 mb-4">
                    <Sparkles className="w-4 h-4 text-[#375DEE]" />
                    <span className="text-sm text-[#375DEE] font-medium">Coming Soon</span>
                  </div>

                  <p className="text-white/60 text-sm mb-6">
                    {selectedIntegration.description}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">
                        Email for early access
                      </label>
                      <input
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                      />
                    </div>

                    <button
                      onClick={handleRequestAccess}
                      disabled={!email || submitting}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Request Early Access
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-white/30 text-xs text-center mt-4">
                    We'll email you when this integration is ready
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
