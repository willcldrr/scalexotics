"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Image from "next/image"
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
  Gauge,
  Zap,
  Activity,
  CircleDot,
  Bell,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInDays, formatDistanceToNow } from "date-fns"
import OnboardingChecklist from "./onboarding-checklist"
import PageTransition from "@/app/components/page-transition"

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
      className="w-full rounded-2xl border border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.4),0_0_40px_rgba(255,255,255,0.03)] overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%)'
      }}
    >
      {/* Background glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[400px] rounded-full blur-[120px] opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
            top: '-50%',
            left: '20%',
          }}
        />
        <div
          className="absolute w-[400px] h-[300px] rounded-full blur-[100px] opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
            bottom: '-30%',
            right: '10%',
          }}
        />
      </div>

      <div className="relative z-10 p-4 sm:p-6">
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
                      ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
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
                <stop offset="0%" stopColor="white" stopOpacity="0.2" />
                <stop offset="40%" stopColor="white" stopOpacity="0.06" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>

              {/* Line gradient */}
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                <stop offset="50%" stopColor="white" stopOpacity="1" />
                <stop offset="100%" stopColor="white" stopOpacity="0.5" />
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
              <>
              <path d={linePath} fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.15" />
              <path
                d={linePath}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              </>
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
  const [businessName, setBusinessName] = useState<string>('')
  const [aiSettings, setAiSettings] = useState<{ business_name?: string; business_phone?: string; tone?: string } | null>(null)
  const [hasStripeKeys, setHasStripeKeys] = useState(false)
  const [hasInstagram, setHasInstagram] = useState(false)

  useEffect(() => {
    fetchData()

    // Poll every 5 seconds for live updates
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData()
      }
    }, 5000)

    return () => clearInterval(pollInterval)
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const [vehiclesRes, bookingsRes, leadsRes, syncsRes, settingsRes, aiSettingsRes, depositConfigRes, instagramRes] = await Promise.all([
      supabase.from("vehicles").select("*").eq("user_id", user.id),
      supabase.from("bookings").select("*, vehicles(*)").eq("user_id", user.id).order("start_date", { ascending: false }),
      supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("calendar_syncs").select("*").eq("user_id", user.id),
      supabase.from("businesses").select("stripe_connected, name").eq("owner_user_id", user.id).maybeSingle(),
      supabase.from("ai_settings").select("id, business_name, business_phone, tone").eq("user_id", user.id).maybeSingle(),
      supabase.from("deposit_portal_config").select("stripe_publishable_key, stripe_secret_key").eq("user_id", user.id).maybeSingle(),
      supabase.from("instagram_connections").select("id").eq("user_id", user.id).eq("is_active", true).maybeSingle(),
    ])

    if (vehiclesRes.data) setVehicles(vehiclesRes.data)
    if (bookingsRes.data) setBookings(bookingsRes.data)
    if (leadsRes.data) setLeads(leadsRes.data)
    if (syncsRes.data) setCalendarSyncs(syncsRes.data)
    if (settingsRes.data) {
      setHasStripeConnected(!!settingsRes.data.stripe_connected)
      setBusinessName(settingsRes.data?.name || '')
    }
    setHasAIConfigured(!!aiSettingsRes.data)
    if (aiSettingsRes.data) {
      setAiSettings({
        business_name: aiSettingsRes.data.business_name || '',
        business_phone: aiSettingsRes.data.business_phone || '',
        tone: aiSettingsRes.data.tone || '',
      })
    } else {
      setAiSettings(null)
    }
    setHasStripeKeys(!!(depositConfigRes.data?.stripe_publishable_key && depositConfigRes.data?.stripe_secret_key))
    setHasInstagram(!!instagramRes.data)

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
      if (!b.deposit_paid || !b.created_at) return false
      const paymentDate = parseISO(b.created_at)
      return isWithinInterval(paymentDate, { start: thisMonthStart, end: thisMonthEnd })
    })

    const lastMonthPayments = bookings.filter(b => {
      if (!b.deposit_paid || !b.created_at) return false
      const paymentDate = parseISO(b.created_at)
      return isWithinInterval(paymentDate, { start: lastMonthStart, end: lastMonthEnd })
    })

    // Revenue = actual deposit amounts from confirmed Stripe payments
    const thisMonthRevenue = thisMonthPayments.reduce((sum, b) => sum + (b.deposit_amount || 0), 0)
    const lastMonthRevenue = lastMonthPayments.reduce((sum, b) => sum + (b.deposit_amount || 0), 0)

    // Keep track of bookings for other metrics
    const thisMonthBookings = bookings.filter(b => {
      if (!b.start_date) return false
      const startDate = parseISO(b.start_date)
      return isWithinInterval(startDate, { start: thisMonthStart, end: thisMonthEnd })
    })
    const revenueChange = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

    const activeBookings = bookings.filter(b => {
      if (!b.start_date || !b.end_date) return false
      const start = parseISO(b.start_date)
      const end = parseISO(b.end_date)
      return now >= start && now <= end && b.status !== 'cancelled'
    })

    const upcomingBookings = bookings.filter(b => {
      if (!b.start_date) return false
      const start = parseISO(b.start_date)
      const daysUntil = differenceInDays(start, now)
      return daysUntil > 0 && daysUntil <= 7 && b.status !== 'cancelled'
    }).slice(0, 4)

    const availableVehicles = vehicles.filter(v => v.status === 'available').length
    const rentedVehicles = vehicles.filter(v => v.status === 'rented').length
    const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length
    const utilizationRate = vehicles.length > 0 ? (rentedVehicles / vehicles.length) * 100 : 0

    const thisMonthLeads = leads.filter(l => {
      if (!l.created_at) return false
      const created = parseISO(l.created_at)
      return isWithinInterval(created, { start: thisMonthStart, end: thisMonthEnd })
    })
    const lastMonthLeads = leads.filter(l => {
      if (!l.created_at) return false
      const created = parseISO(l.created_at)
      return isWithinInterval(created, { start: lastMonthStart, end: lastMonthEnd })
    })
    const leadChange = lastMonthLeads.length > 0 ? ((thisMonthLeads.length - lastMonthLeads.length) / lastMonthLeads.length) * 100 : 0

    const bookedLeads = thisMonthLeads.filter(l => l.status === 'booked').length
    const conversionRate = thisMonthLeads.length > 0 ? (bookedLeads / thisMonthLeads.length) * 100 : 0

    const newLeads = leads.filter(l => {
      if (!l.created_at) return false
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

      // Only count bookings with deposit_paid (confirmed Stripe payments)
      const dayPayments = bookings.filter(b => {
        if (!b.deposit_paid || !b.created_at) return false
        const paymentDate = format(parseISO(b.created_at), 'yyyy-MM-dd')
        return paymentDate === dateStr
      })

      // Sum up the deposit amounts (actual money collected via Stripe)
      const dayRevenue = dayPayments.reduce((sum, b) => sum + (b.deposit_amount || 0), 0)
      dailyRevenue.push(dayRevenue)
    }

    const turoBookings = calendarSyncs.filter(s => parseISO(s.start_date) >= now).length

    // Lead sources breakdown
    const leadSourceCounts: Record<string, number> = {}
    leads.forEach(l => {
      const src = (l.source || 'direct').toLowerCase()
      leadSourceCounts[src] = (leadSourceCounts[src] || 0) + 1
    })
    const leadSources = Object.entries(leadSourceCounts)
      .sort((a, b) => b[1] - a[1])

    // Lead status pipeline
    const statusOrder = ['new', 'qualified', 'pending', 'booked', 'lost'] as const
    const leadStatusCounts: Record<string, number> = {}
    leads.forEach(l => {
      const st = (l.status || 'new').toLowerCase()
      leadStatusCounts[st] = (leadStatusCounts[st] || 0) + 1
    })
    const leadPipeline = statusOrder.map(s => ({ status: s, count: leadStatusCounts[s] || 0 }))

    // Month-over-month comparisons
    const lastMonthBookedLeads = lastMonthLeads.filter(l => l.status === 'booked').length
    const thisMonthBookingRevenue = thisMonthPayments.reduce((sum, b) => sum + (b.total_amount || 0), 0)
    const lastMonthBookingRevenue = lastMonthPayments.reduce((sum, b) => sum + (b.total_amount || 0), 0)
    const bookingRevenueChange = lastMonthBookingRevenue > 0
      ? ((thisMonthBookingRevenue - lastMonthBookingRevenue) / lastMonthBookingRevenue) * 100
      : thisMonthBookingRevenue > 0 ? 100 : 0
    const bookedLeadsChange = lastMonthBookedLeads > 0
      ? ((bookedLeads - lastMonthBookedLeads) / lastMonthBookedLeads) * 100
      : bookedLeads > 0 ? 100 : 0

    // Recent leads/bookings timeline
    const activityTimeline: Array<{ id: string; name: string; source: string; status: string; time: string; type: 'lead' | 'booking' }> = []
    leads.slice(0, 10).forEach(l => {
      activityTimeline.push({ id: l.id, name: l.name, source: l.source || 'direct', status: l.status, time: l.created_at, type: 'lead' })
    })
    bookings.slice(0, 10).forEach(b => {
      activityTimeline.push({ id: b.id, name: b.customer_name, source: 'booking', status: b.status, time: b.created_at, type: 'booking' })
    })
    activityTimeline.sort((a, b) => {
      try { return parseISO(b.time).getTime() - parseISO(a.time).getTime() } catch { return 0 }
    })

    const recentActivity: Array<{type: string; title: string; subtitle: string; timestamp: string; icon: 'calendar'|'user'|'dollar'|'car'}> = []

    try {
      bookings.filter(b => b.created_at && differenceInDays(now, parseISO(b.created_at)) <= 7).slice(0, 3).forEach(b => {
        recentActivity.push({ type: 'booking', title: `New booking: ${b.customer_name}`, subtitle: b.vehicles?.name || 'Vehicle', timestamp: b.created_at, icon: 'calendar' })
        if (b.deposit_paid) {
          recentActivity.push({ type: 'payment', title: `Payment: $${(b.deposit_amount || 0).toLocaleString()}`, subtitle: b.customer_name, timestamp: b.created_at, icon: 'dollar' })
        }
      })

      leads.filter(l => l.created_at && differenceInDays(now, parseISO(l.created_at)) <= 7).slice(0, 3).forEach(l => {
        recentActivity.push({ type: 'lead', title: `New lead: ${l.name}`, subtitle: l.vehicle_interest || l.source || 'Direct', timestamp: l.created_at, icon: 'user' })
      })

      recentActivity.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime())
    } catch { /* gracefully handle date parse errors */ }

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
      recentActivity: recentActivity.slice(0, 5),
      leadSources,
      leadPipeline,
      thisMonthLeadsCount: thisMonthLeads.length,
      lastMonthLeadsCount: lastMonthLeads.length,
      bookedLeads,
      lastMonthBookedLeads,
      bookedLeadsChange,
      thisMonthBookingRevenue,
      lastMonthBookingRevenue,
      bookingRevenueChange,
      activityTimeline: activityTimeline.slice(0, 8),
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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Determine alerts
  const alerts: { type: string; message: string; href: string; count: number }[] = []
  if (metrics.newLeads > 0) {
    alerts.push({ type: 'leads', message: `${metrics.newLeads} new lead${metrics.newLeads > 1 ? 's' : ''} today`, href: '/dashboard/leads', count: metrics.newLeads })
  }

  return (
    <PageTransition loading={loading}>
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}{businessName ? `, ${businessName}` : ''}
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        {alerts.length > 0 && (
          <div className="relative">
            <Bell className="w-5 h-5 text-white/40" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.4)]">
              {alerts.reduce((sum, a) => sum + a.count, 0)}
            </span>
          </div>
        )}
      </div>

      <OnboardingChecklist settings={aiSettings} vehicleCount={vehicles.length} hasStripe={hasStripeKeys} hasInstagram={hasInstagram} />

      {/* Alert Pills */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert, i) => {
            const alertIcons: Record<string, any> = { leads: Users, deposits: DollarSign, maintenance: Wrench }
            const AlertIcon = alertIcons[alert.type] || AlertCircle
            return (
              <Link key={i} href={alert.href} className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.2] transition-all duration-300 text-sm group">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                  <AlertIcon className="w-3.5 h-3.5 text-white/60" />
                </div>
                <span className="text-white/70 group-hover:text-white">{alert.message}</span>
                <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60" />
              </Link>
            )
          })}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-fade-in">
        <div className="stat-card bg-white/[0.03] rounded-2xl border border-white/[0.08] p-5 hover:border-white/[0.15] hover:bg-white/[0.045] transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-white/60" /></div>
            {metrics.revenueChange !== 0 && (
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${metrics.revenueChange > 0 ? 'bg-white/10 text-white/70' : 'bg-white/5 text-white/40'}`}>
                {metrics.revenueChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(metrics.revenueChange).toFixed(0)}%
              </span>
            )}
          </div>
          <p className="text-3xl font-bold tracking-tight group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-all duration-300" style={{ fontFeatureSettings: '"tnum"' }}>${metrics.thisMonthRevenue.toLocaleString()}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">This Month</span>
            <span className="text-xs text-white/30">{metrics.totalBookings} bookings</span>
          </div>
        </div>

        <div className="stat-card bg-white/[0.03] rounded-2xl border border-white/[0.08] p-5 hover:border-white/[0.15] hover:bg-white/[0.045] transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Gauge className="w-5 h-5 text-white/60" /></div>
            <span className="text-xs text-white/30">{metrics.totalVehicles} vehicles</span>
          </div>
          <p className="text-3xl font-bold tracking-tight group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-all duration-300" style={{ fontFeatureSettings: '"tnum"' }}>{metrics.utilizationRate.toFixed(0)}%</p>
          <div className="mt-3">
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-full bg-white/60 rounded-full transition-all duration-700" style={{ width: `${metrics.utilizationRate}%` }} /></div>
            <div className="flex items-center justify-between mt-2 text-xs text-white/30"><span>{metrics.rentedVehicles} rented</span><span>{metrics.availableVehicles} available</span></div>
          </div>
        </div>

        <div className="stat-card bg-white/[0.03] rounded-2xl border border-white/[0.08] p-5 hover:border-white/[0.15] hover:bg-white/[0.045] transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Activity className="w-5 h-5 text-white/60" /></div>
            {metrics.turoBookings > 0 && <span className="text-xs text-white/30 px-2 py-1 rounded-lg bg-white/[0.04]">+{metrics.turoBookings} Turo</span>}
          </div>
          <p className="text-3xl font-bold tracking-tight group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-all duration-300" style={{ fontFeatureSettings: '"tnum"' }}>{metrics.activeBookings}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">Active Now</span>
            <span className="text-xs text-white/30">{metrics.upcomingBookings.length} upcoming</span>
          </div>
        </div>

        <div className="stat-card bg-white/[0.03] rounded-2xl border border-white/[0.08] p-5 hover:border-white/[0.15] hover:bg-white/[0.045] transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Users className="w-5 h-5 text-white/60" /></div>
            {metrics.leadChange !== 0 && (
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${metrics.leadChange > 0 ? 'bg-white/10 text-white/70' : 'bg-white/5 text-white/40'}`}>
                {metrics.leadChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(metrics.leadChange).toFixed(0)}%
              </span>
            )}
          </div>
          <p className="text-3xl font-bold tracking-tight group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-all duration-300" style={{ fontFeatureSettings: '"tnum"' }}>{metrics.thisMonthLeads}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">Leads</span>
            <span className="text-xs text-white/30">{metrics.conversionRate.toFixed(0)}% booked</span>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={chartData.data} labels={chartData.labels} selectedRange={revenueRange} onRangeChange={setRevenueRange} />

      {/* Analytics: This Month Stats + Lead Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* This Month Stats - Month over Month */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] p-5 shadow-[0_2px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2.5 mb-5">
            <TrendingUp className="w-4 h-4 text-white/60" />
            <span className="text-sm font-semibold">This Month vs Last Month</span>
          </div>
          <div className="space-y-4">
            {[
              {
                label: 'New Leads',
                current: metrics.thisMonthLeadsCount,
                previous: metrics.lastMonthLeadsCount,
                change: metrics.leadChange,
                fmt: (v: number) => v.toString(),
              },
              {
                label: 'Leads Converted',
                current: metrics.bookedLeads,
                previous: metrics.lastMonthBookedLeads,
                change: metrics.bookedLeadsChange,
                fmt: (v: number) => v.toString(),
              },
              {
                label: 'Booking Revenue',
                current: metrics.thisMonthBookingRevenue,
                previous: metrics.lastMonthBookingRevenue,
                change: metrics.bookingRevenueChange,
                fmt: (v: number) => `$${v.toLocaleString()}`,
              },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-xl font-bold mt-1" style={{ fontFeatureSettings: '"tnum"' }}>{stat.fmt(stat.current)}</p>
                  <p className="text-xs text-white/25 mt-0.5">prev: {stat.fmt(stat.previous)}</p>
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg ${
                  stat.change > 0 ? 'bg-emerald-500/10 text-emerald-400' : stat.change < 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/[0.05] text-white/30'
                }`}>
                  {stat.change > 0 ? <ArrowUpRight className="w-4 h-4" /> : stat.change < 0 ? <ArrowDownRight className="w-4 h-4" /> : null}
                  {stat.change !== 0 ? `${Math.abs(stat.change).toFixed(0)}%` : '--'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources Breakdown */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] p-5 shadow-[0_2px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2.5 mb-5">
            <CircleDot className="w-4 h-4 text-white/60" />
            <span className="text-sm font-semibold">Lead Sources</span>
          </div>
          {metrics.leadSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-3"><Users className="w-6 h-6 text-white/15" /></div>
              <p className="text-sm text-white/30">No lead data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                const maxCount = metrics.leadSources.length > 0 ? metrics.leadSources[0][1] : 1
                const sourceColors: Record<string, string> = {
                  instagram: 'bg-gradient-to-r from-pink-500/70 to-purple-500/70',
                  sms: 'bg-gradient-to-r from-sky-500/70 to-cyan-500/70',
                  website: 'bg-gradient-to-r from-emerald-500/70 to-green-500/70',
                  referral: 'bg-gradient-to-r from-amber-500/70 to-yellow-500/70',
                  turo: 'bg-gradient-to-r from-indigo-500/70 to-blue-500/70',
                  facebook: 'bg-gradient-to-r from-blue-500/70 to-blue-600/70',
                  google: 'bg-gradient-to-r from-red-500/70 to-orange-500/70',
                  direct: 'bg-gradient-to-r from-white/40 to-white/20',
                }
                const defaultColor = 'bg-gradient-to-r from-white/30 to-white/15'
                return metrics.leadSources.map(([source, count]) => (
                  <div key={source}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-white/70 capitalize">{source}</span>
                      <span className="text-sm font-semibold text-white/50" style={{ fontFeatureSettings: '"tnum"' }}>{count}</span>
                    </div>
                    <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${sourceColors[source] || defaultColor}`}
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Analytics: Lead Pipeline + Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead Status Pipeline / Funnel */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] p-5 shadow-[0_2px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2.5 mb-5">
            <Activity className="w-4 h-4 text-white/60" />
            <span className="text-sm font-semibold">Lead Pipeline</span>
          </div>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-3"><Users className="w-6 h-6 text-white/15" /></div>
              <p className="text-sm text-white/30">No leads yet</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(() => {
                const maxPipeline = Math.max(...metrics.leadPipeline.map(s => s.count), 1)
                const funnelColors: Record<string, string> = {
                  new: 'bg-sky-400/70',
                  qualified: 'bg-indigo-400/70',
                  pending: 'bg-amber-400/70',
                  booked: 'bg-emerald-400/70',
                  lost: 'bg-white/20',
                }
                const funnelWidths = [100, 85, 70, 55, 40]
                return metrics.leadPipeline.map((stage, idx) => (
                  <div key={stage.status} className="flex items-center gap-3">
                    <span className="text-xs text-white/40 w-16 text-right capitalize shrink-0">{stage.status}</span>
                    <div className="flex-1" style={{ maxWidth: `${funnelWidths[idx]}%` }}>
                      <div className="h-8 bg-white/[0.03] rounded-lg overflow-hidden relative border border-white/[0.05]">
                        <div
                          className={`h-full rounded-lg transition-all duration-700 ${funnelColors[stage.status] || 'bg-white/20'}`}
                          style={{ width: stage.count > 0 ? `${Math.max((stage.count / maxPipeline) * 100, 8)}%` : '0%' }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white/80" style={{ fontFeatureSettings: '"tnum"' }}>
                          {stage.count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] p-5 shadow-[0_2px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2.5 mb-5">
            <Clock className="w-4 h-4 text-white/60" />
            <span className="text-sm font-semibold">Activity Feed</span>
          </div>
          {metrics.activityTimeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-3"><Clock className="w-6 h-6 text-white/15" /></div>
              <p className="text-sm text-white/30">No recent activity</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/[0.06]" />
              <div className="space-y-2.5">
                {metrics.activityTimeline.map((item) => {
                  const sourceIcons: Record<string, string> = {
                    instagram: 'IG', sms: 'SM', website: 'WB', referral: 'RF',
                    turo: 'TU', facebook: 'FB', google: 'GL', direct: 'DR', booking: 'BK',
                  }
                  const statusColors: Record<string, string> = {
                    new: 'bg-sky-500/20 text-sky-400',
                    qualified: 'bg-indigo-500/20 text-indigo-400',
                    pending: 'bg-amber-500/20 text-amber-400',
                    booked: 'bg-emerald-500/20 text-emerald-400',
                    confirmed: 'bg-emerald-500/20 text-emerald-400',
                    lost: 'bg-white/10 text-white/40',
                    cancelled: 'bg-red-500/20 text-red-400',
                  }
                  let timeAgo = ''
                  try { timeAgo = formatDistanceToNow(parseISO(item.time), { addSuffix: true }) } catch { timeAgo = '' }
                  return (
                    <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 relative">
                      <div className="w-[30px] h-[30px] rounded-lg bg-white/[0.08] flex items-center justify-center flex-shrink-0 z-10">
                        <span className="text-[9px] font-bold text-white/50 uppercase">{sourceIcons[item.source.toLowerCase()] || item.source.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${statusColors[item.status] || 'bg-white/10 text-white/40'}`}>{item.status}</span>
                          <span className="text-[11px] text-white/20">{timeAgo}</span>
                        </div>
                      </div>
                      {item.type === 'booking' && <Calendar className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />}
                      {item.type === 'lead' && <Users className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Column: Upcoming + Fleet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] p-5 shadow-[0_2px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5"><Calendar className="w-4 h-4 text-white/60" /><span className="text-sm font-semibold">Upcoming Rentals</span></div>
            <Link href="/dashboard/bookings" className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 transition-colors">View all <ChevronRight className="w-3 h-3" /></Link>
          </div>
          {metrics.upcomingBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-3"><Calendar className="w-6 h-6 text-white/15" /></div>
              <p className="text-sm text-white/30">No upcoming rentals</p>
              <p className="text-xs text-white/20 mt-1">Upcoming bookings will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.upcomingBookings.map(booking => {
                const daysUntil = booking.start_date ? differenceInDays(parseISO(booking.start_date), new Date()) : 0
                return (
                  <div key={booking.id} className="flex items-center gap-3.5 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all duration-300">
                    <div className="relative w-12 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {booking.vehicles?.image_url ? <Image src={booking.vehicles.image_url} alt="" fill sizes="48px" className="object-cover" /> : <Car className="w-5 h-5 text-white/15" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{booking.customer_name}</p>
                      <p className="text-xs text-white/35 truncate">{booking.vehicles?.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-white/70">{booking.start_date ? format(parseISO(booking.start_date), 'MMM d') : ''}</p>
                      <p className={`text-xs font-medium ${daysUntil <= 1 ? 'text-white/70' : 'text-white/30'}`}>{daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d away`}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] p-5 shadow-[0_2px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5"><Car className="w-4 h-4 text-emerald-400" /><span className="text-sm font-semibold">Fleet Status</span></div>
            <Link href="/dashboard/vehicles" className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 transition-colors">Manage <ChevronRight className="w-3 h-3" /></Link>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-medium">{metrics.availableVehicles} Available</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white/60 font-medium">{metrics.rentedVehicles} Rented</span>
            {metrics.maintenanceVehicles > 0 && <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-medium">{metrics.maintenanceVehicles} Maintenance</span>}
          </div>
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-3"><Car className="w-6 h-6 text-white/15" /></div>
              <p className="text-sm text-white/30">No vehicles yet</p>
              <Link href="/dashboard/vehicles" className="mt-3 text-xs text-white/60 font-medium flex items-center gap-1">Add vehicle <ChevronRight className="w-3 h-3" /></Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {vehicles.slice(0, 6).map(vehicle => (
                <div key={vehicle.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-200">
                  <div className="relative w-12 h-9 rounded-lg bg-white/[0.04] overflow-hidden flex-shrink-0">
                    {vehicle.image_url ? <Image src={vehicle.image_url} alt={vehicle.name} fill sizes="48px" className="object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Car className="w-4 h-4 text-white/10" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{vehicle.name}</p>
                    <p className="text-xs text-white/30">${vehicle.daily_rate}/day</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${vehicle.status === 'available' ? 'bg-emerald-500/10 text-emerald-400' : vehicle.status === 'rented' ? 'bg-white/10 text-white/60' : 'bg-amber-500/10 text-amber-400'}`}>
                    <CircleDot className="w-3 h-3" />{vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                  </span>
                </div>
              ))}
              {vehicles.length > 6 && <Link href="/dashboard/vehicles" className="block text-center text-xs text-white/30 hover:text-white/60 py-2 transition-colors">+{vehicles.length - 6} more</Link>}
            </div>
          )}
        </div>
      </div>

      {/* Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] p-5 shadow-[0_2px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2.5 mb-4"><Activity className="w-4 h-4 text-white/60" /><span className="text-sm font-semibold">Recent Activity</span></div>
          {metrics.recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-3"><Activity className="w-6 h-6 text-white/15" /></div>
              <p className="text-sm text-white/30">No recent activity</p>
              <p className="text-xs text-white/20 mt-1">Bookings, leads, and payments will appear here</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/[0.06]" />
              <div className="space-y-3">
                {metrics.recentActivity.map((item, idx) => {
                  const iconMap: Record<string, any> = { calendar: Calendar, user: Users, dollar: DollarSign, car: Car }
                  const colorMap: Record<string, string> = { calendar: 'bg-white/10 text-white/60', user: 'bg-white/10 text-white/60', dollar: 'bg-white/10 text-white/60', car: 'bg-white/10 text-white/60' }
                  const ItemIcon = iconMap[item.icon] || Activity
                  return (
                    <div key={idx} className="flex items-start gap-3 relative">
                      <div className={`w-[30px] h-[30px] rounded-lg ${colorMap[item.icon] || 'bg-white/10 text-white/40'} flex items-center justify-center flex-shrink-0 z-10`}><ItemIcon className="w-3.5 h-3.5" /></div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm text-white/80 truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-white/30 truncate">{item.subtitle}</span>
                          <span className="text-xs text-white/20">&middot;</span>
                          <span className="text-xs text-white/20 flex-shrink-0">{item.timestamp ? format(parseISO(item.timestamp), 'MMM d') : ''}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] p-5 shadow-[0_2px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2.5 mb-4"><Zap className="w-4 h-4 text-white/60" /><span className="text-sm font-semibold">Quick Actions</span></div>
          <div className="grid grid-cols-2 gap-2.5">
            <Link href="/dashboard/leads" className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"><Users className="w-4 h-4 text-white/60" /></div>
              <div><p className="text-sm font-medium">Leads</p><p className="text-xs text-white/30 mt-0.5">Manage inquiries</p></div>
            </Link>
            <Link href="/dashboard/vehicles" className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"><Car className="w-4 h-4 text-white/60" /></div>
              <div><p className="text-sm font-medium">Vehicles</p><p className="text-xs text-white/30 mt-0.5">Fleet management</p></div>
            </Link>
            <Link href="/dashboard/ai-assistant" className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white/60" /></div>
              <div><p className="text-sm font-medium">AI Assistant</p><p className="text-xs text-white/30 mt-0.5">Customer chatbot</p></div>
            </Link>
            <Link href="/dashboard/settings" className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group">
              <div className="w-9 h-9 rounded-xl bg-white/[0.08] flex items-center justify-center"><Settings className="w-4 h-4 text-white/50" /></div>
              <div><p className="text-sm font-medium">Settings</p><p className="text-xs text-white/30 mt-0.5">Configuration</p></div>
            </Link>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  )
}
