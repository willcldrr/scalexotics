"use client"

import { useState } from "react"
import { User, ClipboardList, Code, PanelLeft, Calendar, Palette, Monitor } from "lucide-react"

// Import tab content
import AccountSettings from "./account-settings"
import LeadCaptureSettings from "./lead-capture-settings"
import WidgetSettings from "./widget-settings"
import SidebarSettings from "./sidebar-settings"
import CalendarSettings from "./calendar-settings"
import BrandingSettings from "./branding-settings"
import SessionsSettings from "./sessions-settings"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"account" | "lead-capture" | "widget" | "calendar" | "sidebar" | "branding" | "sessions">("account")

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
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === "calendar"
              ? "bg-[#375DEE] text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendar Sync
        </button>
        <button
          onClick={() => setActiveTab("sidebar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === "sidebar"
              ? "bg-[#375DEE] text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <PanelLeft className="w-4 h-4" />
          Sidebar
        </button>
        <button
          onClick={() => setActiveTab("branding")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === "branding"
              ? "bg-[#375DEE] text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Palette className="w-4 h-4" />
          Branding
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === "sessions"
              ? "bg-[#375DEE] text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Monitor className="w-4 h-4" />
          Sessions
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "account" && <AccountSettings />}
      {activeTab === "lead-capture" && <LeadCaptureSettings />}
      {activeTab === "widget" && <WidgetSettings />}
      {activeTab === "calendar" && <CalendarSettings />}
      {activeTab === "sidebar" && <SidebarSettings />}
      {activeTab === "branding" && <BrandingSettings />}
      {activeTab === "sessions" && <SessionsSettings />}
    </div>
  )
}
