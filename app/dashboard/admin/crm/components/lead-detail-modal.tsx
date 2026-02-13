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
  Send as SendIcon,
  Users,
  RefreshCw,
  Loader2,
  Instagram,
  Clock,
  Tag,
  ExternalLink,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { type CRMLeadStatus, type CRMNoteType } from "../lib/crm-status"
import { useCRMStatuses } from "../hooks/use-crm-statuses"
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
  const { statusOptions, getStatusColor, getStatusLabel } = useCRMStatuses()
  const [notes, setNotes] = useState<Note[]>([])
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  // New note form
  const [newNote, setNewNote] = useState("")
  const [addingNote, setAddingNote] = useState(false)

  // Schedule modal
  const [showScheduleMenu, setShowScheduleMenu] = useState(false)
  const scheduleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotes()
  }, [lead.id])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false)
      }
      if (scheduleRef.current && !scheduleRef.current.contains(e.target as Node)) {
        setShowScheduleMenu(false)
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
      note_type: "note",
    })

    if (!error) {
      setNewNote("")
      fetchNotes()
    }

    setAddingNote(false)
  }

  const handleAddActivityNote = async (type: CRMNoteType, content: string) => {
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from("crm_notes").insert({
      lead_id: lead.id,
      user_id: user?.id,
      content,
      note_type: type,
    })

    fetchNotes()
    setShowScheduleMenu(false)
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
        return <PhoneCall className="w-3.5 h-3.5" />
      case "email":
        return <SendIcon className="w-3.5 h-3.5" />
      case "meeting":
        return <Users className="w-3.5 h-3.5" />
      case "status_change":
        return <RefreshCw className="w-3.5 h-3.5" />
      default:
        return <FileText className="w-3.5 h-3.5" />
    }
  }

  // Get Instagram from custom_fields
  const instagram = lead.custom_fields?.instagram || lead.custom_fields?.Instagram || null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#375DEE]" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{lead.company_name}</h2>
              <p className="text-sm text-white/50">{lead.contact_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Status Dropdown */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${getStatusColor(lead.status)}`}
              >
                {getStatusLabel(lead.status)}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl z-10 overflow-hidden">
                  {statusOptions.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusChangeWithNote(status.value as CRMLeadStatus)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2 ${
                        lead.status === status.value ? "bg-white/5" : ""
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${status.bgColor}`} />
                      {status.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onEdit(lead)}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-white"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(lead.id)}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Lead Information Card - All info consolidated */}
          <div className="p-5 border-b border-white/10">
            <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
              {/* Contact & Company Info */}
              <div className="p-4 space-y-3">
                {/* Contact Row */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <User className="w-4 h-4 text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{lead.contact_name}</p>
                    {lead.contact_title && (
                      <p className="text-xs text-white/40">{lead.contact_title}</p>
                    )}
                  </div>
                </div>

                {/* Quick Actions Row */}
                <div className="flex flex-wrap gap-2">
                  {lead.contact_email && (
                    <a
                      href={`mailto:${lead.contact_email}`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/70 hover:text-white transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[150px]">{lead.contact_email}</span>
                    </a>
                  )}
                  {lead.contact_phone && (
                    <a
                      href={`tel:${lead.contact_phone}`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/70 hover:text-white transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{lead.contact_phone}</span>
                    </a>
                  )}
                  {lead.website && (
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/70 hover:text-white transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[120px]">{lead.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  )}
                  {instagram && (
                    <a
                      href={`https://instagram.com/${instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/70 hover:text-white transition-colors"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span>@{instagram.replace(/^@/, '')}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/[0.06]" />

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.03]">
                {/* Location */}
                <div className="bg-[#0a0a0a] p-3">
                  <div className="flex items-center gap-1.5 text-white/40 mb-1">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-wide">Location</span>
                  </div>
                  <p className="text-sm font-medium truncate">{lead.location || "-"}</p>
                </div>

                {/* Fleet Size */}
                <div className="bg-[#0a0a0a] p-3">
                  <div className="flex items-center gap-1.5 text-white/40 mb-1">
                    <Car className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-wide">Fleet</span>
                  </div>
                  <p className="text-sm font-medium">{lead.fleet_size ? `${lead.fleet_size} vehicles` : "-"}</p>
                </div>

                {/* Value */}
                <div className="bg-[#0a0a0a] p-3">
                  <div className="flex items-center gap-1.5 text-white/40 mb-1">
                    <DollarSign className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-wide">Value</span>
                  </div>
                  <p className="text-sm font-medium text-[#375DEE]">{formatCurrency(lead.estimated_value)}</p>
                </div>

                {/* Source */}
                <div className="bg-[#0a0a0a] p-3">
                  <div className="flex items-center gap-1.5 text-white/40 mb-1">
                    <Tag className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-wide">Source</span>
                  </div>
                  <p className="text-sm font-medium truncate">{lead.source || "-"}</p>
                </div>

                {/* Last Contacted */}
                <div className="bg-[#0a0a0a] p-3 col-span-2">
                  <div className="flex items-center gap-1.5 text-white/40 mb-1">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-wide">Last Contacted</span>
                  </div>
                  <p className="text-sm font-medium">
                    {lead.last_contacted_at
                      ? format(new Date(lead.last_contacted_at), "MMM d, yyyy")
                      : "-"}
                  </p>
                </div>

                {/* Next Follow-up */}
                <div className="bg-[#0a0a0a] p-3 col-span-2">
                  <div className="flex items-center gap-1.5 text-white/40 mb-1">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-wide">Follow Up</span>
                  </div>
                  <p className="text-sm font-medium">
                    {lead.next_follow_up
                      ? format(new Date(lead.next_follow_up), "MMM d, yyyy")
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white/60 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Activity
              </h3>

              {/* Schedule Button */}
              <div className="relative" ref={scheduleRef}>
                <button
                  onClick={() => setShowScheduleMenu(!showScheduleMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white/60 hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Activity</span>
                </button>
                {showScheduleMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl z-10 overflow-hidden">
                    <button
                      onClick={() => handleAddActivityNote("call", "Logged a call")}
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <PhoneCall className="w-4 h-4 text-white/40" />
                      Log Call
                    </button>
                    <button
                      onClick={() => handleAddActivityNote("email", "Sent an email")}
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <SendIcon className="w-4 h-4 text-white/40" />
                      Log Email
                    </button>
                    <button
                      onClick={() => handleAddActivityNote("meeting", "Scheduled a meeting")}
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <Users className="w-4 h-4 text-white/40" />
                      Log Meeting
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
              {loadingNotes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[#375DEE]" />
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-white/30 text-sm">No activity yet</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className={`flex items-start gap-2.5 p-3 rounded-lg ${
                      note.note_type === "status_change"
                        ? "bg-[#375DEE]/10 border border-[#375DEE]/20"
                        : "bg-white/[0.03]"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg flex-shrink-0 ${
                        note.note_type === "status_change"
                          ? "bg-[#375DEE]/20 text-[#375DEE]"
                          : "bg-white/10 text-white/40"
                      }`}
                    >
                      {getNoteIcon(note.note_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 whitespace-pre-wrap break-words">{note.content}</p>
                      <p className="text-[10px] text-white/30 mt-1.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
                        <span className="text-white/20 mx-1">•</span>
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Note Input - Chat style */}
            <div className="flex items-end gap-2 bg-white/[0.03] rounded-xl border border-white/[0.06] p-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleAddNote()
                  }
                }}
                placeholder="Add a note..."
                rows={1}
                className="flex-1 px-3 py-2 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none resize-none min-h-[40px] max-h-[100px]"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || addingNote}
                className="p-2.5 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 disabled:hover:bg-[#375DEE] text-white rounded-lg transition-colors flex-shrink-0"
              >
                {addingNote ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02]">
          <p className="text-[10px] text-white/30 text-center">
            Created {format(new Date(lead.created_at), "MMM d, yyyy")}
            {lead.updated_at !== lead.created_at && (
              <span className="text-white/20"> • Updated {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
