"use client"

import { Kanban } from "lucide-react"

export default function PipelineTab() {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
      <Kanban className="w-16 h-16 text-white/20 mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">Pipeline View</h3>
      <p className="text-white/50 max-w-md mx-auto">
        Drag-and-drop Kanban board for managing leads through your sales pipeline.
        Coming in Phase 2.
      </p>
    </div>
  )
}
