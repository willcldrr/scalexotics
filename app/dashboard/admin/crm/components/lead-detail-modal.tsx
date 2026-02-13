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
  Pencil,
  Trash2,
  ChevronDown,
  Loader2,
  Instagram,
  Clock,
  Send,
  Check,
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

  // Local lead state for optimistic updates
  const [localLead, setLocalLead] = useState(lead)

  // New note form
  const [newNote, setNewNote] = useState("")
  const [addingNote, setAddingNote] = useState(false)

  // Contact button state
  const [markingContacted, setMarkingContacted] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [lead.id])

  useEffect(() => {
    setLocalLead(lead)
  }, [lead])

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
      .order("created_at", { ascending: true })

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

  const handleMarkContacted = async () => {
    setMarkingContacted(true)
    const now = new Date().toISOString()

    // Optimistic update
    setLocalLead({ ...localLead, last_contacted_at: now })

    const { error } = await supabase
      .from("crm_leads")
      .update({ last_contacted_at: now })
      .eq("id", lead.id)

    if (error) {
      // Revert on error
      setLocalLead(lead)
    } else {
      onUpdate()
    }

    setMarkingContacted(false)
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

  // Get Instagram from custom_fields OR from notes (for legacy data)
  const instagramFromFields = localLead.custom_fields?.instagram || localLead.custom_fields?.Instagram || null

  // Check notes for Instagram handles (legacy import stored them as notes)
  const instagramNote = notes.find((note) => {
    const content = note.content?.toLowerCase() || ""
    // Check if it looks like an Instagram handle
    return (
      note.note_type === "note" &&
      (content.startsWith("@") ||
       content.includes("instagram.com/") ||
       /^[a-z0-9._]{1,30}$/.test(content.trim()))
    )
  })
  const instagramFromNotes = instagramNote?.content?.replace(/.*instagram\.com\//, "").replace(/^@/, "").trim() || null

  const instagram = instagramFromFields || instagramFromNotes

  // Filter out the Instagram note from the notes list
  const filteredNotes = instagramFromNotes
    ? notes.filter((note) => note.id !== instagramNote?.id)
    : notes

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-4xl h-[95vh] md:h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 md:px-5 py-3 md:py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#375DEE]/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 md:w-5 md:h-5 text-[#375DEE]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-bold truncate">{localLead.company_name}</h2>
              <p className="text-xs md:text-sm text-white/50 truncate">{localLead.contact_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0">
            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`px-2 md:px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-medium flex items-center gap-0.5 md:gap-1 transition-colors whitespace-nowrap ${getStatusColor(localLead.status)}`}
              >
                {getStatusLabel(localLead.status)}
                <ChevronDown className="w-3 h-3 md:w-3.5 md:h-3.5" />
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl z-10 overflow-hidden">
                  {statusOptions.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusChangeWithNote(status.value as CRMLeadStatus)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2 ${
                        localLead.status === status.value ? "bg-white/5" : ""
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

        {/* Two Column Layout - Stacked on mobile */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Side - Lead Info Card (Top on mobile) */}
          <div className="w-full md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto p-4 md:p-5 max-h-[40vh] md:max-h-none">
            {/* Mobile: Compact grid layout */}
            <div className="md:hidden">
              {/* Contact info grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {localLead.contact_email && (
                  <a
                    href={`mailto:${localLead.contact_email}`}
                    className="flex items-center gap-2 p-2.5 bg-white/5 rounded-xl text-sm text-white/70 hover:text-[#375DEE] hover:bg-white/10 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-white/40 flex-shrink-0" />
                    <span className="truncate text-xs">{localLead.contact_email}</span>
                  </a>
                )}

                {localLead.contact_phone && (
                  <a
                    href={`tel:${localLead.contact_phone}`}
                    className="flex items-center gap-2 p-2.5 bg-white/5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-white/40 flex-shrink-0" />
                    <span className="truncate text-xs">{localLead.contact_phone}</span>
                  </a>
                )}

                {localLead.website && (
                  <a
                    href={localLead.website.startsWith("http") ? localLead.website : `https://${localLead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 bg-white/5 rounded-xl text-sm text-white/70 hover:text-[#375DEE] hover:bg-white/10 transition-colors"
                  >
                    <Globe className="w-4 h-4 text-white/40 flex-shrink-0" />
                    <span className="truncate text-xs">{localLead.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}

                {instagram && (
                  <a
                    href={`https://instagram.com/${instagram.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 bg-white/5 rounded-xl text-sm text-white/70 hover:text-[#375DEE] hover:bg-white/10 transition-colors"
                  >
                    <Instagram className="w-4 h-4 text-white/40 flex-shrink-0" />
                    <span className="truncate text-xs">@{instagram.replace(/^@/, '')}</span>
                  </a>
                )}

                {localLead.location && (
                  <div className="flex items-center gap-2 p-2.5 bg-white/5 rounded-xl text-sm text-white/70 col-span-2">
                    <MapPin className="w-4 h-4 text-white/40 flex-shrink-0" />
                    <span className="text-xs">{localLead.location}</span>
                  </div>
                )}
              </div>

              {/* Last contacted row */}
              <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/40" />
                  <div>
                    <p className="text-[10px] text-white/40">Last contacted</p>
                    <p className="text-xs text-white/70">
                      {localLead.last_contacted_at
                        ? formatDistanceToNow(new Date(localLead.last_contacted_at), { addSuffix: true })
                        : "Never"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleMarkContacted}
                  disabled={markingContacted}
                  className="p-2 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 rounded-lg transition-colors"
                  title="Mark as contacted now"
                >
                  {markingContacted ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Desktop: Original vertical list layout */}
            <div className="hidden md:block space-y-3">
              {/* Contact Info */}
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-white/30" />
                <div>
                  <p className="text-sm font-medium">{localLead.contact_name}</p>
                  {localLead.contact_title && (
                    <p className="text-xs text-white/40">{localLead.contact_title}</p>
                  )}
                </div>
              </div>

              {localLead.contact_email && (
                <a
                  href={`mailto:${localLead.contact_email}`}
                  className="flex items-center gap-2.5 text-sm text-white/70 hover:text-[#375DEE] transition-colors"
                >
                  <Mail className="w-4 h-4 text-white/30" />
                  <span className="truncate">{localLead.contact_email}</span>
                </a>
              )}

              {localLead.contact_phone && (
                <a
                  href={`tel:${localLead.contact_phone}`}
                  className="flex items-center gap-2.5 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4 text-white/30" />
                  <span>{localLead.contact_phone}</span>
                </a>
              )}

              {localLead.website && (
                <a
                  href={localLead.website.startsWith("http") ? localLead.website : `https://${localLead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-white/70 hover:text-[#375DEE] transition-colors"
                >
                  <Globe className="w-4 h-4 text-white/30" />
                  <span className="truncate">{localLead.website.replace(/^https?:\/\//, '')}</span>
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

              {localLead.location && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-white/30" />
                  <span className="text-sm text-white/70">{localLead.location}</span>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-white/[0.06] my-4" />

              {/* Last Contacted with Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-white/30" />
                  <div>
                    <p className="text-xs text-white/40">Last contacted</p>
                    <p className="text-sm text-white/70">
                      {localLead.last_contacted_at
                        ? formatDistanceToNow(new Date(localLead.last_contacted_at), { addSuffix: true })
                        : "Never"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleMarkContacted}
                  disabled={markingContacted}
                  className="p-2 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 rounded-lg transition-colors"
                  title="Mark as contacted now"
                >
                  {markingContacted ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Footer info */}
              <div className="pt-3 border-t border-white/[0.06]">
                <p className="text-[10px] text-white/30">
                  Created {format(new Date(localLead.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Notes (Chat Style) - Bottom on mobile */}
          <div className="flex-1 flex flex-col bg-[#050505] min-h-0">
            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 md:p-5">
              {loadingNotes ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-[#375DEE]" />
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white/30 text-sm">No notes yet. Start the conversation below.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotes.map((note) => (
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
            <div className="p-3 md:p-4 border-t border-white/10 flex-shrink-0">
              <div className="flex items-end gap-2 md:gap-3">
                <textarea
                  value={newNote}
                  onChange={(e) => {
                    setNewNote(e.target.value)
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
