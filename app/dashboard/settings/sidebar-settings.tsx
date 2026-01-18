"use client"

import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Users,
  Car,
  CalendarCheck,
  Settings,
  Bot,
  BarChart3,
  UserCircle,
  Receipt,
  Check,
  Plug,
  ClipboardCheck,
  Truck,
} from "lucide-react"

// Define which tabs can be toggled and their defaults
const toggleableTabs = [
  { key: "analytics", name: "Analytics", icon: BarChart3, defaultEnabled: false },
  { key: "leads", name: "Leads", icon: Users, defaultEnabled: true },
  { key: "customers", name: "Customers", icon: UserCircle, defaultEnabled: false },
  { key: "bookings", name: "Bookings", icon: CalendarCheck, defaultEnabled: true },
  { key: "vehicles", name: "Vehicles", icon: Car, defaultEnabled: true },
  { key: "inspections", name: "Inspections", icon: ClipboardCheck, defaultEnabled: false },
  { key: "deliveries", name: "Deliveries", icon: Truck, defaultEnabled: false },
  { key: "billing", name: "Billing", icon: Receipt, defaultEnabled: false },
  { key: "ai-assistant", name: "AI Assistant", icon: Bot, defaultEnabled: true },
  { key: "connections", name: "Connections", icon: Plug, defaultEnabled: true },
]

// Non-toggleable tabs (always visible)
const alwaysVisibleTabs = [
  { key: "overview", name: "Overview", icon: LayoutDashboard },
  { key: "settings", name: "Settings", icon: Settings },
]

export interface SidebarSettings {
  [key: string]: boolean
}

export const getDefaultSidebarSettings = (): SidebarSettings => {
  const defaults: SidebarSettings = {}
  toggleableTabs.forEach(tab => {
    defaults[tab.key] = tab.defaultEnabled
  })
  return defaults
}

export const getSidebarSettings = (): SidebarSettings => {
  if (typeof window === "undefined") return getDefaultSidebarSettings()

  const stored = localStorage.getItem("sidebarSettings")
  if (stored) {
    try {
      return { ...getDefaultSidebarSettings(), ...JSON.parse(stored) }
    } catch {
      return getDefaultSidebarSettings()
    }
  }
  return getDefaultSidebarSettings()
}

export const saveSidebarSettings = (settings: SidebarSettings) => {
  if (typeof window === "undefined") return
  localStorage.setItem("sidebarSettings", JSON.stringify(settings))
  // Dispatch event so layout can update
  window.dispatchEvent(new CustomEvent("sidebarSettingsChanged", { detail: settings }))
}

export default function SidebarSettingsComponent() {
  const [settings, setSettings] = useState<SidebarSettings>(getDefaultSidebarSettings())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(getSidebarSettings())
  }, [])

  const handleToggle = (key: string) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    setSettings(newSettings)
    saveSidebarSettings(newSettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Sidebar Navigation
        </h3>
        <p className="text-white/50 text-sm">
          Choose which tabs appear in your sidebar. Overview and Settings are always visible.
        </p>
      </div>

      {/* Success message */}
      {saved && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
          <Check className="w-5 h-5" />
          <span>Sidebar updated</span>
        </div>
      )}

      {/* Always visible tabs */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <h4 className="text-sm font-medium text-white/60 mb-4">Always Visible</h4>
        <div className="space-y-3">
          {alwaysVisibleTabs.map((tab) => (
            <div
              key={tab.key}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 opacity-60"
            >
              <div className="flex items-center gap-3">
                <tab.icon className="w-5 h-5 text-white/60" />
                <span className="font-medium">{tab.name}</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/40">
                Required
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toggleable tabs */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <h4 className="text-sm font-medium text-white/60 mb-4">Optional Tabs</h4>
        <div className="space-y-3">
          {toggleableTabs.map((tab) => (
            <label
              key={tab.key}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <tab.icon className="w-5 h-5 text-white/60" />
                <span className="font-medium">{tab.name}</span>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings[tab.key] || false}
                  onChange={() => handleToggle(tab.key)}
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${
                    settings[tab.key] ? "bg-[#375DEE]" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      settings[tab.key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
