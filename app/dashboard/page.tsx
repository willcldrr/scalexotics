"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { useDashboardCache } from "@/lib/dashboard-cache"
import Link from "next/link"
import {
  Users,
  Car,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Clock,
  Sparkles,
  RefreshCw,
  CalendarCheck,
  Target,
  Activity,
  Zap,
  PieChart as PieChartIcon,
  Loader2,
} from "lucide-react"
import { formatDistanceToNow, format, subDays, eachDayOfInterval } from "date-fns"
import { convertedStatus } from "@/lib/lead-status"

// Lazy load heavy chart components - only on desktop
const RevenueChart = dynamic(
  () => import("./components/dashboard-charts").then(mod => ({ default: mod.RevenueChart })),
  { ssr: false, loading: () => <ChartLoading /> }
)
const LeadSourcesPieChart = dynamic(
  () => import("./components/dashboard-charts").then(mod => ({ default: mod.LeadSourcesPieChart })),
  { ssr: false, loading: () => <ChartLoading /> }
)
const VehiclePerformanceChart = dynamic(
  () => import("./components/dashboard-charts").then(mod => ({ default: mod.VehiclePerformanceChart })),
  { ssr: false, loading: () => <ChartLoading /> }
)
const BookingStatusPieChart = dynamic(
  () => import("./components/dashboard-charts").then(mod => ({ default: mod.BookingStatusPieChart })),
  { ssr: false, loading: () => <ChartLoading /> }
)

// Chart loading placeholder
const ChartLoading = () => (
  <div className="w-full h-full flex items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin text-[#375DEE]/50" />
  </div>
)

// Hook to detect if we're on mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

// Hook for lazy loading sections when visible
const useInView = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return { ref, inView }
}

const COLORS = ["#375DEE", "#5b7cf2", "#8aa0f6", "#b8c4fa", "#ffffff", "#d1d5db", "#9ca3af", "#6b7280"]

export default function DashboardPage() {
  const { data, refreshData } = useDashboardCache()
  const { leads, vehicles, bookings, isLoading, lastFetched } = data
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d")
  const isMobile = useIsMobile()

  // Lazy load sections
  const revenueSection = useInView()
  const chartsSection = useInView()
  const vehicleSection = useInView()
  const utilizationSection = useInView()

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

  // KPI metrics with period-over-period change
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

  // Revenue over time chart data - OPTIMIZED: pre-group bookings by date
  // Skip computation on mobile since charts are hidden
  const revenueOverTime = useMemo(() => {
    if (isMobile) return []

    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 60
    const interval = eachDayOfInterval({
      start: subDays(new Date(), days),
      end: new Date(),
    })

    // Pre-group bookings by date string (O(n) instead of O(n*m))
    const bookingsByDate = new Map<string, typeof filteredData.bookings>()
    for (const b of filteredData.bookings) {
      const dateKey = format(new Date(b.created_at), "yyyy-MM-dd")
      if (!bookingsByDate.has(dateKey)) {
        bookingsByDate.set(dateKey, [])
      }
      bookingsByDate.get(dateKey)!.push(b)
    }

    return interval.map(day => {
      const dateKey = format(day, "yyyy-MM-dd")
      const dayBookings = bookingsByDate.get(dateKey) || []
      const revenue = dayBookings
        .filter(b => b.status === "confirmed" || b.status === "completed")
        .reduce((sum, b) => sum + (b.total_amount || 0), 0)

      return {
        date: format(day, "MMM dd"),
        revenue,
        bookings: dayBookings.length,
      }
    })
  }, [filteredData, timeRange, isMobile])

  // Lead sources breakdown - Skip on mobile
  const leadSourcesData = useMemo(() => {
    if (isMobile) return []

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
  }, [filteredData.leads, isMobile])

  // Vehicle performance (top 5 by revenue) - Skip on mobile
  const vehiclePerformance = useMemo(() => {
    if (isMobile) return []

    // Pre-group bookings by vehicle_id (O(n) instead of O(n*m))
    const bookingsByVehicle = new Map<string, typeof filteredData.bookings>()
    for (const b of filteredData.bookings) {
      if (!bookingsByVehicle.has(b.vehicle_id)) {
        bookingsByVehicle.set(b.vehicle_id, [])
      }
      bookingsByVehicle.get(b.vehicle_id)!.push(b)
    }

    const vehicleStats = vehicles.map(vehicle => {
      const vehicleBookings = bookingsByVehicle.get(vehicle.id) || []
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
  }, [vehicles, filteredData.bookings, isMobile])

  // Booking status distribution - Skip on mobile
  const bookingStatusData = useMemo(() => {
    if (isMobile) return []

    const statusCounts = filteredData.bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }))
  }, [filteredData.bookings, isMobile])

  // Conversion funnel - Skip on mobile
  const conversionFunnel = useMemo(() => {
    if (isMobile) return []

    const total = filteredData.leads.length
    const contacted = filteredData.leads.filter(l => ["contacted", "converted"].includes(l.status)).length
    const converted = filteredData.leads.filter(l => l.status === convertedStatus).length

    return [
      { stage: "New Leads", count: total, percentage: 100, color: "#375DEE" },
      { stage: "Contacted", count: contacted, percentage: total > 0 ? (contacted / total) * 100 : 0, color: "#a855f7" },
      { stage: "Converted", count: converted, percentage: total > 0 ? (converted / total) * 100 : 0, color: "#10b981" },
    ]
  }, [filteredData.leads, isMobile])

  // Fleet utilization - Skip on mobile
  const vehicleUtilization = useMemo(() => {
    if (isMobile) return []

    // Pre-group non-cancelled bookings by vehicle_id with pre-calculated days
    const utilizationByVehicle = new Map<string, number>()
    for (const b of bookings) {
      if (b.status === "cancelled") continue
      const start = new Date(b.start_date)
      const end = new Date(b.end_date)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      utilizationByVehicle.set(b.vehicle_id, (utilizationByVehicle.get(b.vehicle_id) || 0) + days)
    }

    const periodDays = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365

    return vehicles.map(vehicle => {
      const totalDaysBooked = utilizationByVehicle.get(vehicle.id) || 0
      const utilization = Math.min((totalDaysBooked / periodDays) * 100, 100)

      return {
        name: `${vehicle.make} ${vehicle.model}`,
        utilization: Math.round(utilization),
        daysBooked: totalDaysBooked,
      }
    }).sort((a, b) => b.utilization - a.utilization)
  }, [vehicles, bookings, timeRange, isMobile])

  // Recent leads & upcoming bookings (not time-range dependent)
  const recentLeads = useMemo(() => leads.slice(0, 5), [leads])

  const upcomingBookings = useMemo(() => {
    const now = new Date()
    return bookings
      .filter((b) => new Date(b.start_date) >= now)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 5)
  }, [bookings])

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-5 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl" />
                <div className="h-4 w-12 bg-white/10 rounded" />
              </div>
              <div className="h-3 w-20 bg-white/10 rounded mb-2" />
              <div className="h-8 w-24 bg-white/10 rounded" />
            </div>
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards with Controls */}
      <div className="space-y-4">
        {/* Controls - Time range selector and refresh */}
        <div className="hidden sm:flex justify-end gap-4">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  timeRange === option.value
                    ? "bg-[#375DEE] text-white shadow-lg shadow-[#375DEE]/25"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => refreshData()}
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Updated {getLastUpdatedText()}</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="group rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-5 hover:border-[#375DEE]/30 hover:shadow-lg hover:shadow-[#375DEE]/5 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#375DEE]/10 flex items-center justify-center group-hover:bg-[#375DEE]/15 transition-colors">
              <DollarSign className="w-5 h-5 text-[#375DEE]" />
            </div>
            {kpis.revenueChange !== 0 && (
              <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-medium ${
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
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">
            ${kpis.totalRevenue >= 10000 ? `${(kpis.totalRevenue/1000).toFixed(1)}k` : kpis.totalRevenue.toLocaleString()}
          </p>
        </div>

        {/* Bookings */}
        <div className="group rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-5 hover:border-[#375DEE]/30 hover:shadow-lg hover:shadow-[#375DEE]/5 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#375DEE]/10 flex items-center justify-center group-hover:bg-[#375DEE]/15 transition-colors">
              <CalendarCheck className="w-5 h-5 text-[#375DEE]" />
            </div>
            {kpis.bookingsChange !== 0 && (
              <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-medium ${
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
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">{kpis.totalBookings}</p>
        </div>

        {/* Leads */}
        <div className="group rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-5 hover:border-[#375DEE]/30 hover:shadow-lg hover:shadow-[#375DEE]/5 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#375DEE]/10 flex items-center justify-center group-hover:bg-[#375DEE]/15 transition-colors">
              <Users className="w-5 h-5 text-[#375DEE]" />
            </div>
          </div>
          <p className="text-white/50 text-xs font-medium mb-1">Total Leads</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">{kpis.totalLeads}</p>
          <p className="text-xs text-white/40 mt-1">
            <span className="text-[#375DEE]">{kpis.convertedLeads}</span> converted
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="group rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-5 hover:border-[#375DEE]/30 hover:shadow-lg hover:shadow-[#375DEE]/5 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#375DEE]/10 flex items-center justify-center group-hover:bg-[#375DEE]/15 transition-colors">
              <Target className="w-5 h-5 text-[#375DEE]" />
            </div>
          </div>
          <p className="text-white/50 text-xs font-medium mb-1">Conversion Rate</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">{kpis.conversionRate.toFixed(1)}%</p>
          <p className="text-xs text-white/40 mt-1">
            Avg: <span className="text-[#375DEE]">${Math.round(kpis.avgBookingValue).toLocaleString()}</span>
          </p>
        </div>
      </div>
    </div>

      {/* Revenue Trend Chart - Hidden on mobile for performance */}
      <div ref={revenueSection.ref} className="hidden sm:block rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden hover:border-white/[0.1] transition-colors">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#375DEE]/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-[#375DEE]" />
          </div>
          <div>
            <h2 className="font-bold">Revenue Trend</h2>
            <p className="text-xs text-white/40">Revenue and booking activity over time</p>
          </div>
        </div>
        <div className="p-5">
          <div className="h-72 sm:h-80">
            {revenueSection.inView ? <RevenueChart data={revenueOverTime} /> : <ChartLoading />}
          </div>
        </div>
      </div>

      {/* Conversion Funnel + Lead Sources - Hidden on mobile for performance */}
      <div ref={chartsSection.ref} className="hidden sm:grid lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden hover:border-white/[0.1] transition-colors">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#375DEE]/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#375DEE]" />
            </div>
            <div>
              <h2 className="font-bold">Conversion Funnel</h2>
              <p className="text-xs text-white/40">Lead progression through stages</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {conversionFunnel.map((stage) => (
              <div key={stage.stage}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white/70">{stage.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{stage.count}</span>
                    <span className="text-xs text-white/40">({stage.percentage.toFixed(0)}%)</span>
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
        <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden hover:border-white/[0.1] transition-colors">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
              <PieChartIcon className="w-4 h-4 text-white/60" />
            </div>
            <div>
              <h2 className="font-bold">Lead Sources</h2>
              <p className="text-xs text-white/40">Where your leads come from</p>
            </div>
          </div>
          <div className="p-5">
            {leadSourcesData.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0">
                  {chartsSection.inView ? <LeadSourcesPieChart data={leadSourcesData} /> : <ChartLoading />}
                </div>
                <div className="flex-1 space-y-3">
                  {leadSourcesData.slice(0, 5).map((source, index) => (
                    <div key={source.name} className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-white/60 flex-1 truncate">{source.name}</span>
                      <span className="text-sm font-semibold">{source.value}</span>
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

      {/* Vehicle Performance - Hidden on mobile for performance */}
      <div ref={vehicleSection.ref} className="hidden sm:block rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden hover:border-white/[0.1] transition-colors">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#375DEE]/10 flex items-center justify-center">
            <Car className="w-4 h-4 text-[#375DEE]" />
          </div>
          <div>
            <h2 className="font-bold">Vehicle Performance</h2>
            <p className="text-xs text-white/40">Revenue generated by each vehicle</p>
          </div>
        </div>
        <div className="p-5">
          {vehiclePerformance.length > 0 ? (
            <div className="h-64">
              {vehicleSection.inView ? <VehiclePerformanceChart data={vehiclePerformance} /> : <ChartLoading />}
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

      {/* Fleet Utilization + Booking Status - Hidden on mobile for performance */}
      <div ref={utilizationSection.ref} className="hidden sm:grid lg:grid-cols-2 gap-6">
        {/* Fleet Utilization */}
        <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden hover:border-white/[0.1] transition-colors">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
              <Clock className="w-4 h-4 text-white/60" />
            </div>
            <div>
              <h2 className="font-bold">Fleet Utilization</h2>
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
                      <span className={`text-sm font-semibold ${
                        vehicle.utilization >= 70 ? "text-[#375DEE]" :
                        vehicle.utilization >= 40 ? "text-white/70" : "text-white/40"
                      }`}>
                        {vehicle.utilization}%
                      </span>
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
        <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden hover:border-white/[0.1] transition-colors">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#375DEE]/10 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4 text-[#375DEE]" />
            </div>
            <div>
              <h2 className="font-bold">Booking Status</h2>
              <p className="text-xs text-white/40">Distribution of booking statuses</p>
            </div>
          </div>
          <div className="p-5">
            {bookingStatusData.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0">
                  {utilizationSection.inView ? <BookingStatusPieChart data={bookingStatusData} /> : <ChartLoading />}
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
                      <span className="text-sm font-semibold">{status.value}</span>
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

      {/* Recent Leads + Upcoming Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden hover:border-white/[0.1] transition-colors">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#375DEE]/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#375DEE]" />
              </div>
              <h2 className="font-bold">Recent Leads</h2>
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
                    <div className="w-9 h-9 rounded-full bg-[#375DEE]/10 flex items-center justify-center">
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
        <div className="rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden hover:border-white/[0.1] transition-colors">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white/60" />
              </div>
              <h2 className="font-bold">Upcoming Bookings</h2>
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
                    <div className="w-9 h-9 rounded-full bg-[#375DEE]/10 flex items-center justify-center">
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
                    <p className="font-semibold text-sm text-white">
                      ${booking.total_amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-white/30">
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

      {/* Quick Actions - Hidden on mobile */}
      <div className="hidden sm:grid grid-cols-3 gap-3">
        {[
          { label: "Add Vehicle", href: "/dashboard/vehicles", icon: Car },
          { label: "View Leads", href: "/dashboard/leads", icon: Users },
          { label: "AI Assistant", href: "/dashboard/ai-assistant", icon: Sparkles },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-black border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] hover:border-[#375DEE]/30 hover:shadow-md hover:shadow-[#375DEE]/5 hover:-translate-y-0.5 transition-all duration-200"
          >
            <action.icon className="w-4 h-4 text-white/40 group-hover:text-[#375DEE] transition-colors" />
            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
