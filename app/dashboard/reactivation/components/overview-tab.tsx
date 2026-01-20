"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Users,
  Megaphone,
  MessageSquare,
  TrendingUp,
  Mail,
  Phone,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
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

interface RecentActivity {
  id: string
  type: "message_sent" | "response" | "conversion" | "campaign_started"
  description: string
  created_at: string
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

    // Fetch contacts stats
    const { data: contacts } = await supabase
      .from("reactivation_contacts")
      .select("id, status")
      .eq("user_id", userId)

    // Fetch campaigns
    const { data: campaignsData } = await supabase
      .from("reactivation_campaigns")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)

    // Fetch campaign stats
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white/5 rounded-2xl animate-pulse" />
          <div className="h-80 bg-white/5 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Contacts"
          value={stats.totalContacts}
          subtitle={`${stats.activeContacts} active`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Campaigns"
          value={stats.activeCampaigns}
          icon={Megaphone}
          color="purple"
        />
        <StatCard
          title="Messages Sent"
          value={stats.totalMessagesSent}
          subtitle={`${stats.totalResponses} responses`}
          icon={MessageSquare}
          color="green"
        />
        <StatCard
          title="Conversions"
          value={stats.totalConversions}
          subtitle={`${stats.conversionRate.toFixed(1)}% rate`}
          icon={Target}
          color="orange"
        />
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Rate Card */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Response Rate
          </h3>
          <div className="flex items-end gap-4">
            <div className="text-5xl font-bold text-[#375DEE]">
              {stats.responseRate.toFixed(1)}%
            </div>
            <div className="pb-2">
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>+2.4% from last month</span>
              </div>
            </div>
          </div>
          <div className="mt-6 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#375DEE] rounded-full transition-all"
              style={{ width: `${Math.min(stats.responseRate, 100)}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/50 text-sm">Total Sent</p>
              <p className="text-xl font-semibold">{stats.totalMessagesSent}</p>
            </div>
            <div>
              <p className="text-white/50 text-sm">Responses</p>
              <p className="text-xl font-semibold">{stats.totalResponses}</p>
            </div>
          </div>
        </div>

        {/* Channel Performance */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Channel Performance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium">SMS</p>
                  <p className="text-sm text-white/50">Text Messages</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">68%</p>
                <p className="text-sm text-green-400">Response Rate</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-white/50">Email Campaigns</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">24%</p>
                <p className="text-sm text-blue-400">Open Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Recent Campaigns
          </h3>
          <a
            href="#"
            className="text-sm text-[#375DEE] hover:underline"
            onClick={(e) => {
              e.preventDefault()
              // Would switch to campaigns tab
            }}
          >
            View all
          </a>
        </div>
        {campaigns.length === 0 ? (
          <div className="text-center py-8">
            <Megaphone className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">No campaigns yet</p>
            <p className="text-sm text-white/30">Create your first reactivation campaign to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      campaign.status === "active"
                        ? "bg-green-400"
                        : campaign.status === "completed"
                        ? "bg-blue-400"
                        : campaign.status === "paused"
                        ? "bg-yellow-400"
                        : "bg-white/30"
                    }`}
                  />
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-white/50 capitalize">
                      {campaign.campaign_type?.replace("_", " ")} Campaign
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-white/50">Sent</p>
                    <p className="font-medium">{campaign.messages_sent || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/50">Responses</p>
                    <p className="font-medium">{campaign.responses || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/50">Status</p>
                    <p className="font-medium capitalize">{campaign.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Import Contacts"
          description="Upload a CSV of past customers"
          icon={Users}
          href="/dashboard/reactivation?tab=contacts"
        />
        <QuickActionCard
          title="Create Campaign"
          description="Start a new reactivation campaign"
          icon={Megaphone}
          href="/dashboard/reactivation?tab=campaigns"
        />
        <QuickActionCard
          title="View Templates"
          description="Browse or create message templates"
          icon={MessageSquare}
          href="/dashboard/reactivation?tab=templates"
        />
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  subtitle?: string
  icon: any
  color: "blue" | "purple" | "green" | "orange"
}) {
  const colors = {
    blue: "bg-blue-500/20 text-blue-400",
    purple: "bg-purple-500/20 text-purple-400",
    green: "bg-green-500/20 text-green-400",
    orange: "bg-orange-500/20 text-orange-400",
  }

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/50 text-sm">{title}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
      {subtitle && <p className="text-sm text-white/40 mt-1">{subtitle}</p>}
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string
  description: string
  icon: any
  href: string
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-[#375DEE]/50 transition-colors group"
    >
      <div className="w-12 h-12 bg-[#375DEE]/20 rounded-xl flex items-center justify-center group-hover:bg-[#375DEE]/30 transition-colors">
        <Icon className="w-6 h-6 text-[#375DEE]" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-white/50">{description}</p>
      </div>
    </a>
  )
}
