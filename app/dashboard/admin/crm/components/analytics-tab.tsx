"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Calendar,
  Loader2,
  ArrowRight,
  Building2,
  Clock,
} from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns"
import { crmStatusOptions, getStatusColor, getStatusLabel, type CRMLeadStatus } from "../lib/crm-status"
import type { CRMLead } from "./leads-tab"

interface AnalyticsData {
  leads: CRMLead[]
  notes: { created_at: string; note_type: string }[]
  events: { start_time: string; event_type: string }[]
}

export default function AnalyticsTab() {
  const supabase = createClient()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [leadsRes, notesRes, eventsRes] = await Promise.all([
      supabase.from("crm_leads").select("*").order("created_at", { ascending: false }),
      supabase.from("crm_notes").select("created_at, note_type").order("created_at", { ascending: false }),
      supabase.from("crm_events").select("start_time, event_type").order("start_time", { ascending: false }),
    ])

    setData({
      leads: leadsRes.data || [],
      notes: notesRes.data || [],
      events: eventsRes.data || [],
    })
    setLoading(false)
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
      </div>
    )
  }

  const { leads, notes, events } = data

  // Time range filtering
  const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
  const startDate = subDays(new Date(), daysAgo)
  const recentLeads = leads.filter((l) => new Date(l.created_at) >= startDate)

  // Stats calculations
  const totalLeads = leads.length
  const totalValue = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0)
  const activeLeads = leads.filter((l) => !["closed_won", "closed_lost", "not_interested"].includes(l.status))
  const wonDeals = leads.filter((l) => l.status === "closed_won")
  const wonValue = wonDeals.reduce((sum, l) => sum + (l.estimated_value || 0), 0)
  const lostDeals = leads.filter((l) => l.status === "closed_lost")

  // Conversion rate
  const closedDeals = wonDeals.length + lostDeals.length
  const conversionRate = closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0

  // Leads by status
  const leadsByStatus = crmStatusOptions.map((status) => ({
    ...status,
    count: leads.filter((l) => l.status === status.value).length,
    value: leads.filter((l) => l.status === status.value).reduce((sum, l) => sum + (l.estimated_value || 0), 0),
  }))

  // Pipeline funnel data
  const funnelStages = [
    { status: "not_contacted" as CRMLeadStatus, label: "New Leads" },
    { status: "contacted" as CRMLeadStatus, label: "Contacted" },
    { status: "interested" as CRMLeadStatus, label: "Interested" },
    { status: "demo_scheduled" as CRMLeadStatus, label: "Demo Scheduled" },
    { status: "closed_won" as CRMLeadStatus, label: "Won" },
  ]

  const funnelData = funnelStages.map((stage) => ({
    ...stage,
    count: leads.filter((l) => l.status === stage.status).length,
  }))

  const maxFunnelCount = Math.max(...funnelData.map((d) => d.count), 1)

  // Activity by day (last 30 days)
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  })

  const activityByDay = last30Days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd")
    const notesCount = notes.filter((n) => format(parseISO(n.created_at), "yyyy-MM-dd") === dayStr).length
    const eventsCount = events.filter((e) => format(parseISO(e.start_time), "yyyy-MM-dd") === dayStr).length
    const leadsCount = leads.filter((l) => format(parseISO(l.created_at), "yyyy-MM-dd") === dayStr).length
    return {
      date: day,
      notes: notesCount,
      events: eventsCount,
      leads: leadsCount,
      total: notesCount + eventsCount + leadsCount,
    }
  })

  const maxActivity = Math.max(...activityByDay.map((d) => d.total), 1)

  // Top leads by value
  const topLeads = [...leads]
    .filter((l) => l.estimated_value)
    .sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0))
    .slice(0, 5)

  // Leads by source
  const leadsBySource = leads.reduce((acc, lead) => {
    const source = lead.source || "Unknown"
    if (!acc[source]) acc[source] = { count: 0, value: 0 }
    acc[source].count++
    acc[source].value += lead.estimated_value || 0
    return acc
  }, {} as Record<string, { count: number; value: number }>)

  const sourceData = Object.entries(leadsBySource)
    .map(([source, data]) => ({ source, ...data }))
    .sort((a, b) => b.count - a.count)

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
    return `$${value}`
  }

  return (
    <div className="space-y-6">
      {/* Time Range Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">CRM Analytics</h2>
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeRange === range ? "bg-[#375DEE] text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#375DEE]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#375DEE]" />
            </div>
            <span className="text-white/50 text-sm">Total Leads</span>
          </div>
          <p className="text-3xl font-bold">{totalLeads}</p>
          <p className="text-xs text-white/40 mt-1">{recentLeads.length} new this period</p>
        </div>

        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-white/50 text-sm">Pipeline Value</span>
          </div>
          <p className="text-3xl font-bold text-amber-400">{formatCurrency(totalValue)}</p>
          <p className="text-xs text-white/40 mt-1">{activeLeads.length} active opportunities</p>
        </div>

        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-white/50 text-sm">Conversion Rate</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{conversionRate.toFixed(1)}%</p>
          <p className="text-xs text-white/40 mt-1">{wonDeals.length} won / {closedDeals} closed</p>
        </div>

        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-white/50 text-sm">Revenue Won</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{formatCurrency(wonValue)}</p>
          <p className="text-xs text-white/40 mt-1">{wonDeals.length} deals closed</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <h3 className="text-sm font-bold text-white/60 mb-4">Pipeline Funnel</h3>
          <div className="space-y-3">
            {funnelData.map((stage, index) => {
              const statusOption = crmStatusOptions.find((s) => s.value === stage.status)
              const width = (stage.count / maxFunnelCount) * 100
              return (
                <div key={stage.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/70">{stage.label}</span>
                    <span className="text-sm font-bold">{stage.count}</span>
                  </div>
                  <div className="h-8 bg-white/5 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${statusOption?.bgColor || "bg-white/20"} transition-all duration-500`}
                      style={{ width: `${Math.max(width, 2)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Leads by Status */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <h3 className="text-sm font-bold text-white/60 mb-4">Leads by Status</h3>
          <div className="space-y-2">
            {leadsByStatus.map((status) => (
              <div key={status.value} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${status.bgColor} ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold">{status.count}</span>
                  {status.value > 0 && (
                    <span className="text-white/40 text-sm ml-2">({formatCurrency(status.value)})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
        <h3 className="text-sm font-bold text-white/60 mb-4">Activity (Last 30 Days)</h3>
        <div className="flex items-end gap-1 h-32">
          {activityByDay.map((day, index) => {
            const height = (day.total / maxActivity) * 100
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full bg-[#375DEE]/60 hover:bg-[#375DEE] rounded-t transition-all cursor-pointer"
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
                <span className="text-[9px] text-white/30">{format(day.date, "d")}</span>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 px-2 py-1 bg-[#1a1a1a] rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  {format(day.date, "MMM d")}: {day.total} activities
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Leads */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <h3 className="text-sm font-bold text-white/60 mb-4">Top Opportunities</h3>
          {topLeads.length === 0 ? (
            <p className="text-white/40 text-sm">No leads with estimated value</p>
          ) : (
            <div className="space-y-3">
              {topLeads.map((lead, index) => (
                <div key={lead.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{lead.company_name}</p>
                    <p className="text-xs text-white/40">{lead.contact_name}</p>
                  </div>
                  <span className="text-amber-400 font-bold">{formatCurrency(lead.estimated_value || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leads by Source */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <h3 className="text-sm font-bold text-white/60 mb-4">Leads by Source</h3>
          {sourceData.length === 0 ? (
            <p className="text-white/40 text-sm">No lead sources recorded</p>
          ) : (
            <div className="space-y-3">
              {sourceData.slice(0, 6).map((source) => (
                <div key={source.source} className="flex items-center justify-between">
                  <span className="text-white/70">{source.source}</span>
                  <div className="text-right">
                    <span className="font-bold">{source.count}</span>
                    {source.value > 0 && (
                      <span className="text-white/40 text-sm ml-2">({formatCurrency(source.value)})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
