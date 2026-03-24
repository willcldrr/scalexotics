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
import OnboardingChecklist from "./onboarding-checklist"

type DateRange = '7d' | '30d' | 'ytd'

// Premium Revenue Line Chart with glow effects and gradients
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
  const [dimensions, setDimensions] = useState({ width: 800, height: 280 })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 280
        })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const padding = { top: 40, right: 20, bottom: 40, left: 50 }
  const chartWidth = dimensions.width - padding.left - padding.right
  const chartHeight = dimensions.height - padding.top - padding.bottom

  const maxValue = Math.max(...data, 1)
  const totalRevenue = data.reduce((a, b) => a + b, 0)

  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + chartWidth / 2
    return padding.left + (index / (data.length - 1)) * chartWidth
  }

  const getY = (value: number) => {
    return padding.top + chartHeight - (value / maxValue) * chartHeight
  }

  // Create smooth curved path using catmull-rom spline
  const createPath = () => {
    if (data.length < 2) return ''

    const points = data.map((value, i) => ({ x: getX(i), y: getY(value) }))

    let path = `M ${points[0].x},${points[0].y}`

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2 >= points.length ? i + 1 : i + 2]

      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
    }

    return path
  }

  const linePath = createPath()
  const areaPath = linePath + ` L ${getX(data.length - 1)},${padding.top + chartHeight} L ${padding.left},${padding.top + chartHeight} Z`

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - padding.left
    const index = Math.round((x / chartWidth) * (data.length - 1))
    if (index >= 0 && index < data.length) {
      setHoveredIndex(index)
    }
  }

  const rangeLabels: Record<DateRange, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    'ytd': 'Year to date'
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl border border-white/[0.08] overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%)'
      }}
    >
      {/* Background glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[400px] rounded-full blur-[120px] opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            top: '-50%',
            left: '20%',
          }}
        />
        <div
          className="absolute w-[400px] h-[300px] rounded-full blur-[100px] opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            bottom: '-30%',
            right: '10%',
          }}
        />
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Revenue
            </h3>
            <p className="text-sm text-white/40 mt-1">{rangeLabels[selectedRange]}</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center gap-4">
            {/* Range Picker */}
            <div className="flex items-center gap-0.5 bg-white/[0.05] backdrop-blur-sm rounded-xl p-1 border border-white/[0.08]">
              {(['7d', '30d', 'ytd'] as DateRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => onRangeChange(range)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
                    selectedRange === range
                      ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4),0_0_60px_rgba(255,255,255,0.2)]'
                      : 'text-white/40 hover:text-white/80 hover:bg-white/[0.05]'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Total Revenue */}
            <div className="text-right">
              <p
                className="text-4xl font-bold tracking-tight"
                style={{
                  fontFeatureSettings: '"tnum"',
                  textShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(255,255,255,0.1)'
                }}
              >
                ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-white/30 mt-1 uppercase tracking-widest">Total Revenue</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: dimensions.height }}>
          <svg
            width={dimensions.width}
            height={dimensions.height}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
            className="cursor-crosshair"
          >
            <defs>
              {/* Area gradient - white to transparent */}
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.25" />
                <stop offset="40%" stopColor="white" stopOpacity="0.1" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>

              {/* Line gradient */}
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                <stop offset="50%" stopColor="white" stopOpacity="1" />
                <stop offset="100%" stopColor="white" stopOpacity="0.6" />
              </linearGradient>

              {/* Glow filter for line */}
              <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur1"/>
                <feGaussianBlur stdDeviation="8" result="blur2"/>
                <feMerge>
                  <feMergeNode in="blur2"/>
                  <feMergeNode in="blur1"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              {/* Strong glow for points */}
              <filter id="pointGlow" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur stdDeviation="6" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              {/* Radial gradient for hover point */}
              <radialGradient id="pointRadial">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="50%" stopColor="white" stopOpacity="0.5" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Subtle horizontal grid lines */}
            {[0.25, 0.5, 0.75].map((ratio, i) => (
              <line
                key={i}
                x1={padding.left}
                y1={padding.top + chartHeight * ratio}
                x2={padding.left + chartWidth}
                y2={padding.top + chartHeight * ratio}
                stroke="white"
                strokeOpacity="0.04"
                strokeDasharray="8 8"
              />
            ))}

            {/* Area fill */}
            {data.length > 1 && (
              <path
                d={areaPath}
                fill="url(#areaGradient)"
              />
            )}

            {/* Main line - clean, no glow */}
            {data.length > 1 && (
              <path
                d={linePath}
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Hover vertical line */}
            {hoveredIndex !== null && (
              <>
                <line
                  x1={getX(hoveredIndex)}
                  y1={padding.top}
                  x2={getX(hoveredIndex)}
                  y2={padding.top + chartHeight}
                  stroke="white"
                  strokeOpacity="0.15"
                  strokeWidth="1"
                  strokeDasharray="6 6"
                />

                {/* Glow ring around point */}
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(data[hoveredIndex])}
                  r="20"
                  fill="url(#pointRadial)"
                  opacity="0.4"
                />

                {/* Outer ring */}
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(data[hoveredIndex])}
                  r="8"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                  strokeOpacity="0.3"
                />

                {/* Inner point */}
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(data[hoveredIndex])}
                  r="4"
                  fill="white"
                  filter="url(#pointGlow)"
                />
              </>
            )}

            {/* Y-axis labels */}
            {[0, 0.5, 1].map((ratio, i) => {
              const value = maxValue * (1 - ratio)
              return (
                <text
                  key={i}
                  x={padding.left - 12}
                  y={padding.top + chartHeight * ratio + 4}
                  textAnchor="end"
                  fill="white"
                  fillOpacity="0.25"
                  fontSize="11"
                  fontWeight="500"
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  ${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toFixed(0)}
                </text>
              )
            })}

            {/* X-axis labels */}
            {labels.filter((_, i) => {
              if (data.length <= 7) return true
              const step = Math.ceil(data.length / 6)
              return i === 0 || i === data.length - 1 || i % step === 0
            }).map((label, i, arr) => {
              const originalIndex = labels.indexOf(label)
              return (
                <text
                  key={i}
                  x={getX(originalIndex)}
                  y={padding.top + chartHeight + 24}
                  textAnchor="middle"
                  fill="white"
                  fillOpacity="0.25"
                  fontSize="11"
                  fontWeight="500"
                >
                  {label}
                </text>
              )
            })}
          </svg>

          {/* Tooltip */}
          {hoveredIndex !== null && (
            <div
              className="absolute pointer-events-none transform -translate-x-1/2"
              style={{
                left: getX(hoveredIndex) + 24, // Account for padding
                top: getY(data[hoveredIndex]) - 8,
              }}
            >
              <div
                className="bg-white text-black px-4 py-2.5 rounded-xl text-center"
                style={{
                  boxShadow: '0 0 40px rgba(255,255,255,0.5), 0 0 80px rgba(255,255,255,0.25), 0 4px 20px rgba(0,0,0,0.3)'
                }}
              >
                <p className="text-xl font-bold" style={{ fontFeatureSettings: '"tnum"' }}>
                  ${data[hoveredIndex].toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-[10px] text-black/50 uppercase tracking-wider font-medium mt-0.5">
                  {labels[hoveredIndex]}
                </p>
              </div>
            </div>
          )}
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
  deposit_amount: number
  deposit_paid: boolean
  stripe_payment_intent: string | null
  created_at: string
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
  const [revenueRange, setRevenueRange] = useState<DateRange>('7d')
  const [hasStripeConnected, setHasStripeConnected] = useState(false)
  const [hasAIConfigured, setHasAIConfigured] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const [vehiclesRes, bookingsRes, leadsRes, syncsRes, settingsRes] = await Promise.all([
      supabase.from("vehicles").select("*").eq("user_id", user.id),
      supabase.from("bookings").select("*, vehicles(*)").eq("user_id", user.id).order("start_date", { ascending: false }),
      supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("calendar_syncs").select("*").eq("user_id", user.id),
      supabase.from("user_settings").select("stripe_secret_key, business_name").eq("user_id", user.id).single(),
    ])

    if (vehiclesRes.data) setVehicles(vehiclesRes.data)
    if (bookingsRes.data) setBookings(bookingsRes.data)
    if (leadsRes.data) setLeads(leadsRes.data)
    if (syncsRes.data) setCalendarSyncs(syncsRes.data)
    if (settingsRes.data) {
      setHasStripeConnected(!!settingsRes.data.stripe_secret_key)
      setHasAIConfigured(!!settingsRes.data.business_name)
    }

    setLoading(false)
  }

  const metrics = useMemo(() => {
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subDays(thisMonthStart, 1))
    const lastMonthEnd = endOfMonth(subDays(thisMonthStart, 1))

    // Only count bookings with a stripe_payment_intent (confirmed Stripe payments only)
    const thisMonthPayments = bookings.filter(b => {
      if (!b.stripe_payment_intent || !b.created_at) return false
      const paymentDate = parseISO(b.created_at)
      return isWithinInterval(paymentDate, { start: thisMonthStart, end: thisMonthEnd })
    })

    const lastMonthPayments = bookings.filter(b => {
      if (!b.stripe_payment_intent || !b.created_at) return false
      const paymentDate = parseISO(b.created_at)
      return isWithinInterval(paymentDate, { start: lastMonthStart, end: lastMonthEnd })
    })

    // Revenue = actual deposit amounts from confirmed Stripe payments
    const thisMonthRevenue = thisMonthPayments.reduce((sum, b) => sum + (b.deposit_amount || 0), 0)
    const lastMonthRevenue = lastMonthPayments.reduce((sum, b) => sum + (b.deposit_amount || 0), 0)

    // Keep track of bookings for other metrics
    const thisMonthBookings = bookings.filter(b => {
      const startDate = parseISO(b.start_date)
      return isWithinInterval(startDate, { start: thisMonthStart, end: thisMonthEnd })
    })
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

    // Daily revenue for chart - only confirmed Stripe payments
    const dailyRevenue: number[] = []
    const dailyLabels: string[] = []
    // Calculate revenue based on when payment was collected (created_at date)
    for (let i = 364; i >= 0; i--) {
      const date = subDays(now, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      dailyLabels.push(format(date, 'MMM d'))

      // Only count bookings with stripe_payment_intent (confirmed Stripe payments)
      const dayPayments = bookings.filter(b => {
        if (!b.stripe_payment_intent || !b.created_at) return false
        const paymentDate = format(parseISO(b.created_at), 'yyyy-MM-dd')
        return paymentDate === dateStr
      })

      // Sum up the deposit amounts (actual money collected via Stripe)
      const dayRevenue = dayPayments.reduce((sum, b) => sum + (b.deposit_amount || 0), 0)
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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex gap-1 h-[60px] items-end">
          <div className="w-1.5 h-10 bg-gradient-to-b from-transparent via-white to-transparent rounded-sm animate-matrix-fall" />
          <div className="w-1.5 h-14 bg-gradient-to-b from-transparent via-white to-transparent rounded-sm animate-matrix-fall [animation-delay:200ms]" />
          <div className="w-1.5 h-9 bg-gradient-to-b from-transparent via-white to-transparent rounded-sm animate-matrix-fall [animation-delay:400ms]" />
          <div className="w-1.5 h-12 bg-gradient-to-b from-transparent via-white to-transparent rounded-sm animate-matrix-fall [animation-delay:100ms]" />
          <div className="w-1.5 h-11 bg-gradient-to-b from-transparent via-white to-transparent rounded-sm animate-matrix-fall [animation-delay:300ms]" />
          <div className="w-1.5 h-8 bg-gradient-to-b from-transparent via-white to-transparent rounded-sm animate-matrix-fall [animation-delay:500ms]" />
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
      {/* Onboarding Checklist */}
      <OnboardingChecklist
        hasVehicles={vehicles.length > 0}
        hasStripeConnected={hasStripeConnected}
        hasAIConfigured={hasAIConfigured}
      />

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
