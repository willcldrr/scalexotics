"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Calendar,
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Car,
  Link2,
  Clock,
  X,
} from "lucide-react"

interface Vehicle {
  id: string
  name: string | null
  make: string
  model: string
  year: number
}

interface CalendarSync {
  id: string
  vehicle_id: string
  url: string
  source: string
  last_synced_at: string | null
  event_count: number
  is_active: boolean
  last_error: string | null
  vehicles?: Vehicle
}

interface ApiKey {
  key: string
}

const CALENDAR_SOURCES = [
  { id: "turo", name: "Turo", icon: "🚗", placeholder: "https://turo.com/api/host/vehicles/.../ical" },
  { id: "getaround", name: "Getaround", icon: "🔑", placeholder: "https://calendar.getaround.com/..." },
  { id: "airbnb", name: "Airbnb", icon: "🏠", placeholder: "https://airbnb.com/calendar/ical/..." },
  { id: "google", name: "Google Calendar", icon: "📅", placeholder: "https://calendar.google.com/calendar/ical/..." },
  { id: "outlook", name: "Outlook", icon: "📧", placeholder: "https://outlook.office365.com/owa/calendar/..." },
  { id: "apple", name: "Apple iCloud", icon: "🍎", placeholder: "https://p00-caldav.icloud.com/..." },
  { id: "other", name: "Other iCal URL", icon: "🔗", placeholder: "https://example.com/calendar.ics" },
]

export default function CalendarSettings() {
  const supabase = createClient()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [syncs, setSyncs] = useState<CalendarSync[]>([])
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<string>("")
  const [selectedSource, setSelectedSource] = useState<string>("turo")
  const [calendarUrl, setCalendarUrl] = useState<string>("")
  const [adding, setAdding] = useState(false)

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

    // Get vehicles for this user
    const { data: vehiclesData } = await supabase
      .from("vehicles")
      .select("id, name, make, model, year")
      .eq("user_id", user.id)
      .order("make", { ascending: true })

    setVehicles(vehiclesData || [])

    // Get calendar syncs for this user
    const { data: syncsData } = await supabase
      .from("calendar_syncs")
      .select("*, vehicles(id, name, make, model, year)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    setSyncs(syncsData || [])

    // Get API key for this user
    const { data: keyData } = await supabase
      .from("api_keys")
      .select("key")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .single()

    setApiKey(keyData?.key || null)

    setLoading(false)
  }

  const getVehicleName = (vehicle: Vehicle) => {
    return vehicle.name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  }

  const getExportUrl = (vehicleId: string) => {
    if (!apiKey) return null
    return `${window.location.origin}/api/calendar/export/${vehicleId}?token=${apiKey}`
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleAddSync = async () => {
    if (!selectedVehicle || !calendarUrl) {
      setMessage({ type: "error", text: "Please select a vehicle and enter a calendar URL" })
      return
    }

    setAdding(true)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMessage({ type: "error", text: "Not authenticated" })
        setAdding(false)
        return
      }

      const response = await fetch("/api/calendar/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          url: calendarUrl,
          vehicleId: selectedVehicle,
          source: CALENDAR_SOURCES.find(s => s.id === selectedSource)?.name || selectedSource,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to import calendar")
      }

      setMessage({ type: "success", text: `Successfully imported ${data.events} events` })
      setShowAddModal(false)
      setCalendarUrl("")
      setSelectedVehicle("")
      fetchData()
    } catch (error: any) {
      setMessage({ type: "error", text: error.message })
    }

    setAdding(false)
  }

  const handleSyncOne = async (syncId: string) => {
    setSyncing(syncId)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMessage({ type: "error", text: "Not authenticated" })
        setSyncing(null)
        return
      }

      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ syncId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync calendar")
      }

      setMessage({ type: "success", text: `Synced ${data.events} events` })
      fetchData()
    } catch (error: any) {
      setMessage({ type: "error", text: error.message })
    }

    setSyncing(null)
  }

  const handleSyncAll = async () => {
    setSyncing("all")
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMessage({ type: "error", text: "Not authenticated" })
        setSyncing(null)
        return
      }

      const response = await fetch("/api/calendar/sync", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync calendars")
      }

      setMessage({
        type: data.failed > 0 ? "error" : "success",
        text: `Synced ${data.synced} calendars${data.failed > 0 ? `, ${data.failed} failed` : ""}`
      })
      fetchData()
    } catch (error: any) {
      setMessage({ type: "error", text: error.message })
    }

    setSyncing(null)
  }

  const handleDeleteSync = async (syncId: string) => {
    if (!confirm("Are you sure you want to remove this calendar sync?")) return

    const { error } = await supabase
      .from("calendar_syncs")
      .delete()
      .eq("id", syncId)

    if (!error) {
      setSyncs(syncs.filter(s => s.id !== syncId))
      setMessage({ type: "success", text: "Calendar sync removed" })
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never"
    return new Date(dateStr).toLocaleString()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/5 rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-white/10 rounded w-48 mb-4" />
            <div className="h-4 bg-white/10 rounded w-32" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Export Section */}
      <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[#375DEE]/20">
            <Calendar className="w-5 h-5 text-[#375DEE]" />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              Export Your Calendar
            </h3>
            <p className="text-sm text-white/50">
              Subscribe to these URLs in Google Calendar, Apple Calendar, or Outlook
            </p>
          </div>
        </div>

        {!apiKey ? (
          <div className="text-white/50 text-sm p-4 bg-white/5 rounded-xl">
            No API key found. Create one in the Booking Widget settings to enable calendar export.
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-white/50 text-sm p-4 bg-white/5 rounded-xl">
            No vehicles found. Add vehicles to enable calendar export.
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((vehicle) => {
              const exportUrl = getExportUrl(vehicle.id)
              return (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-white/40" />
                    <span className="font-medium">{getVehicleName(vehicle)}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(exportUrl!, `export-${vehicle.id}`)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
                  >
                    {copiedId === `export-${vehicle.id}` ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy iCal URL</span>
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Import Section */}
      <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Link2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                Import External Calendars
              </h3>
              <p className="text-sm text-white/50">
                Sync bookings from Turo, Getaround, Google Calendar, and more
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {syncs.length > 0 && (
              <button
                onClick={handleSyncAll}
                disabled={syncing !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing === "all" ? "animate-spin" : ""}`} />
                Sync All
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#375DEE] hover:opacity-90 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Calendar
            </button>
          </div>
        </div>

        {syncs.length === 0 ? (
          <div className="text-center py-8">
            <Link2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 mb-4">No external calendars connected</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#375DEE] hover:opacity-90 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Connect Your First Calendar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {syncs.map((sync) => (
              <div
                key={sync.id}
                className="p-4 rounded-xl bg-white/5 border border-white/[0.08]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {sync.vehicles ? getVehicleName(sync.vehicles as Vehicle) : "Unknown Vehicle"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-xs text-white/60">
                        {sync.source}
                      </span>
                    </div>
                    <p className="text-sm text-white/40 truncate max-w-md">{sync.url}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last synced: {formatDate(sync.last_synced_at)}
                      </span>
                      <span>{sync.event_count} events</span>
                      {sync.last_error && (
                        <span className="text-red-400">Error: {sync.last_error}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSyncOne(sync.id)}
                      disabled={syncing !== null}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      title="Sync now"
                    >
                      <RefreshCw
                        className={`w-4 h-4 text-white/50 ${syncing === sync.id ? "animate-spin" : ""}`}
                      />
                    </button>
                    <button
                      onClick={() => handleDeleteSync(sync.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-6">
        <h3 className="text-lg font-bold mb-4">
          How Calendar Sync Works
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-bold text-[#375DEE] mb-2">Export (Your Calendar → Others)</h4>
            <ol className="list-decimal list-inside space-y-1 text-white/60">
              <li>Copy the iCal URL for your vehicle</li>
              <li>In Google Calendar, click "+" next to "Other calendars"</li>
              <li>Select "From URL" and paste the link</li>
              <li>Your bookings will appear and auto-update</li>
            </ol>
          </div>
          <div>
            <h4 className="font-bold text-green-400 mb-2">Import (Others → Your Calendar)</h4>
            <ol className="list-decimal list-inside space-y-1 text-white/60">
              <li>Find the iCal/ICS export URL from Turo, Getaround, etc.</li>
              <li>Click "Add Calendar" and paste the URL</li>
              <li>Select which vehicle it applies to</li>
              <li>External bookings will block those dates</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Add Calendar Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.08] w-full max-w-lg">
            <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Add External Calendar
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Vehicle Selection */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Vehicle</label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                >
                  <option value="">Select a vehicle...</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {getVehicleName(vehicle)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Selection */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Calendar Source</label>
                <div className="grid grid-cols-4 gap-2">
                  {CALENDAR_SOURCES.map((source) => (
                    <button
                      key={source.id}
                      onClick={() => setSelectedSource(source.id)}
                      className={`p-3 rounded-xl text-center transition-colors ${
                        selectedSource === source.id
                          ? "bg-[#375DEE] text-white"
                          : "bg-white/5 hover:bg-white/10 text-white/60"
                      }`}
                    >
                      <span className="text-xl block mb-1">{source.icon}</span>
                      <span className="text-xs">{source.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Calendar URL (iCal/ICS)</label>
                <input
                  type="url"
                  value={calendarUrl}
                  onChange={(e) => setCalendarUrl(e.target.value)}
                  placeholder={CALENDAR_SOURCES.find(s => s.id === selectedSource)?.placeholder}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
                <p className="text-xs text-white/40 mt-2">
                  Paste the iCal export URL from {CALENDAR_SOURCES.find(s => s.id === selectedSource)?.name}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-white/[0.08] flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSync}
                disabled={adding || !selectedVehicle || !calendarUrl}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#375DEE] hover:opacity-90 disabled:opacity-50 font-semibold transition-colors"
              >
                {adding ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add & Sync
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
