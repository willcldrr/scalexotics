"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Truck,
  Search,
  Plus,
  MapPin,
  Clock,
  Phone,
  User,
  Car,
  Calendar,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Navigation,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"
import { format } from "date-fns"

interface Delivery {
  id: string
  booking_id: string | null
  vehicle_id: string
  type: "pickup" | "delivery" | "return"
  customer_name: string
  customer_phone: string
  address: string
  city: string
  scheduled_date: string
  scheduled_time: string
  status: "scheduled" | "in_transit" | "completed" | "cancelled"
  driver_name: string | null
  driver_phone: string | null
  notes: string | null
  completed_at: string | null
  created_at: string
  vehicles?: {
    make: string
    model: string
    year: number
    image_url: string | null
  }
}

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  image_url: string | null
}

interface Booking {
  id: string
  customer_name: string
  customer_phone: string
  vehicle_id: string
  start_date: string
  end_date: string
  vehicles?: Vehicle
}

export default function DeliveriesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    booking_id: "",
    vehicle_id: "",
    type: "delivery" as "pickup" | "delivery" | "return",
    customer_name: "",
    customer_phone: "",
    address: "",
    city: "",
    scheduled_date: "",
    scheduled_time: "10:00",
    driver_name: "",
    driver_phone: "",
    notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      setUserId(user.id)

      // Fetch deliveries
      const { data: deliveriesData } = await supabase
        .from("deliveries")
        .select(`
          *,
          vehicles (make, model, year, image_url)
        `)
        .eq("user_id", user.id)
        .order("scheduled_date", { ascending: true })

      setDeliveries(deliveriesData?.map(d => ({
        ...d,
        vehicles: Array.isArray(d.vehicles) ? d.vehicles[0] : d.vehicles
      })) || [])

      // Fetch vehicles
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("id, make, model, year, image_url")
        .eq("user_id", user.id)
        .neq("status", "inactive")

      setVehicles(vehiclesData || [])

      // Fetch active bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(`
          id,
          customer_name,
          customer_phone,
          vehicle_id,
          start_date,
          end_date,
          vehicles (id, make, model, year, image_url)
        `)
        .eq("user_id", user.id)
        .in("status", ["confirmed", "active"])
        .order("start_date", { ascending: true })

      setBookings(bookingsData?.map(b => ({
        ...b,
        vehicles: Array.isArray(b.vehicles) ? b.vehicles[0] : b.vehicles
      })) || [])
    }

    setLoading(false)
  }

  const handleBookingSelect = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (booking) {
      setFormData({
        ...formData,
        booking_id: bookingId,
        vehicle_id: booking.vehicle_id,
        customer_name: booking.customer_name,
        customer_phone: booking.customer_phone,
      })
    }
  }

  const createDelivery = async () => {
    if (!userId) return
    setCreating(true)

    const { data, error } = await supabase
      .from("deliveries")
      .insert({
        user_id: userId,
        booking_id: formData.booking_id || null,
        vehicle_id: formData.vehicle_id,
        type: formData.type,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        address: formData.address,
        city: formData.city,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        driver_name: formData.driver_name || null,
        driver_phone: formData.driver_phone || null,
        notes: formData.notes || null,
        status: "scheduled",
      })
      .select(`
        *,
        vehicles (make, model, year, image_url)
      `)
      .single()

    if (!error && data) {
      setDeliveries([{
        ...data,
        vehicles: Array.isArray(data.vehicles) ? data.vehicles[0] : data.vehicles
      }, ...deliveries].sort((a, b) =>
        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      ))
      setShowModal(false)
      resetForm()
    }

    setCreating(false)
  }

  const updateStatus = async (id: string, status: Delivery["status"]) => {
    const updates: any = { status }
    if (status === "completed") {
      updates.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("deliveries")
      .update(updates)
      .eq("id", id)

    if (!error) {
      setDeliveries(deliveries.map(d =>
        d.id === id ? { ...d, status, completed_at: updates.completed_at } : d
      ))
    }
  }

  const resetForm = () => {
    setFormData({
      booking_id: "",
      vehicle_id: "",
      type: "delivery",
      customer_name: "",
      customer_phone: "",
      address: "",
      city: "",
      scheduled_date: "",
      scheduled_time: "10:00",
      driver_name: "",
      driver_phone: "",
      notes: "",
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      scheduled: { bg: "bg-blue-500/20", text: "text-blue-400", icon: Clock },
      in_transit: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: Navigation },
      completed: { bg: "bg-green-500/20", text: "text-green-400", icon: CheckCircle },
      cancelled: { bg: "bg-red-500/20", text: "text-red-400", icon: AlertCircle },
    }
    const style = styles[status] || styles.scheduled
    const Icon = style.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        {status === "in_transit" ? "In Transit" : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const styles: Record<string, { bg: string; icon: any }> = {
      delivery: { bg: "bg-[#375DEE]/20 text-[#375DEE]", icon: ArrowRight },
      pickup: { bg: "bg-green-500/20 text-green-400", icon: ArrowLeft },
      return: { bg: "bg-purple-500/20 text-purple-400", icon: ArrowLeft },
    }
    const style = styles[type] || styles.delivery
    const Icon = style.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg}`}>
        <Icon className="w-3 h-3" />
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    )
  }

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const todayDeliveries = filteredDeliveries.filter(d => {
    const today = new Date().toISOString().split("T")[0]
    return d.scheduled_date === today && d.status !== "cancelled" && d.status !== "completed"
  })

  const upcomingDeliveries = filteredDeliveries.filter(d => {
    const today = new Date().toISOString().split("T")[0]
    return d.scheduled_date > today && d.status !== "cancelled" && d.status !== "completed"
  })

  const pastDeliveries = filteredDeliveries.filter(d => {
    const today = new Date().toISOString().split("T")[0]
    return d.scheduled_date < today || d.status === "completed" || d.status === "cancelled"
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Deliveries
          </h1>
          <p className="text-white/50 mt-1">Loading deliveries...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
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
            Deliveries
          </h1>
          <p className="text-white/50 mt-1">Schedule and track vehicle deliveries & pickups</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#375DEE] hover:bg-[#4169E1] text-white font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          Schedule Delivery
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Today", value: todayDeliveries.length, color: "text-[#375DEE]" },
          { label: "Upcoming", value: upcomingDeliveries.length, color: "text-blue-400" },
          { label: "In Transit", value: deliveries.filter(d => d.status === "in_transit").length, color: "text-yellow-400" },
          { label: "Completed", value: deliveries.filter(d => d.status === "completed").length, color: "text-green-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-white/50">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search deliveries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
          />
        </div>
        <div className="flex gap-2">
          {["all", "scheduled", "in_transit", "completed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "bg-[#375DEE] text-white"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {status === "in_transit" ? "In Transit" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Today's Deliveries */}
      {todayDeliveries.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#375DEE] animate-pulse" />
            Today
          </h2>
          <div className="space-y-3">
            {todayDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onStatusChange={updateStatus}
                getStatusBadge={getStatusBadge}
                getTypeBadge={getTypeBadge}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Deliveries */}
      {upcomingDeliveries.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-white/60">Upcoming</h2>
          <div className="space-y-3">
            {upcomingDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onStatusChange={updateStatus}
                getStatusBadge={getStatusBadge}
                getTypeBadge={getTypeBadge}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Deliveries */}
      {pastDeliveries.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-white/40">Past</h2>
          <div className="space-y-3 opacity-60">
            {pastDeliveries.slice(0, 10).map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onStatusChange={updateStatus}
                getStatusBadge={getStatusBadge}
                getTypeBadge={getTypeBadge}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {filteredDeliveries.length === 0 && (
        <div className="bg-white/5 rounded-2xl border border-white/10 py-16 text-center">
          <Truck className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No deliveries found</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-[#375DEE] hover:underline"
          >
            Schedule your first delivery
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Schedule Delivery</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Type</label>
                <div className="flex gap-2">
                  {[
                    { value: "delivery", label: "Delivery", icon: ArrowRight },
                    { value: "pickup", label: "Pickup", icon: ArrowLeft },
                    { value: "return", label: "Return", icon: ArrowLeft },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFormData({ ...formData, type: type.value as any })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        formData.type === type.value
                          ? "bg-[#375DEE] text-white"
                          : "bg-white/5 border border-white/10 text-white/60"
                      }`}
                    >
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Booking Selection */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Link to Booking (Optional)</label>
                <select
                  value={formData.booking_id}
                  onChange={(e) => handleBookingSelect(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                >
                  <option value="">Select a booking...</option>
                  {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.customer_name} - {booking.vehicles?.make} {booking.vehicles?.model}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Vehicle *</label>
                <select
                  required
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                >
                  <option value="">Select a vehicle...</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  placeholder="123 Main Street"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  placeholder="Los Angeles, CA"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              {/* Driver Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Driver Name</label>
                  <input
                    type="text"
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Driver Phone</label>
                  <input
                    type="tel"
                    value={formData.driver_phone}
                    onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white resize-none"
                  placeholder="Gate code, special instructions..."
                />
              </div>

              <button
                onClick={createDelivery}
                disabled={!formData.vehicle_id || !formData.customer_name || !formData.address || !formData.scheduled_date || creating}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                {creating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Truck className="w-5 h-5" />
                    Schedule Delivery
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DeliveryCard({
  delivery,
  onStatusChange,
  getStatusBadge,
  getTypeBadge,
  compact = false,
}: {
  delivery: Delivery
  onStatusChange: (id: string, status: Delivery["status"]) => void
  getStatusBadge: (status: string) => JSX.Element
  getTypeBadge: (type: string) => JSX.Element
  compact?: boolean
}) {
  return (
    <div className={`bg-white/5 rounded-xl border border-white/10 p-4 ${compact ? "" : "hover:border-white/20"} transition-colors`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {!compact && (
            <div className="w-16 h-12 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
              {delivery.vehicles?.image_url ? (
                <img
                  src={delivery.vehicles.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="w-6 h-6 text-white/20" />
                </div>
              )}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{delivery.customer_name}</span>
              {getTypeBadge(delivery.type)}
              {getStatusBadge(delivery.status)}
            </div>
            {!compact && (
              <p className="text-sm text-white/50">
                {delivery.vehicles?.year} {delivery.vehicles?.make} {delivery.vehicles?.model}
              </p>
            )}
            <div className="flex items-center gap-4 mt-1 text-sm text-white/40">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {delivery.city}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(delivery.scheduled_date), "MMM d")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {delivery.scheduled_time}
              </span>
            </div>
          </div>
        </div>

        {!compact && delivery.status !== "completed" && delivery.status !== "cancelled" && (
          <div className="flex items-center gap-2">
            {delivery.status === "scheduled" && (
              <button
                onClick={() => onStatusChange(delivery.id, "in_transit")}
                className="px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-sm font-medium rounded-lg transition-colors"
              >
                Start
              </button>
            )}
            {delivery.status === "in_transit" && (
              <button
                onClick={() => onStatusChange(delivery.id, "completed")}
                className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm font-medium rounded-lg transition-colors"
              >
                Complete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
