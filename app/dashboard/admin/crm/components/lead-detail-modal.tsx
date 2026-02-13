"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  DollarSign,
  Car,
  Calendar,
  Pencil,
  Trash2,
  ChevronDown,
  Plus,
  FileText,
  PhoneCall,
  Send,
  Users,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { crmStatusOptions, getStatusColor, getStatusLabel, noteTypeOptions, type CRMLeadStatus, type CRMNoteType } from "../lib/crm-status"
import type { CRMLead } from "./leads-tab"

interface Note {
  id: string
  lead_id: string
  user_id: string | null
  content: string
  note_type: CRMNoteType
  old_status: string | null
  new_status: string | null
  created_at: string
}

interface LeadDetailModalProps {
  lead: CRMLead
  onClose: () => void
  onEdit: (lead: CRMLead) => void
  onStatusChange: (leadId: string, status: CRMLeadStatus) => void
  onDelete: (id: string) => void
  onUpdate: () => void
}

export default function LeadDetailModal({
  lead,
  onClose,
  onEdit,
  onStatusChange,
  onDelete,
  onUpdate,
}: LeadDetailModalProps) {
  const supabase = createClient()
  const [notes, setNotes] = useState<Note[]>([])
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  // New note form
  const [newNote, setNewNote] = useState("")
  const [noteType, setNoteType] = useState<CRMNoteType>("note")
  const [addingNote, setAddingNote] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [lead.id])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchNotes = async () => {
    setLoadingNotes(true)
    const { data, error } = await supabase
      .from("crm_notes")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false })

    if (!error) {
      setNotes(data || [])
    }
    setLoadingNotes(false)
  }

  const handleAddNote = async () => {
    if (!newNote.trim() || addingNote) return

    setAddingNote(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from("crm_notes").insert({
      lead_id: lead.id,
      user_id: user?.id,
      content: newNote.trim(),
      note_type: noteType,
    })

    if (!error) {
      setNewNote("")
      setNoteType("note")
      fetchNotes()
    }

    setAddingNote(false)
  }

  const handleStatusChangeWithNote = async (newStatus: CRMLeadStatus) => {
    if (newStatus === lead.status) {
      setShowStatusDropdown(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    // Add status change note
    await supabase.from("crm_notes").insert({
      lead_id: lead.id,
      user_id: user?.id,
      content: `Status changed from ${getStatusLabel(lead.status)} to ${getStatusLabel(newStatus)}`,
      note_type: "status_change",
      old_status: lead.status,
      new_status: newStatus,
    })

    onStatusChange(lead.id, newStatus)
    setShowStatusDropdown(false)
    fetchNotes()
    onUpdate()
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "-"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getNoteIcon = (type: CRMNoteType) => {
    switch (type) {
      case "call":
        return <PhoneCall className="w-4 h-4" />
      case "email":
        return <Send className="w-4 h-4" />
      case "meeting":
        return <Users className="w-4 h-4" />
      case "status_change":
        return <RefreshCw className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#375DEE]" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{lead.company_name}</h2>
              {lead.location && (
                <p className="text-sm text-white/50 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {lead.location}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Dropdown */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${getStatusColor(lead.status)}`}
              >
                {getStatusLabel(lead.status)}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl z-10 overflow-hidden">
                  {crmStatusOptions.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusChangeWithNote(status.value)}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2 ${
                        lead.status === status.value ? "bg-white/5" : ""
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${status.bgColor}`} />
                      {status.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onEdit(lead)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-white"
              title="Edit lead"
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(lead.id)}
              className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              title="Delete lead"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Left Column - Details */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <h3 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-white/40">Name</p>
                    <p className="text-white font-medium">{lead.contact_name}</p>
                    {lead.contact_title && (
                      <p className="text-sm text-white/50">{lead.contact_title}</p>
                    )}
                  </div>
                  {lead.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-white/30" />
                      <a
                        href={`mailto:${lead.contact_email}`}
                        className="text-[#375DEE] hover:underline text-sm"
                      >
                        {lead.contact_email}
                      </a>
                    </div>
                  )}
                  {lead.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-white/30" />
                      <a
                        href={`tel:${lead.contact_phone}`}
                        className="text-white/80 hover:text-white text-sm"
                      >
                        {lead.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Info */}
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <h3 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Company Details
                </h3>
                <div className="space-y-3">
                  {lead.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-white/30" />
                      <a
                        href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#375DEE] hover:underline text-sm"
                      >
                        {lead.website}
                      </a>
                    </div>
                  )}
                  {lead.fleet_size && (
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-white/30" />
                      <span className="text-white/80 text-sm">{lead.fleet_size} vehicles</span>
                    </div>
                  )}
                  {lead.source && (
                    <div>
                      <p className="text-xs text-white/40">Source</p>
                      <p className="text-white/80 text-sm">{lead.source}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Deal Info */}
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <h3 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Deal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-white/40">Estimated Value</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(lead.estimated_value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Lead Score</p>
                    <p className="text-lg font-bold">{lead.lead_score}/100</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Last Contacted</p>
                    <p className="text-sm text-white/80">
                      {lead.last_contacted_at
                        ? format(new Date(lead.last_contacted_at), "MMM d, yyyy")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Next Follow-up</p>
                    <p className="text-sm text-white/80">
                      {lead.next_follow_up
                        ? format(new Date(lead.next_follow_up), "MMM d, yyyy")
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Notes */}
            <div className="flex flex-col h-full min-h-[400px]">
              <div className="bg-white/5 rounded-xl border border-white/10 flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white/60 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Activity & Notes
                  </h3>
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingNotes ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 animate-spin text-[#375DEE]" />
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-10 h-10 text-white/20 mx-auto mb-2" />
                      <p className="text-white/40 text-sm">No notes yet</p>
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className={`p-3 rounded-lg ${
                          note.note_type === "status_change"
                            ? "bg-[#375DEE]/10 border border-[#375DEE]/20"
                            : "bg-white/5"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              note.note_type === "status_change"
                                ? "bg-[#375DEE]/20 text-[#375DEE]"
                                : "bg-white/10 text-white/50"
                            }`}
                          >
                            {getNoteIcon(note.note_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/80 whitespace-pre-wrap">{note.content}</p>
                            <p className="text-xs text-white/30 mt-1">
                              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Note Form */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex gap-2 mb-2">
                    {(["note", "call", "email", "meeting"] as CRMNoteType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setNoteType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                          noteType === type
                            ? "bg-[#375DEE] text-white"
                            : "bg-white/5 text-white/50 hover:text-white"
                        }`}
                      >
                        {getNoteIcon(type)}
                        {noteTypeOptions.find((o) => o.value === type)?.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note..."
                      rows={2}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 resize-none"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || addingNote}
                      className="px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {addingNote ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02]">
          <p className="text-xs text-white/30 text-center">
            Created {format(new Date(lead.created_at), "MMMM d, yyyy 'at' h:mm a")}
            {lead.updated_at !== lead.created_at && (
              <> &middot; Last updated {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}</>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
