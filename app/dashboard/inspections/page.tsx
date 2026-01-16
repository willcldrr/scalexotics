"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  ClipboardCheck,
  Search,
  Plus,
  Camera,
  Car,
  Calendar,
  Loader2,
  X,
  Eye,
  CheckCircle,
  AlertTriangle,
  Fuel,
  Gauge,
  Copy,
  ExternalLink,
} from "lucide-react"
import { format } from "date-fns"

interface Inspection {
  id: string
  booking_id: string | null
  vehicle_id: string
  type: "pickup" | "return"
  inspector_name: string
  customer_name: string
  mileage: number
  fuel_level: number // 0-100
  exterior_condition: "excellent" | "good" | "fair" | "poor"
  interior_condition: "excellent" | "good" | "fair" | "poor"
  notes: string | null
  damage_notes: string | null
  photos: string[]
  customer_signature: string | null
  customer_signed_at: string | null
  token: string
  status: "pending" | "completed"
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
  vehicle_id: string
  start_date: string
  end_date: string
  vehicles?: Vehicle
}

export default function InspectionsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    booking_id: "",
    vehicle_id: "",
    type: "pickup" as "pickup" | "return",
    inspector_name: "",
    customer_name: "",
    mileage: 0,
    fuel_level: 100,
    exterior_condition: "excellent" as "excellent" | "good" | "fair" | "poor",
    interior_condition: "excellent" as "excellent" | "good" | "fair" | "poor",
    notes: "",
    damage_notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      setUserId(user.id)

      // Fetch inspections
      const { data: inspectionsData } = await supabase
        .from("inspections")
        .select(`
          *,
          vehicles (make, model, year, image_url)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setInspections(inspectionsData?.map(i => ({
        ...i,
        vehicles: Array.isArray(i.vehicles) ? i.vehicles[0] : i.vehicles
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

      // Get user name for inspector
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()

      if (profile?.full_name) {
        setFormData(prev => ({ ...prev, inspector_name: profile.full_name }))
      }
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
      })
    }
  }

  const createInspection = async () => {
    if (!userId) return
    setCreating(true)

    const token = crypto.randomUUID()

    const { data, error } = await supabase
      .from("inspections")
      .insert({
        user_id: userId,
        booking_id: formData.booking_id || null,
        vehicle_id: formData.vehicle_id,
        type: formData.type,
        inspector_name: formData.inspector_name,
        customer_name: formData.customer_name,
        mileage: formData.mileage,
        fuel_level: formData.fuel_level,
        exterior_condition: formData.exterior_condition,
        interior_condition: formData.interior_condition,
        notes: formData.notes || null,
        damage_notes: formData.damage_notes || null,
        photos: [],
        token,
        status: "pending",
      })
      .select(`
        *,
        vehicles (make, model, year, image_url)
      `)
      .single()

    if (!error && data) {
      setInspections([{
        ...data,
        vehicles: Array.isArray(data.vehicles) ? data.vehicles[0] : data.vehicles
      }, ...inspections])
      setShowCreateModal(false)
      resetForm()
    }

    setCreating(false)
  }

  const resetForm = () => {
    setFormData({
      booking_id: "",
      vehicle_id: "",
      type: "pickup",
      inspector_name: formData.inspector_name,
      customer_name: "",
      mileage: 0,
      fuel_level: 100,
      exterior_condition: "excellent",
      interior_condition: "excellent",
      notes: "",
      damage_notes: "",
    })
  }

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/inspection/${token}`
    navigator.clipboard.writeText(link)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getConditionBadge = (condition: string) => {
    const styles: Record<string, string> = {
      excellent: "bg-green-500/20 text-green-400",
      good: "bg-blue-500/20 text-blue-400",
      fair: "bg-yellow-500/20 text-yellow-400",
      poor: "bg-red-500/20 text-red-400",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[condition]}`}>
        {condition.charAt(0).toUpperCase() + condition.slice(1)}
      </span>
    )
  }

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.vehicles?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.vehicles?.model?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || inspection.type === typeFilter
    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Vehicle Inspections
          </h1>
          <p className="text-white/50 mt-1">Loading inspections...</p>
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
            Vehicle Inspections
          </h1>
          <p className="text-white/50 mt-1">Document vehicle condition at pickup and return</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#375DEE] hover:bg-[#4169E1] text-white font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Inspection
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: inspections.length, color: "text-white" },
          { label: "Pickups", value: inspections.filter(i => i.type === "pickup").length, color: "text-blue-400" },
          { label: "Returns", value: inspections.filter(i => i.type === "return").length, color: "text-green-400" },
          { label: "Pending Signature", value: inspections.filter(i => i.status === "pending").length, color: "text-yellow-400" },
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
            placeholder="Search inspections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
          />
        </div>
        <div className="flex gap-2">
          {["all", "pickup", "return"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === type
                  ? "bg-[#375DEE] text-white"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Inspections List */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        {filteredInspections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/40">
            <ClipboardCheck className="w-12 h-12 mb-3" />
            <p>No inspections found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-[#375DEE] hover:underline"
            >
              Create your first inspection
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredInspections.map((inspection) => (
              <div key={inspection.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 rounded-lg bg-white/5 overflow-hidden">
                      {inspection.vehicles?.image_url ? (
                        <img
                          src={inspection.vehicles.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{inspection.customer_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          inspection.type === "pickup" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
                        }`}>
                          {inspection.type === "pickup" ? "Pickup" : "Return"}
                        </span>
                        {inspection.status === "completed" ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <span className="text-xs text-yellow-400">Awaiting signature</span>
                        )}
                      </div>
                      <p className="text-sm text-white/50">
                        {inspection.vehicles?.year} {inspection.vehicles?.make} {inspection.vehicles?.model}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Gauge className="w-3 h-3" />
                          {inspection.mileage?.toLocaleString()} mi
                        </span>
                        <span className="flex items-center gap-1">
                          <Fuel className="w-3 h-3" />
                          {inspection.fuel_level}%
                        </span>
                        <span>{format(new Date(inspection.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getConditionBadge(inspection.exterior_condition)}
                    <button
                      onClick={() => copyLink(inspection.token)}
                      className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Copy inspection link"
                    >
                      {copiedId === inspection.token ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInspection(inspection)
                        setShowViewModal(true)
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="View inspection"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-semibold">New Inspection</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Inspection Type</label>
                <div className="flex gap-2">
                  {["pickup", "return"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, type: type as "pickup" | "return" })}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        formData.type === type
                          ? "bg-[#375DEE] text-white"
                          : "bg-white/5 border border-white/10 text-white/60"
                      }`}
                    >
                      {type === "pickup" ? "Pickup" : "Return"}
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

              {/* Customer Name */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  placeholder="Customer name"
                />
              </div>

              {/* Mileage & Fuel */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Mileage *</label>
                  <input
                    type="number"
                    required
                    value={formData.mileage || ""}
                    onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                    placeholder="Current mileage"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Fuel Level (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.fuel_level}
                    onChange={(e) => setFormData({ ...formData, fuel_level: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              {/* Conditions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Exterior Condition</label>
                  <select
                    value={formData.exterior_condition}
                    onChange={(e) => setFormData({ ...formData, exterior_condition: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Interior Condition</label>
                  <select
                    value={formData.interior_condition}
                    onChange={(e) => setFormData({ ...formData, interior_condition: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>

              {/* Damage Notes */}
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  <AlertTriangle className="w-4 h-4 inline mr-1 text-yellow-400" />
                  Damage Notes
                </label>
                <textarea
                  value={formData.damage_notes}
                  onChange={(e) => setFormData({ ...formData, damage_notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white resize-none"
                  placeholder="Note any existing damage or issues..."
                />
              </div>

              {/* General Notes */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white resize-none"
                  placeholder="Any additional notes..."
                />
              </div>

              <button
                onClick={createInspection}
                disabled={!formData.vehicle_id || !formData.customer_name || creating}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                {creating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ClipboardCheck className="w-5 h-5" />
                    Create Inspection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedInspection && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Inspection Report</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedInspection.type === "pickup" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
                }`}>
                  {selectedInspection.type === "pickup" ? "Pickup" : "Return"}
                </span>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Vehicle & Customer */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Vehicle</p>
                  <p className="font-semibold">
                    {selectedInspection.vehicles?.year} {selectedInspection.vehicles?.make} {selectedInspection.vehicles?.model}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Customer</p>
                  <p className="font-semibold">{selectedInspection.customer_name}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Gauge className="w-5 h-5 text-[#375DEE] mx-auto mb-1" />
                  <p className="text-lg font-bold font-numbers">{selectedInspection.mileage?.toLocaleString()}</p>
                  <p className="text-xs text-white/50">Miles</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Fuel className="w-5 h-5 text-[#375DEE] mx-auto mb-1" />
                  <p className="text-lg font-bold font-numbers">{selectedInspection.fuel_level}%</p>
                  <p className="text-xs text-white/50">Fuel</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-white/50 mb-1">Exterior</p>
                  {getConditionBadge(selectedInspection.exterior_condition)}
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-white/50 mb-1">Interior</p>
                  {getConditionBadge(selectedInspection.interior_condition)}
                </div>
              </div>

              {/* Damage Notes */}
              {selectedInspection.damage_notes && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-sm text-yellow-400 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Damage Notes
                  </p>
                  <p className="text-white/80">{selectedInspection.damage_notes}</p>
                </div>
              )}

              {/* Notes */}
              {selectedInspection.notes && (
                <div className="space-y-2">
                  <p className="text-sm text-white/50">Additional Notes</p>
                  <p className="text-white/80">{selectedInspection.notes}</p>
                </div>
              )}

              {/* Signature */}
              {selectedInspection.customer_signature && (
                <div className="space-y-2">
                  <p className="text-sm text-white/50">Customer Signature</p>
                  <div className="bg-white rounded-xl p-4">
                    <img
                      src={selectedInspection.customer_signature}
                      alt="Customer signature"
                      className="max-h-24"
                    />
                  </div>
                  {selectedInspection.customer_signed_at && (
                    <p className="text-sm text-white/40">
                      Signed on {format(new Date(selectedInspection.customer_signed_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  )}
                </div>
              )}

              {/* Inspection Link */}
              <div className="space-y-2">
                <p className="text-sm text-white/50">Customer Link</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/inspection/${selectedInspection.token}`}
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70"
                  />
                  <button
                    onClick={() => copyLink(selectedInspection.token)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <a
                    href={`/inspection/${selectedInspection.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Meta */}
              <div className="text-sm text-white/40 pt-4 border-t border-white/10">
                <p>Created: {format(new Date(selectedInspection.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                <p>Inspector: {selectedInspection.inspector_name}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
