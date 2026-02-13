"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  MapPin,
  Link as LinkIcon,
  User,
  Building2,
  Loader2,
  Calendar as CalendarIcon,
  Video,
  Phone,
  RefreshCw,
  Trash2,
} from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
} from "date-fns"
import { eventTypeOptions, getEventTypeColor, type CRMEventType } from "../lib/crm-status"
import type { CRMLead } from "./leads-tab"

interface CRMEvent {
  id: string
  user_id: string | null
  lead_id: string | null
  title: string
  description: string | null
  start_time: string
  end_time: string
  is_all_day: boolean
  event_type: CRMEventType
  location: string | null
  meeting_link: string | null
  created_at: string
  lead?: CRMLead
}

type ViewMode = "month" | "week"

export default function CalendarTab() {
  const supabase = createClient()
  const [events, setEvents] = useState<CRMEvent[]>([])
  const [leads, setLeads] = useState<CRMLead[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CRMEvent | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CRMEvent | null>(null)

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel("crm-calendar-events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crm_events" },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchData = async () => {
    const [eventsRes, leadsRes] = await Promise.all([
      supabase.from("crm_events").select("*").order("start_time", { ascending: true }),
      supabase.from("crm_leads").select("id, company_name, contact_name"),
    ])

    if (eventsRes.data) {
      setEvents(eventsRes.data)
    }
    if (leadsRes.data) {
      setLeads(leadsRes.data as CRMLead[])
    }
    setLoading(false)
  }

  const handlePrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1))
    } else {
      setCurrentDate(subWeeks(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1))
    } else {
      setCurrentDate(addWeeks(currentDate, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setEditingEvent(null)
    setShowEventModal(true)
  }

  const handleEventClick = (event: CRMEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEvent(event)
  }

  const handleEditEvent = () => {
    if (selectedEvent) {
      setEditingEvent(selectedEvent)
      setSelectedDate(parseISO(selectedEvent.start_time))
      setShowEventModal(true)
      setSelectedEvent(null)
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return
    if (!confirm("Are you sure you want to delete this event?")) return

    await supabase.from("crm_events").delete().eq("id", selectedEvent.id)
    setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id))
    setSelectedEvent(null)
  }

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = parseISO(event.start_time)
      return isSameDay(eventDate, date)
    })
  }

  // Generate calendar days for month view
  const generateMonthDays = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days: Date[] = []
    let day = startDate

    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }

  // Generate days for week view
  const generateWeekDays = () => {
    const weekStart = startOfWeek(currentDate)
    const days: Date[] = []

    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i))
    }

    return days
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
      </div>
    )
  }

  const days = viewMode === "month" ? generateMonthDays() : generateWeekDays()

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">
            {format(currentDate, viewMode === "month" ? "MMMM yyyy" : "'Week of' MMM d, yyyy")}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevious}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-white/5 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === "month" ? "bg-[#375DEE] text-white" : "text-white/60 hover:text-white"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === "week" ? "bg-[#375DEE] text-white" : "text-white/60 hover:text-white"
              }`}
            >
              Week
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedDate(new Date())
              setEditingEvent(null)
              setShowEventModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] text-white font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-white/10">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-white/50"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className={`grid grid-cols-7 ${viewMode === "week" ? "min-h-[500px]" : ""}`}>
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day)
            const isCurrentMonth = viewMode === "month" ? isSameMonth(day, currentDate) : true
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`min-h-[100px] ${viewMode === "week" ? "min-h-[500px]" : ""} p-2 border-b border-r border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                  !isCurrentMonth ? "bg-white/[0.01]" : ""
                } ${isSelected ? "bg-[#375DEE]/10" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday(day)
                        ? "bg-[#375DEE] text-white"
                        : isCurrentMonth
                        ? "text-white"
                        : "text-white/30"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, viewMode === "week" ? 10 : 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => handleEventClick(event, e)}
                      className={`px-2 py-1 rounded text-xs truncate cursor-pointer hover:opacity-80 transition-opacity ${getEventTypeColor(event.event_type)} text-white`}
                    >
                      {format(parseISO(event.start_time), "h:mm a")} - {event.title}
                    </div>
                  ))}
                  {dayEvents.length > (viewMode === "week" ? 10 : 3) && (
                    <div className="text-xs text-white/40 px-2">
                      +{dayEvents.length - (viewMode === "week" ? 10 : 3)} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Event Type Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {eventTypeOptions.map((type) => (
          <div key={type.value} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${type.color}`} />
            <span className="text-xs text-white/60">{type.label}</span>
          </div>
        ))}
      </div>

      {/* Event Detail Popup */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvent(null)}>
          <div
            className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-4 ${getEventTypeColor(selectedEvent.event_type)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/80 capitalize">
                  {selectedEvent.event_type.replace("_", " ")}
                </span>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-bold mt-2">{selectedEvent.title}</h3>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 text-white/70">
                <Clock className="w-4 h-4" />
                <span>
                  {format(parseISO(selectedEvent.start_time), "EEEE, MMMM d, yyyy")}
                  <br />
                  {format(parseISO(selectedEvent.start_time), "h:mm a")} -{" "}
                  {format(parseISO(selectedEvent.end_time), "h:mm a")}
                </span>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-3 text-white/70">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.meeting_link && (
                <div className="flex items-center gap-3">
                  <Video className="w-4 h-4 text-white/70" />
                  <a
                    href={selectedEvent.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#375DEE] hover:underline"
                  >
                    Join Meeting
                  </a>
                </div>
              )}

              {selectedEvent.description && (
                <p className="text-white/60 text-sm">{selectedEvent.description}</p>
              )}

              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={handleEditEvent}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteEvent}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Event Modal */}
      {showEventModal && (
        <EventFormModal
          date={selectedDate || new Date()}
          event={editingEvent}
          leads={leads}
          onClose={() => {
            setShowEventModal(false)
            setEditingEvent(null)
            setSelectedDate(null)
          }}
          onSave={() => {
            fetchData()
            setShowEventModal(false)
            setEditingEvent(null)
            setSelectedDate(null)
          }}
        />
      )}
    </div>
  )
}

// Event Form Modal Component
function EventFormModal({
  date,
  event,
  leads,
  onClose,
  onSave,
}: {
  date: Date
  event: CRMEvent | null
  leads: CRMLead[]
  onClose: () => void
  onSave: () => void
}) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: event?.title || "",
    description: event?.description || "",
    event_type: event?.event_type || "meeting" as CRMEventType,
    lead_id: event?.lead_id || "",
    start_date: format(event ? parseISO(event.start_time) : date, "yyyy-MM-dd"),
    start_time: format(event ? parseISO(event.start_time) : new Date(), "HH:mm"),
    end_time: format(event ? parseISO(event.end_time) : addDays(new Date(), 0), "HH:mm"),
    location: event?.location || "",
    meeting_link: event?.meeting_link || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`)
    const endDateTime = new Date(`${formData.start_date}T${formData.end_time}`)

    const eventData = {
      user_id: user?.id,
      title: formData.title,
      description: formData.description || null,
      event_type: formData.event_type,
      lead_id: formData.lead_id || null,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      location: formData.location || null,
      meeting_link: formData.meeting_link || null,
      is_all_day: false,
    }

    if (event) {
      await supabase.from("crm_events").update(eventData).eq("id", event.id)
    } else {
      await supabase.from("crm_events").insert(eventData)
    }

    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold">
            {event ? "Edit Event" : "New Event"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Event Title *</label>
            <input
              type="text"
              required
              placeholder="Demo with Miami Exotics"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Event Type</label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value as CRMEventType })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
              >
                {eventTypeOptions.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Related Lead</label>
              <select
                value={formData.lead_id}
                onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
              >
                <option value="">None</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.company_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Date</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Start Time</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">End Time</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Location</label>
            <input
              type="text"
              placeholder="Office, Zoom, etc."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Meeting Link</label>
            <input
              type="url"
              placeholder="https://zoom.us/j/..."
              value={formData.meeting_link}
              onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Description</label>
            <textarea
              placeholder="Notes about this event..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors resize-none"
            />
          </div>
        </form>

        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.title}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 font-semibold transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>{event ? "Save Changes" : "Create Event"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
