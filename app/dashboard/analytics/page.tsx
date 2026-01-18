"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  TrendingUp,
  DollarSign,
  Users,
  Car,
  CalendarCheck,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  BarChart3,
  PieChartIcon,
  Activity,
  Zap,
} from "lucide-react"
import { format, subDays, eachDayOfInterval } from "date-fns"
import { convertedStatus } from "@/lib/lead-status"

interface Booking {
  id: string
  vehicle_id: string
  start_date: string
  end_date: string
  total_amount: number
  status: string
  created_at: string
  customer_name: string
}

interface Lead {
  id: string
  name: string
  status: string
  source: string
  created_at: string
  vehicle_interest: string | null
}

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  daily_rate: number
  status: string
}

const COLORS = ["#375DEE", "#5b7cf2", "#8aa0f6", "#b8c4fa", "#ffffff", "#d1d5db", "#9ca3af", "#6b7280"]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/95 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-white/50 text-xs font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-white/70 text-sm">{entry.name}:</span>
            <span className="text-white font-semibold font-numbers text-sm">
              {typeof entry.value === 'number' && entry.name?.toLowerCase().includes('revenue')
                ? `$${entry.value.toLocaleString()}`
                : entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const [bookingsRes, leadsRes, vehiclesRes] = await Promise.all([
        supabase.from("bookings").select("*").eq("user_id", user.id),
        supabase.from("leads").select("*").eq("user_id", user.id),
        supabase.from("vehicles").select("*").eq("user_id", user.id),
      ])

      setBookings(bookingsRes.data || [])
      setLeads(leadsRes.data || [])
      setVehicles(vehiclesRes.data || [])
    }

    setLoading(false)
  }

  const filteredData = useMemo(() => {
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case "7d":
        startDate = subDays(now, 7)
        break
      case "30d":
        startDate = subDays(now, 30)
        break
      case "90d":
        startDate = subDays(now, 90)
        break
      default:
        startDate = new Date(0)
    }

    return {
      bookings: bookings.filter(b => new Date(b.created_at) >= startDate),
      leads: leads.filter(l => new Date(l.created_at) >= startDate),
    }
  }, [bookings, leads, timeRange])

  const kpis = useMemo(() => {
    const totalRevenue = filteredData.bookings
      .filter(b => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + (b.total_amount || 0), 0)

    const totalBookings = filteredData.bookings.length
    const totalLeads = filteredData.leads.length
    const convertedLeads = filteredData.leads.filter(l => l.status === convertedStatus).length
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

    const periodDays = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365
    const previousStart = subDays(new Date(), periodDays * 2)
    const previousEnd = subDays(new Date(), periodDays)

    const previousBookings = bookings.filter(b => {
      const date = new Date(b.created_at)
      return date >= previousStart && date < previousEnd
    })
    const previousRevenue = previousBookings
      .filter(b => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + (b.total_amount || 0), 0)

    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const bookingsChange = previousBookings.length > 0
      ? ((totalBookings - previousBookings.length) / previousBookings.length) * 100
      : 0

    return {
      totalRevenue,
      totalBookings,
      totalLeads,
      convertedLeads,
      conversionRate,
      avgBookingValue,
      revenueChange,
      bookingsChange,
    }
  }, [filteredData, bookings, timeRange])

  const revenueOverTime = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 60
    const interval = eachDayOfInterval({
      start: subDays(new Date(), days),
      end: new Date(),
    })

    return interval.map(day => {
      const dayBookings = filteredData.bookings.filter(b =>
        format(new Date(b.created_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
      )
      const revenue = dayBookings
        .filter(b => b.status === "confirmed" || b.status === "completed")
        .reduce((sum, b) => sum + (b.total_amount || 0), 0)

      return {
        date: format(day, "MMM dd"),
        revenue,
        bookings: dayBookings.length,
      }
    })
  }, [filteredData, timeRange])

  const leadSourcesData = useMemo(() => {
    const sourceCounts = filteredData.leads.reduce((acc, lead) => {
      const source = lead.source || "Direct"
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(sourceCounts)
      .map(([source, count]) => ({
        name: source.charAt(0).toUpperCase() + source.slice(1).replace(/_/g, " "),
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredData.leads])

  const vehiclePerformance = useMemo(() => {
    const vehicleStats = vehicles.map(vehicle => {
      const vehicleBookings = filteredData.bookings.filter(b => b.vehicle_id === vehicle.id)
      const revenue = vehicleBookings
        .filter(b => b.status === "confirmed" || b.status === "completed")
        .reduce((sum, b) => sum + (b.total_amount || 0), 0)

      return {
        name: `${vehicle.make} ${vehicle.model}`,
        bookings: vehicleBookings.length,
        revenue,
      }
    })

    return vehicleStats.sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  }, [vehicles, filteredData.bookings])

  const bookingStatusData = useMemo(() => {
    const statusCounts = filteredData.bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }))
  }, [filteredData.bookings])

  const conversionFunnel = useMemo(() => {
    // Funnel stages: each stage includes leads that have progressed to that point or beyond
    const total = filteredData.leads.length
    const contacted = filteredData.leads.filter(l => ["contacted", "converted"].includes(l.status)).length
    const converted = filteredData.leads.filter(l => l.status === convertedStatus).length

    return [
      { stage: "New Leads", count: total, percentage: 100, color: "#375DEE" },
      { stage: "Contacted", count: contacted, percentage: total > 0 ? (contacted / total) * 100 : 0, color: "#a855f7" },
      { stage: "Converted", count: converted, percentage: total > 0 ? (converted / total) * 100 : 0, color: "#10b981" },
    ]
  }, [filteredData.leads])

  const vehicleUtilization = useMemo(() => {
    return vehicles.map(vehicle => {
      const vehicleBookings = bookings.filter(b => b.vehicle_id === vehicle.id && b.status !== "cancelled")
      const totalDaysBooked = vehicleBookings.reduce((sum, b) => {
        const start = new Date(b.start_date)
        const end = new Date(b.end_date)
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        return sum + days
      }, 0)

      const periodDays = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365
      const utilization = Math.min((totalDaysBooked / periodDays) * 100, 100)

      return {
        name: `${vehicle.make} ${vehicle.model}`,
        utilization: Math.round(utilization),
        daysBooked: totalDaysBooked,
      }
    }).sort((a, b) => b.utilization - a.utilization)
  }, [vehicles, bookings, timeRange])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-9 w-36 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-5 w-64 bg-white/5 rounded mt-2 animate-pulse" />
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
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
            Analytics
          </h1>
          <p className="text-white/50 text-sm sm:text-base mt-1">
            Track performance and optimize your business
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          {[
            { value: "7d", label: "7D" },
            { value: "30d", label: "30D" },
            { value: "90d", label: "90D" },
            { value: "all", label: "All" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === option.value
                  ? "bg-[#375DEE] text-white shadow-lg shadow-[#375DEE]/25"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#375DEE]/20 via-[#375DEE]/10 to-transparent rounded-2xl p-5 border border-[#375DEE]/20 group">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#375DEE]/20 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#375DEE]" />
              </div>
              {kpis.revenueChange !== 0 && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium font-numbers ${
                  kpis.revenueChange >= 0
                    ? "bg-[#375DEE]/15 text-[#375DEE]"
                    : "bg-white/[0.06] text-white/50"
                }`}>
                  {kpis.revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(kpis.revenueChange).toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-white/50 text-xs font-medium mb-1">Total Revenue</p>
            <p className="text-2xl sm:text-3xl font-bold font-numbers tracking-tight">
              ${kpis.totalRevenue >= 10000 ? `${(kpis.totalRevenue/1000).toFixed(1)}k` : kpis.totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Bookings Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#375DEE]/20 via-[#375DEE]/10 to-transparent rounded-2xl p-5 border border-[#375DEE]/20 group">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#375DEE]/20 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-[#375DEE]" />
              </div>
              {kpis.bookingsChange !== 0 && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium font-numbers ${
                  kpis.bookingsChange >= 0
                    ? "bg-[#375DEE]/15 text-[#375DEE]"
                    : "bg-white/[0.06] text-white/50"
                }`}>
                  {kpis.bookingsChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(kpis.bookingsChange).toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-white/50 text-xs font-medium mb-1">Total Bookings</p>
            <p className="text-2xl sm:text-3xl font-bold font-numbers tracking-tight">{kpis.totalBookings}</p>
          </div>
        </div>

        {/* Leads Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#375DEE]/20 via-[#375DEE]/10 to-transparent rounded-2xl p-5 border border-[#375DEE]/20 group">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#375DEE]/20 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#375DEE]" />
              </div>
            </div>
            <p className="text-white/50 text-xs font-medium mb-1">Total Leads</p>
            <p className="text-2xl sm:text-3xl font-bold font-numbers tracking-tight">{kpis.totalLeads}</p>
            <p className="text-xs text-white/40 mt-1">
              <span className="text-[#375DEE] font-numbers">{kpis.convertedLeads}</span> converted
            </p>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#375DEE]/20 via-[#375DEE]/10 to-transparent rounded-2xl p-5 border border-[#375DEE]/20 group">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#375DEE]/20 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#375DEE]" />
              </div>
            </div>
            <p className="text-white/50 text-xs font-medium mb-1">Conversion Rate</p>
            <p className="text-2xl sm:text-3xl font-bold font-numbers tracking-tight">{kpis.conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-white/40 mt-1">
              Avg: <span className="text-[#375DEE] font-numbers">${Math.round(kpis.avgBookingValue).toLocaleString()}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#375DEE]/15 flex items-center justify-center">
            <Activity className="w-4 h-4 text-[#375DEE]" />
          </div>
          <div>
            <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Revenue Trend</h2>
            <p className="text-xs text-white/40">Revenue and booking activity over time</p>
          </div>
        </div>
        <div className="p-5">
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#375DEE" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#375DEE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#ffffff20"
                  tick={{ fill: '#ffffff40', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#ffffff20"
                  tick={{ fill: '#ffffff40', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#375DEE"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#375DEE]/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#375DEE]" />
            </div>
            <div>
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Conversion Funnel</h2>
              <p className="text-xs text-white/40">Lead progression through stages</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {conversionFunnel.map((stage, index) => (
              <div key={stage.stage}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white/70">{stage.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-numbers">{stage.count}</span>
                    <span className="text-xs text-white/40 font-numbers">({stage.percentage.toFixed(0)}%)</span>
                  </div>
                </div>
                <div className="h-2.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${stage.percentage}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
              <PieChartIcon className="w-4 h-4 text-white/60" />
            </div>
            <div>
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Lead Sources</h2>
              <p className="text-xs text-white/40">Where your leads come from</p>
            </div>
          </div>
          <div className="p-5">
            {leadSourcesData.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadSourcesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                        style={{ cursor: 'default', outline: 'none' }}
                      >
                        {leadSourcesData.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} style={{ outline: 'none' }} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} cursor={false} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {leadSourcesData.slice(0, 5).map((source, index) => (
                    <div key={source.name} className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-white/60 flex-1 truncate">{source.name}</span>
                      <span className="text-sm font-semibold font-numbers">{source.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                  <PieChartIcon className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/40 text-sm">No lead data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Performance */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#375DEE]/15 flex items-center justify-center">
            <Car className="w-4 h-4 text-[#375DEE]" />
          </div>
          <div>
            <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Vehicle Performance</h2>
            <p className="text-xs text-white/40">Revenue generated by each vehicle</p>
          </div>
        </div>
        <div className="p-5">
          {vehiclePerformance.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehiclePerformance} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#ffffff20"
                    tick={{ fill: '#ffffff40', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#ffffff20"
                    tick={{ fill: '#ffffff60', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={110}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar dataKey="revenue" name="Revenue" fill="#375DEE" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                <Car className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-white/40 text-sm">No vehicle data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Two Column */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vehicle Utilization */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
              <Clock className="w-4 h-4 text-white/60" />
            </div>
            <div>
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Fleet Utilization</h2>
              <p className="text-xs text-white/40">How often each vehicle is booked</p>
            </div>
          </div>
          <div className="p-5">
            {vehicleUtilization.length > 0 ? (
              <div className="space-y-4">
                {vehicleUtilization.slice(0, 5).map((vehicle) => (
                  <div key={vehicle.name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-white/70 truncate pr-4">{vehicle.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold font-numbers ${
                          vehicle.utilization >= 70 ? "text-[#375DEE]" :
                          vehicle.utilization >= 40 ? "text-white/70" : "text-white/40"
                        }`}>
                          {vehicle.utilization}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${vehicle.utilization}%`,
                          backgroundColor: vehicle.utilization >= 70 ? "#375DEE" : vehicle.utilization >= 40 ? "#8aa0f6" : "#6b7280",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/40 text-sm">No utilization data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Booking Status */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#375DEE]/15 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4 text-[#375DEE]" />
            </div>
            <div>
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Booking Status</h2>
              <p className="text-xs text-white/40">Distribution of booking statuses</p>
            </div>
          </div>
          <div className="p-5">
            {bookingStatusData.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bookingStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                        style={{ cursor: 'default', outline: 'none' }}
                      >
                        {bookingStatusData.map((entry) => (
                          <Cell
                            key={entry.name}
                            style={{ outline: 'none' }}
                            fill={
                              entry.name.toLowerCase() === "completed" ? "#ffffff" :
                              entry.name.toLowerCase() === "confirmed" ? "#375DEE" :
                              entry.name.toLowerCase() === "pending" ? "#8aa0f6" :
                              entry.name.toLowerCase() === "cancelled" ? "#4b5563" :
                              "#6b7280"
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} cursor={false} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {bookingStatusData.map((status) => (
                    <div key={status.name} className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            status.name.toLowerCase() === "completed" ? "#ffffff" :
                            status.name.toLowerCase() === "confirmed" ? "#375DEE" :
                            status.name.toLowerCase() === "pending" ? "#8aa0f6" :
                            status.name.toLowerCase() === "cancelled" ? "#4b5563" :
                            "#6b7280"
                        }}
                      />
                      <span className="text-sm text-white/60 flex-1 truncate">{status.name}</span>
                      <span className="text-sm font-semibold font-numbers">{status.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                  <CalendarCheck className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/40 text-sm">No booking data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
