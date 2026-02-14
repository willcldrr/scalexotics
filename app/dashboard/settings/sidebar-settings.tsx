"use client"

import { useState, useEffect } from "react"
import {
  Users,
  Car,
  CalendarCheck,
  Bot,
  UserCircle,
  Receipt,
  RefreshCw,
  PanelLeftClose,
  PanelLeft,
  PanelLeftOpen,
} from "lucide-react"

// Define which tabs can be toggled and their defaults
const toggleableTabs = [
  { key: "leads", name: "Leads", icon: Users, defaultEnabled: true },
  { key: "customers", name: "Customers", icon: UserCircle, defaultEnabled: false },
  { key: "bookings", name: "Bookings", icon: CalendarCheck, defaultEnabled: true },
  { key: "vehicles", name: "Vehicles", icon: Car, defaultEnabled: true },
  { key: "billing", name: "Billing", icon: Receipt, defaultEnabled: false },
  { key: "reactivation", name: "Reactivation", icon: RefreshCw, defaultEnabled: true },
  { key: "ai-assistant", name: "AI Assistant", icon: Bot, defaultEnabled: true },
]

// Sidebar display modes
export type SidebarDisplayMode = "icons" | "full" | "hover"

const sidebarModes = [
  {
    value: "icons" as SidebarDisplayMode,
    name: "Icons Only",
    description: "Compact sidebar with icons only",
    icon: PanelLeftClose
  },
  {
    value: "full" as SidebarDisplayMode,
    name: "Always Expanded",
    description: "Full sidebar with text labels",
    icon: PanelLeft
  },
  {
    value: "hover" as SidebarDisplayMode,
    name: "Expand on Hover",
    description: "Icons by default, expands when you hover",
    icon: PanelLeftOpen
  },
]

export interface SidebarSettings {
  [key: string]: boolean | SidebarDisplayMode
  displayMode: SidebarDisplayMode
}

export const getDefaultSidebarSettings = (): SidebarSettings => {
  const defaults: SidebarSettings = {
    displayMode: "hover" // Default to hover-expand mode
  }
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

  useEffect(() => {
    setSettings(getSidebarSettings())
  }, [])

  const handleToggle = (key: string) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    setSettings(newSettings)
    saveSidebarSettings(newSettings)
  }

  const handleModeChange = (mode: SidebarDisplayMode) => {
    const newSettings = { ...settings, displayMode: mode }
    setSettings(newSettings)
    saveSidebarSettings(newSettings)
  }

  return (
    <div className="space-y-6">
      {/* Display Mode */}
      <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-6">
        <h3 className="text-lg font-bold mb-2">
          Sidebar Display Mode
        </h3>
        <p className="text-white/50 text-sm mb-4">
          Choose how the sidebar behaves on desktop.
        </p>
        <div className="grid gap-3">
          {sidebarModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => handleModeChange(mode.value)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                settings.displayMode === mode.value
                  ? "bg-[#375DEE]/10 border-[#375DEE]/50"
                  : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                settings.displayMode === mode.value
                  ? "bg-[#375DEE]/20"
                  : "bg-white/10"
              }`}>
                <mode.icon className={`w-5 h-5 ${
                  settings.displayMode === mode.value
                    ? "text-[#375DEE]"
                    : "text-white/60"
                }`} />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${
                  settings.displayMode === mode.value
                    ? "text-white"
                    : "text-white/80"
                }`}>{mode.name}</p>
                <p className="text-sm text-white/40">{mode.description}</p>
              </div>
              {settings.displayMode === mode.value && (
                <div className="w-5 h-5 rounded-full bg-[#375DEE] flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Visible Tabs */}
      <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-6">
        <h3 className="text-lg font-bold mb-2">
          Visible Tabs
        </h3>
        <p className="text-white/50 text-sm mb-4">
          Choose which tabs appear in your sidebar.
        </p>
        <div className="space-y-3">
          {toggleableTabs.map((tab) => (
            <label
              key={tab.key}
              className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer transition-colors border border-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <tab.icon className="w-5 h-5 text-white/60" />
                <span className="font-medium">{tab.name}</span>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings[tab.key] === true}
                  onChange={() => handleToggle(tab.key)}
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${
                    settings[tab.key] === true ? "bg-[#375DEE]" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      settings[tab.key] === true ? "translate-x-5" : "translate-x-0"
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
