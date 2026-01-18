"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Search,
  Phone,
  Mail,
  X,
  MessageSquare,
  Send,
  ChevronLeft,
  Pencil,
  Trash2,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Check,
  CheckCheck,
  Loader2,
  Calendar,
  Car,
  StickyNote,
  ChevronDown,
} from "lucide-react"
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns"
import { leadStatusOptions, getStatusColor, getStatusLabel, defaultLeadStatus } from "@/lib/lead-status"

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string
  status: string
  source: string | null
  notes: string | null
  vehicle_interest: string | null
  created_at: string
  last_message?: string
  last_message_time?: string
  last_message_direction?: "inbound" | "outbound"
  unread: boolean
}

interface Message {
  id: string
  lead_id: string
  content: string
  direction: "inbound" | "outbound"
  created_at: string
}

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
}

// Using centralized lead status config from @/lib/lead-status

const sourceOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google Ads" },
  { value: "tiktok", label: "TikTok" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "lead_capture", label: "Lead Capture" },
  { value: "sms", label: "SMS" },
  { value: "phone", label: "Phone" },
  { value: "other", label: "Other" },
]

export default function LeadsPage() {
  const supabase = createClient()
  const [leads, setLeads] = useState<Lead[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [readConversations, setReadConversations] = useState<Set<string>>(new Set())
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showDetailsPanel, setShowDetailsPanel] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: defaultLeadStatus as string,
    source: "website",
    notes: "",
    vehicle_interest: "",
  })

  // CSV Import state
  const [showImportModal, setShowImportModal] = useState(false)
  const [csvData, setCsvData] = useState<Array<Record<string, string>>>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
    // Load read conversations from localStorage
    const stored = localStorage.getItem("readConversations")
    if (stored) {
      setReadConversations(new Set(JSON.parse(stored)))
    }

    // Set up real-time subscription for leads
    const channel = supabase
      .channel("leads-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const newLead = payload.new as Lead
          setLeads((current) => [{ ...newLead, unread: true }, ...current])
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload) => {
          setLeads((current) =>
            current.map((lead) =>
              lead.id === payload.new.id ? { ...lead, ...payload.new } : lead
            )
          )
          setSelectedLead((current) =>
            current?.id === payload.new.id ? { ...current, ...payload.new } : current
          )
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "leads" },
        (payload) => {
          setLeads((current) => current.filter((lead) => lead.id !== payload.old.id))
          setSelectedLead((current) =>
            current?.id === payload.old.id ? null : current
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (selectedLead) {
      fetchMessages(selectedLead.id)
      markAsRead(selectedLead.id)
    }
  }, [selectedLead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAsRead = (leadId: string) => {
    setReadConversations(prev => {
      const newSet = new Set(prev)
      newSet.add(leadId)
      localStorage.setItem("readConversations", JSON.stringify([...newSet]))
      return newSet
    })
    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, unread: false } : l
    ))
  }

  const fetchData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    setUserId(user.id)

    const [leadsRes, vehiclesRes] = await Promise.all([
      supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("vehicles").select("id, name, make, model").eq("user_id", user.id),
    ])

    if (leadsRes.data) {
      const storedRead = localStorage.getItem("readConversations")
      const readSet = storedRead ? new Set(JSON.parse(storedRead)) : new Set()

      // Fetch last message for each lead
      const leadsWithMessages = await Promise.all(
        leadsRes.data.map(async (lead) => {
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at, direction")
            .eq("lead_id", lead.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          const isUnread = lastMsg?.direction === "inbound" && !readSet.has(lead.id)

          return {
            ...lead,
            last_message: lastMsg?.content,
            last_message_time: lastMsg?.created_at,
            last_message_direction: lastMsg?.direction,
            unread: isUnread,
          }
        })
      )

      // Sort by last message time (most recent first)
      leadsWithMessages.sort((a, b) => {
        const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : new Date(a.created_at).getTime()
        const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : new Date(b.created_at).getTime()
        return timeB - timeA
      })

      setLeads(leadsWithMessages)
    }

    setVehicles(vehiclesRes.data || [])
    setLoading(false)
  }

  const fetchMessages = async (leadId: string) => {
    setMessagesLoading(true)
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true })

    setMessages(data || [])
    setMessagesLoading(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || sending) return

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: savedMessage, error: saveError } = await supabase
        .from("messages")
        .insert({
          user_id: user.id,
          lead_id: selectedLead.id,
          content: newMessage,
          direction: "outbound",
        })
        .select()
        .single()

      if (saveError) throw saveError

      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedLead.phone,
          message: newMessage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send SMS")
      }

      if (savedMessage) {
        setMessages([...messages, savedMessage])
      }

      setNewMessage("")

      setLeads(leads.map(l =>
        l.id === selectedLead.id
          ? { ...l, last_message: newMessage, last_message_time: new Date().toISOString(), last_message_direction: "outbound" }
          : l
      ))

    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message. Please try again.")
    }

    setSending(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)

    const leadData = {
      user_id: userId,
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone,
      status: formData.status,
      source: formData.source,
      notes: formData.notes || null,
      vehicle_interest: formData.vehicle_interest || null,
    }

    if (editingLead) {
      await supabase.from("leads").update(leadData).eq("id", editingLead.id)
    } else {
      await supabase.from("leads").insert(leadData)
    }

    setSaving(false)
    setShowAddModal(false)
    setEditingLead(null)
    resetForm()
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return
    await supabase.from("leads").delete().eq("id", id)
    if (selectedLead?.id === id) {
      setSelectedLead(null)
    }
    fetchData()
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from("leads").update({ status: newStatus }).eq("id", id)
    setLeads(leads.map((l) => (l.id === id ? { ...l, status: newStatus } : l)))
    if (selectedLead?.id === id) {
      setSelectedLead({ ...selectedLead, status: newStatus })
    }
    setShowStatusDropdown(false)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      status: defaultLeadStatus,
      source: "website",
      notes: "",
      vehicle_interest: "",
    })
  }

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead)
    setFormData({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone,
      status: lead.status,
      source: lead.source || "website",
      notes: lead.notes || "",
      vehicle_interest: lead.vehicle_interest || "",
    })
    setShowAddModal(true)
  }

  // CSV Import functions
  const parseCSV = (text: string): { headers: string[]; data: Array<Record<string, string>> } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    if (lines.length === 0) return { headers: [], data: [] }

    const headers = parseCSVLine(lines[0])
    const data = lines.slice(1).map(line => {
      const values = parseCSVLine(line)
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      return row
    }).filter(row => Object.values(row).some(v => v.trim()))

    return { headers, data }
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const { headers, data } = parseCSV(text)
      setCsvHeaders(headers)
      setCsvData(data)
      setImportResult(null)

      const autoMapping: Record<string, string> = {}
      const nameVariants = ["name", "full name", "fullname", "customer name", "contact name", "first name"]
      const emailVariants = ["email", "e-mail", "email address", "mail"]
      const phoneVariants = ["phone", "phone number", "telephone", "tel", "mobile", "cell"]
      const notesVariants = ["notes", "note", "comments", "comment", "description"]

      headers.forEach(header => {
        const lowerHeader = header.toLowerCase()
        if (nameVariants.some(v => lowerHeader.includes(v))) autoMapping[header] = "name"
        else if (emailVariants.some(v => lowerHeader.includes(v))) autoMapping[header] = "email"
        else if (phoneVariants.some(v => lowerHeader.includes(v))) autoMapping[header] = "phone"
        else if (notesVariants.some(v => lowerHeader.includes(v))) autoMapping[header] = "notes"
      })

      setColumnMapping(autoMapping)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!userId || csvData.length === 0) return
    setImporting(true)

    let success = 0
    let failed = 0

    const nameCol = Object.entries(columnMapping).find(([_, v]) => v === "name")?.[0]
    const emailCol = Object.entries(columnMapping).find(([_, v]) => v === "email")?.[0]
    const phoneCol = Object.entries(columnMapping).find(([_, v]) => v === "phone")?.[0]
    const notesCol = Object.entries(columnMapping).find(([_, v]) => v === "notes")?.[0]

    if (!nameCol || !phoneCol) {
      alert("Please map at least Name and Phone columns")
      setImporting(false)
      return
    }

    for (const row of csvData) {
      const name = row[nameCol]?.trim()
      const phone = row[phoneCol]?.trim()
      const email = emailCol ? row[emailCol]?.trim() : null
      const notes = notesCol ? row[notesCol]?.trim() : null

      if (!name || !phone) {
        failed++
        continue
      }

      const { error } = await supabase.from("leads").insert({
        user_id: userId,
        name,
        phone,
        email: email || null,
        notes: notes || null,
        status: defaultLeadStatus,
        source: "csv_import",
      })

      if (error) {
        failed++
      } else {
        success++
      }
    }

    setImportResult({ success, failed })
    setImporting(false)

    if (success > 0) {
      fetchData()
    }
  }

  const resetImportModal = () => {
    setCsvData([])
    setCsvHeaders([])
    setColumnMapping({})
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search) ||
      lead.email?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) {
      return format(date, "h:mm a")
    } else if (isYesterday(date)) {
      return "Yesterday"
    } else {
      return format(date, "MMM d")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "MMM d, yyyy")
  }

  const unreadCount = leads.filter(l => l.unread).length

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Leads
          </h1>
          <p className="text-white/50 mt-1">Loading your CRM...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Leads
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-[#375DEE] text-white text-xs font-semibold rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-white/50 mt-1">{leads.length} lead{leads.length !== 1 ? "s" : ""} from your campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetImportModal()
              setShowImportModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium rounded-xl transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={() => {
              resetForm()
              setEditingLead(null)
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#375DEE] hover:bg-[#4169E1] text-white font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
        <div className="flex h-full">
          {/* Leads List */}
          <div className={`w-full md:w-[380px] border-r border-white/[0.06] flex flex-col bg-white/[0.01] ${selectedLead ? "hidden md:flex" : "flex"}`}>
            {/* Search & Filters */}
            <div className="p-4 border-b border-white/[0.06] space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 focus:bg-white/[0.06] transition-all"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    statusFilter === "all" ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  All
                </button>
                {leadStatusOptions.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      statusFilter === status.value ? status.color : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Leads */}
            <div className="flex-1 overflow-y-auto">
              {filteredLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/50 font-medium">No leads found</p>
                  <p className="text-white/30 text-sm mt-1">
                    {leads.length === 0 ? "Add your first lead to get started" : "Try adjusting your filters"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {filteredLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`w-full p-4 hover:bg-white/[0.03] transition-all text-left group relative ${
                        selectedLead?.id === lead.id ? "bg-white/[0.05]" : ""
                      }`}
                    >
                      {/* Unread indicator bar */}
                      {lead.unread && (
                        <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-[#375DEE] rounded-r-full" />
                      )}

                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            lead.unread
                              ? "bg-[#375DEE]/20 ring-2 ring-[#375DEE]/30"
                              : "bg-white/[0.06]"
                          }`}>
                            <span className={`font-semibold ${lead.unread ? "text-[#375DEE]" : "text-white/60"}`}>
                              {lead.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {lead.unread && (
                            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#375DEE] rounded-full border-2 border-[#0a0a0a]" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className={`font-medium truncate ${lead.unread ? "text-white" : "text-white/80"}`}>
                              {lead.name}
                            </span>
                            <span className={`text-xs flex-shrink-0 ${lead.unread ? "text-[#375DEE] font-medium" : "text-white/30"}`}>
                              {lead.last_message_time ? formatMessageTime(lead.last_message_time) : formatMessageTime(lead.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-sm text-white/40 truncate">{lead.phone}</p>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(lead.status)}`}>
                              {getStatusLabel(lead.status)}
                            </span>
                          </div>
                          {lead.last_message && (
                            <div className="flex items-center gap-1.5">
                              {lead.last_message_direction === "outbound" && (
                                <CheckCheck className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                              )}
                              <p className={`text-sm truncate ${lead.unread ? "text-white/70 font-medium" : "text-white/40"}`}>
                                {lead.last_message}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className={`flex-1 flex flex-col bg-black/20 ${selectedLead ? "flex" : "hidden md:flex"}`}>
            {selectedLead ? (
              <>
                {/* Lead Header */}
                <div className="p-4 border-b border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#375DEE]/30 to-[#375DEE]/10 flex items-center justify-center ring-1 ring-white/10">
                      <span className="text-[#375DEE] font-semibold">
                        {selectedLead.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{selectedLead.name}</h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-white/40 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          {selectedLead.phone}
                        </span>
                        {selectedLead.email && (
                          <span className="text-white/40 flex items-center gap-1.5 hidden sm:flex">
                            <Mail className="w-3.5 h-3.5" />
                            {selectedLead.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Dropdown */}
                      <div className="relative" ref={statusDropdownRef}>
                        <button
                          onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${getStatusColor(selectedLead.status)}`}
                        >
                          {getStatusLabel(selectedLead.status)}
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {showStatusDropdown && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl z-10 overflow-hidden">
                            {leadStatusOptions.map((status) => (
                              <button
                                key={status.value}
                                onClick={() => handleStatusChange(selectedLead.id, status.value)}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2 ${
                                  selectedLead.status === status.value ? "bg-white/5" : ""
                                }`}
                              >
                                <div className={`w-2 h-2 rounded-full ${status.color.split(" ")[0].replace("/15", "")}`} />
                                {status.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => openEditModal(selectedLead)}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(selectedLead.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lead Details Panel */}
                <div className="p-4 border-b border-white/[0.06] bg-white/[0.01]">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-white/40" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-white/40 uppercase tracking-wider mb-0.5">Source</p>
                        <p className="text-sm font-medium capitalize truncate">{selectedLead.source || "Unknown"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-white/40" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-white/40 uppercase tracking-wider mb-0.5">Added</p>
                        <p className="text-sm font-medium truncate">{formatDate(selectedLead.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                        <Car className="w-4 h-4 text-white/40" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-white/40 uppercase tracking-wider mb-0.5">Interest</p>
                        <p className="text-sm font-medium truncate">
                          {vehicles.find((v) => v.id === selectedLead.vehicle_interest)?.name || "Not specified"}
                        </p>
                      </div>
                    </div>
                    {selectedLead.notes && (
                      <div className="flex items-start gap-2.5 col-span-2 sm:col-span-1">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                          <StickyNote className="w-4 h-4 text-white/40" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-white/40 uppercase tracking-wider mb-0.5">Notes</p>
                          <p className="text-sm font-medium truncate">{selectedLead.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-[#375DEE]" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                        <MessageSquare className="w-10 h-10 text-white/15" />
                      </div>
                      <p className="text-white/50 font-medium">No messages yet</p>
                      <p className="text-white/30 text-sm mt-1 max-w-[240px]">
                        Send a message to start the conversation with {selectedLead.name}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Date separator */}
                      <div className="flex items-center justify-center mb-4">
                        <span className="px-3 py-1 bg-white/[0.04] rounded-full text-xs text-white/40">
                          {format(new Date(messages[0]?.created_at || new Date()), "MMMM d, yyyy")}
                        </span>
                      </div>

                      {messages.map((message, index) => {
                        const isOutbound = message.direction === "outbound"
                        const showTimestamp = index === messages.length - 1 ||
                          new Date(messages[index + 1]?.created_at).getTime() - new Date(message.created_at).getTime() > 300000

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[75%] ${isOutbound ? "items-end" : "items-start"}`}>
                              <div
                                className={`rounded-2xl px-4 py-2.5 ${
                                  isOutbound
                                    ? "bg-[#375DEE] text-white rounded-br-md"
                                    : "bg-white/[0.08] text-white rounded-bl-md"
                                }`}
                              >
                                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                              </div>
                              {showTimestamp && (
                                <div className={`flex items-center gap-1.5 mt-1.5 ${isOutbound ? "justify-end" : "justify-start"}`}>
                                  {isOutbound && <CheckCheck className="w-3.5 h-3.5 text-white/30" />}
                                  <p className="text-[11px] text-white/30">
                                    {format(new Date(message.created_at), "h:mm a")}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-white/[0.06] bg-white/[0.02]">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 focus:bg-white/[0.06] transition-all"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-5 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 disabled:hover:bg-[#375DEE] text-white rounded-xl transition-all flex items-center gap-2 font-medium"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span className="hidden sm:inline">Send</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#375DEE]/20 to-[#375DEE]/5 flex items-center justify-center mb-6 ring-1 ring-white/[0.06]">
                  <MessageSquare className="w-12 h-12 text-[#375DEE]/60" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Select a lead</h3>
                <p className="text-white/40 max-w-[280px]">
                  Choose a lead from the list to view details and manage their conversation
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                {editingLead ? "Edit Lead" : "Add Lead"}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                  >
                    {leadStatusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                  >
                    {sourceOptions.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Vehicle Interest</label>
                <select
                  value={formData.vehicle_interest}
                  onChange={(e) => setFormData({ ...formData, vehicle_interest: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                >
                  <option value="">Not specified</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Notes</label>
                <textarea
                  placeholder="Additional notes..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-5 py-3 rounded-xl bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 font-semibold transition-colors"
                >
                  {saving ? "Saving..." : editingLead ? "Save Changes" : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-[#375DEE]" />
                <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                  Import Leads from CSV
                </h2>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {csvData.length === 0 ? (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-[#375DEE]/50 transition-colors"
                  >
                    <Upload className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
                    <p className="text-sm text-white/50 mb-4">or click to browse</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-sm text-white/60 mb-2">Expected CSV format:</p>
                    <code className="text-xs text-white/40 block">
                      Name, Phone, Email, Notes<br />
                      John Smith, (555) 123-4567, john@email.com, Interested in Lamborghini
                    </code>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {importResult && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${
                      importResult.failed === 0
                        ? "bg-green-500/10 border border-green-500/30 text-green-400"
                        : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
                    }`}>
                      {importResult.failed === 0 ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      <span>
                        Imported {importResult.success} leads
                        {importResult.failed > 0 && `, ${importResult.failed} failed`}
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-white/60 mb-3">Map your columns</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {csvHeaders.map(header => (
                        <div key={header} className="flex items-center gap-3">
                          <span className="text-sm text-white/50 w-32 truncate" title={header}>
                            {header}
                          </span>
                          <select
                            value={columnMapping[header] || ""}
                            onChange={(e) => setColumnMapping({
                              ...columnMapping,
                              [header]: e.target.value
                            })}
                            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#375DEE]"
                          >
                            <option value="">Skip</option>
                            <option value="name">Name *</option>
                            <option value="phone">Phone *</option>
                            <option value="email">Email</option>
                            <option value="notes">Notes</option>
                          </select>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-white/40 mt-2">* Required fields</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-white/60 mb-3">
                      Preview ({csvData.length} rows)
                    </h3>
                    <div className="bg-white/5 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto max-h-48">
                        <table className="w-full text-sm">
                          <thead className="bg-white/5">
                            <tr>
                              {csvHeaders.slice(0, 4).map(header => (
                                <th key={header} className="px-4 py-2 text-left text-white/60 font-medium">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.slice(0, 5).map((row, i) => (
                              <tr key={i} className="border-t border-white/5">
                                {csvHeaders.slice(0, 4).map(header => (
                                  <td key={header} className="px-4 py-2 text-white/80 truncate max-w-[150px]">
                                    {row[header]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {csvData.length > 5 && (
                        <div className="px-4 py-2 text-xs text-white/40 border-t border-white/5">
                          + {csvData.length - 5} more rows
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3">
              {csvData.length > 0 && !importResult && (
                <button
                  onClick={resetImportModal}
                  className="px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
                >
                  Choose Different File
                </button>
              )}
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
              >
                {importResult ? "Close" : "Cancel"}
              </button>
              {csvData.length > 0 && !importResult && (
                <button
                  onClick={handleImport}
                  disabled={importing || !Object.values(columnMapping).includes("name") || !Object.values(columnMapping).includes("phone")}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 font-semibold transition-colors"
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import {csvData.length} Leads
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
