"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  Users,
  Megaphone,
  MessageSquare,
  Mail,
  Phone,
  ArrowRight,
  Target,
  Send,
  Reply,
  Zap,
  Plus,
  Upload,
} from "lucide-react"

interface OverviewTabProps {
  userId: string
}

interface Stats {
  totalContacts: number
  activeContacts: number
  activeCampaigns: number
  totalMessagesSent: number
  totalResponses: number
  totalConversions: number
  responseRate: number
  conversionRate: number
}

export default function OverviewTab({ userId }: OverviewTabProps) {
  const supabase = createClient()
  const [stats, setStats] = useState<Stats>({
    totalContacts: 0,
    activeContacts: 0,
    activeCampaigns: 0,
    totalMessagesSent: 0,
    totalResponses: 0,
    totalConversions: 0,
    responseRate: 0,
    conversionRate: 0,
  })
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [userId])

  const fetchStats = async () => {
    setLoading(true)

    const { data: contacts } = await supabase
      .from("reactivation_contacts")
      .select("id, status")
      .eq("user_id", userId)

    const { data: campaignsData } = await supabase
      .from("reactivation_campaigns")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)

    const { data: allCampaigns } = await supabase
      .from("reactivation_campaigns")
      .select("status, messages_sent, responses, conversions")
      .eq("user_id", userId)

    const totalContacts = contacts?.length || 0
    const activeContacts = contacts?.filter((c) => c.status === "active").length || 0
    const activeCampaigns = allCampaigns?.filter((c) => c.status === "active").length || 0
    const totalMessagesSent = allCampaigns?.reduce((sum, c) => sum + (c.messages_sent || 0), 0) || 0
    const totalResponses = allCampaigns?.reduce((sum, c) => sum + (c.responses || 0), 0) || 0
    const totalConversions = allCampaigns?.reduce((sum, c) => sum + (c.conversions || 0), 0) || 0

    setStats({
      totalContacts,
      activeContacts,
      activeCampaigns,
      totalMessagesSent,
      totalResponses,
      totalConversions,
      responseRate: totalMessagesSent > 0 ? (totalResponses / totalMessagesSent) * 100 : 0,
      conversionRate: totalContacts > 0 ? (totalConversions / totalContacts) * 100 : 0,
    })

    setCampaigns(campaignsData || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-20 bg-white/[0.02] rounded-2xl border border-white/[0.06] animate-pulse" />
        <div className="h-12 bg-white/[0.02] rounded-xl animate-pulse" />
        <div className="h-64 bg-white/[0.02] rounded-2xl border border-white/[0.06] animate-pulse" />
        <div className="h-40 bg-white/[0.02] rounded-2xl border border-white/[0.06] animate-pulse" />
      </div>
    )
  }

  const ribbonMetrics = [
    { label: "Contacts", value: stats.totalContacts, icon: Users },
    { label: "Active", value: stats.activeContacts, icon: Zap },
    { label: "Campaigns", value: stats.activeCampaigns, icon: Megaphone },
    { label: "Sent", value: stats.totalMessagesSent, icon: Send },
    { label: "Responses", value: stats.totalResponses, icon: Reply },
    { label: "Resp. Rate", value: `${stats.responseRate.toFixed(1)}%`, icon: MessageSquare },
    { label: "Conversions", value: stats.totalConversions, icon: Target },
    { label: "Conv. Rate", value: `${stats.conversionRate.toFixed(1)}%`, icon: Target },
  ]

  const smsRate = 68
  const emailRate = 24

  return (
    <div className="space-y-5">
      {/* Stats Ribbon */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-4">
        <div className="flex items-center gap-0 overflow-x-auto">
          {ribbonMetrics.map((metric, i) => (
            <div key={metric.label} className="flex items-center">
              {i > 0 && (
                <div className="w-px h-10 bg-white/[0.06] mx-3 flex-shrink-0" />
              )}
              <div className="flex items-center gap-2.5 px-2 flex-shrink-0">
                <metric.icon className="w-4 h-4 text-white/30" />
                <div>
                  <p className="text-[11px] text-white/40 uppercase tracking-wider font-medium">{metric.label}</p>
                  <p className="text-lg font-bold leading-tight">
                    {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Actions Bar */}
      <div className="flex items-center gap-3">
        <Link
          href="#"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#375DEE] hover:bg-[#2a4fd4] text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </Link>
        <Link
          href="#"
          className="flex items-center gap-2 px-5 py-2.5 bg-transparent border border-white/[0.10] hover:border-white/[0.20] text-white/70 hover:text-white text-sm font-medium rounded-xl transition-all"
        >
          <Upload className="w-4 h-4" />
          Import Contacts
        </Link>
      </div>

      {/* Recent Campaigns - Full Width Table */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-white/60" />
            </div>
            <h2 className="font-bold">Recent Campaigns</h2>
          </div>
          <Link
            href="#"
            className="text-xs text-white/40 hover:text-[#375DEE] transition-colors flex items-center gap-1 group"
          >
            View all
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
              <Megaphone className="w-6 h-6 text-white/20" />
            </div>
            <p className="text-white/40 text-sm">No campaigns yet</p>
            <p className="text-white/25 text-xs mt-1">Create your first campaign to get started</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-[auto_1fr_100px_80px_80px_90px_90px] gap-4 px-5 py-2.5 text-[11px] text-white/30 uppercase tracking-wider font-medium border-b border-white/[0.04]">
              <span className="w-2.5" />
              <span>Campaign</span>
              <span>Type</span>
              <span className="text-right">Sent</span>
              <span className="text-right">Responses</span>
              <span className="text-right">Conversions</span>
              <span className="text-right">Status</span>
            </div>
            {/* Table Rows */}
            <div className="divide-y divide-white/[0.04]">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="grid grid-cols-1 sm:grid-cols-[auto_1fr_100px_80px_80px_90px_90px] gap-2 sm:gap-4 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      campaign.status === "active"
                        ? "bg-[#375DEE]"
                        : campaign.status === "completed"
                        ? "bg-white/40"
                        : campaign.status === "paused"
                        ? "bg-white/30"
                        : "bg-white/20"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{campaign.name}</p>
                  </div>
                  <p className="text-xs text-white/40 capitalize">
                    {campaign.campaign_type?.replace("_", " ") || "—"}
                  </p>
                  <p className="text-sm text-right">{campaign.messages_sent || 0}</p>
                  <p className="text-sm text-right">{campaign.responses || 0}</p>
                  <p className="text-sm text-right">{campaign.conversions || 0}</p>
                  <div className="flex justify-end">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide ${
                      campaign.status === "active"
                        ? "bg-[#375DEE]/15 text-[#375DEE] border border-[#375DEE]/20"
                        : campaign.status === "completed"
                        ? "bg-white/[0.08] text-white/70 border border-white/10"
                        : "bg-white/[0.04] text-white/40 border border-white/[0.06]"
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Channel Performance */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#375DEE]/15 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-[#375DEE]" />
          </div>
          <h2 className="font-bold">Channel Performance</h2>
        </div>
        <div className="p-5 space-y-5">
          {/* SMS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#375DEE]" />
                <span className="text-sm font-medium">SMS</span>
              </div>
              <span className="text-sm font-bold">{smsRate}%</span>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#375DEE] rounded-full transition-all duration-500"
                style={{ width: `${smsRate}%` }}
              />
            </div>
          </div>
          {/* Email */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-white/50" />
                <span className="text-sm font-medium">Email</span>
              </div>
              <span className="text-sm font-bold">{emailRate}%</span>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-white/30 rounded-full transition-all duration-500"
                style={{ width: `${emailRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
