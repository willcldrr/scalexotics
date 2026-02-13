"use client"

import { memo, useCallback } from "react"
import { useDroppable } from "@dnd-kit/core"
import { LeadStatusOption, LeadStatus } from "@/lib/lead-status"
import PipelineCard from "./pipeline-card"
import { Users } from "lucide-react"

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string
  status: LeadStatus
  source: string | null
  notes: string | null
  vehicle_interest: string | null
  created_at: string
}

interface PipelineColumnProps {
  status: LeadStatusOption
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
}

// Memoized column to prevent re-renders when other columns update
const PipelineColumn = memo(function PipelineColumn({
  status,
  leads,
  onLeadClick,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.value,
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 flex flex-col bg-white/[0.02] rounded-2xl border transition-all ${
        isOver
          ? "border-[#375DEE]/50 bg-[#375DEE]/5"
          : "border-white/[0.06]"
      }`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${status.color}`}
            >
              {status.label}
            </span>
            <span className="text-white/40 text-sm">
              {leads.length}
            </span>
          </div>
        </div>
        <p className="text-white/40 text-xs mt-1.5">{status.description}</p>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px]">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-white/20" />
            </div>
            <p className="text-white/30 text-xs">No leads</p>
          </div>
        ) : (
          leads.map((lead) => (
            <PipelineCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead)}
            />
          ))
        )}
      </div>
    </div>
  )
})

export default PipelineColumn
