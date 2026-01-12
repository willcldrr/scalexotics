"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Settings, User, ClipboardList, Code, Key, FileText, PanelLeft, Calendar } from "lucide-react"

// Import tab content
import AccountSettings from "./account-settings"
import LeadCaptureSettings from "./lead-capture-settings"
import WidgetSettings from "./widget-settings"
import AccessCodesSettings from "./access-codes-settings"
import InvoicesSettings from "./invoices-settings"
import SidebarSettings from "./sidebar-settings"
import CalendarSettings from "./calendar-settings"

export default function SettingsPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<"account" | "lead-capture" | "widget" | "calendar" | "sidebar" | "access-codes" | "invoices">("account")
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()

      setIsAdmin(profile?.is_admin || false)
    }
  }

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
        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab("invoices")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === "invoices"
                  ? "bg-[#375DEE] text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <FileText className="w-4 h-4" />
              Invoices
            </button>
            <button
              onClick={() => setActiveTab("access-codes")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === "access-codes"
                  ? "bg-[#375DEE] text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Key className="w-4 h-4" />
              Access Codes
            </button>
          </>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "account" && <AccountSettings />}
      {activeTab === "lead-capture" && <LeadCaptureSettings />}
      {activeTab === "widget" && <WidgetSettings />}
      {activeTab === "calendar" && <CalendarSettings />}
      {activeTab === "sidebar" && <SidebarSettings />}
      {activeTab === "invoices" && isAdmin && <InvoicesSettings />}
      {activeTab === "access-codes" && isAdmin && <AccessCodesSettings />}
    </div>
  )
}
