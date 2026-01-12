"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Search,
  Calendar,
  Car,
  DollarSign,
  X,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
} from "lucide-react"

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  daily_rate: number
  image_url: string | null
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
  { value: "pending", label: "Pending Deposit", color: "bg-yellow-500/20 text-yellow-400" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-500/20 text-blue-400" },
  { value: "active", label: "Active Rental", color: "bg-green-500/20 text-green-400" },
  { value: "completed", label: "Completed", color: "bg-gray-500/20 text-gray-400" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500/20 text-red-400" },
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
        .select("*, vehicles(id, name, make, model, daily_rate, image_url)")
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
    fetchData()
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from("bookings").update({ status: newStatus }).eq("id", id)
    setBookings(bookings.map((b) => (b.id === id ? { ...b, status: newStatus } : b)))
  }

  const handleDepositToggle = async (id: string, paid: boolean) => {
    const updates: any = { deposit_paid: paid }
    if (paid) {
      updates.status = "confirmed"
    }
    await supabase.from("bookings").update(updates).eq("id", id)
    setBookings(
      bookings.map((b) =>
        b.id === id ? { ...b, deposit_paid: paid, status: paid ? "confirmed" : b.status } : b
      )
    )
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
          deposit_amount: Math.round(total * 0.25), // 25% deposit
        }))
      }
    }
  }

  const getStatusColor = (status: string) => {
    return statusOptions.find((s) => s.value === status)?.color || "bg-gray-500/20 text-gray-400"
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Bookings
          </h1>
          <p className="text-white/50 mt-1">Loading bookings...</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl" />
          ))}
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
            Bookings
          </h1>
          <p className="text-white/50 mt-1">
            {bookings.filter((b) => b.status !== "cancelled").length} active booking
            {bookings.filter((b) => b.status !== "cancelled").length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingBooking(null)
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-5 py-3 bg-[#375DEE] hover:bg-[#4169E1] text-white font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white/50 text-sm">Pending Deposits</p>
          <p className="text-2xl font-bold mt-1">
            {bookings.filter((b) => !b.deposit_paid && b.status === "pending").length}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white/50 text-sm">Confirmed</p>
          <p className="text-2xl font-bold mt-1">
            {bookings.filter((b) => b.status === "confirmed").length}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white/50 text-sm">Active Rentals</p>
          <p className="text-2xl font-bold mt-1">
            {bookings.filter((b) => b.status === "active").length}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white/50 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold mt-1 text-[#375DEE]">
            ${bookings
              .filter((b) => b.status !== "cancelled")
              .reduce((sum, b) => sum + (b.total_amount || 0), 0)
              .toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#375DEE] transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
        >
          <option value="all">All Status</option>
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Upcoming & Active
          </h2>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white/5 rounded-xl border border-white/10 p-4 hover:border-white/20 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Vehicle Image */}
                    <div className="w-20 h-14 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                      {booking.vehicles?.image_url ? (
                        <img
                          src={booking.vehicles.image_url}
                          alt={booking.vehicles.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                    </div>

                    {/* Booking Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{booking.customer_name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {statusOptions.find((s) => s.value === booking.status)?.label}
                        </span>
                      </div>
                      <p className="text-sm text-white/50">
                        {booking.vehicles?.make} {booking.vehicles?.model}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-white/40">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {booking.customer_phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="flex items-center gap-4">
                    {/* Deposit Status */}
                    <div className="text-right">
                      <p className="text-xl font-bold">${booking.total_amount?.toLocaleString()}</p>
                      <button
                        onClick={() => handleDepositToggle(booking.id, !booking.deposit_paid)}
                        className={`text-xs flex items-center gap-1 mt-1 ${
                          booking.deposit_paid ? "text-green-400" : "text-yellow-400"
                        }`}
                      >
                        {booking.deposit_paid ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Deposit paid (${booking.deposit_amount?.toLocaleString()})
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Deposit pending (${booking.deposit_amount?.toLocaleString()})
                          </>
                        )}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#375DEE]"
                      >
                        {statusOptions.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => openEditModal(booking)}
                        className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-colors"
                      >
                        Delete
                      </button>
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
          <h2 className="text-lg font-semibold mb-4 text-white/60" style={{ fontFamily: 'var(--font-display)' }}>
            Past & Cancelled
          </h2>
          <div className="space-y-3 opacity-60">
            {pastBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white/5 rounded-xl border border-white/10 p-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                      {booking.vehicles?.image_url ? (
                        <img
                          src={booking.vehicles.image_url}
                          alt={booking.vehicles.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-5 h-5 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{booking.customer_name}</h3>
                      <p className="text-sm text-white/40">
                        {booking.vehicles?.make} {booking.vehicles?.model} • {new Date(booking.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {statusOptions.find((s) => s.value === booking.status)?.label}
                    </span>
                    <span className="font-semibold">${booking.total_amount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredBookings.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
          <p className="text-white/50 mb-6">
            {bookings.length === 0 ? "Create your first booking to get started" : "Try adjusting your filters"}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                {editingBooking ? "Edit Booking" : "New Booking"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-2">Vehicle *</label>
                <select
                  required
                  value={formData.vehicle_id}
                  onChange={(e) => {
                    setFormData({ ...formData, vehicle_id: e.target.value })
                    updateTotalFromDates(formData.start_date, formData.end_date, e.target.value)
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} - ${vehicle.daily_rate}/day
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="John Smith"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="(555) 123-4567"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => {
                      setFormData({ ...formData, start_date: e.target.value })
                      updateTotalFromDates(e.target.value, formData.end_date, formData.vehicle_id)
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => {
                      setFormData({ ...formData, end_date: e.target.value })
                      updateTotalFromDates(formData.start_date, e.target.value, formData.vehicle_id)
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Total Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.total_amount || ""}
                    onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Deposit Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deposit_amount || ""}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="deposit_paid"
                  checked={formData.deposit_paid}
                  onChange={(e) => setFormData({ ...formData, deposit_paid: e.target.checked })}
                  className="w-5 h-5 rounded bg-white/5 border border-white/20 checked:bg-[#375DEE] checked:border-[#375DEE]"
                />
                <label htmlFor="deposit_paid" className="text-sm">
                  Deposit has been paid
                </label>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Notes</label>
                <textarea
                  placeholder="Additional notes..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-5 py-3 rounded-xl bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 font-semibold transition-colors"
                >
                  {saving ? "Saving..." : editingBooking ? "Save Changes" : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
