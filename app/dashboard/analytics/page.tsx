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
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Car,
  CalendarCheck,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar,
  BarChart3,
  PieChartIcon,
  Activity,
} from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isWithinInterval } from "date-fns"

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

const COLORS = ["#375DEE", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-white/20 rounded-lg px-4 py-3 shadow-xl">
        <p className="text-white/60 text-sm mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-white font-semibold" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' && entry.name?.toLowerCase().includes('revenue')
              ? `$${entry.value.toLocaleString()}`
              : entry.value?.toLocaleString()}
          </p>
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

  // Filter data by time range
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

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalRevenue = filteredData.bookings
      .filter(b => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + (b.total_amount || 0), 0)

    const totalBookings = filteredData.bookings.length
    const completedBookings = filteredData.bookings.filter(b => b.status === "completed").length
    const pendingBookings = filteredData.bookings.filter(b => b.status === "pending").length

    const totalLeads = filteredData.leads.length
    const convertedLeads = filteredData.leads.filter(l => l.status === "converted").length
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

    // Calculate previous period for comparison
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
      completedBookings,
      pendingBookings,
      totalLeads,
      convertedLeads,
      conversionRate,
      avgBookingValue,
      revenueChange,
      bookingsChange,
    }
  }, [filteredData, bookings, timeRange])

  // Revenue over time
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

  // Lead status distribution
  const leadStatusData = useMemo(() => {
    const statusCounts = filteredData.leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }))
  }, [filteredData.leads])

  // Lead sources distribution
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

  // Vehicle performance
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

    return vehicleStats.sort((a, b) => b.revenue - a.revenue).slice(0, 6)
  }, [vehicles, filteredData.bookings])

  // Booking status distribution
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

  // Lead conversion funnel
  const conversionFunnel = useMemo(() => {
    const total = filteredData.leads.length
    const contacted = filteredData.leads.filter(l =>
      ["contacted", "qualified", "negotiating", "converted"].includes(l.status)
    ).length
    const qualified = filteredData.leads.filter(l =>
      ["qualified", "negotiating", "converted"].includes(l.status)
    ).length
    const converted = filteredData.leads.filter(l => l.status === "converted").length

    return [
      { stage: "New Leads", count: total, percentage: 100 },
      { stage: "Contacted", count: contacted, percentage: total > 0 ? (contacted / total) * 100 : 0 },
      { stage: "Qualified", count: qualified, percentage: total > 0 ? (qualified / total) * 100 : 0 },
      { stage: "Converted", count: converted, percentage: total > 0 ? (converted / total) * 100 : 0 },
    ]
  }, [filteredData.leads])

  // Vehicle utilization (simplified - based on active bookings)
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
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Analytics
          </h1>
          <p className="text-white/50 mt-1">Loading your business insights...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Analytics
          </h1>
          <p className="text-white/50 text-sm sm:text-base mt-1">Deep insights into your rental business</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1 sm:gap-2 bg-white/5 rounded-xl p-1 overflow-x-auto">
          {[
            { value: "7d", label: "7D", fullLabel: "7 Days" },
            { value: "30d", label: "30D", fullLabel: "30 Days" },
            { value: "90d", label: "90D", fullLabel: "90 Days" },
            { value: "all", label: "All", fullLabel: "All Time" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as any)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                timeRange === option.value
                  ? "bg-[#375DEE] text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <span className="sm:hidden">{option.label}</span>
              <span className="hidden sm:inline">{option.fullLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
            </div>
            {kpis.revenueChange !== 0 && (
              <div className={`flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm ${kpis.revenueChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                {kpis.revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                {Math.abs(kpis.revenueChange).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-white/50 text-xs sm:text-sm">Total Revenue</p>
          <p className="text-xl sm:text-3xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            ${kpis.totalRevenue >= 10000 ? `${(kpis.totalRevenue/1000).toFixed(1)}k` : kpis.totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#375DEE]" />
            </div>
            {kpis.bookingsChange !== 0 && (
              <div className={`flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm ${kpis.bookingsChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                {kpis.bookingsChange >= 0 ? <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                {Math.abs(kpis.bookingsChange).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-white/50 text-xs sm:text-sm">Total Bookings</p>
          <p className="text-xl sm:text-3xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            {kpis.totalBookings}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-white/50 text-xs sm:text-sm">Leads</p>
          <p className="text-xl sm:text-3xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            {kpis.totalLeads}
          </p>
          <p className="text-xs sm:text-sm text-white/40 mt-1">{kpis.convertedLeads} converted</p>
        </div>

        <div className="bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
            </div>
          </div>
          <p className="text-white/50 text-xs sm:text-sm">Conversion Rate</p>
          <p className="text-xl sm:text-3xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            {kpis.conversionRate.toFixed(1)}%
          </p>
          <p className="text-xs sm:text-sm text-white/40 mt-1 truncate">Avg: ${kpis.avgBookingValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Revenue Over Time */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <Activity className="w-5 h-5 text-[#375DEE]" />
          <h2 className="text-base sm:text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Revenue & Bookings
          </h2>
        </div>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueOverTime}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#375DEE" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#375DEE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis
                dataKey="date"
                stroke="#ffffff40"
                tick={{ fill: '#ffffff60', fontSize: 10 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="left"
                stroke="#ffffff40"
                tick={{ fill: '#ffffff60', fontSize: 10 }}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
                width={50}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#ffffff40"
                tick={{ fill: '#ffffff60', fontSize: 10 }}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span style={{ color: '#ffffff80' }}>{value}</span>}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#375DEE"
                fill="url(#revenueGradient)"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bookings"
                name="Bookings"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Middle Row - Conversion Funnel & Lead Sources */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <BarChart3 className="w-5 h-5 text-[#375DEE]" />
            <h2 className="text-base sm:text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Conversion Funnel
            </h2>
          </div>
          <div className="space-y-4">
            {conversionFunnel.map((stage, index) => (
              <div key={stage.stage}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white/70">{stage.stage}</span>
                  <span className="text-sm font-semibold">{stage.count} ({stage.percentage.toFixed(0)}%)</span>
                </div>
                <div className="h-8 bg-white/5 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500"
                    style={{
                      width: `${stage.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <PieChartIcon className="w-5 h-5 text-[#375DEE]" />
            <h2 className="text-base sm:text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Lead Sources
            </h2>
          </div>
          {leadSourcesData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadSourcesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {leadSourcesData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:flex-1 space-y-2">
                {leadSourcesData.slice(0, 5).map((source, index) => (
                  <div key={source.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-white/70 flex-1 truncate">{source.name}</span>
                    <span className="text-sm font-semibold">{source.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-white/40 text-center py-8">No lead data available</p>
          )}
        </div>
      </div>

      {/* Vehicle Performance */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <Car className="w-5 h-5 text-[#375DEE]" />
          <h2 className="text-base sm:text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Vehicle Performance
          </h2>
        </div>
        {vehiclePerformance.length > 0 ? (
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehiclePerformance} layout="vertical" margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#ffffff40"
                  tick={{ fill: '#ffffff60', fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#ffffff40"
                  tick={{ fill: '#ffffff60', fontSize: 10 }}
                  tickLine={false}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#375DEE" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-white/40 text-center py-8">No vehicle performance data available</p>
        )}
      </div>

      {/* Bottom Row - Vehicle Utilization & Booking Status */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Vehicle Utilization */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Clock className="w-5 h-5 text-[#375DEE]" />
            <h2 className="text-base sm:text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Vehicle Utilization
            </h2>
          </div>
          {vehicleUtilization.length > 0 ? (
            <div className="space-y-4">
              {vehicleUtilization.slice(0, 5).map((vehicle) => (
                <div key={vehicle.name}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white/70">{vehicle.name}</span>
                    <span className="text-sm font-semibold">{vehicle.utilization}%</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${vehicle.utilization}%`,
                        backgroundColor: vehicle.utilization >= 70 ? "#22c55e" : vehicle.utilization >= 40 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  <p className="text-xs text-white/40 mt-1">{vehicle.daysBooked} days booked</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-center py-8">No utilization data available</p>
          )}
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <CalendarCheck className="w-5 h-5 text-[#375DEE]" />
            <h2 className="text-base sm:text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Booking Status
            </h2>
          </div>
          {bookingStatusData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {bookingStatusData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.name.toLowerCase() === "completed" ? "#22c55e" :
                            entry.name.toLowerCase() === "confirmed" ? "#375DEE" :
                            entry.name.toLowerCase() === "pending" ? "#f59e0b" :
                            entry.name.toLowerCase() === "cancelled" ? "#ef4444" :
                            COLORS[index % COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:flex-1 space-y-2">
                {bookingStatusData.map((status) => (
                  <div key={status.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          status.name.toLowerCase() === "completed" ? "#22c55e" :
                          status.name.toLowerCase() === "confirmed" ? "#375DEE" :
                          status.name.toLowerCase() === "pending" ? "#f59e0b" :
                          status.name.toLowerCase() === "cancelled" ? "#ef4444" :
                          "#8b5cf6"
                      }}
                    />
                    <span className="text-sm text-white/70 flex-1 truncate">{status.name}</span>
                    <span className="text-sm font-semibold">{status.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-white/40 text-center py-8">No booking data available</p>
          )}
        </div>
      </div>

      {/* Lead Status Overview */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <Users className="w-5 h-5 text-[#375DEE]" />
          <h2 className="text-base sm:text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Lead Pipeline
          </h2>
        </div>
        {leadStatusData.length > 0 ? (
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="name"
                  stroke="#ffffff40"
                  tick={{ fill: '#ffffff60', fontSize: 10 }}
                  tickLine={false}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="#ffffff40"
                  tick={{ fill: '#ffffff60', fontSize: 10 }}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]}>
                  {leadStatusData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.name.toLowerCase() === "converted" ? "#22c55e" :
                        entry.name.toLowerCase() === "qualified" ? "#375DEE" :
                        entry.name.toLowerCase() === "contacted" ? "#8b5cf6" :
                        entry.name.toLowerCase() === "new" ? "#06b6d4" :
                        entry.name.toLowerCase() === "lost" ? "#ef4444" :
                        COLORS[index % COLORS.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-white/40 text-center py-8">No lead data available</p>
        )}
      </div>
    </div>
  )
}
