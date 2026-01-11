"use client"

import { useState } from "react"
import { Settings, User, ClipboardList, Code } from "lucide-react"

// Import tab content
import AccountSettings from "./account-settings"
import LeadCaptureSettings from "./lead-capture-settings"
import WidgetSettings from "./widget-settings"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"account" | "lead-capture" | "widget">("account")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Settings
        </h1>
        <p className="text-white/50 mt-1">Manage your account and integrations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === "account"
              ? "bg-[#375DEE] text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <User className="w-4 h-4" />
          Account
        </button>
        <button
          onClick={() => setActiveTab("lead-capture")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === "lead-capture"
              ? "bg-[#375DEE] text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Lead Capture
        </button>
        <button
          onClick={() => setActiveTab("widget")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === "widget"
              ? "bg-[#375DEE] text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Code className="w-4 h-4" />
          Booking Widget
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "account" && <AccountSettings />}
      {activeTab === "lead-capture" && <LeadCaptureSettings />}
      {activeTab === "widget" && <WidgetSettings />}
    </div>
  )
}
