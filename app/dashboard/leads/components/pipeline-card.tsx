"use client"

import { memo, useMemo } from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { LeadStatus } from "@/lib/lead-status"
import { Phone, Car, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

interface PipelineCardProps {
  lead: Lead
  onClick?: () => void
  isDragging?: boolean
}

const sourceIcons: Record<string, string> = {
  instagram: "📱",
  facebook: "📘",
  google: "🔍",
  tiktok: "🎵",
  website: "🌐",
  referral: "👥",
  other: "📌",
}

// Memoized card to prevent re-renders during drag operations on other cards
const PipelineCard = memo(function PipelineCard({
  lead,
  onClick,
  isDragging = false,
}: PipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
  })

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined

  const initials = lead.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const timeAgo = formatDistanceToNow(new Date(lead.created_at), {
    addSuffix: true,
  })

  const sourceIcon = lead.source
    ? sourceIcons[lead.source.toLowerCase()] || sourceIcons.other
    : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`bg-white/[0.03] rounded-xl border border-white/[0.06] p-3 cursor-grab active:cursor-grabbing hover:border-white/[0.12] transition-all group ${
        isDragging ? "opacity-90 shadow-xl scale-105 rotate-2" : ""
      }`}
    >
      {/* Header - Avatar + Name */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-[#375DEE]/15 flex items-center justify-center flex-shrink-0">
          <span className="text-[#375DEE] text-xs font-semibold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm truncate group-hover:text-white transition-colors">
            {lead.name}
          </h4>
          <div className="flex items-center gap-1 text-white/50 text-xs">
            <Phone className="w-3 h-3" />
            <span className="truncate">{lead.phone}</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        {lead.vehicle_interest && (
          <div className="flex items-center gap-1.5 text-white/50 text-xs">
            <Car className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{lead.vehicle_interest}</span>
          </div>
        )}
        {lead.source && (
          <div className="flex items-center gap-1.5 text-white/50 text-xs">
            <span className="text-[10px]">{sourceIcon}</span>
            <span className="capitalize">{lead.source.replace("_", " ")}</span>
          </div>
        )}
      </div>

      {/* Footer - Time */}
      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-white/[0.04]">
        <Clock className="w-3 h-3 text-white/30" />
        <span className="text-white/30 text-[10px]">{timeAgo}</span>
      </div>
    </div>
  )
})

export default PipelineCard
