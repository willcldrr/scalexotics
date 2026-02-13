"use client"

import { Settings2 } from "lucide-react"

export default function SettingsTab() {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
      <Settings2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">CRM Settings</h3>
      <p className="text-white/50 max-w-md mx-auto">
        Connect Google Calendar and Zoom for meeting scheduling and calendar sync.
        Coming in Phase 4.
      </p>
    </div>
  )
}
