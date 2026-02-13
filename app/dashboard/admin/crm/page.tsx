"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Users,
  Kanban,
  Calendar,
  BarChart3,
  Settings2,
  Loader2,
  Plus,
  Upload,
  Search,
  Filter,
} from "lucide-react"

// Tab components
import LeadsTab from "./components/leads-tab"
import PipelineTab from "./components/pipeline-tab"
import CalendarTab from "./components/calendar-tab"
import AnalyticsTab from "./components/analytics-tab"
import SettingsTab from "./components/settings-tab"

type TabKey = "leads" | "pipeline" | "calendar" | "analytics" | "settings"

interface Tab {
  key: TabKey
  label: string
  icon: React.ElementType
}

const tabs: Tab[] = [
  { key: "leads", label: "Leads", icon: Users },
  { key: "pipeline", label: "Pipeline", icon: Kanban },
  { key: "calendar", label: "Calendar", icon: Calendar },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings2 },
]

export default function AdminCRMPage() {
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>("leads")

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (profile?.is_admin) {
      setIsAdmin(true)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold dashboard-heading">CRM</h1>
          <p className="text-white/50 mt-1">Loading...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold dashboard-heading">Access Denied</h1>
          <p className="text-white/50 mt-1">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold dashboard-heading">CRM</h1>
          <p className="text-white/50 mt-1">Manage your B2B leads and sales pipeline</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-[#375DEE] text-white shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "leads" && <LeadsTab />}
        {activeTab === "pipeline" && <PipelineTab />}
        {activeTab === "calendar" && <CalendarTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  )
}
