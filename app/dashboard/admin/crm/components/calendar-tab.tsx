"use client"

import { Calendar } from "lucide-react"

export default function CalendarTab() {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
      <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">Calendar View</h3>
      <p className="text-white/50 max-w-md mx-auto">
        Schedule and manage meetings, demos, and follow-ups with Google Calendar integration.
        Coming in Phase 3.
      </p>
    </div>
  )
}
