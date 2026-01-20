"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  Users,
  Megaphone,
  MessageSquare,
  TrendingUp,
  Mail,
  Phone,
  ArrowUpRight,
  ArrowRight,
  Target,
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
      <div className="space-y-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-white/[0.02] rounded-2xl border border-white/[0.06] animate-pulse" />
          <div className="h-72 bg-white/[0.02] rounded-2xl border border-white/[0.06] animate-pulse" />
        </div>
      </div>
    )
  }

  const statCards = [
    {
      name: "Total Contacts",
      value: stats.totalContacts,
      subtitle: `${stats.activeContacts} active`,
      icon: Users,
    },
    {
      name: "Active Campaigns",
      value: stats.activeCampaigns,
      subtitle: "Running now",
      icon: Megaphone,
    },
    {
      name: "Messages Sent",
      value: stats.totalMessagesSent,
      subtitle: `${stats.totalResponses} responses`,
      icon: MessageSquare,
    },
    {
      name: "Conversions",
      value: stats.totalConversions,
      subtitle: `${stats.conversionRate.toFixed(1)}% rate`,
      icon: Target,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden bg-gradient-to-br from-[#375DEE]/20 via-[#375DEE]/10 to-transparent rounded-2xl p-5 border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300 group"
          >
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#375DEE]/20 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/50 text-sm font-medium">{stat.name}</span>
                <div className="w-10 h-10 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-[#375DEE]" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-bold font-numbers tracking-tight">
                  {stat.value.toLocaleString()}
                </h3>
                <p className="text-xs text-white/40">{stat.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Response Rate Highlight */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#375DEE]/20 via-[#375DEE]/10 to-transparent rounded-2xl p-6 border border-[#375DEE]/20">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#375DEE]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#375DEE]/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#375DEE]/20 border border-[#375DEE]/30 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-[#375DEE]" />
            </div>
            <div>
              <p className="text-white/50 text-sm font-medium">Response Rate</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl sm:text-4xl font-bold font-numbers">
                  {stats.responseRate.toFixed(1)}%
                </h3>
                {stats.responseRate > 0 && (
                  <span className="flex items-center gap-0.5 text-[#375DEE] text-sm font-medium">
                    <ArrowUpRight className="w-4 h-4" />
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-sm text-white/40">
            Based on <span className="text-white/60 font-numbers">{stats.totalMessagesSent}</span> messages sent
          </div>
        </div>
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Performance */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#375DEE]/15 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-[#375DEE]" />
              </div>
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                Channel Performance
              </h2>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#375DEE]/15 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#375DEE]" />
                </div>
                <div>
                  <p className="font-medium text-sm">SMS</p>
                  <p className="text-xs text-white/40">Text Messages</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold font-numbers">68%</p>
                <p className="text-xs text-white/40">Response Rate</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <p className="font-medium text-sm">Email</p>
                  <p className="text-xs text-white/40">Email Campaigns</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold font-numbers">24%</p>
                <p className="text-xs text-white/40">Open Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-white/60" />
              </div>
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                Recent Campaigns
              </h2>
            </div>
            <Link
              href="#"
              className="text-xs text-white/40 hover:text-[#375DEE] transition-colors flex items-center gap-1 group"
            >
              View all
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {campaigns.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                  <Megaphone className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/40 text-sm">No campaigns yet</p>
                <p className="text-white/25 text-xs mt-1">Create your first campaign to get started</p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        campaign.status === "active"
                          ? "bg-[#375DEE]"
                          : campaign.status === "completed"
                          ? "bg-white/40"
                          : campaign.status === "paused"
                          ? "bg-white/30"
                          : "bg-white/20"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-sm">{campaign.name}</p>
                      <p className="text-xs text-white/40 capitalize">
                        {campaign.campaign_type?.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <p className="text-white/40">Sent</p>
                      <p className="font-medium font-numbers">{campaign.messages_sent || 0}</p>
                    </div>
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
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Import Contacts", icon: Users, href: "#" },
          { label: "Create Campaign", icon: Megaphone, href: "#" },
          { label: "View Templates", icon: MessageSquare, href: "#" },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-xl transition-all group"
          >
            <action.icon className="w-4 h-4 text-white/40 group-hover:text-[#375DEE] transition-colors" />
            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
