"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Code,
  Copy,
  CheckCircle,
  Palette,
  Layout,
  ExternalLink,
  Eye,
  Settings,
  Loader2,
} from "lucide-react"

interface CustomDomain {
  domain: string
  verified: boolean
  ssl_status: string
}

export default function WidgetPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [customDomain, setCustomDomain] = useState<CustomDomain | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"embed" | "customize" | "preview">("embed")

  // Widget customization options
  const [widgetConfig, setWidgetConfig] = useState({
    theme: "dark",
    primaryColor: "#375DEE",
    buttonText: "Book Now",
    showPrices: true,
    showAvailability: true,
    maxVehicles: 6,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Get or create API key for widget and fetch custom domain
      const [keyRes, domainRes] = await Promise.all([
        supabase
          .from("api_keys")
          .select("key")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single(),
        supabase
          .from("custom_domains")
          .select("domain, verified, ssl_status")
          .eq("user_id", user.id)
          .limit(1)
          .single(),
      ])

      if (keyRes.data) {
        setApiKey(keyRes.data.key)
      } else {
        // Create a new API key
        const newKey = `se_${crypto.randomUUID().replace(/-/g, "")}`
        const { data: createdKey } = await supabase
          .from("api_keys")
          .insert({
            user_id: user.id,
            key: newKey,
            name: "Booking Widget",
            is_active: true,
          })
          .select("key")
          .single()

        if (createdKey) {
          setApiKey(createdKey.key)
        }
      }

      setCustomDomain(domainRes.data || null)
    }

    setLoading(false)
  }

  // Get the base URL for embeds (custom domain if available)
  const getBaseUrl = () => {
    if (customDomain?.verified && customDomain.ssl_status === "active") {
      return `https://${customDomain.domain}`
    }
    return typeof window !== 'undefined' ? window.location.origin : 'https://scalexotics.com'
  }

  const baseUrl = getBaseUrl()

  const embedCode = `<!-- Scale Exotics Booking Widget -->
<div id="scale-exotics-widget"></div>
<script>
  (function() {
    var config = {
      apiKey: "${apiKey || "YOUR_API_KEY"}",
      theme: "${widgetConfig.theme}",
      primaryColor: "${widgetConfig.primaryColor}",
      buttonText: "${widgetConfig.buttonText}",
      showPrices: ${widgetConfig.showPrices},
      showAvailability: ${widgetConfig.showAvailability},
      maxVehicles: ${widgetConfig.maxVehicles}
    };
    var script = document.createElement("script");
    script.src = "${baseUrl}/widget.js";
    script.async = true;
    script.onload = function() {
      ScaleExoticsWidget.init(config);
    };
    document.head.appendChild(script);
  })();
</script>`

  const iframeCode = `<iframe
  src="${baseUrl}/embed?key=${apiKey || "YOUR_API_KEY"}&theme=${widgetConfig.theme}&color=${encodeURIComponent(widgetConfig.primaryColor)}"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 12px; max-width: 800px;">
</iframe>`

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Booking Widget
          </h1>
          <p className="text-white/50 mt-1">Loading widget configuration...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Booking Widget
        </h1>
        <p className="text-white/50 mt-1">Embed a booking widget on your website</p>
      </div>

      {/* Domain Info */}
      {customDomain?.verified && customDomain.ssl_status === "active" ? (
        <div className="bg-green-500/10 rounded-xl border border-green-500/30 p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-400 font-medium">Using your custom domain</p>
            <p className="text-white/60 text-sm">
              Widget URLs will use <span className="text-white font-mono">{customDomain.domain}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-500/10 rounded-xl border border-yellow-500/30 p-4">
          <p className="text-yellow-400 text-sm">
            Set up a custom domain in Settings → Branding to use your own domain for widget URLs
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {[
          { id: "embed", label: "Embed Code", icon: Code },
          { id: "customize", label: "Customize", icon: Palette },
          { id: "preview", label: "Preview", icon: Eye },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#375DEE] text-white"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "embed" && (
        <div className="space-y-6">
          {/* API Key */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4">Your Widget API Key</h2>
            <div className="flex items-center gap-3">
              <input
                type="text"
                readOnly
                value={apiKey || "Loading..."}
                className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white/70 font-mono text-sm"
              />
              <button
                onClick={() => apiKey && copyCode(apiKey)}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                {copied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-sm text-white/40 mt-2">
              Keep this key private. It identifies your account for the widget.
            </p>
          </div>

          {/* JavaScript Embed */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">JavaScript Embed (Recommended)</h2>
                <p className="text-sm text-white/50">Full-featured widget with dynamic updates</p>
              </div>
              <button
                onClick={() => copyCode(embedCode)}
                className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] rounded-lg text-sm font-medium transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy Code
              </button>
            </div>
            <pre className="bg-black/30 rounded-xl p-4 overflow-x-auto text-sm text-white/70 font-mono">
              {embedCode}
            </pre>
          </div>

          {/* iFrame Embed */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">iFrame Embed (Simple)</h2>
                <p className="text-sm text-white/50">Easy to add, works everywhere</p>
              </div>
              <button
                onClick={() => copyCode(iframeCode)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy Code
              </button>
            </div>
            <pre className="bg-black/30 rounded-xl p-4 overflow-x-auto text-sm text-white/70 font-mono whitespace-pre-wrap">
              {iframeCode}
            </pre>
          </div>

          {/* Installation Steps */}
          <div className="bg-[#375DEE]/10 rounded-2xl border border-[#375DEE]/30 p-6">
            <h3 className="font-semibold text-[#375DEE] mb-3">Installation Steps</h3>
            <ol className="text-sm text-white/70 space-y-2 list-decimal list-inside">
              <li>Copy the embed code above</li>
              <li>Paste it into your website's HTML where you want the widget to appear</li>
              <li>The widget will automatically load and display your available vehicles</li>
              <li>Customers can view vehicles, check availability, and submit booking requests</li>
            </ol>
          </div>
        </div>
      )}

      {activeTab === "customize" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Customization Options */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-6">
            <h2 className="text-lg font-semibold">Widget Settings</h2>

            {/* Theme */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Theme</label>
              <div className="flex gap-3">
                {["dark", "light"].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setWidgetConfig({ ...widgetConfig, theme })}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      widgetConfig.theme === theme
                        ? "bg-[#375DEE] border-[#375DEE] text-white"
                        : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={widgetConfig.primaryColor}
                  onChange={(e) => setWidgetConfig({ ...widgetConfig, primaryColor: e.target.value })}
                  className="w-12 h-12 rounded-lg border border-white/10 cursor-pointer"
                />
                <input
                  type="text"
                  value={widgetConfig.primaryColor}
                  onChange={(e) => setWidgetConfig({ ...widgetConfig, primaryColor: e.target.value })}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono"
                />
              </div>
            </div>

            {/* Button Text */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Button Text</label>
              <input
                type="text"
                value={widgetConfig.buttonText}
                onChange={(e) => setWidgetConfig({ ...widgetConfig, buttonText: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>

            {/* Max Vehicles */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Max Vehicles to Show</label>
              <input
                type="number"
                min="1"
                max="12"
                value={widgetConfig.maxVehicles}
                onChange={(e) => setWidgetConfig({ ...widgetConfig, maxVehicles: parseInt(e.target.value) || 6 })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer">
                <span className="text-sm">Show Prices</span>
                <button
                  onClick={() => setWidgetConfig({ ...widgetConfig, showPrices: !widgetConfig.showPrices })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    widgetConfig.showPrices ? "bg-[#375DEE]" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      widgetConfig.showPrices ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer">
                <span className="text-sm">Show Availability Calendar</span>
                <button
                  onClick={() => setWidgetConfig({ ...widgetConfig, showAvailability: !widgetConfig.showAvailability })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    widgetConfig.showAvailability ? "bg-[#375DEE]" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      widgetConfig.showAvailability ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4">Live Preview</h2>
            <div
              className={`rounded-xl p-4 ${
                widgetConfig.theme === "dark" ? "bg-black" : "bg-white"
              }`}
            >
              <div
                className={`text-center py-3 rounded-lg mb-4 ${
                  widgetConfig.theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                <h3 className="font-semibold text-lg">Available Vehicles</h3>
              </div>

              {/* Sample Vehicle Cards */}
              <div className="grid gap-3">
                {[
                  { name: "Lamborghini Huracan", price: 1500, image: "🏎️" },
                  { name: "Ferrari 488 GTB", price: 1200, image: "🚗" },
                ].slice(0, Math.min(2, widgetConfig.maxVehicles)).map((vehicle, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg flex items-center justify-between ${
                      widgetConfig.theme === "dark"
                        ? "bg-white/5 border border-white/10"
                        : "bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{vehicle.image}</span>
                      <div>
                        <p className={`font-medium ${widgetConfig.theme === "dark" ? "text-white" : "text-black"}`}>
                          {vehicle.name}
                        </p>
                        {widgetConfig.showPrices && (
                          <p className={widgetConfig.theme === "dark" ? "text-white/60 text-sm" : "text-gray-600 text-sm"}>
                            ${vehicle.price}/day
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: widgetConfig.primaryColor }}
                    >
                      {widgetConfig.buttonText}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "preview" && (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Full Widget Preview</h2>
            <a
              href={`/embed?key=${apiKey}&theme=${widgetConfig.theme}&color=${encodeURIComponent(widgetConfig.primaryColor)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#375DEE] hover:underline text-sm"
            >
              Open in new tab
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-black/30 rounded-xl overflow-hidden">
            <iframe
              src={`/embed?key=${apiKey}&theme=${widgetConfig.theme}&color=${encodeURIComponent(widgetConfig.primaryColor)}&preview=true`}
              width="100%"
              height="600"
              frameBorder="0"
              className="rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
