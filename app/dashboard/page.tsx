"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  DollarSign,
  Car,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  TrendingUp,
  Clock,
  AlertCircle,
  Wrench,
  Sparkles,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInDays } from "date-fns"

type DateRange = '7d' | '30d' | 'ytd'

// Revenue Chart Component with illuminated grid effect
function RevenueChart({
  data,
  labels,
  selectedRange,
  onRangeChange
}: {
  data: number[]
  labels: string[]
  selectedRange: DateRange
  onRangeChange: (range: DateRange) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(800)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 32) // minus padding
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const maxValue = Math.max(...data, 1)
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const height = 240
  const chartWidth = containerWidth - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calculate square grid cells
  const cellSize = chartHeight / 5 // 5 rows
  const numCols = Math.floor(chartWidth / cellSize)

  const getX = (index: number) => {
    if (data.length <= 1) return padding.left
    return padding.left + (index / (data.length - 1)) * chartWidth
  }

  const getY = (value: number) => {
    return padding.top + chartHeight - (value / maxValue) * chartHeight
  }

  const rangeLabels: Record<DateRange, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    'ytd': 'Year to date'
  }

  // Build the line path
  const linePath = data.length > 0
    ? `M ${getX(0)} ${getY(data[0])}` + data.slice(1).map((value, i) => ` L ${getX(i + 1)} ${getY(value)}`).join('')
    : ''

  // Build the area path
  const areaPath = data.length > 0
    ? linePath + ` L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`
    : ''

  return (
    <div ref={containerRef} className="w-full bg-black rounded-2xl border border-white/[0.08] p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Revenue</h3>
          <p className="text-sm text-white/40">{rangeLabels[selectedRange]}</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Range Picker */}
          <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-1">
            {(['7d', '30d', 'ytd'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => onRangeChange(range)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  selectedRange === range
                    ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${data.reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-white/40">Total period</p>
          </div>
        </div>
      </div>

      <div style={{ height: `${height}px`, position: 'relative' }}>
        <svg
          width={containerWidth}
          height={height}
          style={{ display: 'block' }}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.12" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <clipPath id="belowLine">
              <path d={areaPath} />
            </clipPath>
            <clipPath id="aboveLine">
              <path d={data.length > 0
                ? `M ${padding.left} ${padding.top}` + data.map((value, i) => ` L ${getX(i)} ${getY(value)}`).join('') + ` L ${getX(data.length - 1)} ${padding.top} Z`
                : ''
              } />
            </clipPath>
          </defs>

          {/* Grid - dim (above line) */}
          <g clipPath="url(#aboveLine)">
            {Array.from({ length: 6 }).map((_, i) => (
              <line
                key={`h-dim-${i}`}
                x1={padding.left}
                y1={padding.top + (i / 5) * chartHeight}
                x2={padding.left + chartWidth}
                y2={padding.top + (i / 5) * chartHeight}
                stroke="white"
                strokeOpacity="0.05"
              />
            ))}
            {Array.from({ length: numCols + 1 }).map((_, i) => (
              <line
                key={`v-dim-${i}`}
                x1={padding.left + i * cellSize}
                y1={padding.top}
                x2={padding.left + i * cellSize}
                y2={padding.top + chartHeight}
                stroke="white"
                strokeOpacity="0.05"
              />
            ))}
          </g>

          {/* Grid - lit (below line) */}
          <g clipPath="url(#belowLine)">
            {Array.from({ length: 6 }).map((_, i) => (
              <line
                key={`h-lit-${i}`}
                x1={padding.left}
                y1={padding.top + (i / 5) * chartHeight}
                x2={padding.left + chartWidth}
                y2={padding.top + (i / 5) * chartHeight}
                stroke="white"
                strokeOpacity="0.2"
              />
            ))}
            {Array.from({ length: numCols + 1 }).map((_, i) => (
              <line
                key={`v-lit-${i}`}
                x1={padding.left + i * cellSize}
                y1={padding.top}
                x2={padding.left + i * cellSize}
                y2={padding.top + chartHeight}
                stroke="white"
                strokeOpacity="0.2"
              />
            ))}
          </g>

          {/* Area fill */}
          {data.length > 0 && (
            <path d={areaPath} fill="url(#areaGradient)" />
          )}

          {/* Line */}
          {data.length > 0 && (
            <path
              d={linePath}
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.4))' }}
            />
          )}
        </svg>

        {/* Y-axis labels - positioned with CSS */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-[20px]" style={{ width: `${padding.left - 8}px` }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const value = maxValue - (i / 5) * maxValue
            return (
              <span key={i} className="text-[11px] text-white/30 text-right pr-2">
                ${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toFixed(0)}
              </span>
            )
          })}
        </div>

        {/* X-axis labels - positioned with CSS */}
        <div
          className="absolute bottom-0 flex justify-between"
          style={{ left: `${padding.left}px`, right: `${padding.right}px`, height: '24px' }}
        >
          {labels.filter((_, i, arr) => {
            const step = Math.max(1, Math.floor(labels.length / 5))
            return i === 0 || i === labels.length - 1 || i % step === 0
          }).slice(0, 6).map((label, i) => (
            <span key={i} className="text-[11px] text-white/30">
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

interface Vehicle {
  id: string
  name: string
  status: string
  daily_rate: number
  image_url: string | null
}

interface Booking {
  id: string
  vehicle_id: string
  customer_name: string
  start_date: string
  end_date: string
  status: string
  total_amount: number
  deposit_paid: boolean
  vehicles?: Vehicle
}

interface Lead {
  id: string
  name: string
  status: string
  source: string | null
  vehicle_interest: string | null
  created_at: string
}

interface CalendarSync {
  id: string
  vehicle_id: string
  start_date: string
  end_date: string
  source: string
}

export default function DashboardOverview() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [calendarSyncs, setCalendarSyncs] = useState<CalendarSync[]>([])
  const [revenueRange, setRevenueRange] = useState<DateRange>('30d')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const [vehiclesRes, bookingsRes, leadsRes, syncsRes] = await Promise.all([
      supabase.from("vehicles").select("*").eq("user_id", user.id),
      supabase.from("bookings").select("*, vehicles(*)").eq("user_id", user.id).order("start_date", { ascending: false }),
      supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("calendar_syncs").select("*").eq("user_id", user.id),
    ])

    if (vehiclesRes.data) setVehicles(vehiclesRes.data)
    if (bookingsRes.data) setBookings(bookingsRes.data)
    if (leadsRes.data) setLeads(leadsRes.data)
    if (syncsRes.data) setCalendarSyncs(syncsRes.data)

    setLoading(false)
  }

  const metrics = useMemo(() => {
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subDays(thisMonthStart, 1))
    const lastMonthEnd = endOfMonth(subDays(thisMonthStart, 1))

    const thisMonthBookings = bookings.filter(b => {
      const startDate = parseISO(b.start_date)
      return isWithinInterval(startDate, { start: thisMonthStart, end: thisMonthEnd })
    })

    const lastMonthBookings = bookings.filter(b => {
      const startDate = parseISO(b.start_date)
      return isWithinInterval(startDate, { start: lastMonthStart, end: lastMonthEnd })
    })

    const thisMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
    const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
    const revenueChange = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

    const activeBookings = bookings.filter(b => {
      const start = parseISO(b.start_date)
      const end = parseISO(b.end_date)
      return now >= start && now <= end && b.status !== 'cancelled'
    })

    const upcomingBookings = bookings.filter(b => {
      const start = parseISO(b.start_date)
      const daysUntil = differenceInDays(start, now)
      return daysUntil > 0 && daysUntil <= 7 && b.status !== 'cancelled'
    }).slice(0, 4)

    const availableVehicles = vehicles.filter(v => v.status === 'available').length
    const rentedVehicles = vehicles.filter(v => v.status === 'rented').length
    const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length
    const utilizationRate = vehicles.length > 0 ? (rentedVehicles / vehicles.length) * 100 : 0

    const thisMonthLeads = leads.filter(l => {
      const created = parseISO(l.created_at)
      return isWithinInterval(created, { start: thisMonthStart, end: thisMonthEnd })
    })
    const lastMonthLeads = leads.filter(l => {
      const created = parseISO(l.created_at)
      return isWithinInterval(created, { start: lastMonthStart, end: lastMonthEnd })
    })
    const leadChange = lastMonthLeads.length > 0 ? ((thisMonthLeads.length - lastMonthLeads.length) / lastMonthLeads.length) * 100 : 0

    const bookedLeads = thisMonthLeads.filter(l => l.status === 'booked').length
    const conversionRate = thisMonthLeads.length > 0 ? (bookedLeads / thisMonthLeads.length) * 100 : 0

    const newLeads = leads.filter(l => {
      const created = parseISO(l.created_at)
      return differenceInDays(now, created) < 1
    })

    const pendingDeposits = bookings.filter(b => !b.deposit_paid && b.status !== 'cancelled')

    // Daily revenue for chart - will be recalculated based on range
    const dailyRevenue: number[] = []
    const dailyLabels: string[] = []
    // Default 30 days calculation (will be filtered in render based on range)
    for (let i = 364; i >= 0; i--) {
      const date = subDays(now, i)
      dailyLabels.push(format(date, 'MMM d'))
      const dayBookings = bookings.filter(b => {
        const start = parseISO(b.start_date)
        const end = parseISO(b.end_date)
        return date >= start && date <= end && b.status !== 'cancelled'
      })
      const dayRevenue = dayBookings.reduce((sum, b) => {
        const days = differenceInDays(parseISO(b.end_date), parseISO(b.start_date)) || 1
        return sum + (b.total_amount / days)
      }, 0)
      dailyRevenue.push(dayRevenue)
    }

    const turoBookings = calendarSyncs.filter(s => parseISO(s.start_date) >= now).length

    return {
      thisMonthRevenue,
      revenueChange,
      activeBookings: activeBookings.length,
      upcomingBookings,
      availableVehicles,
      rentedVehicles,
      maintenanceVehicles,
      utilizationRate,
      totalVehicles: vehicles.length,
      thisMonthLeads: thisMonthLeads.length,
      leadChange,
      conversionRate,
      newLeads: newLeads.length,
      pendingDeposits: pendingDeposits.length,
      dailyRevenue,
      dailyLabels,
      turoBookings,
      totalBookings: thisMonthBookings.length,
    }
  }, [vehicles, bookings, leads, calendarSyncs])

  // Filter chart data based on selected range
  const chartData = useMemo(() => {
    const now = new Date()
    let daysToShow: number

    switch (revenueRange) {
      case '7d':
        daysToShow = 7
        break
      case '30d':
        daysToShow = 30
        break
      case 'ytd':
        // Days from start of year
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        daysToShow = Math.min(differenceInDays(now, startOfYear) + 1, 365)
        break
      default:
        daysToShow = 30
    }

    // Get the last N days of data
    const sliceStart = metrics.dailyRevenue.length - daysToShow
    return {
      data: metrics.dailyRevenue.slice(sliceStart),
      labels: metrics.dailyLabels.slice(sliceStart)
    }
  }, [metrics.dailyRevenue, metrics.dailyLabels, revenueRange])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {/* Revenue Chart Skeleton */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 h-80">
          <div className="flex justify-between items-center mb-4">
            <div className="h-4 w-32 bg-white/10 rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-white/10 rounded-lg" />
              <div className="h-8 w-16 bg-white/10 rounded-lg" />
              <div className="h-8 w-16 bg-white/10 rounded-lg" />
            </div>
          </div>
          <div className="h-full w-full bg-white/5 rounded-lg" />
        </div>
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-4">
              <div className="h-3 bg-white/10 rounded w-1/2 mb-3" />
              <div className="h-6 bg-white/10 rounded w-2/3" />
            </div>
          ))}
        </div>
        {/* Bottom Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-4 h-48" />
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-4 h-48" />
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-4 h-48" />
        </div>
      </div>
    )
  }

  // Determine alerts
  const alerts: { type: string; message: string; href: string; count: number }[] = []
  if (metrics.newLeads > 0) {
    alerts.push({ type: 'leads', message: `${metrics.newLeads} new lead${metrics.newLeads > 1 ? 's' : ''} today`, href: '/dashboard/leads', count: metrics.newLeads })
  }
  if (metrics.pendingDeposits > 0) {
    alerts.push({ type: 'deposits', message: `${metrics.pendingDeposits} pending deposit${metrics.pendingDeposits > 1 ? 's' : ''}`, href: '/dashboard/bookings', count: metrics.pendingDeposits })
  }
  if (metrics.maintenanceVehicles > 0) {
    alerts.push({ type: 'maintenance', message: `${metrics.maintenanceVehicles} in maintenance`, href: '/dashboard/vehicles', count: metrics.maintenanceVehicles })
  }

  return (
    <div className="space-y-4">
      {/* Revenue Chart - Full Width */}
      <RevenueChart
        data={chartData.data}
        labels={chartData.labels}
        selectedRange={revenueRange}
        onRangeChange={setRevenueRange}
      />

      {/* Alerts Bar */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert, i) => (
            <Link
              key={i}
              href={alert.href}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] hover:border-white/20 transition-all text-sm group"
            >
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
                {alert.count}
              </span>
              <span className="text-white/70 group-hover:text-white">{alert.message}</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60" />
            </Link>
          ))}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Monthly Revenue */}
        <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">This Month</span>
            {metrics.revenueChange !== 0 && (
              <span className={`flex items-center text-xs ${metrics.revenueChange > 0 ? 'text-white/60' : 'text-white/40'}`}>
                {metrics.revenueChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(metrics.revenueChange).toFixed(0)}%
              </span>
            )}
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">${metrics.thisMonthRevenue.toLocaleString()}</span>
            <span className="text-xs text-white/40">{metrics.totalBookings} bookings</span>
          </div>
        </div>

        {/* Fleet */}
        <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">Fleet</span>
            <span className="text-xs text-white/40">{metrics.totalVehicles} total</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">{metrics.utilizationRate.toFixed(0)}%</span>
            <div className="flex items-center gap-3 text-xs text-white/50">
              <span>{metrics.rentedVehicles} out</span>
              <span>{metrics.availableVehicles} in</span>
            </div>
          </div>
        </div>

        {/* Active Rentals */}
        <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">Active</span>
            {metrics.turoBookings > 0 && (
              <span className="text-xs text-white/40">+{metrics.turoBookings} Turo</span>
            )}
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">{metrics.activeBookings}</span>
            <span className="text-xs text-white/40">{metrics.upcomingBookings.length} upcoming</span>
          </div>
        </div>

        {/* Leads */}
        <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">Leads</span>
            {metrics.leadChange !== 0 && (
              <span className={`flex items-center text-xs ${metrics.leadChange > 0 ? 'text-white/60' : 'text-white/40'}`}>
                {metrics.leadChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(metrics.leadChange).toFixed(0)}%
              </span>
            )}
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">{metrics.thisMonthLeads}</span>
            <span className="text-xs text-white/40">{metrics.conversionRate.toFixed(0)}% converted</span>
          </div>
        </div>
      </div>

      {/* Two Column: Upcoming + Fleet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Rentals */}
        <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Upcoming Rentals</span>
            <Link href="/dashboard/bookings" className="text-xs text-white/40 hover:text-white flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {metrics.upcomingBookings.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-white/30 text-sm">
              No upcoming rentals this week
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.upcomingBookings.map(booking => (
                <div key={booking.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="w-10 h-8 rounded bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {booking.vehicles?.image_url ? (
                      <img src={booking.vehicles.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Car className="w-4 h-4 text-white/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{booking.customer_name}</p>
                    <p className="text-xs text-white/40 truncate">{booking.vehicles?.name}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-white/60">{format(parseISO(booking.start_date), 'MMM d')}</p>
                    <p className="text-white/30">{differenceInDays(parseISO(booking.start_date), new Date())}d</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fleet Overview */}
        <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Fleet Status</span>
            <Link href="/dashboard/vehicles" className="text-xs text-white/40 hover:text-white flex items-center gap-1">
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-white/30 text-sm">
              No vehicles added yet
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {vehicles.slice(0, 8).map(vehicle => (
                <div key={vehicle.id} className="relative group">
                  <div className="aspect-[4/3] rounded-lg bg-white/5 overflow-hidden">
                    {vehicle.image_url ? (
                      <img src={vehicle.image_url} alt={vehicle.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-5 h-5 text-white/10" />
                      </div>
                    )}
                  </div>
                  <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                    vehicle.status === 'available' ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]' :
                    vehicle.status === 'rented' ? 'bg-white/40' :
                    'bg-white/20'
                  }`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/dashboard/leads"
          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/20 transition-all group"
        >
          <Users className="w-5 h-5 text-white/40 group-hover:text-white" />
          <span className="text-sm text-white/60 group-hover:text-white">Leads</span>
        </Link>
        <Link
          href="/dashboard/vehicles"
          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/20 transition-all group"
        >
          <Car className="w-5 h-5 text-white/40 group-hover:text-white" />
          <span className="text-sm text-white/60 group-hover:text-white">Vehicles</span>
        </Link>
        <Link
          href="/dashboard/ai-assistant"
          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all group"
        >
          <Sparkles className="w-5 h-5 text-white/40 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          <span className="text-sm text-white/60 group-hover:text-white">AI Assistant</span>
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/20 transition-all group"
        >
          <Calendar className="w-5 h-5 text-white/40 group-hover:text-white" />
          <span className="text-sm text-white/60 group-hover:text-white">Settings</span>
        </Link>
      </div>
    </div>
  )
}
