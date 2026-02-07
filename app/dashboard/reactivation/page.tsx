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
        <div>
          <div className="h-9 w-40 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-5 w-64 bg-white/5 rounded mt-2 animate-pulse" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-24 bg-white/[0.03] rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06] animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-20 bg-white/10 rounded" />
                <div className="w-10 h-10 bg-white/10 rounded-xl" />
              </div>
              <div className="h-8 w-24 bg-white/10 rounded mb-2" />
              <div className="h-3 w-16 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight dashboard-heading">
          Reactivation
        </h1>
        <p className="text-white/50 text-sm sm:text-base mt-1">
          Re-engage past customers with AI-powered campaigns
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#375DEE]/15 text-[#375DEE] border border-[#375DEE]/20"
                : "text-white/50 hover:text-white/70 hover:bg-white/[0.03] border border-transparent"
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
