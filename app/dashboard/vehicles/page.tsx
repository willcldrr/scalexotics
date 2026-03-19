"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Search,
  Car,
  X,
  Pencil,
  Trash2,
  Upload,
  Link as LinkIcon,
  Loader2,
  Calendar as CalendarIcon,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  DollarSign,
  Clock,
  User,
  FileText,
  MessageSquare,
  Send,
  CheckCheck,
  StickyNote,
  ChevronDown,
} from "lucide-react"
import { leadStatusOptions } from "@/lib/lead-status"
import { format, formatDistanceToNow } from "date-fns"
import { getStatusColor, getStatusLabel } from "@/lib/lead-status"

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  year: number
  type: string
  daily_rate: number
  image_url: string | null
  status: string
  notes: string | null
  created_at: string
  turo_ical_url: string | null
  last_turo_sync: string | null
}

interface CalendarEvent {
  id: string
  vehicle_id: string
  start_date: string
  end_date: string
  source: string
  event_summary: string | null
}

interface Booking {
  id: string
  vehicle_id: string
  start_date: string
  end_date: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  status: string
  total_amount: number | null
  deposit_amount: number | null
  deposit_paid: boolean
  notes: string | null
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

// Vehicle colors for the calendar - dark sophisticated palette
const vehicleColors = [
  'bg-emerald-900 border-emerald-700',    // Deep forest green
  'bg-slate-700 border-slate-600',         // Dark steel
  'bg-amber-900 border-amber-700',         // Deep gold
  'bg-rose-900 border-rose-700',           // Dark burgundy
  'bg-cyan-900 border-cyan-700',           // Dark teal
  'bg-violet-900 border-violet-700',       // Deep purple
  'bg-zinc-700 border-zinc-600',           // Charcoal
  'bg-orange-900 border-orange-700',       // Deep burnt orange
]

const getVehicleType = (make: string): string => {
  const makeLower = make.toLowerCase()
  if (['lamborghini', 'ferrari', 'mclaren', 'bugatti', 'koenigsegg', 'pagani'].includes(makeLower)) return 'Supercar'
  if (['range rover', 'land rover', 'cadillac escalade', 'bentley bentayga', 'rolls royce cullinan'].some(m => makeLower.includes(m.split(' ')[0]))) return 'Luxury SUV'
  if (['rolls royce', 'bentley', 'maybach'].some(m => makeLower.includes(m.split(' ')[0])) && !makeLower.includes('cullinan') && !makeLower.includes('bentayga')) return 'Luxury Sedan'
  if (['porsche', 'aston martin', 'corvette', 'nissan gt-r', 'audi r8'].some(m => makeLower.includes(m.split(' ')[0]))) return 'Sports Car'
  if (['mercedes', 'bmw', 'audi'].includes(makeLower)) return 'Luxury'
  return 'Exotic'
}

const statusOptions = [
  { value: "available", label: "Available", color: "bg-green-500/20 text-green-400" },
  { value: "rented", label: "Rented", color: "bg-blue-500/20 text-blue-400" },
  { value: "maintenance", label: "Maintenance", color: "bg-orange-500/20 text-orange-400" },
  { value: "inactive", label: "Inactive", color: "bg-gray-500/20 text-gray-400" },
]

const bookingStatusOptions = [
  { value: "pending", label: "Pending", color: "bg-amber-500/20 text-amber-400" },
  { value: "confirmed", label: "Confirmed", color: "bg-emerald-500/20 text-emerald-400" },
  { value: "completed", label: "Completed", color: "bg-blue-500/20 text-blue-400" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500/20 text-red-400" },
]

export default function VehiclesPage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageInputMode, setImageInputMode] = useState<'url' | 'upload'>('upload')
  const [syncing, setSyncing] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [selectedRental, setSelectedRental] = useState<RentalBar | null>(null)

  // Lead state for rental popup
  const [leads, setLeads] = useState<Lead[]>([])
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

  // Calendar state
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | 'all'>('all')
  const [allCalendarEvents, setAllCalendarEvents] = useState<CalendarEvent[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loadingEvents, setLoadingEvents] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    daily_rate: 0,
    image_url: "",
    status: "available",
    notes: "",
    turo_ical_url: "",
  })

  // Create a color map for vehicles
  const vehicleColorMap = new Map<string, string>()
  vehicles.forEach((v, i) => {
    vehicleColorMap.set(v.id, vehicleColors[i % vehicleColors.length])
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  useEffect(() => {
    if (vehicles.length > 0) {
      fetchAllCalendarEvents()
    }
  }, [vehicles, selectedVehicleId])

  const fetchVehicles = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setUserId(user.id)

    const [vehiclesRes, leadsRes] = await Promise.all([
      supabase.from("vehicles").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("leads").select("*").eq("user_id", user.id),
    ])

    if (!vehiclesRes.error && vehiclesRes.data) {
      setVehicles(vehiclesRes.data)
    }
    if (!leadsRes.error && leadsRes.data) {
      setLeads(leadsRes.data)
    }
    setLoading(false)
  }

  const fetchAllCalendarEvents = async () => {
    setLoadingEvents(true)

    const vehicleIds = selectedVehicleId === 'all'
      ? vehicles.map(v => v.id)
      : [selectedVehicleId]

    // Fetch calendar_syncs
    const { data: syncData } = await supabase
      .from("calendar_syncs")
      .select("*")
      .in("vehicle_id", vehicleIds)
      .order("start_date", { ascending: true })

    // Fetch bookings
    const { data: bookingData } = await supabase
      .from("bookings")
      .select("id, vehicle_id, start_date, end_date, customer_name, customer_email, customer_phone, status, total_amount, deposit_amount, deposit_paid, notes")
      .in("vehicle_id", vehicleIds)
      .in("status", ["confirmed", "pending", "completed"])
      .order("start_date", { ascending: true })

    if (syncData) setAllCalendarEvents(syncData)
    if (bookingData) setAllBookings(bookingData)
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

      // Match by phone or email (most reliable)
      if (bookingPhone && leadPhone && bookingPhone === leadPhone) return true
      if (bookingEmail && leadEmail && bookingEmail === leadEmail) return true
      // Match by exact name as fallback
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

  // Send message to lead
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

      if (!response.ok) {
        throw new Error("Failed to send SMS")
      }

      if (savedMessage) {
        setMessages([...messages, savedMessage])
      }

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message. Please try again.")
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
      // Update local state
      setSelectedRental({
        ...selectedRental,
        booking: { ...selectedRental.booking, status: newStatus }
      })
      setAllBookings(allBookings.map(b =>
        b.id === selectedRental.booking!.id ? { ...b, status: newStatus } : b
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

  // Toggle deposit paid status
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
      setAllBookings(allBookings.map(b =>
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

  // Handle rental selection - find matching lead and fetch messages
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

  const filteredVehicles = vehicles.filter((vehicle) => {
    return vehicle.name.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(search.toLowerCase())
  })

  const openAddModal = () => {
    setEditingVehicle(null)
    setFormData({
      name: "", make: "", model: "", year: new Date().getFullYear(),
      daily_rate: 0, image_url: "", status: "available", notes: "", turo_ical_url: "",
    })
    setImageInputMode('upload')
    setShowModal(true)
  }

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      name: vehicle.name, make: vehicle.make, model: vehicle.model, year: vehicle.year,
      daily_rate: vehicle.daily_rate, image_url: vehicle.image_url || "",
      status: vehicle.status, notes: vehicle.notes || "", turo_ical_url: vehicle.turo_ical_url || "",
    })
    setImageInputMode(vehicle.image_url ? 'url' : 'upload')
    setShowModal(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('vehicle-images').upload(fileName, file)
      if (uploadError) {
        alert('Failed to upload image.')
        setUploading(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('vehicle-images').getPublicUrl(fileName)
      setFormData({ ...formData, image_url: publicUrl })
    } catch (err) {
      alert('Failed to upload image.')
    }
    setUploading(false)
  }

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    const vehicleType = getVehicleType(formData.make)
    const vehicleData = {
      user_id: userId,
      name: formData.name || `${formData.year} ${formData.make} ${formData.model}`,
      make: formData.make, model: formData.model, year: formData.year, type: vehicleType,
      daily_rate: formData.daily_rate, image_url: formData.image_url || null,
      status: formData.status, notes: formData.notes || null, turo_ical_url: formData.turo_ical_url || null,
    }

    if (editingVehicle) {
      const { error } = await supabase.from("vehicles").update(vehicleData).eq("id", editingVehicle.id)
      if (!error) {
        setVehicles(vehicles.map((v) => v.id === editingVehicle.id ? { ...v, ...vehicleData } : v))
      }
    } else {
      const { data, error } = await supabase.from("vehicles").insert(vehicleData).select().single()
      if (!error && data) {
        setVehicles([data, ...vehicles])
      }
    }
    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const { error } = await supabase.from("vehicles").delete().eq("id", id)
    if (!error) {
      setVehicles(vehicles.filter((v) => v.id !== id))
      if (selectedVehicleId === id) setSelectedVehicleId('all')
    }
    setDeleting(null)
    setDeleteConfirm(null)
  }

  const getStatusColor = (status: string) => {
    return statusOptions.find((s) => s.value === status)?.color || "bg-gray-500/20 text-gray-400"
  }

  const handleSyncCalendar = async (vehicleId: string) => {
    setSyncing(vehicleId)
    try {
      const res = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      })
      const data = await res.json()
      if (data.success) {
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, last_turo_sync: new Date().toISOString() } : v))
        fetchAllCalendarEvents()
      }
    } catch (error) {
      console.error("Sync error:", error)
    }
    setSyncing(null)
  }

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

    // Fill in empty days at start
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null)
    }

    // Fill in days
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    // Fill in remaining days
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

    // Combine events and bookings into rental bars
    const allRentals: RentalBar[] = []

    allCalendarEvents.forEach(event => {
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

    allBookings.forEach(booking => {
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

    // Track which rows are used to stack overlapping bars
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
        // Find available row
        let row = 0
        const key = `${weekIndex}-${startCol}-${endCol}`
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    )
  }

  return (
    <div className="flex flex-row gap-4 h-[calc(100vh-120px)]">
      {/* Left Panel - Vehicle List */}
      <div className="w-64 flex-shrink-0 flex flex-col bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="p-3 border-b border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm">Fleet</h2>
            <button onClick={openAddModal} className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-white/90 text-black text-xs font-medium rounded-lg transition-colors">
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-white/5 border border-white/[0.08] text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* All Vehicles Option */}
          <div
            onClick={() => setSelectedVehicleId('all')}
            className={`p-2.5 cursor-pointer transition-colors border-b border-white/[0.06] ${selectedVehicleId === 'all' ? 'bg-white/10' : 'hover:bg-white/[0.04]'}`}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-medium">All Vehicles</h3>
                <p className="text-[10px] text-white/40">{vehicles.length} vehicles</p>
              </div>
            </div>
          </div>

          {filteredVehicles.map((vehicle, index) => (
            <div
              key={vehicle.id}
              onClick={() => setSelectedVehicleId(vehicle.id)}
              className={`p-2.5 cursor-pointer transition-colors border-b border-white/[0.06] ${selectedVehicleId === vehicle.id ? 'bg-white/10' : 'hover:bg-white/[0.04]'}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                  {vehicle.image_url ? (
                    <img src={vehicle.image_url} alt={vehicle.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${vehicleColors[index % vehicleColors.length].split(' ')[0]}`}>
                      <Car className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="text-xs font-medium truncate">{vehicle.name}</h3>
                    {vehicle.turo_ical_url && <CalendarIcon className="w-2.5 h-2.5 text-[#00D4AA] flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] text-white/40">${vehicle.daily_rate}/day</p>
                </div>
                <div className="flex gap-0.5">
                  <button onClick={(e) => { e.stopPropagation(); openEditModal(vehicle); }} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: vehicle.id, name: vehicle.name }); }} disabled={deleting === vehicle.id} className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 disabled:opacity-50">
                    {deleting === vehicle.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Gantt Calendar */}
      <div className="flex-1 flex flex-col bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
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

                      {/* Rental bars area */}
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.08] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
              <h2 className="text-xl font-bold">{editingVehicle ? "Edit Vehicle" : "Add Vehicle"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-2">Year</label>
                <input type="number" min="1900" max={new Date().getFullYear() + 1} value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white focus:outline-none focus:border-white/50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Make</label>
                  <input type="text" placeholder="Lamborghini" value={formData.make} onChange={(e) => setFormData({ ...formData, make: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/50" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Model</label>
                  <input type="text" placeholder="Huracán" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/50" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Daily Rate ($)</label>
                <input type="number" min="0" step="50" placeholder="1500" value={formData.daily_rate || ""} onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/50" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-white/60">Vehicle Image</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setImageInputMode('upload')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${imageInputMode === 'upload' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
                      <Upload className="w-3.5 h-3.5" />Upload
                    </button>
                    <button type="button" onClick={() => setImageInputMode('url')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${imageInputMode === 'url' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
                      <LinkIcon className="w-3.5 h-3.5" />URL
                    </button>
                  </div>
                </div>
                {imageInputMode === 'upload' ? (
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full px-4 py-8 rounded-xl bg-white/5 border border-white/[0.08] border-dashed hover:border-white/50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50">
                      {uploading ? <><Loader2 className="w-8 h-8 text-white animate-spin" /><span className="text-white/50 text-sm">Uploading...</span></> : <><Upload className="w-8 h-8 text-white/30" /><span className="text-white/50 text-sm">Click to upload image</span></>}
                    </button>
                  </div>
                ) : (
                  <input type="url" placeholder="https://example.com/image.jpg" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/50" />
                )}
                {formData.image_url && (
                  <div className="mt-3 rounded-xl overflow-hidden bg-white/5 h-32 relative">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFormData({ ...formData, image_url: '' })} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-red-500/50 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Notes (optional)</label>
                <textarea placeholder="Additional details..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 resize-none" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-white/60 flex items-center gap-2"><CalendarIcon className="w-4 h-4" />Turo iCal URL</label>
                  <a href="https://support.turo.com/hc/en-us/articles/203991880-Exporting-your-Turo-calendar" target="_blank" rel="noopener noreferrer" className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1">
                    How to get this <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input type="url" placeholder="https://turo.com/reservations/subscribe/ical.ics?..." value={formData.turo_ical_url} onChange={(e) => setFormData({ ...formData, turo_ical_url: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 text-sm" />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white focus:outline-none focus:border-white/50">
                  {statusOptions.map((status) => (<option key={status.value} value={status.value}>{status.label}</option>))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-white/[0.08]">
              <button onClick={() => setShowModal(false)} className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !formData.make || !formData.model} className="flex-1 px-5 py-3 rounded-xl bg-white hover:bg-white/90 text-black disabled:opacity-50 font-semibold transition-colors">
                {saving ? "Saving..." : editingVehicle ? "Save Changes" : "Add Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.08] w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-center mb-2">Delete Vehicle</h2>
              <p className="text-white/60 text-center text-sm">
                Are you sure you want to delete <span className="text-white font-medium">{deleteConfirm.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 p-4 border-t border-white/[0.08] bg-white/[0.02]">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting === deleteConfirm.id}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting === deleteConfirm.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rental Details Modal */}
      {selectedRental && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRental(null)}>
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.08] w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col shadow-[0_0_60px_rgba(255,255,255,0.1)]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedRental.color}`}>
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedRental.vehicleName}</h3>
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
                          <div className="absolute left-0 top-full mt-1 w-32 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl z-20 overflow-hidden">
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

            {/* Two Column Layout */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Side - Booking & Lead Info (35%) */}
              <div className="w-[35%] border-r border-white/[0.08] overflow-y-auto p-4 space-y-4 flex-shrink-0">
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
                            <div className="absolute left-0 top-full mt-1 w-40 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl z-20 overflow-hidden max-h-64 overflow-y-auto">
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

                      {matchedLead?.vehicle_interest && (
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Car className="w-4 h-4 text-white/40" />
                            <span className="text-[10px] text-white/40 uppercase tracking-wider">Vehicle Interest</span>
                          </div>
                          <p className="text-sm font-medium">
                            {vehicles.find(v => v.id === matchedLead.vehicle_interest)?.name || matchedLead.vehicle_interest}
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

                      {matchedLead && (
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Clock className="w-4 h-4 text-white/40" />
                            <span className="text-[10px] text-white/40 uppercase tracking-wider">Lead Created</span>
                          </div>
                          <p className="text-sm font-medium">{format(new Date(matchedLead.created_at), "MMM d, yyyy")}</p>
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
                  // No matching lead found
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
                  // Turo sync event - no messaging
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
