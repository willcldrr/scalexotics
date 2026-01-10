"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Calendar as CalendarIcon,
  Car,
} from "lucide-react"

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
}

interface Booking {
  id: string
  vehicle_id: string
  customer_name: string
  customer_phone: string
  start_date: string
  end_date: string
  total_amount: number
  status: string
  vehicles?: Vehicle
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  active: "bg-green-500",
  completed: "bg-gray-500",
  cancelled: "bg-red-500",
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

export default function CalendarPage() {
  const supabase = createClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const [formData, setFormData] = useState({
    vehicle_id: "",
    customer_name: "",
    customer_phone: "",
    start_date: "",
    end_date: "",
    total_amount: 0,
    status: "pending",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const [vehiclesRes, bookingsRes] = await Promise.all([
      supabase.from("vehicles").select("id, name, make, model").neq("status", "inactive"),
      supabase.from("bookings").select("*, vehicles(id, name, make, model)"),
    ])

    if (vehiclesRes.data) setVehicles(vehiclesRes.data)
    if (bookingsRes.data) setBookings(bookingsRes.data)

    setLoading(false)
  }

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (number | null)[] = []
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getBookingsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return bookings.filter((booking) => {
      const start = booking.start_date
      const end = booking.end_date
      return dateStr >= start && dateStr <= end && booking.status !== "cancelled"
    })
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const openAddModal = (day?: number) => {
    setEditingBooking(null)
    const startDate = day
      ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : ""
    setFormData({
      vehicle_id: vehicles[0]?.id || "",
      customer_name: "",
      customer_phone: "",
      start_date: startDate,
      end_date: startDate,
      total_amount: 0,
      status: "pending",
    })
    setShowModal(true)
  }

  const openEditModal = (booking: Booking) => {
    setEditingBooking(booking)
    setFormData({
      vehicle_id: booking.vehicle_id,
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone || "",
      start_date: booking.start_date,
      end_date: booking.end_date,
      total_amount: booking.total_amount,
      status: booking.status,
    })
    setSelectedBooking(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)

    const bookingData = {
      vehicle_id: formData.vehicle_id,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone || null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      total_amount: formData.total_amount,
      status: formData.status,
    }

    if (editingBooking) {
      const { error } = await supabase
        .from("bookings")
        .update(bookingData)
        .eq("id", editingBooking.id)

      if (!error) {
        const vehicle = vehicles.find((v) => v.id === formData.vehicle_id)
        setBookings(
          bookings.map((b) =>
            b.id === editingBooking.id
              ? { ...b, ...bookingData, vehicles: vehicle }
              : b
          )
        )
      }
    } else {
      const { data, error } = await supabase
        .from("bookings")
        .insert(bookingData)
        .select("*, vehicles(id, name, make, model)")
        .single()

      if (!error && data) {
        setBookings([...bookings, data])
      }
    }

    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async () => {
    if (!editingBooking || !confirm("Are you sure you want to delete this booking?")) return

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", editingBooking.id)

    if (!error) {
      setBookings(bookings.filter((b) => b.id !== editingBooking.id))
      setShowModal(false)
    }
  }

  const days = getDaysInMonth(currentDate)

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Calendar
          </h1>
          <p className="text-white/50 mt-1">Loading bookings...</p>
        </div>
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 animate-pulse">
          <div className="h-96 bg-white/5 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Calendar
          </h1>
          <p className="text-white/50 mt-1">Manage your vehicle bookings</p>
        </div>
        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-2 px-5 py-3 bg-[#375DEE] hover:bg-[#4169E1] text-white font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Booking
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 border-b border-white/10">
          {dayNames.map((day) => (
            <div
              key={day}
              className="px-4 py-3 text-center text-sm font-medium text-white/50"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayBookings = day ? getBookingsForDay(day) : []
            return (
              <div
                key={index}
                className={`min-h-[120px] border-b border-r border-white/5 p-2 ${
                  day ? "cursor-pointer hover:bg-white/5" : "bg-white/[0.02]"
                }`}
                onClick={() => day && openAddModal(day)}
              >
                {day && (
                  <>
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-full mb-1 text-sm ${
                        isToday(day)
                          ? "bg-[#375DEE] text-white font-semibold"
                          : "text-white/60"
                      }`}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map((booking) => (
                        <div
                          key={booking.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedBooking(booking)
                          }}
                          className={`px-2 py-1 rounded text-xs truncate cursor-pointer hover:opacity-80 ${
                            statusColors[booking.status]
                          } text-white`}
                        >
                          {booking.vehicles?.make || "Vehicle"} - {booking.customer_name}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-white/40 px-2">
                          +{dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {statusOptions.map((status) => (
          <div key={status.value} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${statusColors[status.value]}`} />
            <span className="text-white/60">{status.label}</span>
          </div>
        ))}
      </div>

      {/* Booking Detail Popup */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                Booking Details
              </h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
                  <Car className="w-6 h-6 text-[#375DEE]" />
                </div>
                <div>
                  <p className="font-semibold">
                    {selectedBooking.vehicles?.make} {selectedBooking.vehicles?.model}
                  </p>
                  <p className="text-sm text-white/50">{selectedBooking.vehicles?.name}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex justify-between">
                  <span className="text-white/50">Customer</span>
                  <span>{selectedBooking.customer_name}</span>
                </div>
                {selectedBooking.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-white/50">Phone</span>
                    <span>{selectedBooking.customer_phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/50">Dates</span>
                  <span>
                    {new Date(selectedBooking.start_date).toLocaleDateString()} -{" "}
                    {new Date(selectedBooking.end_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Total</span>
                  <span className="font-semibold text-[#375DEE]">
                    ${selectedBooking.total_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50">Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                      statusColors[selectedBooking.status]
                    }`}
                  >
                    {selectedBooking.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => setSelectedBooking(null)}
                className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => openEditModal(selectedBooking)}
                className="flex-1 px-5 py-3 rounded-xl bg-[#375DEE] hover:bg-[#4169E1] font-semibold transition-colors"
              >
                Edit Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                {editingBooking ? "Edit Booking" : "Add Booking"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-2">Vehicle</label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Customer Name</label>
                <input
                  type="text"
                  placeholder="John Smith"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Customer Phone</label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Total Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="5000"
                  value={formData.total_amount || ""}
                  onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-white/10">
              {editingBooking && (
                <button
                  onClick={handleDelete}
                  className="px-5 py-3 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 font-medium transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.vehicle_id || !formData.customer_name || !formData.start_date || !formData.end_date}
                className="flex-1 px-5 py-3 rounded-xl bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {saving ? "Saving..." : editingBooking ? "Save Changes" : "Add Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
