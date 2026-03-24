"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
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
import MatrixRainLoader from "@/app/components/matrix-rain-loader"

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  year: number
  daily_rate: number
  image_url: string | null
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

// Vehicle colors for the calendar
const vehicleColors = [
  'bg-emerald-900 border-emerald-700',
  'bg-slate-700 border-slate-600',
  'bg-amber-900 border-amber-700',
  'bg-rose-900 border-rose-700',
  'bg-cyan-900 border-cyan-700',
  'bg-violet-900 border-violet-700',
  'bg-zinc-700 border-zinc-600',
  'bg-orange-900 border-orange-700',
]

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
    color: "text-white/60",
    bg: "bg-white/5",
    border: "border-white/10",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
    icon: XCircle,
  },
}

const bookingStatusOptions = [
  { value: "pending", label: "Pending", color: "bg-amber-500/20 text-amber-400" },
  { value: "confirmed", label: "Confirmed", color: "bg-emerald-500/20 text-emerald-400" },
  { value: "completed", label: "Completed", color: "bg-blue-500/20 text-blue-400" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500/20 text-red-400" },
]

export default function BookingsPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

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

  // Create a color map for vehicles
  const vehicleColorMap = useMemo(() => {
    const map = new Map<string, string>()
    vehicles.forEach((v, i) => {
      map.set(v.id, vehicleColors[i % vehicleColors.length])
    })
    return map
  }, [vehicles])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (vehicles.length > 0) {
      fetchCalendarEvents()
    }
  }, [vehicles])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [bookingsRes, vehiclesRes, leadsRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("*, vehicles(*)")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false }),
      supabase
        .from("vehicles")
        .select("id, name, make, model, year, daily_rate, image_url")
        .eq("user_id", user.id),
      supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id),
    ])

    if (bookingsRes.data) setBookings(bookingsRes.data)
    if (vehiclesRes.data) setVehicles(vehiclesRes.data)
    if (leadsRes.data) setLeads(leadsRes.data)
    setLoading(false)
  }

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
  const updateBookingStatus = async (newStatus: string) => {
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
      setBookings(bookings.map(b =>
        b.id === selectedRental.booking!.id ? { ...b, status: newStatus as Booking["status"] } : b
      ))
    }
    setUpdatingBooking(false)
    setShowBookingStatusDropdown(false)
  }

  // Update lead status
  const updateLeadStatus = async (newStatus: string) => {
    if (!matchedLead) return
    setUpdatingLead(true)

    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", matchedLead.id)

    if (!error) {
      setMatchedLead({ ...matchedLead, status: newStatus })
      setLeads(leads.map(l =>
        l.id === matchedLead.id ? { ...l, status: newStatus } : l
      ))
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
      setBookings(bookings.map(b =>
        b.id === selectedRental.booking!.id ? { ...b, deposit_paid: newValue } : b
      ))
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

  // Filter and sort bookings - pending deposits first
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

    // Sort: pending deposits first, then by start date
    return filtered.sort((a, b) => {
      // Pending deposits first
      if (!a.deposit_paid && b.deposit_paid) return -1
      if (a.deposit_paid && !b.deposit_paid) return 1
      // Then by start date (upcoming first)
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    })
  }, [bookings, searchQuery])

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
        color: vehicleColorMap.get(event.vehicle_id) || vehicleColors[0],
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
          color: vehicleColorMap.get(booking.vehicle_id) || vehicleColors[0],
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

  if (loading) {
    return <MatrixRainLoader />
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-120px)]">
      {/* Left Panel - Booking List */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden h-[50vh] lg:h-auto">
        {/* Header with stats */}
        <div className="p-3 border-b border-white/[0.08]">
          <div className="mb-3">
            <h2 className="font-semibold text-sm">Bookings</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-white/5 border border-white/[0.08] text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        {/* Booking List */}
        <div className="flex-1 overflow-y-auto">
          {filteredBookings.length === 0 ? (
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
            filteredBookings.map((booking) => {
              const vehicle = booking.vehicles
              const status = statusConfig[booking.status]
              const now = startOfDay(new Date())
              const start = parseISO(booking.start_date)
              const end = parseISO(booking.end_date)
              const isActive = !isBefore(now, start) && !isAfter(now, end) && booking.status !== "cancelled"
              const isSelected = selectedBooking?.id === booking.id

              return (
                <div
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className={`p-3 cursor-pointer transition-colors border-b border-white/[0.06] ${
                    isSelected ? 'bg-white/10' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Vehicle thumbnail */}
                    <div className="w-12 h-10 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                      {vehicle?.image_url ? (
                        <img src={vehicle.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-5 h-5 text-white/20" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-medium truncate">{booking.customer_name}</h3>
                        {!booking.deposit_paid && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-400 rounded">
                            DEPOSIT
                          </span>
                        )}
                        {isActive && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/50 truncate">
                        {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Unknown"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-white/40">
                          {format(start, "MMM d")} - {format(end, "MMM d")}
                        </span>
                        <span className="text-[10px] font-medium text-white/60">
                          ${booking.total_amount?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Right Panel - Calendar (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 flex-col bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.08]">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-semibold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Vehicle Legend */}
        <div className="px-4 py-2 border-b border-white/[0.08] flex items-center gap-2 flex-wrap">
          {vehicles.slice(0, 6).map((v, i) => (
            <div key={v.id} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${vehicleColors[i % vehicleColors.length].split(' ')[0]}`} />
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
              <div className="grid grid-cols-7 border-b border-white/[0.08]">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-[10px] text-white/40 font-medium py-1.5 border-r border-white/[0.06] last:border-r-0">
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
                    <div key={weekIndex} className="flex-1 border-b border-white/[0.08] last:border-b-0 min-h-[80px]">
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
                              className={`text-sm font-medium px-2 py-0.5 border-r border-white/[0.06] last:border-r-0 ${
                                day ? (isToday ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-white/70') : ''
                              }`}
                            >
                              {day}
                            </div>
                          )
                        })}
                      </div>

                      {/* Rental bars */}
                      <div className="relative" style={{ minHeight: `${Math.max(maxRow * 24, 24)}px` }}>
                        {bars.map(({ bar, startCol, endCol, row }) => {
                          const leftPercent = (startCol / 7) * 100
                          const widthPercent = ((endCol - startCol + 1) / 7) * 100
                          return (
                            <div
                              key={bar.id}
                              onClick={() => handleRentalClick(bar)}
                              className={`absolute h-5 rounded px-2 text-[11px] font-medium text-white truncate border-l-2 cursor-pointer hover:brightness-110 transition-all ${bar.color}`}
                              style={{
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                                top: `${row * 24 + 2}px`,
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
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.08] w-full max-w-5xl h-[95vh] lg:h-[85vh] overflow-hidden flex flex-col shadow-[0_0_60px_rgba(255,255,255,0.1)]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedRental.color}`}>
                  <Car className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-white truncate">{selectedRental.vehicleName}</h3>
                    {selectedRental.type === 'booking' ? (
                      <div className="relative" ref={bookingStatusRef}>
                        <button
                          onClick={() => setShowBookingStatusDropdown(!showBookingStatusDropdown)}
                          disabled={updatingBooking}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors hover:brightness-110 ${
                            bookingStatusOptions.find(s => s.value === selectedRental.booking?.status)?.color || 'bg-white/10 text-white/60'
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
                          <div className="absolute left-0 top-full mt-1 w-32 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden">
                            {bookingStatusOptions.map((status) => (
                              <button
                                key={status.value}
                                onClick={() => updateBookingStatus(status.value)}
                                className={`w-full px-3 py-2 text-left text-xs hover:bg-white/5 transition-colors flex items-center gap-2 ${
                                  selectedRental.booking?.status === status.value ? "bg-white/5" : ""
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-400">
                        TURO SYNC
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/50">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {format(selectedRental.startDate, "MMM d")} - {format(selectedRental.endDate, "MMM d, yyyy")}
                    </span>
                    {selectedRental.type === 'booking' && selectedRental.booking?.customer_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {selectedRental.booking.customer_phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedRental(null)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Two Column Layout - Stacks on mobile */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              {/* Left Side - Booking & Lead Info */}
              <div className="w-full lg:w-[35%] border-b lg:border-b-0 lg:border-r border-white/[0.08] overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 flex-shrink-0 max-h-[40vh] lg:max-h-none">
                {selectedRental.type === 'booking' && selectedRental.booking ? (
                  <>
                    {/* Customer Info */}
                    <div>
                      <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Customer</label>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center ring-1 ring-white/10">
                            <span className="text-sm font-semibold">{selectedRental.booking.customer_name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium">{selectedRental.booking.customer_name}</p>
                            {selectedRental.booking.customer_email && (
                              <p className="text-xs text-white/50">{selectedRental.booking.customer_email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lead Status (if matched) */}
                    {matchedLead && (
                      <div>
                        <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Lead Status</label>
                        <div className="relative" ref={leadStatusRef}>
                          <button
                            onClick={() => setShowLeadStatusDropdown(!showLeadStatusDropdown)}
                            disabled={updatingLead}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors hover:brightness-110 ${getStatusColor(matchedLead.status)}`}
                          >
                            {updatingLead ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                {getStatusLabel(matchedLead.status)}
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                          {showLeadStatusDropdown && (
                            <div className="absolute left-0 top-full mt-1 w-40 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                              {leadStatusOptions.map((status) => (
                                <button
                                  key={status.value}
                                  onClick={() => updateLeadStatus(status.value)}
                                  className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2 ${
                                    matchedLead.status === status.value ? "bg-white/5" : ""
                                  }`}
                                >
                                  <div className={`w-2 h-2 rounded-full ${status.color.split(" ")[0]}`} />
                                  {status.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Booking Details */}
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Clock className="w-4 h-4 text-white/40" />
                          <span className="text-[10px] text-white/40 uppercase tracking-wider">Duration</span>
                        </div>
                        <p className="text-sm font-medium">
                          {Math.ceil((selectedRental.endDate.getTime() - selectedRental.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>

                      {selectedRental.booking.total_amount && (
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <div className="flex items-center gap-2 mb-1.5">
                            <DollarSign className="w-4 h-4 text-white/40" />
                            <span className="text-[10px] text-white/40 uppercase tracking-wider">Total Amount</span>
                          </div>
                          <p className="text-sm font-medium">${selectedRental.booking.total_amount.toLocaleString()}</p>
                        </div>
                      )}

                      {selectedRental.booking.deposit_amount && (
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <div className="flex items-center gap-2 mb-1.5">
                            <DollarSign className="w-4 h-4 text-white/40" />
                            <span className="text-[10px] text-white/40 uppercase tracking-wider">Deposit</span>
                          </div>
                          <p className="text-sm font-medium flex items-center gap-2">
                            ${selectedRental.booking.deposit_amount.toLocaleString()}
                            <button
                              onClick={toggleDepositPaid}
                              className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-colors hover:brightness-110 ${
                                selectedRental.booking.deposit_paid
                                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                              }`}
                            >
                              {selectedRental.booking.deposit_paid ? 'PAID' : 'PENDING'}
                            </button>
                          </p>
                        </div>
                      )}

                      {(selectedRental.booking.notes || matchedLead?.notes) && (
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <div className="flex items-center gap-2 mb-1.5">
                            <StickyNote className="w-4 h-4 text-white/40" />
                            <span className="text-[10px] text-white/40 uppercase tracking-wider">Notes</span>
                          </div>
                          <p className="text-sm text-white/80 whitespace-pre-wrap">
                            {selectedRental.booking.notes || matchedLead?.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // Turo Sync Event Info
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                      <div className="flex items-center gap-2 mb-1.5">
                        <CalendarIcon className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px] text-cyan-400 uppercase tracking-wider">External Source</span>
                      </div>
                      <p className="text-sm font-medium text-cyan-400 capitalize">{selectedRental.calendarEvent?.source || 'Turo'}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <CalendarIcon className="w-4 h-4 text-white/40" />
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">Start Date</span>
                      </div>
                      <p className="text-sm font-medium">{format(selectedRental.startDate, "MMM d, yyyy")}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <CalendarIcon className="w-4 h-4 text-white/40" />
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">End Date</span>
                      </div>
                      <p className="text-sm font-medium">{format(selectedRental.endDate, "MMM d, yyyy")}</p>
                    </div>

                    {selectedRental.calendarEvent?.event_summary && (
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-1.5">
                          <FileText className="w-4 h-4 text-white/40" />
                          <span className="text-[10px] text-white/40 uppercase tracking-wider">Event Summary</span>
                        </div>
                        <p className="text-sm text-white/80">{selectedRental.calendarEvent.event_summary}</p>
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                      <p className="text-xs text-cyan-400">
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
                                        ? "bg-white text-black rounded-br-md"
                                        : "bg-white/[0.08] text-white rounded-bl-md"
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
                          className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all text-sm"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || sending}
                          className="px-4 py-2.5 bg-white hover:bg-white/90 disabled:opacity-50 text-black rounded-xl transition-all font-medium shadow-[0_0_20px_rgba(255,255,255,0.2)]"
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
                    <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4">
                      <CalendarIcon className="w-10 h-10 text-cyan-400/50" />
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
  )
}
