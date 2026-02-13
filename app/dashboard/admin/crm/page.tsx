"use client"

import { useState, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import { createClient } from "@/lib/supabase/client"
import {
  Users,
  Kanban,
  Calendar,
  BarChart3,
  Settings2,
  Loader2,
} from "lucide-react"

// Loading fallback component
const TabLoading = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
  </div>
)

// Lazy load heavy tab components - these include dnd-kit, date-fns, etc.
const LeadsTab = dynamic(() => import("./components/leads-tab"), {
  loading: TabLoading,
  ssr: false,
})
const PipelineTab = dynamic(() => import("./components/pipeline-tab"), {
  loading: TabLoading,
  ssr: false,
})
const CalendarTab = dynamic(() => import("./components/calendar-tab"), {
  loading: TabLoading,
  ssr: false,
})
const AnalyticsTab = dynamic(() => import("./components/analytics-tab"), {
  loading: TabLoading,
  ssr: false,
})
const SettingsTab = dynamic(() => import("./components/settings-tab"), {
  loading: TabLoading,
  ssr: false,
})

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
      <div className="space-y-4 sm:space-y-6">
        <div className="hidden sm:block">
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
      <div className="space-y-4 sm:space-y-6">
        <div className="hidden sm:block">
          <h1 className="text-3xl font-bold dashboard-heading">Access Denied</h1>
        </div>
        <p className="text-white/50">You don&apos;t have permission to access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
      {/* Header - Hidden on mobile since it's in the top bar */}
      <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold dashboard-heading">CRM</h1>
        </div>
      </div>

      {/* Desktop Tabs - Hidden on mobile */}
      <div className="hidden sm:flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
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
            <span>{tab.label}</span>
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

      {/* Mobile Bottom Nav - CRM specific */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 sm:hidden">
        <div className="flex items-center justify-around px-1 py-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all flex-1 ${
                activeTab === tab.key
                  ? "text-[#375DEE] bg-[#375DEE]/10"
                  : "text-white/50 active:text-white active:bg-white/5"
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.key ? "text-[#375DEE]" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
