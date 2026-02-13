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
  Loader2,
  Instagram,
  Clock,
  Tag,
  Send,
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
  const notesEndRef = useRef<HTMLDivElement>(null)

  // New note form
  const [newNote, setNewNote] = useState("")
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

  // Scroll to bottom when notes load or new note added
  useEffect(() => {
    if (notesEndRef.current) {
      notesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [notes])

  const fetchNotes = async () => {
    setLoadingNotes(true)
    const { data, error } = await supabase
      .from("crm_notes")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: true }) // Oldest first for chat style

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

  const handleStatusChangeWithNote = async (newStatus: CRMLeadStatus) => {
    if (newStatus === lead.status) {
      setShowStatusDropdown(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from("crm_notes").insert({
      lead_id: lead.id,
      user_id: user?.id,
      content: `Status changed to ${getStatusLabel(newStatus)}`,
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

  // Get Instagram from custom_fields
  const instagram = lead.custom_fields?.instagram || lead.custom_fields?.Instagram || null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#375DEE]" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{lead.company_name}</h2>
              <p className="text-sm text-white/50">{lead.contact_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
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
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(lead.id)}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors"
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

        {/* Two Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Lead Info Card */}
          <div className="w-80 flex-shrink-0 border-r border-white/10 overflow-y-auto p-5">
            <div className="space-y-4">
              {/* Contact Section */}
              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-white/40 mb-3">Contact</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-white/30" />
                    <div>
                      <p className="text-sm font-medium">{lead.contact_name}</p>
                      {lead.contact_title && (
                        <p className="text-xs text-white/40">{lead.contact_title}</p>
                      )}
                    </div>
                  </div>

                  {lead.contact_email && (
                    <a
                      href={`mailto:${lead.contact_email}`}
                      className="flex items-center gap-2.5 text-sm text-white/70 hover:text-[#375DEE] transition-colors"
                    >
                      <Mail className="w-4 h-4 text-white/30" />
                      <span className="truncate">{lead.contact_email}</span>
                    </a>
                  )}

                  {lead.contact_phone && (
                    <a
                      href={`tel:${lead.contact_phone}`}
                      className="flex items-center gap-2.5 text-sm text-white/70 hover:text-white transition-colors"
                    >
                      <Phone className="w-4 h-4 text-white/30" />
                      <span>{lead.contact_phone}</span>
                    </a>
                  )}

                  {lead.website && (
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-white/70 hover:text-[#375DEE] transition-colors"
                    >
                      <Globe className="w-4 h-4 text-white/30" />
                      <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}

                  {instagram && (
                    <a
                      href={`https://instagram.com/${instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-white/70 hover:text-[#375DEE] transition-colors"
                    >
                      <Instagram className="w-4 h-4 text-white/30" />
                      <span>@{instagram.replace(/^@/, '')}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/[0.06]" />

              {/* Company Section */}
              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-white/40 mb-3">Company</h3>
                <div className="space-y-2.5">
                  {lead.location && (
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-white/30" />
                      <span className="text-sm text-white/70">{lead.location}</span>
                    </div>
                  )}

                  {lead.fleet_size && (
                    <div className="flex items-center gap-2.5">
                      <Car className="w-4 h-4 text-white/30" />
                      <span className="text-sm text-white/70">{lead.fleet_size} vehicles</span>
                    </div>
                  )}

                  {lead.source && (
                    <div className="flex items-center gap-2.5">
                      <Tag className="w-4 h-4 text-white/30" />
                      <span className="text-sm text-white/70">{lead.source}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/[0.06]" />

              {/* Deal Section */}
              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-white/40 mb-3">Deal</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4 text-white/30" />
                    <span className="text-sm font-medium text-[#375DEE]">{formatCurrency(lead.estimated_value)}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-white/30" />
                    <div>
                      <p className="text-xs text-white/40">Last contacted</p>
                      <p className="text-sm text-white/70">
                        {lead.last_contacted_at
                          ? format(new Date(lead.last_contacted_at), "MMM d, yyyy")
                          : "Never"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-white/30" />
                    <div>
                      <p className="text-xs text-white/40">Follow up</p>
                      <p className="text-sm text-white/70">
                        {lead.next_follow_up
                          ? format(new Date(lead.next_follow_up), "MMM d, yyyy")
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="pt-2 border-t border-white/[0.06]">
                <p className="text-[10px] text-white/30">
                  Created {format(new Date(lead.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Notes (Chat Style) */}
          <div className="flex-1 flex flex-col bg-[#050505]">
            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-5">
              {loadingNotes ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-[#375DEE]" />
                </div>
              ) : notes.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white/30 text-sm">No notes yet. Start the conversation below.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="flex justify-end">
                      <div
                        className={`max-w-[85%] ${
                          note.note_type === "status_change"
                            ? "bg-[#375DEE]/10 border border-[#375DEE]/20"
                            : "bg-[#375DEE]"
                        } rounded-2xl rounded-br-md px-4 py-2.5`}
                      >
                        <p className={`text-sm ${note.note_type === "status_change" ? "text-white/70 italic" : "text-white"}`}>
                          {note.content}
                        </p>
                        <p className={`text-[10px] mt-1 ${note.note_type === "status_change" ? "text-white/30" : "text-white/50"}`}>
                          {format(new Date(note.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={notesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-end gap-3">
                <textarea
                  value={newNote}
                  onChange={(e) => {
                    setNewNote(e.target.value)
                    // Auto-resize
                    e.target.style.height = "auto"
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleAddNote()
                    }
                  }}
                  placeholder="Type a note..."
                  rows={1}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 resize-none"
                  style={{ minHeight: "48px", maxHeight: "120px" }}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addingNote}
                  className="w-12 h-12 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 disabled:hover:bg-[#375DEE] text-white rounded-full transition-colors flex items-center justify-center flex-shrink-0"
                >
                  {addingNote ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
