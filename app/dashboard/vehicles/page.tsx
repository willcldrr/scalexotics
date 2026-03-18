"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Search,
  Car,
  DollarSign,
  X,
  Pencil,
  Trash2,
  Upload,
  Link as LinkIcon,
  Loader2,
  Calendar,
  RefreshCw,
  ExternalLink,
} from "lucide-react"

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

// Auto-determine vehicle type based on make
const getVehicleType = (make: string): string => {
  const makeLower = make.toLowerCase()

  // Supercars
  if (['lamborghini', 'ferrari', 'mclaren', 'bugatti', 'koenigsegg', 'pagani'].includes(makeLower)) {
    return 'Supercar'
  }
  // Luxury SUVs
  if (['range rover', 'land rover', 'cadillac escalade', 'bentley bentayga', 'rolls royce cullinan'].some(m => makeLower.includes(m.split(' ')[0]))) {
    return 'Luxury SUV'
  }
  // Luxury Sedans
  if (['rolls royce', 'bentley', 'maybach'].some(m => makeLower.includes(m.split(' ')[0])) && !makeLower.includes('cullinan') && !makeLower.includes('bentayga')) {
    return 'Luxury Sedan'
  }
  // Sports Cars
  if (['porsche', 'aston martin', 'corvette', 'nissan gt-r', 'audi r8'].some(m => makeLower.includes(m.split(' ')[0]))) {
    return 'Sports Car'
  }
  // Convertibles - check model later or default
  if (['mercedes', 'bmw', 'audi'].includes(makeLower)) {
    return 'Luxury'
  }

  return 'Exotic'
}

const statusOptions = [
  { value: "available", label: "Available", color: "bg-green-500/20 text-green-400" },
  { value: "rented", label: "Rented", color: "bg-blue-500/20 text-blue-400" },
  { value: "maintenance", label: "Maintenance", color: "bg-orange-500/20 text-orange-400" },
  { value: "inactive", label: "Inactive", color: "bg-gray-500/20 text-gray-400" },
]

export default function VehiclesPage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageInputMode, setImageInputMode] = useState<'url' | 'upload'>('upload')

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
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    setUserId(user.id)

    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setVehicles(data)
    }
    setLoading(false)
  }

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.name.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || vehicle.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const openAddModal = () => {
    setEditingVehicle(null)
    setFormData({
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
    setImageInputMode('upload')
    setShowModal(true)
  }

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      name: vehicle.name,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      daily_rate: vehicle.daily_rate,
      image_url: vehicle.image_url || "",
      status: vehicle.status,
      notes: vehicle.notes || "",
      turo_ical_url: vehicle.turo_ical_url || "",
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

      const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Failed to upload image. Please try again or use an image URL.')
        setUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(fileName)

      setFormData({ ...formData, image_url: publicUrl })
    } catch (err) {
      console.error('Upload error:', err)
      alert('Failed to upload image. Please try again or use an image URL.')
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
      make: formData.make,
      model: formData.model,
      year: formData.year,
      type: vehicleType,
      daily_rate: formData.daily_rate,
      image_url: formData.image_url || null,
      status: formData.status,
      notes: formData.notes || null,
      turo_ical_url: formData.turo_ical_url || null,
    }

    if (editingVehicle) {
      const { error } = await supabase
        .from("vehicles")
        .update(vehicleData)
        .eq("id", editingVehicle.id)

      if (!error) {
        setVehicles(
          vehicles.map((v) =>
            v.id === editingVehicle.id ? { ...v, ...vehicleData } : v
          )
        )
      }
    } else {
      const { data, error } = await supabase
        .from("vehicles")
        .insert(vehicleData)
        .select()
        .single()

      if (!error && data) {
        setVehicles([data, ...vehicles])
      }
    }

    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return

    setDeleting(id)
    const { error } = await supabase.from("vehicles").delete().eq("id", id)

    if (!error) {
      setVehicles(vehicles.filter((v) => v.id !== id))
    }
    setDeleting(null)
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("vehicles")
      .update({ status: newStatus })
      .eq("id", id)

    if (!error) {
      setVehicles(
        vehicles.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
      )
    }
  }

  const getStatusColor = (status: string) => {
    return (
      statusOptions.find((s) => s.value === status)?.color ||
      "bg-gray-500/20 text-gray-400"
    )
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
        // Update the vehicle's last sync time in local state
        setVehicles(vehicles.map(v =>
          v.id === vehicleId
            ? { ...v, last_turo_sync: new Date().toISOString() }
            : v
        ))
      }
    } catch (error) {
      console.error("Sync error:", error)
    }
    setSyncing(null)
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 border-b border-white/[0.06] animate-pulse">
              <div className="w-14 h-10 rounded-md bg-white/10" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="h-3 bg-white/10 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters and Action button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-colors"
        >
          <option value="">All Status</option>
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <button
          onClick={openAddModal}
          className="hidden sm:flex items-center gap-2 px-5 py-3 bg-white hover:bg-white/90 text-black text-white font-semibold rounded-xl transition-colors ml-auto"
        >
          <Plus className="w-5 h-5" />
          Add Vehicle
        </button>
      </div>

      {/* Vehicle Table */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-16">
          <Car className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No vehicles found</h3>
          <p className="text-white/50 mb-6">
            {vehicles.length === 0
              ? "Add your first vehicle to get started"
              : "Try adjusting your search or filters"}
          </p>
          {vehicles.length === 0 && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-white/90 text-black font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Vehicle
            </button>
          )}
        </div>
      ) : (
        <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid sm:grid-cols-[60px_1fr_100px_100px_90px_80px] gap-3 px-3 py-2 bg-white/[0.03] border-b border-white/[0.08] text-[11px] font-medium text-white/40 uppercase tracking-wider">
            <div>Image</div>
            <div>Vehicle</div>
            <div>Type</div>
            <div>Daily Rate</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-white/[0.06]">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="grid grid-cols-1 sm:grid-cols-[60px_1fr_100px_100px_90px_80px] gap-3 px-3 py-2 items-center hover:bg-white/[0.02] transition-colors group"
              >
                {/* Image */}
                <div className="w-14 h-10 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
                  {vehicle.image_url ? (
                    <img
                      src={vehicle.image_url}
                      alt={vehicle.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-4 h-4 text-white/20" />
                    </div>
                  )}
                </div>

                {/* Vehicle Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-medium text-white truncate">{vehicle.name}</h3>
                    {vehicle.turo_ical_url && (
                      <span title="Synced with Turo" className="flex-shrink-0">
                        <Calendar className="w-3 h-3 text-[#00D4AA]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 truncate">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                </div>

                {/* Type */}
                <div className="hidden sm:block">
                  <span className="text-xs text-white/60">{vehicle.type}</span>
                </div>

                {/* Daily Rate */}
                <div className="hidden sm:flex items-center gap-0.5 text-sm text-white font-medium">
                  <DollarSign className="w-3.5 h-3.5 text-white/50" />
                  {vehicle.daily_rate.toLocaleString()}
                  <span className="text-white/40 text-xs">/day</span>
                </div>

                {/* Status */}
                <div className="hidden sm:block">
                  <select
                    value={vehicle.status}
                    onChange={(e) => handleStatusChange(vehicle.id, e.target.value)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20 ${getStatusColor(vehicle.status)}`}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  {vehicle.turo_ical_url && (
                    <button
                      onClick={() => handleSyncCalendar(vehicle.id)}
                      disabled={syncing === vehicle.id}
                      title="Sync Turo calendar"
                      className="p-1.5 rounded hover:bg-[#00D4AA]/20 text-white/40 hover:text-[#00D4AA] transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncing === vehicle.id ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(vehicle)}
                    className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle.id)}
                    disabled={deleting === vehicle.id}
                    className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deleting === vehicle.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Mobile: Extra Info */}
                <div className="sm:hidden col-span-1 flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/60">{vehicle.type}</span>
                    <span className="text-xs font-medium">${vehicle.daily_rate.toLocaleString()}/day</span>
                  </div>
                  <select
                    value={vehicle.status}
                    onChange={(e) => handleStatusChange(vehicle.id, e.target.value)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border-0 cursor-pointer focus:outline-none ${getStatusColor(vehicle.status)}`}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.08] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
              <h2 className="text-xl font-bold">
                {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Year */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Year</label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-colors"
                />
              </div>

              {/* Make & Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Make</label>
                  <input
                    type="text"
                    placeholder="Lamborghini"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Model</label>
                  <input
                    type="text"
                    placeholder="Huracán"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-colors"
                  />
                </div>
              </div>

              {/* Daily Rate */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Daily Rate ($)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  placeholder="1500"
                  value={formData.daily_rate || ""}
                  onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-colors"
                />
              </div>

              {/* Image Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-white/60">Vehicle Image</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        imageInputMode === 'upload'
                          ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        imageInputMode === 'url'
                          ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      URL
                    </button>
                  </div>
                </div>

                {imageInputMode === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full px-4 py-8 rounded-xl bg-white/5 border border-white/[0.08] border-dashed hover:border-white/50 hover:bg-white/[0.02] transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] animate-spin" />
                          <span className="text-white/50 text-sm">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-white/30" />
                          <span className="text-white/50 text-sm">Click to upload image</span>
                          <span className="text-white/30 text-xs">JPG, PNG, WebP up to 10MB</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-colors"
                  />
                )}

                {formData.image_url && (
                  <div className="mt-3 rounded-xl overflow-hidden bg-white/5 h-32 relative">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-red-500/50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Notes (optional)</label>
                <textarea
                  placeholder="Additional details about this vehicle..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-colors resize-none"
                />
              </div>

              {/* Turo iCal URL */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-white/60 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Turo iCal URL (optional)
                  </label>
                  <a
                    href="https://support.turo.com/hc/en-us/articles/203991880-Exporting-your-Turo-calendar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1"
                  >
                    How to get this <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="url"
                  placeholder="https://turo.com/reservations/subscribe/ical.ics?..."
                  value={formData.turo_ical_url}
                  onChange={(e) => setFormData({ ...formData, turo_ical_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-colors text-sm"
                />
                <p className="mt-1.5 text-xs text-white/30">
                  Auto-sync Turo bookings to keep your calendar up to date
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-colors"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-white/[0.08]">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.make || !formData.model}
                className="flex-1 px-5 py-3 rounded-xl bg-white hover:bg-white/90 text-black disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {saving ? "Saving..." : editingVehicle ? "Save Changes" : "Add Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
