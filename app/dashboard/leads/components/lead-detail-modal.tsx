"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  Car,
  Calendar,
  Globe,
  StickyNote,
  Trash2,
  ChevronDown,
  ExternalLink,
} from "lucide-react"
import { leadStatusOptions, LeadStatus, getStatusColor, getStatusLabel } from "@/lib/lead-status"
import { formatDistanceToNow, format } from "date-fns"

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

interface Message {
  id: string
  content: string
  direction: "inbound" | "outbound"
  created_at: string
}

interface LeadDetailModalProps {
  lead: Lead
  onClose: () => void
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void
  onUpdate: (lead: Lead) => void
  onDelete: (leadId: string) => void
}

export default function LeadDetailModal({
  lead,
  onClose,
  onStatusChange,
  onUpdate,
  onDelete,
}: LeadDetailModalProps) {
  const supabase = createClient()
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [notes, setNotes] = useState(lead.notes || "")
  const [savingNotes, setSavingNotes] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchMessages()
  }, [lead.id])

  const fetchMessages = async () => {
    setLoadingMessages(true)
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (data) {
      setMessages(data)
    }
    setLoadingMessages(false)
  }

  const handleStatusSelect = (status: LeadStatus) => {
    onStatusChange(lead.id, status)
    setShowStatusDropdown(false)
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    const { error } = await supabase
      .from("leads")
      .update({ notes })
      .eq("id", lead.id)

    if (!error) {
      onUpdate({ ...lead, notes })
    }
    setSavingNotes(false)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lead? This cannot be undone.")) {
      return
    }

    setDeleting(true)
    const { error } = await supabase.from("leads").delete().eq("id", lead.id)

    if (!error) {
      onDelete(lead.id)
    }
    setDeleting(false)
  }

  const initials = lead.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/[0.08] w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#375DEE]/15 flex items-center justify-center">
              <span className="text-[#375DEE] text-lg font-semibold">
                {initials}
              </span>
            </div>
            <div>
              <h2
                className="text-xl font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {lead.name}
              </h2>
              <p className="text-white/50 text-sm">
                Added {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          {/* Status Selector */}
          <div>
            <label className="block text-sm text-white/50 mb-2">Status</label>
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-colors ${getStatusColor(lead.status)}`}
              >
                <span className="font-medium">{getStatusLabel(lead.status)}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} />
              </button>

              {showStatusDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl z-10">
                  {leadStatusOptions.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusSelect(status.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors ${
                        lead.status === status.value ? "bg-white/[0.04]" : ""
                      }`}
                    >
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-white/40 text-xs">{status.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <label className="block text-sm text-white/50">Contact</label>
            <div className="space-y-2">
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] rounded-xl border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#375DEE]/15 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-[#375DEE]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{lead.phone}</p>
                  <p className="text-xs text-white/40">Call</p>
                </div>
                <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/60" />
              </a>

              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] rounded-xl border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white/60" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{lead.email}</p>
                    <p className="text-xs text-white/40">Email</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/60" />
                </a>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {lead.vehicle_interest && (
              <div className="px-4 py-3 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                  <Car className="w-3 h-3" />
                  Vehicle Interest
                </div>
                <p className="text-sm font-medium truncate">{lead.vehicle_interest}</p>
              </div>
            )}

            {lead.source && (
              <div className="px-4 py-3 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                  <Globe className="w-3 h-3" />
                  Source
                </div>
                <p className="text-sm font-medium capitalize">{lead.source.replace("_", " ")}</p>
              </div>
            )}

            <div className="px-4 py-3 bg-white/[0.02] rounded-xl border border-white/[0.06]">
              <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                <Calendar className="w-3 h-3" />
                Added
              </div>
              <p className="text-sm font-medium">
                {format(new Date(lead.created_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-white/50 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this lead..."
              rows={3}
              className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 resize-none transition-colors"
            />
            {notes !== (lead.notes || "") && (
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="mt-2 px-4 py-2 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-lg text-[#375DEE] text-sm font-medium hover:bg-[#375DEE]/25 transition-all disabled:opacity-50"
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            )}
          </div>

          {/* Recent Messages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-white/50">Recent Messages</label>
              <a
                href={`/dashboard/leads?selected=${lead.id}`}
                className="text-xs text-[#375DEE] hover:underline"
              >
                View all
              </a>
            </div>
            {loadingMessages ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-white/[0.02] rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-6 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <MessageSquare className="w-6 h-6 text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.slice(0, 3).map((msg) => (
                  <div
                    key={msg.id}
                    className={`px-4 py-2.5 rounded-xl text-sm ${
                      msg.direction === "outbound"
                        ? "bg-[#375DEE]/15 text-white/80 ml-4"
                        : "bg-white/[0.04] text-white/70 mr-4"
                    }`}
                  >
                    <p className="line-clamp-2">{msg.content}</p>
                    <p className="text-[10px] text-white/30 mt-1">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/[0.06]">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2.5 text-white/50 hover:text-white/80 hover:bg-white/[0.04] rounded-xl transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Deleting..." : "Delete"}
          </button>

          <a
            href={`/dashboard/leads?selected=${lead.id}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-xl text-[#375DEE] text-sm font-medium hover:bg-[#375DEE]/25 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            Open Chat
          </a>
        </div>
      </div>
    </div>
  )
}
