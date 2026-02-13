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
  User,
  Building2,
  Loader2,
  Video,
  Trash2,
  ArrowLeft,
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
  setHours,
  setMinutes,
  getHours,
  getMinutes,
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

export default function CalendarTab() {
  const supabase = createClient()
  const [events, setEvents] = useState<CRMEvent[]>([])
  const [leads, setLeads] = useState<CRMLead[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CRMEvent | null>(null)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)

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
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNext = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleBackToMonth = () => {
    setSelectedDate(null)
  }

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour)
    setEditingEvent(null)
    setShowEventModal(true)
  }

  const handleEventClick = (event: CRMEvent) => {
    setEditingEvent(event)
    setShowEventModal(true)
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    await supabase.from("crm_events").delete().eq("id", eventId)
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
  }

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = parseISO(event.start_time)
      return isSameDay(eventDate, date)
    })
  }

  // Get events for a specific hour on selected day
  const getEventsForHour = (hour: number) => {
    if (!selectedDate) return []
    return events.filter((event) => {
      const eventDate = parseISO(event.start_time)
      return isSameDay(eventDate, selectedDate) && getHours(eventDate) === hour
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
      </div>
    )
  }

  const days = generateMonthDays()

  // Day Detail View (Hour by Hour)
  if (selectedDate) {
    const dayEvents = getEventsForDay(selectedDate)
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="space-y-4">
        {/* Day View Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToMonth}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-white/70 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h2 className="text-xl font-bold">{format(selectedDate, "EEEE")}</h2>
              <p className="text-white/50">{format(selectedDate, "MMMM d, yyyy")}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedHour(9)
              setEditingEvent(null)
              setShowEventModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] text-white font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>

        {/* Hour by Hour Grid */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="divide-y divide-white/5">
            {hours.map((hour) => {
              const hourEvents = getEventsForHour(hour)
              const isCurrentHour = isToday(selectedDate) && new Date().getHours() === hour

              return (
                <div
                  key={hour}
                  onClick={() => handleHourClick(hour)}
                  className={`flex min-h-[60px] cursor-pointer hover:bg-white/5 transition-colors ${
                    isCurrentHour ? "bg-[#375DEE]/10" : ""
                  }`}
                >
                  {/* Time Label */}
                  <div className="w-20 flex-shrink-0 p-3 border-r border-white/5 text-right">
                    <span className={`text-sm ${isCurrentHour ? "text-[#375DEE] font-medium" : "text-white/40"}`}>
                      {format(setHours(new Date(), hour), "h a")}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="flex-1 p-2">
                    {hourEvents.length > 0 ? (
                      <div className="space-y-1">
                        {hourEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEventClick(event)
                            }}
                            className={`px-3 py-2 rounded-lg ${getEventTypeColor(event.event_type)} text-white text-sm cursor-pointer hover:opacity-90 transition-opacity`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{event.title}</span>
                              <span className="text-white/70 text-xs">
                                {format(parseISO(event.start_time), "h:mm a")}
                              </span>
                            </div>
                            {event.location && (
                              <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Event Modal */}
        {showEventModal && (
          <EventFormModal
            date={selectedDate}
            hour={selectedHour}
            event={editingEvent}
            leads={leads}
            onClose={() => {
              setShowEventModal(false)
              setEditingEvent(null)
              setSelectedHour(null)
            }}
            onSave={() => {
              fetchData()
              setShowEventModal(false)
              setEditingEvent(null)
              setSelectedHour(null)
            }}
            onDelete={handleDeleteEvent}
          />
        )}
      </div>
    )
  }

  // Month View (Square Days)
  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">{format(currentDate, "MMMM yyyy")}</h2>
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

        <button
          onClick={() => {
            setSelectedDate(new Date())
            setSelectedHour(9)
            setEditingEvent(null)
            setShowEventModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] text-white font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Calendar Grid - Full Width Square Days */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-white/10">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-white/50 border-r border-white/5 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days - Square Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`aspect-square p-2 border-b border-r border-white/5 cursor-pointer hover:bg-white/5 transition-colors relative ${
                  !isCurrentMonth ? "bg-white/[0.01]" : ""
                } ${isSelected ? "bg-[#375DEE]/10" : ""} ${
                  index % 7 === 6 ? "border-r-0" : ""
                }`}
              >
                {/* Date Number */}
                <div className="flex items-center justify-center mb-1">
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
                <div className="space-y-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs truncate ${getEventTypeColor(event.event_type)} text-white`}
                    >
                      <span className="hidden sm:inline">{format(parseISO(event.start_time), "h:mm")} </span>
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-white/40 px-1.5">
                      +{dayEvents.length - 3} more
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

      {/* Quick Event Modal (when adding from month view) */}
      {showEventModal && selectedDate && (
        <EventFormModal
          date={selectedDate}
          hour={selectedHour}
          event={editingEvent}
          leads={leads}
          onClose={() => {
            setShowEventModal(false)
            setEditingEvent(null)
            setSelectedHour(null)
          }}
          onSave={() => {
            fetchData()
            setShowEventModal(false)
            setEditingEvent(null)
            setSelectedHour(null)
          }}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  )
}

// Event Form Modal Component
function EventFormModal({
  date,
  hour,
  event,
  leads,
  onClose,
  onSave,
  onDelete,
}: {
  date: Date
  hour: number | null
  event: CRMEvent | null
  leads: CRMLead[]
  onClose: () => void
  onSave: () => void
  onDelete: (id: string) => void
}) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  const defaultStartTime = hour !== null ? `${hour.toString().padStart(2, "0")}:00` : "09:00"
  const defaultEndTime = hour !== null ? `${(hour + 1).toString().padStart(2, "0")}:00` : "10:00"

  const [formData, setFormData] = useState({
    title: event?.title || "",
    description: event?.description || "",
    event_type: event?.event_type || "meeting" as CRMEventType,
    lead_id: event?.lead_id || "",
    start_date: format(event ? parseISO(event.start_time) : date, "yyyy-MM-dd"),
    start_time: event ? format(parseISO(event.start_time), "HH:mm") : defaultStartTime,
    end_time: event ? format(parseISO(event.end_time), "HH:mm") : defaultEndTime,
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
          <div className="flex items-center gap-2">
            {event && (
              <button
                onClick={() => {
                  onDelete(event.id)
                  onClose()
                }}
                className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
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
