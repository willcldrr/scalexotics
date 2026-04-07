"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
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
  HelpCircle,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import PageTransition from "@/app/components/page-transition"

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
  color: string | null
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
  { value: "available", label: "Available" },
  { value: "rented", label: "Rented" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inactive", label: "Inactive" },
]

function getVehicleStatusStyle(status: string, vehicleColor: string): { className: string; style: Record<string, string | number> } {
  const color = vehicleColor || '#ffffff'
  switch (status) {
    case 'available': {
      const r = parseInt(color.slice(1, 3), 16) || 0
      const g = parseInt(color.slice(3, 5), 16) || 0
      const b = parseInt(color.slice(5, 7), 16) || 0
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      const textColor = luminance > 0.6 ? '#000000' : '#ffffff'
      return {
        className: 'font-semibold tracking-wide',
        style: {
          backgroundColor: color,
          color: textColor,
          boxShadow: `0 0 12px ${color}60, 0 2px 8px rgba(0,0,0,0.3)`,
          borderWidth: '0',
        },
      }
    }
    case 'rented': {
      const rr = parseInt(color.slice(1, 3), 16) || 0
      const rg = parseInt(color.slice(3, 5), 16) || 0
      const rb = parseInt(color.slice(5, 7), 16) || 0
      // Mix the vehicle color with grey to desaturate it
      const mixR = Math.round(rr * 0.35 + 120 * 0.65)
      const mixG = Math.round(rg * 0.35 + 120 * 0.65)
      const mixB = Math.round(rb * 0.35 + 120 * 0.65)
      const dimColor = `rgb(${mixR},${mixG},${mixB})`
      return {
        className: '',
        style: {
          backgroundColor: `rgba(${mixR},${mixG},${mixB},0.25)`,
          color: dimColor,
          borderWidth: '0',
        },
      }
    }
    case 'maintenance':
      return {
        className: '',
        style: {
          backgroundColor: 'rgba(120,120,120,0.2)',
          borderColor: 'rgba(120,120,120,0.3)',
          color: 'rgba(160,160,160,0.7)',
          borderWidth: '1px',
          borderStyle: 'solid',
        },
      }
    case 'inactive':
      return {
        className: 'line-through',
        style: {
          backgroundColor: 'rgba(100,100,100,0.15)',
          borderColor: 'rgba(100,100,100,0.2)',
          color: 'rgba(140,140,140,0.5)',
          borderWidth: '1px',
          borderStyle: 'solid',
        },
      }
    default:
      return {
        className: '',
        style: {
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderColor: 'rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.6)',
          borderWidth: '1px',
          borderStyle: 'solid',
        },
      }
  }
}

export default function VehiclesPage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

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
    name: "", make: "", model: "", year: new Date().getFullYear(),
    daily_rate: 0, image_url: "", status: "available", notes: "", turo_ical_url: "", color: "#ffffff",
  })
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

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
    setFormData({ name: "", make: "", model: "", year: new Date().getFullYear(), daily_rate: 0, image_url: "", status: "available", notes: "", turo_ical_url: "", color: "#ffffff" })
    setImageInputMode('upload')
    setShowModal(true)
  }

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      name: vehicle.name, make: vehicle.make, model: vehicle.model, year: vehicle.year,
      daily_rate: vehicle.daily_rate, image_url: vehicle.image_url || "",
      status: vehicle.status, notes: vehicle.notes || "", turo_ical_url: vehicle.turo_ical_url || "",
      color: vehicle.color || "#ffffff",
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
      if (uploadError) { toast.error("Failed to upload image"); setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('vehicle-images').getPublicUrl(fileName)
      setFormData({ ...formData, image_url: publicUrl })
      toast.success("Image uploaded")
    } catch { toast.error("Failed to upload image") }
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
      color: formData.color || '#ffffff',
    }

    if (editingVehicle) {
      const { error } = await supabase.from("vehicles").update(vehicleData).eq("id", editingVehicle.id)
      if (!error) updateVehicle(editingVehicle.id, vehicleData as any)
    } else {
      const { data, error } = await supabase.from("vehicles").insert(vehicleData).select().single()
      if (!error && data) addVehicle(data as any)
    }
    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const { error } = await supabase.from("vehicles").delete().eq("id", id)
    if (!error) removeVehicle(id)
    setDeleting(null)
    setDeleteConfirm(null)
  }


  const handleSyncCalendar = async (vehicleId: string) => {
    setSyncing(vehicleId)
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vehicleId }) })
      const data = await res.json()
      if (data.success) updateVehicle(vehicleId, { last_turo_sync: new Date().toISOString() } as any)
    } catch { toast.error("Sync failed") }
    setSyncing(null)
  }

  // Close modal on click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setShowModal(false)
    }
  }

  return (
    <PageTransition loading={loading}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fleet</h1>
          <p className="text-sm text-white/50 mt-1">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in your fleet</p>
        </div>
        <button onClick={openAddModal} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input type="text" placeholder="Search vehicles..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-300" />
      </div>

      {/* Vehicle Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-6">
            <Car className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{search ? "No vehicles found" : "Add your first vehicle"}</h3>
          <p className="text-white/50 text-center max-w-md mb-6">
            {search ? "Try adjusting your search terms or clear the search to see all vehicles" : "Your fleet is empty. Add vehicles to start managing bookings, tracking availability, and accepting rentals."}
          </p>
          {!search && (
            <button onClick={openAddModal} className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
              <Plus className="w-5 h-5" />
              Add Your First Vehicle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-fade-in">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              onDoubleClick={() => openEditModal(vehicle)}
              className={`bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04] hover:shadow-[0_8px_40px_rgba(0,0,0,0.4),0_0_30px_rgba(255,255,255,0.06)] hover:-translate-y-1 group shadow-[0_2px_15px_rgba(0,0,0,0.25)] select-none ${
                vehicle.status === 'maintenance' || vehicle.status === 'inactive' ? 'grayscale opacity-60' : ''
              }`}
            >
              {/* Image */}
              <div className="aspect-[16/10] bg-white/[0.03] relative overflow-hidden">
                {vehicle.image_url && !failedImages.has(vehicle.id) ? (
                  <Image src={vehicle.image_url} alt={vehicle.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" unoptimized onError={() => setFailedImages(prev => new Set(prev).add(vehicle.id))} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-16 h-16 text-white/[0.06]" />
                  </div>
                )}
                {(() => {
                  const statusStyle = getVehicleStatusStyle(vehicle.status, vehicle.color || '#ffffff')
                  return (
                    <div
                      className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${statusStyle.className}`}
                      style={statusStyle.style}
                    >
                      {statusOptions.find(s => s.value === vehicle.status)?.label}
                    </div>
                  )
                })()}
                {vehicle.turo_ical_url && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#00D4AA]/20 border border-[#00D4AA]/30 backdrop-blur-sm">
                    <CalendarIcon className="w-3 h-3 text-[#00D4AA]" />
                    <span className="text-[10px] font-medium text-[#00D4AA]">Turo</span>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none" />
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold mb-1 truncate">{vehicle.name}</h3>
                <p className="text-sm text-white/40 mb-3">{vehicle.type}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-white/30" />
                    <span className="font-medium">{vehicle.daily_rate}</span>
                    <span className="text-white/30 text-sm">/day</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {vehicle.turo_ical_url && (
                      <button onClick={(e) => { e.stopPropagation(); handleSyncCalendar(vehicle.id) }} disabled={syncing === vehicle.id} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all duration-300 disabled:opacity-50">
                        {syncing === vehicle.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(vehicle) }} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all duration-300">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: vehicle.id, name: vehicle.name }) }} className="p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all duration-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal — Horizontal layout, click outside to close */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
          <div ref={modalRef} className="bg-black border border-white/[0.1] shadow-[0_0_60px_rgba(0,0,0,0.6),0_0_40px_rgba(255,255,255,0.05)] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
            {/* Left — Image preview */}
            <div className="md:w-[380px] shrink-0 bg-white/[0.02] flex items-center justify-center relative">
              {formData.image_url ? (
                <div className="relative w-full h-full min-h-[200px] md:min-h-0">
                  <Image src={formData.image_url} alt="Preview" fill sizes="380px" className="object-cover" unoptimized />
                  <button type="button" onClick={() => setFormData({ ...formData, image_url: '' })} className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 hover:bg-red-500/60 transition-all duration-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 gap-4 w-full min-h-[200px] md:min-h-0">
                  <Car className="w-16 h-16 text-white/[0.06]" />
                  <div className="flex gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${imageInputMode === 'upload' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploading ? "Uploading..." : "Upload"}
                    </button>
                    <button type="button" onClick={() => setImageInputMode(imageInputMode === 'url' ? 'upload' : 'url')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 text-white/50 hover:bg-white/10 transition-all duration-300">
                      <LinkIcon className="w-3.5 h-3.5" />URL
                    </button>
                  </div>
                  {imageInputMode === 'url' && (
                    <input type="url" placeholder="https://example.com/image.jpg" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/25 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-300" />
                  )}
                </div>
              )}
            </div>

            {/* Right — Form */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h2 className="text-lg font-semibold tracking-tight">{editingVehicle ? "Edit Vehicle" : "New Vehicle"}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/5 transition-all duration-300 text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {/* Vehicle name */}
                <div>
                  <input type="text" placeholder="Vehicle name (auto-generated if empty)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-0 py-2 bg-transparent border-b border-white/[0.08] text-white text-lg font-medium placeholder:text-white/20 focus:outline-none focus:border-white/25 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-300" />
                </div>

                {/* Year / Make / Model row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/30 mb-1.5">Year</label>
                    <input type="number" min="1900" max={new Date().getFullYear() + 1} value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-white/25 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-300" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/30 mb-1.5">Make</label>
                    <input type="text" placeholder="Make" value={formData.make} onChange={(e) => setFormData({ ...formData, make: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/25 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-300" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/30 mb-1.5">Model</label>
                    <input type="text" placeholder="Model" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/25 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-300" />
                  </div>
                </div>

                {/* Rate / Status row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/30 mb-1.5">Daily Rate</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input type="number" min="0" step="50" placeholder="0" value={formData.daily_rate || ""} onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })} className="w-full pl-8 pr-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/25 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-300" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/30 mb-1.5">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-white/25 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-300">
                      {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Vehicle Color */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/30 mb-1.5">Vehicle Color</label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: formData.color || '#ffffff' }}
                    />
                    <input
                      type="color"
                      value={formData.color || '#ffffff'}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      ref={(el) => { if (el) (el as any)._colorRef = true }}
                      className="sr-only"
                      aria-label="Color picker"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (typeof window !== 'undefined' && window.isSecureContext && 'EyeDropper' in window) {
                            const eyeDropper = new (window as any).EyeDropper()
                            const result = await eyeDropper.open()
                            setFormData(prev => ({ ...prev, color: result.sRGBHex }))
                            return
                          }
                        } catch { /* user cancelled */ }
                        // Fallback: open native color picker
                        const input = (document.querySelector('input[aria-label="Color picker"]') as HTMLInputElement)
                        input?.click()
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-200 text-sm text-white/60 hover:text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/></svg>
                      Pick Color
                    </button>
                    <span className="text-xs text-white/30 font-mono">{formData.color || '#ffffff'}</span>
                  </div>
                </div>

                {/* Turo iCal */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-white/30 flex items-center gap-1.5">
                      <CalendarIcon className="w-3 h-3" />Turo iCal
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-white/20 hover:text-white/40 transition-all duration-300"><HelpCircle className="w-3 h-3" /></button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">Sync Turo bookings automatically. Paste your Turo calendar URL.</TooltipContent>
                      </Tooltip>
                    </label>
                    <a href="https://support.turo.com/hc/en-us/articles/203991880-Exporting-your-Turo-calendar" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/30 hover:text-white/50 flex items-center gap-1">
                      How to get this <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input type="url" placeholder="https://turo.com/reservations/subscribe/ical.ics?..." value={formData.turo_ical_url} onChange={(e) => setFormData({ ...formData, turo_ical_url: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-white/25 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-300" />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/30 mb-1.5">Notes</label>
                  <textarea placeholder="Additional details..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/25 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)] resize-none transition-all duration-300" />
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-white/[0.08] hover:bg-white/5 font-medium text-sm transition-all duration-300">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || !formData.make || !formData.model} className="flex-1 px-4 py-2.5 rounded-lg bg-white hover:bg-white/90 text-black disabled:opacity-50 font-semibold text-sm transition-all duration-300">
                  {saving ? "Saving..." : editingVehicle ? "Save Changes" : "Add Vehicle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-black rounded-2xl border border-white/[0.08] w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-center mb-2">Delete Vehicle</h2>
              <p className="text-white/60 text-center text-sm">
                Are you sure you want to delete <span className="text-white font-medium">{deleteConfirm.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 p-4 border-t border-white/[0.06]">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] hover:bg-white/5 font-medium transition-all duration-300 text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} disabled={deleting === deleteConfirm.id} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-all duration-300 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting === deleteConfirm.id ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  )
}
