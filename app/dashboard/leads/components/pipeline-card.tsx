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
      className={`bg-white/[0.03] rounded-xl border border-white/[0.06] p-3 cursor-grab active:cursor-grabbing hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-200 select-none ${
        isDragging ? "opacity-90 shadow-xl scale-105 rotate-1" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-white truncate">{lead.name}</h4>
        <span className="text-[10px] text-white/25 flex-shrink-0 ml-2">{timeAgo}</span>
      </div>
      {lead.vehicle_interest && (
        <p className="text-xs text-white/40 mt-1 truncate">{lead.vehicle_interest}</p>
      )}
    </div>
  )
})

export default PipelineCard
