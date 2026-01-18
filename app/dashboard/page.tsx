"use client"

import { useMemo } from "react"
import { useDashboardCache } from "@/lib/dashboard-cache"
import Link from "next/link"
import {
  Users,
  Car,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { convertedStatus } from "@/lib/lead-status"

export default function DashboardPage() {
  const { data, refreshData } = useDashboardCache()
  const { leads, vehicles, bookings, isLoading, lastFetched } = data

  // Compute metrics from cached data
  const metrics = useMemo(() => {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const leadsThisMonth = leads.filter(
      (l) => new Date(l.created_at) >= startOfMonth
    ).length

    const bookingsThisMonth = bookings.filter(
      (b) => new Date(b.start_date) >= startOfMonth
    )

    const revenueThisMonth = bookingsThisMonth
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + (b.total_amount || 0), 0)

    const convertedLeads = leads.filter((l) => l.status === convertedStatus).length
    const conversionRate = leads.length ? (convertedLeads / leads.length) * 100 : 0

    return {
      totalLeads: leads.length,
      leadsThisMonth,
      totalVehicles: vehicles.filter((v) => v.status !== "inactive").length,
      bookingsThisMonth: bookingsThisMonth.length,
      revenueThisMonth,
      conversionRate,
    }
  }, [leads, vehicles, bookings])

  const recentLeads = useMemo(() => leads.slice(0, 5), [leads])

  const upcomingBookings = useMemo(() => {
    const now = new Date()
    return bookings
      .filter((b) => new Date(b.start_date) >= now)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 5)
  }, [bookings])

  const statCards = [
    {
      name: "Total Revenue",
      value: `$${metrics.revenueThisMonth.toLocaleString()}`,
      subtitle: "This month",
      icon: DollarSign,
      gradient: "from-[#375DEE]/20 via-[#375DEE]/10 to-transparent",
      iconBg: "bg-[#375DEE]/20",
      iconColor: "text-[#375DEE]",
    },
    {
      name: "Total Leads",
      value: metrics.totalLeads,
      subtitle: `+${metrics.leadsThisMonth} this month`,
      icon: Users,
      gradient: "from-[#375DEE]/20 via-[#375DEE]/10 to-transparent",
      iconBg: "bg-[#375DEE]/20",
      iconColor: "text-[#375DEE]",
    },
    {
      name: "Bookings",
      value: metrics.bookingsThisMonth,
      subtitle: "This month",
      icon: Calendar,
      gradient: "from-[#375DEE]/20 via-[#375DEE]/10 to-transparent",
      iconBg: "bg-[#375DEE]/20",
      iconColor: "text-[#375DEE]",
    },
    {
      name: "Fleet Size",
      value: metrics.totalVehicles,
      subtitle: "Active vehicles",
      icon: Car,
      gradient: "from-[#375DEE]/20 via-[#375DEE]/10 to-transparent",
      iconBg: "bg-[#375DEE]/20",
      iconColor: "text-[#375DEE]",
    },
  ]

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-[#375DEE]/15 text-[#375DEE] border border-[#375DEE]/20",
      contacted: "bg-white/[0.08] text-white/70 border border-white/10",
      qualified: "bg-[#375DEE]/10 text-[#375DEE]/80 border border-[#375DEE]/15",
      converted: "bg-white/10 text-white border border-white/15",
      lost: "bg-white/[0.04] text-white/40 border border-white/[0.06]",
      pending: "bg-white/[0.06] text-white/60 border border-white/[0.08]",
      confirmed: "bg-[#375DEE]/15 text-[#375DEE] border border-[#375DEE]/20",
      active: "bg-[#375DEE]/20 text-[#375DEE] border border-[#375DEE]/25",
      completed: "bg-white/[0.08] text-white/70 border border-white/10",
      cancelled: "bg-white/[0.04] text-white/40 border border-white/[0.06]",
    }
    return colors[status] || "bg-white/[0.06] text-white/50 border border-white/[0.08]"
  }

  const getLastUpdatedText = () => {
    if (!lastFetched) return "Loading..."
    const seconds = Math.floor((Date.now() - lastFetched) / 1000)
    if (seconds < 5) return "Just now"
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ago`
  }

  if (isLoading && leads.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-9 w-40 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-5 w-64 bg-white/5 rounded mt-2 animate-pulse" />
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Dashboard
          </h1>
          <p className="text-white/50 text-sm sm:text-base mt-1">
            Welcome back. Here's your business overview.
          </p>
        </div>
        <button
          onClick={() => refreshData()}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Updated {getLastUpdatedText()}</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} rounded-2xl p-5 border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300 group`}
          >
            {/* Subtle glow effect */}
            <div className={`absolute -top-12 -right-12 w-24 h-24 ${stat.iconBg} rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity`} />

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/50 text-sm font-medium">{stat.name}</span>
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-bold font-numbers tracking-tight">
                  {stat.value}
                </h3>
                <p className="text-xs text-white/40">{stat.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Conversion Rate Highlight */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#375DEE]/20 via-[#375DEE]/10 to-transparent rounded-2xl p-6 border border-[#375DEE]/20">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#375DEE]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#375DEE]/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#375DEE]/20 border border-[#375DEE]/30 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-[#375DEE]" />
            </div>
            <div>
              <p className="text-white/50 text-sm font-medium">Lead Conversion Rate</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl sm:text-4xl font-bold font-numbers">
                  {metrics.conversionRate.toFixed(1)}%
                </h3>
                {metrics.conversionRate > 0 && (
                  <span className="flex items-center gap-0.5 text-[#375DEE] text-sm font-medium">
                    <ArrowUpRight className="w-4 h-4" />
                    Good
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-sm text-white/40">
            Based on <span className="text-white/60 font-numbers">{metrics.totalLeads}</span> total leads
          </div>
        </div>
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#375DEE]/15 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#375DEE]" />
              </div>
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                Recent Leads
              </h2>
            </div>
            <Link
              href="/dashboard/leads"
              className="text-xs text-white/40 hover:text-[#375DEE] transition-colors flex items-center gap-1 group"
            >
              View all
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {recentLeads.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/40 text-sm">No leads yet</p>
                <p className="text-white/25 text-xs mt-1">New leads will appear here</p>
              </div>
            ) : (
              recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#375DEE]/20 to-[#375DEE]/10 flex items-center justify-center border border-white/[0.08]">
                      <span className="text-sm font-semibold text-white/80">
                        {lead.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{lead.name}</p>
                      <p className="text-xs text-white/40">{lead.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/30 hidden sm:block">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white/60" />
              </div>
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                Upcoming Bookings
              </h2>
            </div>
            <Link
              href="/dashboard/bookings"
              className="text-xs text-white/40 hover:text-[#375DEE] transition-colors flex items-center gap-1 group"
            >
              View all
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {upcomingBookings.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/40 text-sm">No upcoming bookings</p>
                <p className="text-white/25 text-xs mt-1">Future bookings will appear here</p>
              </div>
            ) : (
              upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#375DEE]/20 to-[#375DEE]/10 flex items-center justify-center border border-white/[0.08]">
                      <Car className="w-4 h-4 text-[#375DEE]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{booking.customer_name}</p>
                      <p className="text-xs text-white/40">
                        {booking.vehicles?.make} {booking.vehicles?.model}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-white font-numbers">
                      ${booking.total_amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-white/30 font-numbers">
                      {new Date(booking.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {" - "}
                      {new Date(booking.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Add Vehicle", href: "/dashboard/vehicles", icon: Car },
          { label: "View Leads", href: "/dashboard/leads", icon: Users },
          { label: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
          { label: "AI Assistant", href: "/dashboard/ai-assistant", icon: Sparkles },
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
