"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useDashboardCache } from "@/lib/dashboard-cache"
import { toast } from "sonner"
import {
  Calendar as CalendarIcon,
  Car,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  User,
  Phone,
  Mail,
  X,
  CalendarDays,
  MessageSquare,
  Loader2,
  Send,
  CheckCheck,
  StickyNote,
  ChevronDown,
  FileText,
} from "lucide-react"
import { format, parseISO, differenceInDays, isAfter, isBefore, startOfDay } from "date-fns"
import { leadStatusOptions, getStatusColor, getStatusLabel } from "@/lib/lead-status"
import PageTransition from "@/app/components/page-transition"
// LeadDetailModal removed - causes chunk loading issues
// import LeadDetailModal from "@/app/dashboard/leads/components/lead-detail-modal"

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  year: number
  daily_rate: number
  image_url: string | null
  color: string | null
}

interface Booking {
  id: string
  vehicle_id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  start_date: string
  end_date: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  total_amount: number
  deposit_amount: number
  deposit_paid: boolean
  notes: string | null
  created_at: string
  lead_id: string | null
  vehicles?: Vehicle
}

interface CalendarEvent {
  id: string
  vehicle_id: string
  start_date: string
  end_date: string
  source: string
  event_summary: string | null
}

interface RentalBar {
  id: string
  vehicleId: string
  vehicleName: string
  label: string
  startDate: Date
  endDate: Date
  color: string
  type: 'booking' | 'sync'
  booking?: Booking
  calendarEvent?: CalendarEvent
}

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string
  status: string
  source: string | null
  notes: string | null
  vehicle_interest: string | null
  created_at: string
}

interface Message {
  id: string
  lead_id: string
  content: string
  direction: "inbound" | "outbound"
  created_at: string
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    icon: CheckCircle,
  },
  completed: {
    label: "Completed",
    color: "text-white/50",
    bg: "bg-white/5",
    border: "border-white/10",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-white/30",
    bg: "bg-white/5",
    border: "border-white/10",
    icon: XCircle,
  },
}

const bookingStatusOptions = [
  { value: "pending", label: "Pending", color: "bg-amber-500/15 text-amber-400" },
  { value: "confirmed", label: "Confirmed", color: "bg-emerald-500/15 text-emerald-400" },
  { value: "completed", label: "Completed", color: "bg-white/10 text-white/50" },
  { value: "cancelled", label: "Cancelled", color: "bg-white/10 text-white/30" },
]

export default function BookingsPage() {
  const supabase = createClient()

  // Use the shared cache with real-time updates
  const { data: cacheData, updateBooking, updateLead } = useDashboardCache()
  const bookings = cacheData.bookings as Booking[]
  const vehicles = cacheData.vehicles as Vehicle[]
  const leads = cacheData.leads as Lead[]
  const loading = cacheData.isLoading

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null)

  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loadingEvents, setLoadingEvents] = useState(false)

  // Detail modal state
  const [selectedRental, setSelectedRental] = useState<RentalBar | null>(null)
  const [matchedLead, setMatchedLead] = useState<Lead | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showBookingStatusDropdown, setShowBookingStatusDropdown] = useState(false)
  const [showLeadStatusDropdown, setShowLeadStatusDropdown] = useState(false)
  const [updatingBooking, setUpdatingBooking] = useState(false)
  const [updatingLead, setUpdatingLead] = useState(false)
  const bookingStatusRef = useRef<HTMLDivElement>(null)
  const leadStatusRef = useRef<HTMLDivElement>(null)
  // const [leadDetailLead, setLeadDetailLead] = useState<Lead | null>(null)

  // Create a color map for vehicles
  const vehicleColorMap = useMemo(() => {
    const map = new Map<string, string>()
    vehicles.forEach(v => {
      map.set(v.id, v.color || '#ffffff')
    })
    return map
  }, [vehicles])

  // Fetch calendar events when vehicles load
  useEffect(() => {
    if (vehicles.length > 0) {
      fetchCalendarEvents()
    }
  }, [vehicles])

  const fetchCalendarEvents = async () => {
    setLoadingEvents(true)
    const vehicleIds = vehicles.map(v => v.id)

    const { data: syncData } = await supabase
      .from("calendar_syncs")
      .select("*")
      .in("vehicle_id", vehicleIds)
      .order("start_date", { ascending: true })

    if (syncData) setCalendarEvents(syncData)
    setLoadingEvents(false)
  }

  // Find matching lead for a booking
  const findMatchingLead = (booking: Booking): Lead | null => {
    const bookingPhone = booking.customer_phone?.replace(/\D/g, "")
    const bookingEmail = booking.customer_email?.toLowerCase().trim()
    const bookingName = booking.customer_name?.toLowerCase().trim()

    return leads.find(lead => {
      const leadPhone = lead.phone?.replace(/\D/g, "")
      const leadEmail = lead.email?.toLowerCase().trim()
      const leadName = lead.name?.toLowerCase().trim()

      if (bookingPhone && leadPhone && bookingPhone === leadPhone) return true
      if (bookingEmail && leadEmail && bookingEmail === leadEmail) return true
      if (bookingName && leadName && bookingName === leadName) return true
      return false
    }) || null
  }

  // Fetch messages for a lead
  const fetchMessages = async (leadId: string) => {
    setMessagesLoading(true)
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true })

    setMessages(data || [])
    setMessagesLoading(false)
  }

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !matchedLead || sending) return

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: savedMessage, error: saveError } = await supabase
        .from("messages")
        .insert({
          user_id: user.id,
          lead_id: matchedLead.id,
          content: newMessage,
          direction: "outbound",
        })
        .select()
        .single()

      if (saveError) throw saveError

      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: matchedLead.phone,
          message: newMessage,
        }),
      })

      if (!response.ok) throw new Error("Failed to send SMS")

      if (savedMessage) {
        setMessages([...messages, savedMessage])
      }

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message", { description: "Please check your connection and try again" })
    }

    setSending(false)
  }

  // Update booking status
  const updateBookingStatusHandler = async (newStatus: string) => {
    if (!selectedRental?.booking) return
    setUpdatingBooking(true)

    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", selectedRental.booking.id)

    if (!error) {
      setSelectedRental({
        ...selectedRental,
        booking: { ...selectedRental.booking, status: newStatus as Booking["status"] }
      })
      // Update via cache for real-time sync across tabs
      updateBooking(selectedRental.booking.id, { status: newStatus as Booking["status"] })
    }
    setUpdatingBooking(false)
    setShowBookingStatusDropdown(false)
  }

  // Update lead status
  const updateLeadStatusHandler = async (newStatus: string) => {
    if (!matchedLead) return
    setUpdatingLead(true)

    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", matchedLead.id)

    if (!error) {
      setMatchedLead({ ...matchedLead, status: newStatus })
      // Update via cache for real-time sync across tabs
      updateLead(matchedLead.id, { status: newStatus })
    }
    setUpdatingLead(false)
    setShowLeadStatusDropdown(false)
  }

  // Toggle deposit paid
  const toggleDepositPaid = async () => {
    if (!selectedRental?.booking) return

    const newValue = !selectedRental.booking.deposit_paid
    const { error } = await supabase
      .from("bookings")
      .update({ deposit_paid: newValue })
      .eq("id", selectedRental.booking.id)

    if (!error) {
      setSelectedRental({
        ...selectedRental,
        booking: { ...selectedRental.booking, deposit_paid: newValue }
      })
      // Update via cache for real-time sync across tabs
      updateBooking(selectedRental.booking.id, { deposit_paid: newValue })
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bookingStatusRef.current && !bookingStatusRef.current.contains(e.target as Node)) {
        setShowBookingStatusDropdown(false)
      }
      if (leadStatusRef.current && !leadStatusRef.current.contains(e.target as Node)) {
        setShowLeadStatusDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle rental selection
  const handleRentalClick = async (rental: RentalBar) => {
    setSelectedRental(rental)
    setMatchedLead(null)
    setMessages([])

    if (rental.type === 'booking' && rental.booking) {
      const lead = findMatchingLead(rental.booking)
      if (lead) {
        setMatchedLead(lead)
        fetchMessages(lead.id)
      }
    }
  }

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Filter and sort bookings - upcoming first, then past
  const filteredBookings = useMemo(() => {
    let filtered = bookings.filter(b => b.status !== "cancelled")

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(booking =>
        booking.customer_name?.toLowerCase().includes(query) ||
        booking.customer_email?.toLowerCase().includes(query) ||
        booking.customer_phone?.includes(query) ||
        booking.vehicles?.name?.toLowerCase().includes(query) ||
        booking.vehicles?.make?.toLowerCase().includes(query) ||
        booking.vehicles?.model?.toLowerCase().includes(query)
      )
    }

    const today = startOfDay(new Date())
    // Sort: upcoming first, then past; within each group by start date
    return filtered.sort((a, b) => {
      const aIsPast = isBefore(parseISO(a.end_date), today)
      const bIsPast = isBefore(parseISO(b.end_date), today)
      if (aIsPast !== bIsPast) return aIsPast ? 1 : -1
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    })
  }, [bookings, searchQuery])

  // Combined list of bookings and calendar events
  const combinedBookings = useMemo(() => {
    const items: Array<{
      id: string
      vehicleId: string
      vehicleName: string
      customerName: string
      startDate: string
      endDate: string
      color: string
      type: 'booking' | 'sync'
      booking?: Booking
      calendarEvent?: CalendarEvent
    }> = []

    // Add bookings
    filteredBookings.forEach(b => {
      const vehicle = b.vehicles
      items.push({
        id: b.id,
        vehicleId: b.vehicle_id,
        vehicleName: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown',
        customerName: b.customer_name,
        startDate: b.start_date,
        endDate: b.end_date,
        color: vehicleColorMap.get(b.vehicle_id) || '#ffffff',
        type: 'booking',
        booking: b,
      })
    })

    // Add Turo calendar events
    calendarEvents.forEach(event => {
      const vehicle = vehicles.find(v => v.id === event.vehicle_id)
      if (!vehicle) return
      items.push({
        id: event.id,
        vehicleId: event.vehicle_id,
        vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        customerName: event.event_summary || 'Turo Booking',
        startDate: event.start_date,
        endDate: event.end_date,
        color: vehicleColorMap.get(event.vehicle_id) || '#ffffff',
        type: 'sync',
        calendarEvent: event,
      })
    })

    // Sort: upcoming first, then past; within each group by start date
    const today = startOfDay(new Date())
    items.sort((a, b) => {
      const aIsPast = a.endDate ? isBefore(parseISO(a.endDate), today) : false
      const bIsPast = b.endDate ? isBefore(parseISO(b.endDate), today) : false
      if (aIsPast !== bIsPast) return aIsPast ? 1 : -1
      return new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime()
    })
    return items
  }, [filteredBookings, calendarEvents, vehicles, vehicleColorMap])

  // Calendar helpers
  const getWeeksInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const weeks: (number | null)[][] = []
    let currentWeek: (number | null)[] = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      weeks.push(currentWeek)
    }

    return weeks
  }

  // Get rental bars for a specific week
  const getRentalBarsForWeek = (week: (number | null)[], weekIndex: number) => {
    const bars: { bar: RentalBar; startCol: number; endCol: number; row: number }[] = []
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const allRentals: RentalBar[] = []

    // Add calendar sync events
    calendarEvents.forEach(event => {
      const vehicle = vehicles.find(v => v.id === event.vehicle_id)
      if (!vehicle) return
      allRentals.push({
        id: event.id,
        vehicleId: event.vehicle_id,
        vehicleName: vehicle.model || vehicle.name,
        label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        startDate: new Date(event.start_date),
        endDate: new Date(event.end_date),
        color: vehicleColorMap.get(event.vehicle_id) || '#ffffff',
        type: 'sync',
        calendarEvent: event,
      })
    })

    // Add bookings
    bookings
      .filter(b => b.status !== "cancelled")
      .forEach(booking => {
        const vehicle = vehicles.find(v => v.id === booking.vehicle_id)
        if (!vehicle) return
        allRentals.push({
          id: booking.id,
          vehicleId: booking.vehicle_id,
          vehicleName: vehicle.model || vehicle.name,
          label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          startDate: new Date(booking.start_date),
          endDate: new Date(booking.end_date),
          color: vehicleColorMap.get(booking.vehicle_id) || '#ffffff',
          type: 'booking',
          booking: booking,
        })
      })

    const rowTracker: Map<string, number> = new Map()

    allRentals.forEach(rental => {
      let startCol = -1
      let endCol = -1

      week.forEach((day, colIndex) => {
        if (day === null) return
        const cellDate = new Date(year, month, day)
        cellDate.setHours(0, 0, 0, 0)

        const rentalStart = new Date(rental.startDate)
        rentalStart.setHours(0, 0, 0, 0)
        const rentalEnd = new Date(rental.endDate)
        rentalEnd.setHours(0, 0, 0, 0)

        if (cellDate >= rentalStart && cellDate <= rentalEnd) {
          if (startCol === -1) startCol = colIndex
          endCol = colIndex
        }
      })

      if (startCol !== -1) {
        let row = 0
        for (let r = 0; r < 10; r++) {
          let available = true
          for (let c = startCol; c <= endCol; c++) {
            if (rowTracker.has(`${weekIndex}-${c}-${r}`)) {
              available = false
              break
            }
          }
          if (available) {
            row = r
            for (let c = startCol; c <= endCol; c++) {
              rowTracker.set(`${weekIndex}-${c}-${r}`, 1)
            }
            break
          }
        }

        bars.push({ bar: rental, startCol, endCol, row })
      }
    })

    return bars
  }

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weeks = getWeeksInMonth(currentMonth)

  // Stats
  const pendingDepositsCount = bookings.filter(b => !b.deposit_paid && b.status !== "cancelled").length
  const activeCount = bookings.filter(b => {
    const now = startOfDay(new Date())
    const start = parseISO(b.start_date)
    const end = parseISO(b.end_date)
    return !isBefore(now, start) && !isAfter(now, end) && b.status !== "cancelled"
  }).length

  return (
    <PageTransition loading={loading}>
    <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-120px)]">
      {/* Left Panel - Booking List */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-white/[0.02] rounded-2xl border border-white/[0.06] p-0 overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.3)] h-[50vh] lg:h-auto">
        {/* Header with stats */}
        <div className="border-b border-white/[0.06]">
          <div className="p-3 pb-0">
            <h2 className="font-semibold text-sm mb-3">Bookings</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white/[0.03] border-b border-white/[0.06] text-xs text-white placeholder:text-white/40 focus:outline-none focus:bg-white/[0.05] transition-all duration-200"
            />
          </div>
        </div>

        {/* Booking List */}
        <div className="flex-1 overflow-y-auto">
          {combinedBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <div className="w-14 h-14 rounded-xl bg-white/[0.03] flex items-center justify-center mb-4">
                <CalendarDays className="w-7 h-7 text-white/20" />
              </div>
              <p className="text-sm font-medium text-white/60 mb-1">
                {searchQuery ? "No bookings match your search" : "No bookings yet"}
              </p>
              <p className="text-xs text-white/40 max-w-[200px]">
                {searchQuery
                  ? "Try different search terms"
                  : "Bookings will appear here when customers make reservations"}
              </p>
            </div>
          ) : (
            combinedBookings.map((item) => {
              if (!item.startDate || !item.endDate) return null
              const start = parseISO(item.startDate)
              const end = parseISO(item.endDate)
              const isPast = isBefore(end, startOfDay(new Date()))

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onMouseEnter={() => setHoveredBookingId(item.id)}
                  onMouseLeave={() => setHoveredBookingId(null)}
                  onClick={() => {
                    setSelectedBookingId(prev => prev === item.id ? null : item.id)
                    if (item.startDate) {
                      setCurrentMonth(new Date(parseISO(item.startDate).getFullYear(), parseISO(item.startDate).getMonth(), 1))
                    }
                  }}
                  onDoubleClick={() => {
                    if (item.type === 'booking' && item.booking) {
                      const v = vehicles.find(v => v.id === item.vehicleId)
                      if (v) {
                        const rentalBar: RentalBar = {
                          id: item.id,
                          vehicleId: item.vehicleId,
                          vehicleName: v.name,
                          label: item.customerName,
                          startDate: new Date(item.startDate),
                          endDate: new Date(item.endDate),
                          color: item.color,
                          type: 'booking',
                          booking: item.booking,
                        }
                        handleRentalClick(rentalBar)
                      }
                    } else if (item.type === 'sync' && item.calendarEvent) {
                      const v = vehicles.find(v => v.id === item.vehicleId)
                      if (v) {
                        const rentalBar: RentalBar = {
                          id: item.id,
                          vehicleId: item.vehicleId,
                          vehicleName: v.name,
                          label: item.customerName,
                          startDate: new Date(item.startDate),
                          endDate: new Date(item.endDate),
                          color: item.color,
                          type: 'sync',
                          calendarEvent: item.calendarEvent,
                        }
                        handleRentalClick(rentalBar)
                      }
                    }
                  }}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200 border-b border-white/[0.04] select-none ${
                    selectedBookingId === item.id
                      ? 'bg-white/[0.06]'
                      : hoveredBookingId === item.id
                      ? 'bg-white/[0.03]'
                      : 'hover:bg-white/[0.02]'
                  } ${isPast ? 'opacity-40' : ''}`}
                  style={{ borderLeft: selectedBookingId === item.id || hoveredBookingId === item.id ? `3px solid ${item.color}` : '3px solid transparent' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm font-medium text-white truncate">
                      {(item.vehicleName || 'Unknown').replace(/^\d{4}\s+/, '')}
                    </span>
                    {item.type === 'sync' && (
                      <span className="text-[9px] text-white/25 font-medium flex-shrink-0">TURO</span>
                    )}
                  </div>
                  <span className="text-[11px] text-white/30 flex-shrink-0 ml-3 tabular-nums">
                    {format(start, "MMM d")} – {format(end, "MMM d")}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Right Panel - Calendar (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 flex-col bg-white/[0.02] rounded-2xl border border-white/[0.06] p-0 overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.3)]" onClick={() => setSelectedBookingId(null)}>
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
          <button onClick={prevMonth} className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-all duration-200">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-semibold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button onClick={nextMonth} className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-all duration-200">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Vehicle Legend */}
        <div className="px-4 py-2 border-b border-white/[0.06] flex items-center gap-2 flex-wrap">
          {vehicles.slice(0, 6).map((v) => (
            <div key={v.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: v.color || '#ffffff' }} />
              <span className="text-[10px] text-white/50">{v.make} {v.model}</span>
            </div>
          ))}
          {vehicles.length > 6 && (
            <span className="text-[10px] text-white/30">+{vehicles.length - 6} more</span>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {loadingEvents ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-white/40" />
            </div>
          ) : (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-white/[0.06]">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-[10px] text-white/30 uppercase tracking-wider font-medium py-1.5 border-r border-white/[0.06] last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <div className="flex-1 flex flex-col">
                {weeks.map((week, weekIndex) => {
                  const bars = getRentalBarsForWeek(week, weekIndex)
                  const maxRow = bars.length > 0 ? Math.max(...bars.map(b => b.row)) + 1 : 0

                  return (
                    <div key={weekIndex} className="flex-1 border-b border-white/[0.06] last:border-b-0 min-h-[80px]">
                      {/* Date numbers */}
                      <div className="grid grid-cols-7 h-6">
                        {week.map((day, dayIndex) => {
                          const isToday = day &&
                            new Date().getDate() === day &&
                            new Date().getMonth() === currentMonth.getMonth() &&
                            new Date().getFullYear() === currentMonth.getFullYear()
                          return (
                            <div
                              key={dayIndex}
                              className={`px-2 py-0.5 border-r border-white/[0.06] last:border-r-0 ${
                                day ? (isToday ? 'text-xs text-white font-medium' : 'text-xs text-white/50') : ''
                              }`}
                            >
                              {isToday ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 bg-white/10 rounded-full text-white font-medium">{day}</span>
                              ) : day}
                            </div>
                          )
                        })}
                      </div>

                      {/* Rental bars */}
                      <div className="relative" style={{ minHeight: `${Math.max(maxRow * 24, 24)}px` }}>
                        {bars.map(({ bar, startCol, endCol, row }) => {
                          const leftPercent = (startCol / 7) * 100
                          const widthPercent = ((endCol - startCol + 1) / 7) * 100
                          const isHighlighted = selectedBookingId === bar.id || hoveredBookingId === bar.id
                          return (
                            <div
                              key={bar.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedBookingId(prev => prev === bar.id ? null : bar.id)
                              }}
                              onDoubleClick={() => handleRentalClick(bar)}
                              className="absolute h-[18px] rounded-[4px] px-1.5 text-[9px] font-semibold truncate cursor-pointer leading-[18px] tracking-wide select-none"
                              style={{
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                                top: `${row * 24 + 3}px`,
                                backgroundColor: `${bar.color || '#ffffff'}${isHighlighted ? '' : '30'}`,
                                color: isHighlighted
                                  ? (() => { try { const c = bar.color || '#fff'; const r = parseInt(c.slice(1,3),16)||0; const g = parseInt(c.slice(3,5),16)||0; const b = parseInt(c.slice(5,7),16)||0; return (0.299*r+0.587*g+0.114*b)/255 > 0.6 ? '#000' : '#fff'; } catch { return '#fff'; } })()
                                  : (bar.color || '#ffffff'),
                                boxShadow: isHighlighted ? `0 0 8px ${bar.color || '#fff'}50, inset 0 0 0 1px rgba(255,255,255,0.2)` : 'none',
                                borderLeft: `2px solid ${bar.color || '#ffffff'}`,
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {bar.label}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>


      {/* Rental Details Modal */}
      {selectedRental && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setSelectedRental(null)}>
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.06] w-full max-w-5xl h-[95vh] lg:h-[85vh] overflow-hidden flex flex-col shadow-[0_2px_20px_rgba(0,0,0,0.3)]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-white/[0.06] flex items-start justify-between flex-shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: selectedRental.color }} />
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">{selectedRental.label}</h3>
                  {selectedRental.type === 'booking' ? (
                    <div className="relative" ref={bookingStatusRef}>
                      <button
                        onClick={() => setShowBookingStatusDropdown(!showBookingStatusDropdown)}
                        disabled={updatingBooking}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all duration-200 hover:brightness-110 ${
                          bookingStatusOptions.find(s => s.value === selectedRental.booking?.status)?.color || 'bg-white/10 text-white/50'
                        }`}
                      >
                        {updatingBooking ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            {selectedRental.booking?.status?.toUpperCase()}
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                      {showBookingStatusDropdown && (
                        <div className="absolute left-0 top-full mt-1 w-32 bg-[#1a1a1a] rounded-xl border border-white/[0.08] shadow-xl z-50 overflow-hidden">
                          {bookingStatusOptions.map((status) => (
                            <button
                              key={status.value}
                              onClick={() => updateBookingStatusHandler(status.value)}
                              className={`w-full px-3 py-2 text-left text-xs hover:bg-white/[0.06] transition-all duration-200 flex items-center gap-2 ${
                                selectedRental.booking?.status === status.value ? "bg-white/[0.06]" : ""
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full ${status.color.split(" ")[0]}`} />
                              {status.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-white/50">
                      TURO SYNC
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/40 mt-0.5">
                  {format(selectedRental.startDate, "MMM d")} - {format(selectedRental.endDate, "MMM d, yyyy")}
                </p>
              </div>
              <button
                onClick={() => setSelectedRental(null)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-all duration-200 flex-shrink-0"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            {/* Two Column Layout - Stacks on mobile */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              {/* Left Side - Booking & Lead Info */}
              <div className="w-full lg:w-[35%] border-b lg:border-b-0 lg:border-r border-white/[0.06] overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 flex-shrink-0 max-h-[40vh] lg:max-h-none">
                {selectedRental.type === 'booking' && selectedRental.booking ? (
                  <div className="space-y-0">
                    {/* Customer name & contact */}
                    <div className="pb-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-white">{selectedRental.booking.customer_name}</p>
                      </div>
                      {selectedRental.booking.customer_email && (
                        <p className="text-xs text-white/40 mt-1">{selectedRental.booking.customer_email}</p>
                      )}
                      {selectedRental.booking.customer_phone && (
                        <p className="text-xs text-white/40 mt-0.5">{selectedRental.booking.customer_phone}</p>
                      )}
                    </div>

                    {/* Dates, amount, deposit */}
                    <div className="py-4 border-b border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">
                          {format(selectedRental.startDate, "MMM d")} &rarr; {format(selectedRental.endDate, "MMM d")}
                        </span>
                        <span className="text-sm text-white/50">
                          {Math.ceil((selectedRental.endDate.getTime() - selectedRental.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                      {selectedRental.booking.total_amount > 0 && (
                        <p className="text-sm text-white/70">${selectedRental.booking.total_amount.toLocaleString()} total</p>
                      )}
                      {selectedRental.booking.deposit_amount > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white/70">${selectedRental.booking.deposit_amount.toLocaleString()} deposit</span>
                          <button
                            onClick={toggleDepositPaid}
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-all duration-200 hover:brightness-110 ${
                              selectedRental.booking.deposit_paid
                                ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                                : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                            }`}
                          >
                            {selectedRental.booking.deposit_paid ? 'PAID' : 'PENDING'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {(selectedRental.booking.notes || matchedLead?.notes) && (
                      <div className="pt-4">
                        <p className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">
                          {selectedRental.booking.notes || matchedLead?.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Turo Sync Event Info
                  <div className="space-y-0">
                    <div className="pb-4 border-b border-white/[0.06]">
                      <p className="text-lg font-bold text-white">{selectedRental.calendarEvent?.event_summary || 'Turo Booking'}</p>
                      <p className="text-xs text-white/40 mt-1 capitalize">{selectedRental.calendarEvent?.source || 'Turo'}</p>
                    </div>

                    <div className="py-4 border-b border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">
                          {format(selectedRental.startDate, "MMM d")} &rarr; {format(selectedRental.endDate, "MMM d")}
                        </span>
                        <span className="text-sm text-white/50">
                          {Math.ceil((selectedRental.endDate.getTime() - selectedRental.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <p className="text-xs text-white/40">
                        This event was imported from an external calendar. To view full details, check the original platform.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side - Conversation (65%) */}
              <div className="flex-1 flex flex-col bg-black/30 min-w-0">
                {selectedRental.type === 'booking' && matchedLead ? (
                  <>
                    {/* Conversation Header */}
                    <div className="p-3 border-b border-white/[0.06] flex items-center gap-2 flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-white/50" />
                      <span className="text-sm font-medium text-white/70">Conversation</span>
                      <span className="text-xs text-white/30">({messages.length} messages)</span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-white/15" />
                          </div>
                          <p className="text-white/50 font-medium">No messages yet</p>
                          <p className="text-white/30 text-sm mt-1 max-w-[240px]">
                            Send a message to start the conversation with {matchedLead.name}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-center mb-4">
                            <span className="px-3 py-1 bg-white/[0.04] rounded-full text-xs text-white/40">
                              {format(new Date(messages[0]?.created_at || new Date()), "MMMM d, yyyy")}
                            </span>
                          </div>

                          {messages.map((message, index) => {
                            const isOutbound = message.direction === "outbound"
                            const showTimestamp = index === messages.length - 1 ||
                              new Date(messages[index + 1]?.created_at).getTime() - new Date(message.created_at).getTime() > 300000

                            return (
                              <div
                                key={message.id}
                                className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                              >
                                <div className={`max-w-[80%] ${isOutbound ? "items-end" : "items-start"}`}>
                                  <div
                                    className={`rounded-2xl px-4 py-2.5 ${
                                      isOutbound
                                        ? "bg-white/[0.06] text-white rounded-br-md"
                                        : "bg-white/[0.03] text-white rounded-bl-md"
                                    }`}
                                  >
                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                  </div>
                                  {showTimestamp && (
                                    <div className={`flex items-center gap-1.5 mt-1.5 ${isOutbound ? "justify-end" : "justify-start"}`}>
                                      {isOutbound && <CheckCheck className="w-3.5 h-3.5 text-white/30" />}
                                      <p className="text-[11px] text-white/30">
                                        {format(new Date(message.created_at), "h:mm a")}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all duration-200 text-sm"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || sending}
                          className="px-4 py-2.5 bg-white text-black hover:bg-white/90 disabled:opacity-50 rounded-xl transition-all duration-200 font-medium"
                        >
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : selectedRental.type === 'booking' && !matchedLead ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                      <User className="w-10 h-10 text-white/20" />
                    </div>
                    <p className="text-white/50 font-medium mb-2">No linked lead found</p>
                    <p className="text-white/30 text-sm max-w-[280px]">
                      This booking doesn't match any existing lead. Create a lead with matching phone or email to link conversations.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                      <CalendarIcon className="w-10 h-10 text-white/20" />
                    </div>
                    <p className="text-white/50 font-medium mb-2">External Calendar Event</p>
                    <p className="text-white/30 text-sm max-w-[280px]">
                      This event was synced from Turo. Messaging is available for direct bookings only.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  )
}
