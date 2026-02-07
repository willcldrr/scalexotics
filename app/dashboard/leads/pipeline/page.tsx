"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from "@dnd-kit/core"
import Link from "next/link"
import { List, Plus, RefreshCw } from "lucide-react"
import { leadStatusOptions, LeadStatus } from "@/lib/lead-status"
import PipelineColumn from "../components/pipeline-column"
import PipelineCard from "../components/pipeline-card"
import LeadDetailModal from "../components/lead-detail-modal"

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

export default function PipelinePage() {
  const supabase = createClient()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchLeads()

    // Set up real-time subscription
    const channel = supabase
      .channel("pipeline-leads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          fetchLeads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchLeads = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (data) {
      setLeads(data)
    }
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
    const newStatus = over.id as LeadStatus

    // Find the lead being dragged
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.status === newStatus) return

    // Optimistically update the UI
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    )

    // Update in database
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId)

    if (error) {
      // Revert on error
      fetchLeads()
      console.error("Failed to update lead status:", error)
    }
  }

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
  }

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    )

    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId)

    if (error) {
      fetchLeads()
    }

    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => prev ? { ...prev, status: newStatus } : null)
    }
  }

  const handleLeadUpdate = (updatedLead: Lead) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    )
    setSelectedLead(updatedLead)
  }

  const handleLeadDelete = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId))
    setSelectedLead(null)
  }

  // Group leads by status
  const leadsByStatus = leadStatusOptions.reduce((acc, status) => {
    acc[status.value] = leads.filter((lead) => lead.status === status.value)
    return acc
  }, {} as Record<LeadStatus, Lead[]>)

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null

  if (loading) {
    return (
      <div className="h-full">
        <div className="mb-6">
          <div className="h-8 w-48 bg-white/[0.05] rounded-lg animate-pulse" />
          <div className="h-5 w-64 bg-white/[0.03] rounded mt-2 animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-72 h-[500px] bg-white/[0.02] rounded-2xl border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight dashboard-heading"
           
          >
            Lead Pipeline
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Drag leads between columns to update their status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/leads"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white/70 text-sm hover:bg-white/[0.06] hover:text-white transition-all"
          >
            <List className="w-4 h-4" />
            List View
          </Link>
          <button
            onClick={() => fetchLeads()}
            className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white/70 hover:bg-white/[0.06] hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pipeline Board */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
          {leadStatusOptions.map((status) => (
            <PipelineColumn
              key={status.value}
              status={status}
              leads={leadsByStatus[status.value] || []}
              onLeadClick={handleLeadClick}
            />
          ))}
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
          onStatusChange={handleStatusChange}
          onUpdate={handleLeadUpdate}
          onDelete={handleLeadDelete}
        />
      )}
    </div>
  )
}
