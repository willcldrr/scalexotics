"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Search,
  Calendar,
  Car,
  X,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  List,
  Grid3X3,
  Loader2,
  User,
} from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO, startOfWeek, endOfWeek, isBefore, isAfter, isSameMonth } from "date-fns"

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  daily_rate: number
  image_url: string | null
  status: string
}

interface Booking {
  id: string
  vehicle_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  start_date: string
  end_date: string
  total_amount: number
  deposit_amount: number
  deposit_paid: boolean
  status: string
  notes: string
  created_at: string
  vehicles?: Vehicle
}

const statusOptions = [
  { value: "pending", label: "Pending Deposit", color: "bg-yellow-500/20 text-yellow-400", barColor: "bg-yellow-500" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-500/20 text-blue-400", barColor: "bg-blue-500" },
  { value: "active", label: "Active Rental", color: "bg-green-500/20 text-green-400", barColor: "bg-green-500" },
  { value: "completed", label: "Completed", color: "bg-gray-500/20 text-gray-400", barColor: "bg-gray-400" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500/20 text-red-400", barColor: "bg-red-500" },
]

export default function BookingsPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<"all" | "by-vehicle">("by-vehicle")
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const [formData, setFormData] = useState({
    vehicle_id: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    start_date: "",
    end_date: "",
    total_amount: 0,
    deposit_amount: 0,
    deposit_paid: false,
    status: "pending",
    notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      // Default to "All Vehicles" view
      setSelectedVehicle({ id: "all", name: "All Vehicles", make: "All", model: "Vehicles", daily_rate: 0, image_url: null, status: "active" } as Vehicle)
    }
  }, [vehicles])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setUserId(user.id)

    const [bookingsRes, vehiclesRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("*, vehicles(id, name, make, model, daily_rate, image_url, status)")
        .eq("user_id", user.id)
        .order("start_date", { ascending: true }),
      supabase.from("vehicles").select("*").eq("user_id", user.id).neq("status", "inactive"),
    ])

    setBookings(bookingsRes.data || [])
    setVehicles(vehiclesRes.data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)

    const bookingData = {
      user_id: userId,
      vehicle_id: formData.vehicle_id,
      customer_name: formData.customer_name,
      customer_email: formData.customer_email || null,
      customer_phone: formData.customer_phone,
      start_date: formData.start_date,
      end_date: formData.end_date,
      total_amount: formData.total_amount,
      deposit_amount: formData.deposit_amount,
      deposit_paid: formData.deposit_paid,
      status: formData.deposit_paid ? "confirmed" : "pending",
      notes: formData.notes || null,
    }

    if (editingBooking) {
      await supabase.from("bookings").update(bookingData).eq("id", editingBooking.id)
    } else {
      await supabase.from("bookings").insert(bookingData)
    }

    setSaving(false)
    setShowModal(false)
    setEditingBooking(null)
    resetForm()
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return
    await supabase.from("bookings").delete().eq("id", id)
    setSelectedBooking(null)
    fetchData()
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from("bookings").update({ status: newStatus }).eq("id", id)
    setBookings(bookings.map((b) => (b.id === id ? { ...b, status: newStatus } : b)))
    if (selectedBooking?.id === id) {
      setSelectedBooking({ ...selectedBooking, status: newStatus })
    }
  }

  const handleDepositToggle = async (id: string, paid: boolean) => {
    const updates: any = { deposit_paid: paid }
    if (paid) updates.status = "confirmed"
    await supabase.from("bookings").update(updates).eq("id", id)
    setBookings(
      bookings.map((b) =>
        b.id === id ? { ...b, deposit_paid: paid, status: paid ? "confirmed" : b.status } : b
      )
    )
    if (selectedBooking?.id === id) {
      setSelectedBooking({ ...selectedBooking, deposit_paid: paid, status: paid ? "confirmed" : selectedBooking.status })
    }
  }

  const resetForm = () => {
    setFormData({
      vehicle_id: "",
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      start_date: "",
      end_date: "",
      total_amount: 0,
      deposit_amount: 0,
      deposit_paid: false,
      status: "pending",
      notes: "",
    })
  }

  const openEditModal = (booking: Booking) => {
    setEditingBooking(booking)
    setFormData({
      vehicle_id: booking.vehicle_id,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email || "",
      customer_phone: booking.customer_phone || "",
      start_date: booking.start_date,
      end_date: booking.end_date,
      total_amount: booking.total_amount,
      deposit_amount: booking.deposit_amount || 0,
      deposit_paid: booking.deposit_paid || false,
      status: booking.status,
      notes: booking.notes || "",
    })
    setShowModal(true)
  }

  const openNewBookingForVehicle = (vehicle: Vehicle) => {
    resetForm()
    setFormData(prev => ({ ...prev, vehicle_id: vehicle.id }))
    setEditingBooking(null)
    setShowModal(true)
  }

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const updateTotalFromDates = (startDate: string, endDate: string, vehicleId: string) => {
    if (startDate && endDate && vehicleId) {
      const vehicle = vehicles.find((v) => v.id === vehicleId)
      if (vehicle) {
        const days = calculateDays(startDate, endDate)
        const total = days * vehicle.daily_rate
        setFormData((prev) => ({
          ...prev,
          total_amount: total,
          deposit_amount: Math.round(total * 0.25),
        }))
      }
    }
  }

  const getStatusColor = (status: string) => {
    return statusOptions.find((s) => s.value === status)?.color || "bg-gray-500/20 text-gray-400"
  }

  const getStatusBarColor = (status: string) => {
    return statusOptions.find((s) => s.value === status)?.barColor || "bg-gray-500"
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      booking.customer_phone?.includes(search) ||
      booking.vehicles?.make.toLowerCase().includes(search.toLowerCase()) ||
      booking.vehicles?.model.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const upcomingBookings = filteredBookings.filter(
    (b) => new Date(b.start_date) >= new Date() && b.status !== "cancelled" && b.status !== "completed"
  )
  const pastBookings = filteredBookings.filter(
    (b) => new Date(b.start_date) < new Date() || b.status === "completed" || b.status === "cancelled"
  )

  const vehicleBookings = selectedVehicle
    ? bookings.filter((b) => b.vehicle_id === selectedVehicle.id && b.status !== "cancelled")
    : []

  // Calendar weeks
  const calendarWeeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    const days = eachDayOfInterval({ start: calStart, end: calEnd })
    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }
    return weeks
  }, [currentMonth])

  // Get booking bars for a week (for specific vehicle)
  const getBookingBarsForWeek = (week: Date[], bookingsToUse: Booking[] = vehicleBookings) => {
    const weekStart = week[0]
    const weekEnd = week[6]

    return bookingsToUse
      .filter(booking => {
        const bookingStart = parseISO(booking.start_date)
        const bookingEnd = parseISO(booking.end_date)
        return !(isAfter(bookingStart, weekEnd) || isBefore(bookingEnd, weekStart))
      })
      .map(booking => {
        const bookingStart = parseISO(booking.start_date)
        const bookingEnd = parseISO(booking.end_date)

        let startCol = 0
        let endCol = 6

        if (isBefore(bookingStart, weekStart)) {
          startCol = 0
        } else {
          for (let i = 0; i < 7; i++) {
            if (isSameDay(week[i], bookingStart)) {
              startCol = i
              break
            }
          }
        }

        if (isAfter(bookingEnd, weekEnd)) {
          endCol = 6
        } else {
          for (let i = 6; i >= 0; i--) {
            if (isSameDay(week[i], bookingEnd)) {
              endCol = i
              break
            }
          }
        }

        const isStart = week.some(d => isSameDay(d, bookingStart))
        const isEnd = week.some(d => isSameDay(d, bookingEnd))

        return { booking, startCol, endCol, isStart, isEnd }
      })
  }

  // All active bookings for the all-vehicles calendar
  const allActiveBookings = bookings.filter(b => b.status !== "cancelled")

  const getBookingCountForVehicle = (vehicleId: string) => {
    return bookings.filter(
      (b) => b.vehicle_id === vehicleId && b.status !== "cancelled" && new Date(b.end_date) >= new Date()
    ).length
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* By Vehicle Tab */}
      {activeTab === "by-vehicle" && (
        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* Vehicle Sidebar */}
          <div className={`${selectedVehicle ? "hidden lg:flex" : "w-full"} lg:w-72 flex-shrink-0 flex-col`}>
            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl mb-4">
              <button
                onClick={() => setActiveTab("by-vehicle")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "by-vehicle"
                    ? "bg-[#375DEE] text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                By Vehicle
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "all"
                    ? "bg-[#375DEE] text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <List className="w-4 h-4" />
                All
              </button>
            </div>

            {/* Vehicle List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {vehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Car className="w-10 h-10 text-white/20 mb-2" />
                  <p className="text-white/50 text-sm">No vehicles</p>
                </div>
              ) : (
                <>
                  {/* All Vehicles Option */}
                  <button
                    onClick={() => setSelectedVehicle({ id: "all", name: "All Vehicles", make: "All", model: "Vehicles", daily_rate: 0, image_url: null, status: "active" } as Vehicle)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      selectedVehicle?.id === "all"
                        ? "bg-[#375DEE] text-white"
                        : "bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedVehicle?.id === "all" ? "bg-white/20" : "bg-[#375DEE]/20"
                      }`}>
                        <Grid3X3 className={`w-5 h-5 ${selectedVehicle?.id === "all" ? "text-white" : "text-[#375DEE]"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm">All Vehicles</h4>
                        <p className={`text-xs ${selectedVehicle?.id === "all" ? "text-white/70" : "text-white/40"}`}>
                          {allActiveBookings.length} bookings
                        </p>
                      </div>
                    </div>
                  </button>

                  {vehicles.map((vehicle) => {
                    const bookingCount = getBookingCountForVehicle(vehicle.id)
                    const isSelected = selectedVehicle?.id === vehicle.id
                    return (
                      <button
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        className={`w-full p-3 rounded-xl text-left transition-all ${
                          isSelected
                            ? "bg-[#375DEE] text-white"
                            : "bg-white/[0.03] hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden flex-shrink-0">
                            {vehicle.image_url ? (
                              <Image src={vehicle.image_url} alt={vehicle.name} fill sizes="48px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="w-5 h-5 text-white/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate">{vehicle.make} {vehicle.model}</h4>
                            <p className={`text-xs ${isSelected ? "text-white/70" : "text-white/40"}`}>
                              {bookingCount} booking{bookingCount !== 1 ? "s" : ""} · ${vehicle.daily_rate}/day
                            </p>
                          </div>
                          {bookingCount > 0 && !isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[#375DEE]/20 text-[#375DEE] text-xs font-bold flex items-center justify-center">
                              {bookingCount}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </>
              )}
            </div>
          </div>

          {/* Calendar Panel */}
          {selectedVehicle ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedVehicle(null)}
                    className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {selectedVehicle.id === "all" ? (
                    <div className="w-11 h-11 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
                      <Grid3X3 className="w-5 h-5 text-[#375DEE]" />
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-white/[0.06] overflow-hidden">
                      {selectedVehicle.image_url ? (
                        <Image src={selectedVehicle.image_url} alt={selectedVehicle.name} fill sizes="44px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-5 h-5 text-white/30" />
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold">
                      {selectedVehicle.id === "all" ? "All Vehicles" : `${selectedVehicle.make} ${selectedVehicle.model}`}
                    </h2>
                    <p className="text-sm text-white/50">
                      {selectedVehicle.id === "all"
                        ? `${allActiveBookings.length} total booking${allActiveBookings.length !== 1 ? "s" : ""}`
                        : `${vehicleBookings.length} booking${vehicleBookings.length !== 1 ? "s" : ""}`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Month Navigation */}
                  <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1">
                    <button
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 text-sm font-medium min-w-[140px] text-center">
                      {format(currentMonth, "MMMM yyyy")}
                    </span>
                    <button
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {selectedVehicle.id !== "all" && (
                    <button
                      onClick={() => openNewBookingForVehicle(selectedVehicle)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#375DEE] hover:bg-[#4169E1] text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Booking
                    </button>
                  )}
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="flex-1 bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-5 flex flex-col">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-[11px] font-semibold text-white/40 uppercase tracking-wider py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="flex-1 grid grid-rows-6 gap-1">
                  {calendarWeeks.map((week, weekIndex) => {
                    const currentBookings = selectedVehicle.id === "all" ? allActiveBookings : vehicleBookings
                    const bookingBars = getBookingBarsForWeek(week, currentBookings)

                    return (
                      <div key={weekIndex} className="relative">
                        {/* Date cells row */}
                        <div className="grid grid-cols-7 gap-1 h-full">
                          {week.map((day) => {
                            const isToday = isSameDay(day, new Date())
                            const isCurrentMonth = isSameMonth(day, currentMonth)

                            return (
                              <div
                                key={day.toISOString()}
                                className={`relative rounded-lg min-h-[80px] ${
                                  isCurrentMonth ? "bg-white/[0.02]" : ""
                                }`}
                              >
                                {/* Date number */}
                                <div
                                  className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                                    isToday
                                      ? "bg-[#375DEE] text-white"
                                      : isCurrentMonth
                                      ? "text-white/60"
                                      : "text-white/20"
                                  }`}
                                >
                                  {format(day, "d")}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Booking events overlaid */}
                        {bookingBars.length > 0 && (
                          <div className="absolute inset-x-0 top-10 bottom-1 pointer-events-none">
                            {bookingBars.map((bar, barIndex) => {
                              const leftPercent = (bar.startCol / 7) * 100
                              const widthPercent = ((bar.endCol - bar.startCol + 1) / 7) * 100
                              const statusColor = getStatusBarColor(bar.booking.status)

                              return (
                                <button
                                  key={bar.booking.id}
                                  onClick={() => setSelectedBooking(bar.booking)}
                                  style={{
                                    position: "absolute",
                                    left: `calc(${leftPercent}% + 2px)`,
                                    width: `calc(${widthPercent}% - 4px)`,
                                    top: `${barIndex * 28}px`,
                                  }}
                                  className={`h-[24px] pointer-events-auto group flex items-center gap-1.5 px-2 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg hover:z-10 ${
                                    bar.isStart && bar.isEnd
                                      ? "rounded-md"
                                      : bar.isStart
                                      ? "rounded-l-md"
                                      : bar.isEnd
                                      ? "rounded-r-md"
                                      : ""
                                  } ${statusColor} bg-opacity-90`}
                                >
                                  {/* Status dot */}
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/80 flex-shrink-0" />

                                  {/* Customer name */}
                                  <span className="text-[11px] font-medium text-white truncate">
                                    {bar.isStart ? bar.booking.customer_name : ""}
                                  </span>

                                  {/* Duration badge on start */}
                                  {bar.isStart && bar.isEnd && (
                                    <span className="ml-auto text-[10px] text-white/70 flex-shrink-0">
                                      {calculateDays(bar.booking.start_date, bar.booking.end_date)}d
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                  <div className="flex flex-wrap gap-5">
                    {statusOptions.filter(s => s.value !== "cancelled").map((status) => (
                      <div key={status.value} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${status.barColor}`} />
                        <span className="text-xs text-white/50">{status.label}</span>
                      </div>
                    ))}
                  </div>
                  {(selectedVehicle.id === "all" ? allActiveBookings : vehicleBookings).length === 0 && (
                    <p className="text-xs text-white/30">No bookings this month</p>
                  )}
                </div>
              </div>

              {/* Booking Details List */}
              {(selectedVehicle.id === "all" ? allActiveBookings : vehicleBookings).filter(b => new Date(b.end_date) >= new Date()).length > 0 && (
                <div className="mt-4 bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-4">
                  <h4 className="text-sm font-bold text-white/60 mb-3">Upcoming Bookings</h4>
                  <div className="grid gap-2 max-h-[200px] overflow-y-auto">
                    {(selectedVehicle.id === "all" ? allActiveBookings : vehicleBookings)
                      .filter(b => new Date(b.end_date) >= new Date())
                      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                      .map((booking) => (
                        <button
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                            selectedBooking?.id === booking.id
                              ? "bg-[#375DEE]/20 ring-1 ring-[#375DEE]/50"
                              : "bg-white/[0.02] hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className={`w-1 h-10 rounded-full ${getStatusBarColor(booking.status)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{booking.customer_name}</p>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                statusOptions.find(s => s.value === booking.status)?.color || "bg-gray-500/20 text-gray-400"
                              }`}>
                                {statusOptions.find(s => s.value === booking.status)?.label}
                              </span>
                            </div>
                            <p className="text-xs text-white/40 mt-0.5">
                              {selectedVehicle.id === "all" && booking.vehicles && (
                                <span className="text-white/50">{booking.vehicles.make} {booking.vehicles.model} · </span>
                              )}
                              {format(parseISO(booking.start_date), "MMM d")} - {format(parseISO(booking.end_date), "MMM d")} · {calculateDays(booking.start_date, booking.end_date)} days
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-mono text-sm font-semibold">${booking.total_amount?.toLocaleString()}</p>
                            <p className={`text-[10px] font-medium ${booking.deposit_paid ? "text-green-400" : "text-yellow-400"}`}>
                              {booking.deposit_paid ? "Deposit Paid" : "Pending"}
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex flex-1 bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] items-center justify-center">
              <div className="text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-lg font-bold mb-1">Select a vehicle</h3>
                <p className="text-sm text-white/40">Choose a vehicle to view its calendar</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Bookings Tab */}
      {activeTab === "all" && (
        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* Sidebar */}
          <div className="w-72 flex-shrink-0 flex flex-col">
            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl mb-4">
              <button
                onClick={() => {
                  setActiveTab("by-vehicle")
                  if (vehicles.length > 0) {
                    setSelectedVehicle({ id: "all", name: "All Vehicles", make: "All", model: "Vehicles", daily_rate: 0, image_url: null, status: "active" } as Vehicle)
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "by-vehicle"
                    ? "bg-[#375DEE] text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                By Vehicle
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "all"
                    ? "bg-[#375DEE] text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <List className="w-4 h-4" />
                All
              </button>
            </div>

            {/* Stats */}
            <div className="space-y-2 flex-1 overflow-y-auto">
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.08]">
                <p className="text-white/50 text-xs">Pending Deposits</p>
                <p className="text-xl font-bold mt-0.5 font-mono">
                  {bookings.filter((b) => !b.deposit_paid && b.status === "pending").length}
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.08]">
                <p className="text-white/50 text-xs">Confirmed</p>
                <p className="text-xl font-bold mt-0.5 font-mono">
                  {bookings.filter((b) => b.status === "confirmed").length}
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.08]">
                <p className="text-white/50 text-xs">Active Rentals</p>
                <p className="text-xl font-bold mt-0.5 font-mono">
                  {bookings.filter((b) => b.status === "active").length}
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.08]">
                <p className="text-white/50 text-xs">Total Revenue</p>
                <p className="text-xl font-bold mt-0.5 text-[#375DEE] font-mono">
                  ${bookings
                    .filter((b) => b.status !== "cancelled")
                    .reduce((sum, b) => sum + (b.total_amount || 0), 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 transition-colors"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === "all" ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  All
                </button>
                {statusOptions.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      statusFilter === status.value ? status.color : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bookings List */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Upcoming Bookings */}
              {upcomingBookings.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-white/60 mb-3">Upcoming & Active</h2>
                  <div className="space-y-2">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-4 hover:border-white/[0.12] transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-12 rounded-lg bg-white/[0.04] overflow-hidden flex-shrink-0">
                              {booking.vehicles?.image_url ? (
                                <Image src={booking.vehicles.image_url} alt={booking.vehicles.name} fill sizes="64px" className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Car className="w-5 h-5 text-white/20" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-sm">{booking.customer_name}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                  {statusOptions.find((s) => s.value === booking.status)?.label}
                                </span>
                              </div>
                              <p className="text-sm text-white/50">{booking.vehicles?.make} {booking.vehicles?.model}</p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-white/40">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {format(parseISO(booking.start_date), "MMM d")} - {format(parseISO(booking.end_date), "MMM d, yyyy")}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5" />
                                  {booking.customer_phone}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-lg font-bold font-mono">${booking.total_amount?.toLocaleString()}</p>
                              <button
                                onClick={() => handleDepositToggle(booking.id, !booking.deposit_paid)}
                                className={`text-xs flex items-center gap-1 ${booking.deposit_paid ? "text-green-400" : "text-yellow-400"}`}
                              >
                                {booking.deposit_paid ? <><CheckCircle className="w-3 h-3" /> Deposit paid</> : <><AlertCircle className="w-3 h-3" /> Deposit pending</>}
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={booking.status}
                                onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm focus:outline-none focus:border-[#375DEE]/50"
                              >
                                {statusOptions.map((status) => (
                                  <option key={status.value} value={status.value}>{status.label}</option>
                                ))}
                              </select>
                              <button onClick={() => openEditModal(booking)} className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-sm transition-colors">Edit</button>
                              <button onClick={() => handleDelete(booking.id)} className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-colors">Delete</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Bookings */}
              {pastBookings.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-white/40 mb-3">Past & Cancelled</h2>
                  <div className="space-y-2 opacity-60">
                    {pastBookings.map((booking) => (
                      <div key={booking.id} className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-3">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-10 rounded-lg bg-white/[0.04] overflow-hidden flex-shrink-0">
                              {booking.vehicles?.image_url ? (
                                <Image src={booking.vehicles.image_url} alt={booking.vehicles.name} fill sizes="64px" className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Car className="w-4 h-4 text-white/20" /></div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-sm">{booking.customer_name}</h3>
                              <p className="text-xs text-white/40">{booking.vehicles?.make} {booking.vehicles?.model} · {format(parseISO(booking.start_date), "MMM d, yyyy")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {statusOptions.find((s) => s.value === booking.status)?.label}
                            </span>
                            <span className="font-semibold font-mono text-sm">${booking.total_amount?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredBookings.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-white/20" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">No bookings found</h3>
                    <p className="text-sm text-white/40">{bookings.length === 0 ? "Create your first booking to get started" : "Try adjusting your filters"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && activeTab === "by-vehicle" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold">Booking Details</h2>
              <button onClick={() => setSelectedBooking(null)} className="p-2 rounded-lg hover:bg-white/5 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center"><User className="w-6 h-6 text-white/40" /></div>
                <div>
                  <h3 className="font-bold">{selectedBooking.customer_name}</h3>
                  <div className="flex items-center gap-3 text-sm text-white/40">
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{selectedBooking.customer_phone}</span>
                    {selectedBooking.customer_email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{selectedBooking.customer_email}</span>}
                  </div>
                </div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-white/40 uppercase tracking-wider mb-1">Start</p><p className="font-medium">{format(parseISO(selectedBooking.start_date), "MMM d, yyyy")}</p></div>
                  <div className="flex-1 mx-4 border-t border-dashed border-white/20" />
                  <div className="text-right"><p className="text-xs text-white/40 uppercase tracking-wider mb-1">End</p><p className="font-medium">{format(parseISO(selectedBooking.end_date), "MMM d, yyyy")}</p></div>
                </div>
                <p className="text-center text-sm text-white/40 mt-3">{calculateDays(selectedBooking.start_date, selectedBooking.end_date)} days</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Status</p>
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>{statusOptions.find((s) => s.value === selectedBooking.status)?.label}</span>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Total</p>
                  <p className="text-xl font-bold font-mono">${selectedBooking.total_amount?.toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => handleDepositToggle(selectedBooking.id, !selectedBooking.deposit_paid)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${selectedBooking.deposit_paid ? "bg-green-500/10 border border-green-500/30" : "bg-yellow-500/10 border border-yellow-500/30"}`}
              >
                <div className="flex items-center gap-3">
                  {selectedBooking.deposit_paid ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-yellow-400" />}
                  <span className={selectedBooking.deposit_paid ? "text-green-400" : "text-yellow-400"}>{selectedBooking.deposit_paid ? "Deposit Paid" : "Deposit Pending"}</span>
                </div>
                <span className={`font-mono ${selectedBooking.deposit_paid ? "text-green-400" : "text-yellow-400"}`}>${selectedBooking.deposit_amount?.toLocaleString()}</span>
              </button>
              {selectedBooking.notes && (
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Notes</p>
                  <p className="text-sm text-white/70">{selectedBooking.notes}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setSelectedBooking(null); openEditModal(selectedBooking) }} className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] font-medium transition-colors">Edit</button>
                <button onClick={() => handleDelete(selectedBooking.id)} className="px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition-colors">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">{editingBooking ? "Edit Booking" : "New Booking"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/5 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-2">Vehicle *</label>
                <select
                  required
                  value={formData.vehicle_id}
                  onChange={(e) => { setFormData({ ...formData, vehicle_id: e.target.value }); updateTotalFromDates(formData.start_date, formData.end_date, e.target.value) }}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map((vehicle) => (<option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} - ${vehicle.daily_rate}/day</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Customer Name *</label>
                <input type="text" required placeholder="John Smith" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Phone *</label>
                  <input type="tel" required placeholder="(555) 123-4567" value={formData.customer_phone} onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Email</label>
                  <input type="email" placeholder="john@example.com" value={formData.customer_email} onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Start Date *</label>
                  <input type="date" required value={formData.start_date} onChange={(e) => { setFormData({ ...formData, start_date: e.target.value }); updateTotalFromDates(e.target.value, formData.end_date, formData.vehicle_id) }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">End Date *</label>
                  <input type="date" required value={formData.end_date} onChange={(e) => { setFormData({ ...formData, end_date: e.target.value }); updateTotalFromDates(formData.start_date, e.target.value, formData.vehicle_id) }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Total ($)</label>
                  <input type="number" min="0" value={formData.total_amount || ""} onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Deposit ($)</label>
                  <input type="number" min="0" value={formData.deposit_amount || ""} onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="deposit_paid" checked={formData.deposit_paid} onChange={(e) => setFormData({ ...formData, deposit_paid: e.target.checked })} className="w-5 h-5 rounded bg-white/5 border border-white/20 checked:bg-[#375DEE] checked:border-[#375DEE]" />
                <label htmlFor="deposit_paid" className="text-sm">Deposit has been paid</label>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Notes</label>
                <textarea placeholder="Additional notes..." rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors resize-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-5 py-3 rounded-xl bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 font-semibold transition-colors">{saving ? "Saving..." : editingBooking ? "Save" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
