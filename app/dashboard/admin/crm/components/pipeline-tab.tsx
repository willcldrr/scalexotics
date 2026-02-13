"use client"

import { useState, useEffect, memo } from "react"
import { createClient } from "@/lib/supabase/client"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from "@dnd-kit/core"
import { useDroppable, useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { RefreshCw, Building2, User, MapPin, Clock, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { type CRMLeadStatus } from "../lib/crm-status"
import { useCRMStatuses, type CRMStatusOption } from "../hooks/use-crm-statuses"
import type { CRMLead } from "./leads-tab"
import LeadDetailModal from "./lead-detail-modal"

// Pipeline Column Component - Memoized to prevent re-renders
const PipelineColumn = memo(function PipelineColumn({
  status,
  leads,
  onLeadClick,
}: {
  status: CRMStatusOption
  leads: CRMLead[]
  onLeadClick: (lead: CRMLead) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.value,
  })

  const totalValue = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0)
  const formatValue = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`

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
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${status.bgColor} ${status.color}`}>
              {status.label}
            </span>
            <span className="text-white/40 text-sm">{leads.length}</span>
          </div>
          {totalValue > 0 && (
            <span className="text-xs text-white/70 font-medium">{formatValue(totalValue)}</span>
          )}
        </div>
        <p className="text-white/40 text-xs mt-1.5">{status.description}</p>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-380px)]">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center mb-2">
              <Building2 className="w-5 h-5 text-white/20" />
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

// Pipeline Card Component - Memoized to prevent re-renders during drag operations
const PipelineCard = memo(function PipelineCard({
  lead,
  onClick,
  isDragging = false,
}: {
  lead: CRMLead
  onClick?: () => void
  isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const initials = lead.company_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const timeAgo = formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })

  const formatValue = (v: number | null) => {
    if (!v) return null
    return v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
  }

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
      {/* Header - Company + Value */}
      <div className="flex items-start gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-[#375DEE]/15 flex items-center justify-center flex-shrink-0">
          <span className="text-[#375DEE] text-xs font-semibold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm truncate group-hover:text-white transition-colors">
            {lead.company_name}
          </h4>
          <div className="flex items-center gap-1 text-white/50 text-xs">
            <User className="w-3 h-3" />
            <span className="truncate">{lead.contact_name}</span>
          </div>
        </div>
        {lead.estimated_value && (
          <span className="text-xs font-medium text-white bg-white/10 px-2 py-0.5 rounded">
            {formatValue(lead.estimated_value)}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-1">
        {lead.location && (
          <div className="flex items-center gap-1.5 text-white/40 text-xs">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{lead.location}</span>
          </div>
        )}
        {lead.fleet_size && (
          <div className="flex items-center gap-1.5 text-white/40 text-xs">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span>{lead.fleet_size} vehicles</span>
          </div>
        )}
      </div>

      {/* Footer - Time */}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/[0.04]">
        <Clock className="w-3 h-3 text-white/30" />
        <span className="text-white/30 text-[10px]">{timeAgo}</span>
      </div>
    </div>
  )
})

export default function PipelineTab() {
  const supabase = createClient()
  const { statusOptions, pipelineStatuses, getStatusLabel, lostStatuses, wonStatuses } = useCRMStatuses()
  const [leads, setLeads] = useState<CRMLead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null)

  useEffect(() => {
    fetchLeads()

    const channel = supabase
      .channel("crm-pipeline-leads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crm_leads" },
        () => fetchLeads()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchLeads = async () => {
    // Supabase has a 1000 row default limit, so we need to fetch in batches
    const batchSize = 1000
    const maxLeads = 20000
    let allLeads: CRMLead[] = []

    // First, get the total count
    const { count } = await supabase
      .from("crm_leads")
      .select("*", { count: "exact", head: true })

    const totalCount = count || 0
    const batches = Math.ceil(Math.min(totalCount, maxLeads) / batchSize)

    for (let i = 0; i < batches; i++) {
      const from = i * batchSize
      const to = from + batchSize - 1

      const { data, error } = await supabase
        .from("crm_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) {
        console.error("Failed to fetch leads batch:", error)
        break
      }

      if (data) {
        allLeads = [...allLeads, ...data]
      }
    }

    setLeads(allLeads)
    setLoading(false)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const leadId = active.id as string
    const newStatus = over.id as CRMLeadStatus

    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.status === newStatus) return

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    )

    // Update in database
    const { error } = await supabase
      .from("crm_leads")
      .update({ status: newStatus })
      .eq("id", leadId)

    if (error) {
      fetchLeads()
      console.error("Failed to update lead status:", error)
    } else {
      // Add status change note
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from("crm_notes").insert({
        lead_id: leadId,
        user_id: user?.id,
        content: `Status changed from ${getStatusLabel(lead.status)} to ${getStatusLabel(newStatus)}`,
        note_type: "status_change",
        old_status: lead.status,
        new_status: newStatus,
      })
    }
  }

  const handleLeadClick = (lead: CRMLead) => {
    setSelectedLead(lead)
  }

  const handleStatusChange = async (leadId: string, newStatus: CRMLeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    )

    await supabase
      .from("crm_leads")
      .update({ status: newStatus })
      .eq("id", leadId)

    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => prev ? { ...prev, status: newStatus } : null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return

    await supabase.from("crm_leads").delete().eq("id", id)
    setLeads((prev) => prev.filter((l) => l.id !== id))
    setSelectedLead(null)
  }

  // Group leads by status for pipeline view
  const leadsByStatus = pipelineStatuses.reduce((acc, statusValue) => {
    acc[statusValue] = leads.filter((lead) => lead.status === statusValue)
    return acc
  }, {} as Record<string, CRMLead[]>)

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null

  // Stats - use dynamic status arrays
  const closedStatuses = [...wonStatuses, ...lostStatuses]
  const totalValue = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0)
  const activeLeads = leads.filter((l) => !closedStatuses.includes(l.status))

  if (loading) {
    return (
      <div className="h-full">
        <div className="mb-6">
          <div className="h-8 w-48 bg-white/[0.05] rounded-lg animate-pulse" />
          <div className="h-5 w-64 bg-white/[0.03] rounded mt-2 animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-72 h-[400px] bg-white/[0.02] rounded-2xl border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header Stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-white/40 text-xs">Active Leads</p>
            <p className="text-xl font-bold">{activeLeads.length}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs">Pipeline Value</p>
            <p className="text-xl font-bold text-white">
              ${(totalValue / 1000).toFixed(0)}k
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchLeads()}
          className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white/70 hover:bg-white/[0.06] hover:text-white transition-all"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Pipeline Board */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
          {pipelineStatuses.map((statusValue) => {
            const status = statusOptions.find((s) => s.value === statusValue)
            if (!status) return null
            return (
              <PipelineColumn
                key={status.value}
                status={status as CRMStatusOption}
                leads={leadsByStatus[statusValue] || []}
                onLeadClick={handleLeadClick}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeLead ? (
            <PipelineCard lead={activeLead} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onEdit={() => {}}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onUpdate={fetchLeads}
        />
      )}
    </div>
  )
}
