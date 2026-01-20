"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  RefreshCw,
  LayoutGrid,
  Users,
  Megaphone,
  FileText,
  Settings,
} from "lucide-react"

import OverviewTab from "./components/overview-tab"
import ContactsTab from "./components/contacts-tab"
import CampaignsTab from "./components/campaigns-tab"
import TemplatesTab from "./components/templates-tab"
import SettingsTab from "./components/settings-tab"

type TabId = "overview" | "contacts" | "campaigns" | "templates" | "settings"

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
] as const

export default function ReactivationPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-10 w-64 bg-white/10 rounded-lg mb-2" />
          <div className="h-5 w-96 bg-white/5 rounded-lg" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-28 bg-white/10 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#375DEE]" />
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Reactivation
          </h1>
        </div>
        <p className="text-white/50 mt-1">
          Re-engage past customers with AI-powered campaigns via SMS and Email
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
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

      {/* Tab Content */}
      {userId && (
        <>
          {activeTab === "overview" && <OverviewTab userId={userId} />}
          {activeTab === "contacts" && <ContactsTab userId={userId} />}
          {activeTab === "campaigns" && <CampaignsTab userId={userId} />}
          {activeTab === "templates" && <TemplatesTab userId={userId} />}
          {activeTab === "settings" && <SettingsTab userId={userId} />}
        </>
      )}
    </div>
  )
}
