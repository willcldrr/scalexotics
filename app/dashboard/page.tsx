"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Users,
  Car,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

interface Metrics {
  totalLeads: number
  leadsThisMonth: number
  totalVehicles: number
  bookingsThisMonth: number
  revenueThisMonth: number
  conversionRate: number
}

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  status: string
  created_at: string
}

interface Booking {
  id: string
  customer_name: string
  start_date: string
  end_date: string
  total_amount: number
  status: string
  vehicles?: { name: string; make: string; model: string }
}

export default function DashboardPage() {
  const supabase = createClient()
  const [metrics, setMetrics] = useState<Metrics>({
    totalLeads: 0,
    leadsThisMonth: 0,
    totalVehicles: 0,
    bookingsThisMonth: 0,
    revenueThisMonth: 0,
    conversionRate: 0,
  })
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Fetch leads
    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })

    // Fetch vehicles
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("*")

    // Fetch bookings
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, vehicles(name, make, model)")
      .order("start_date", { ascending: true })

    const leadsThisMonth = leads?.filter(
      (l) => new Date(l.created_at) >= startOfMonth
    ).length || 0

    const bookingsThisMonth = bookings?.filter(
      (b) => new Date(b.start_date) >= startOfMonth
    ) || []

    const revenueThisMonth = bookingsThisMonth
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + (b.total_amount || 0), 0)

    const convertedLeads = leads?.filter((l) => l.status === "converted").length || 0
    const conversionRate = leads?.length ? (convertedLeads / leads.length) * 100 : 0

    setMetrics({
      totalLeads: leads?.length || 0,
      leadsThisMonth,
      totalVehicles: vehicles?.filter((v) => v.status !== "inactive").length || 0,
      bookingsThisMonth: bookingsThisMonth.length,
      revenueThisMonth,
      conversionRate,
    })

    setRecentLeads(leads?.slice(0, 5) || [])
    setUpcomingBookings(
      bookings?.filter((b) => new Date(b.start_date) >= new Date()).slice(0, 5) || []
    )
    setLoading(false)
  }

  const statCards = [
    {
      name: "Total Leads",
      value: metrics.totalLeads,
      change: `+${metrics.leadsThisMonth} this month`,
      icon: Users,
      trend: "up",
    },
    {
      name: "Active Vehicles",
      value: metrics.totalVehicles,
      change: "In your fleet",
      icon: Car,
      trend: "neutral",
    },
    {
      name: "Bookings",
      value: metrics.bookingsThisMonth,
      change: "This month",
      icon: Calendar,
      trend: "up",
    },
    {
      name: "Revenue",
      value: `$${metrics.revenueThisMonth.toLocaleString()}`,
      change: "This month",
      icon: DollarSign,
      trend: "up",
    },
  ]

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-500/20 text-blue-400",
      contacted: "bg-orange-500/20 text-orange-400",
      qualified: "bg-yellow-500/20 text-yellow-400",
      converted: "bg-green-500/20 text-green-400",
      lost: "bg-red-500/20 text-red-400",
      pending: "bg-yellow-500/20 text-yellow-400",
      confirmed: "bg-blue-500/20 text-blue-400",
      active: "bg-green-500/20 text-green-400",
      completed: "bg-gray-500/20 text-gray-400",
      cancelled: "bg-red-500/20 text-red-400",
    }
    return colors[status] || "bg-gray-500/20 text-gray-400"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Dashboard
          </h1>
          <p className="text-white/50 mt-1">Loading your data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-24 mb-4" />
              <div className="h-8 bg-white/10 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Dashboard
        </h1>
        <p className="text-white/50 mt-1">Welcome back. Here's what's happening.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/50 text-sm">{stat.name}</p>
                <h3 className="text-3xl font-bold mt-2 tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
                  {stat.value}
                </h3>
                <p className="text-sm mt-2 flex items-center gap-1">
                  {stat.trend === "up" && (
                    <ArrowUpRight className="w-4 h-4 text-green-400" />
                  )}
                  <span className={stat.trend === "up" ? "text-green-400" : "text-white/40"}>
                    {stat.change}
                  </span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-[#375DEE]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Conversion Rate Card */}
      <div className="bg-gradient-to-r from-[#375DEE]/20 to-[#375DEE]/5 rounded-2xl p-6 border border-[#375DEE]/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-sm">Lead Conversion Rate</p>
            <h3 className="text-4xl font-bold mt-2" style={{ fontFamily: 'var(--font-display)' }}>
              {metrics.conversionRate.toFixed(1)}%
            </h3>
            <p className="text-sm text-white/50 mt-2">
              Based on {metrics.totalLeads} total leads
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-[#375DEE]/30 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-[#375DEE]" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white/5 rounded-2xl border border-white/10">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Recent Leads
            </h2>
          </div>
          <div className="p-6">
            {recentLeads.length === 0 ? (
              <p className="text-white/40 text-center py-8">No leads yet</p>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {lead.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-white/40">{lead.phone}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        lead.status
                      )}`}
                    >
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white/5 rounded-2xl border border-white/10">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Upcoming Bookings
            </h2>
          </div>
          <div className="p-6">
            {upcomingBookings.length === 0 ? (
              <p className="text-white/40 text-center py-8">No upcoming bookings</p>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{booking.customer_name}</p>
                      <p className="text-sm text-white/40">
                        {booking.vehicles?.make} {booking.vehicles?.model}
                      </p>
                      <p className="text-sm text-white/40">
                        {new Date(booking.start_date).toLocaleDateString()} -{" "}
                        {new Date(booking.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#375DEE]">
                        ${booking.total_amount.toLocaleString()}
                      </p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
