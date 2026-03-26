"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useDashboardCache } from "@/lib/dashboard-cache"
import { toast } from "sonner"
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
  DollarSign,
  MoreHorizontal,
  HelpCircle,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import MatrixRainLoader from "@/app/components/matrix-rain-loader"

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
  { value: "available", label: "Available", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "rented", label: "Rented", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "maintenance", label: "Maintenance", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { value: "inactive", label: "Inactive", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
]

export default function VehiclesPage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use the shared cache with real-time updates
  const { data: cacheData, addVehicle, updateVehicle, removeVehicle } = useDashboardCache()
  const vehicles = cacheData.vehicles as Vehicle[]
  const loading = cacheData.isLoading

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

  // Get user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [supabase])

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
        toast.error("Failed to upload image", { description: "Please try again or use a different image" })
        setUploading(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('vehicle-images').getPublicUrl(fileName)
      setFormData({ ...formData, image_url: publicUrl })
      toast.success("Image uploaded successfully")
    } catch (err) {
      toast.error("Failed to upload image", { description: "An unexpected error occurred" })
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
        // Optimistic update via cache - real-time will also update across tabs
        updateVehicle(editingVehicle.id, vehicleData as any)
      }
    } else {
      const { data, error } = await supabase.from("vehicles").insert(vehicleData).select().single()
      if (!error && data) {
        // Optimistic update via cache - real-time will also update across tabs
        addVehicle(data as any)
      }
    }
    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const { error } = await supabase.from("vehicles").delete().eq("id", id)
    if (!error) {
      // Optimistic update via cache - real-time will also update across tabs
      removeVehicle(id)
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
        // Update via cache for real-time sync
        updateVehicle(vehicleId, { last_turo_sync: new Date().toISOString() } as any)
      }
    } catch (error) {
      console.error("Sync error:", error)
    }
    setSyncing(null)
  }

  if (loading) {
    return <MatrixRainLoader />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fleet</h1>
          <p className="text-sm text-white/50 mt-1">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in your fleet</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          placeholder="Search vehicles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
        />
      </div>

      {/* Vehicle Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-6">
            <Car className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {search ? "No vehicles found" : "Add your first vehicle"}
          </h3>
          <p className="text-white/50 text-center max-w-md mb-6">
            {search
              ? "Try adjusting your search terms or clear the search to see all vehicles"
              : "Your fleet is empty. Add vehicles to start managing bookings, tracking availability, and accepting rentals."}
          </p>
          {!search && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              <Plus className="w-5 h-5" />
              Add Your First Vehicle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden hover:border-white/[0.15] transition-all group"
            >
              {/* Image */}
              <div className="aspect-[16/10] bg-white/5 relative overflow-hidden">
                {vehicle.image_url ? (
                  <img
                    src={vehicle.image_url}
                    alt={vehicle.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-16 h-16 text-white/10" />
                  </div>
                )}

                {/* Status badge */}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(vehicle.status)}`}>
                  {statusOptions.find(s => s.value === vehicle.status)?.label}
                </div>

                {/* Turo sync indicator */}
                {vehicle.turo_ical_url && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#00D4AA]/20 border border-[#00D4AA]/30">
                    <CalendarIcon className="w-3 h-3 text-[#00D4AA]" />
                    <span className="text-[10px] font-medium text-[#00D4AA]">Turo</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold mb-1 truncate">{vehicle.name}</h3>
                <p className="text-sm text-white/50 mb-3">{vehicle.type}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-white/40" />
                    <span className="font-medium">{vehicle.daily_rate}</span>
                    <span className="text-white/40 text-sm">/day</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {vehicle.turo_ical_url && (
                      <button
                        onClick={() => handleSyncCalendar(vehicle.id)}
                        disabled={syncing === vehicle.id}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors disabled:opacity-50"
                        title="Sync Turo calendar"
                      >
                        {syncing === vehicle.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(vehicle)}
                      className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ id: vehicle.id, name: vehicle.name })}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-white/60 flex items-center gap-2"><CalendarIcon className="w-4 h-4" />Turo iCal URL</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-white/30 hover:text-white/50 transition-colors">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        Sync your Turo bookings automatically. Paste your Turo calendar URL here to block dates when a vehicle is booked on Turo.
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
    </div>
  )
}
