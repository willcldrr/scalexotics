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
  Clock,
  User,
  Bot,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  status: string
  source: string
  notes: string
  vehicle_interest: string | null
  created_at: string
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

const statusOptions = [
  { value: "new", label: "New", color: "bg-blue-500/20 text-blue-400" },
  { value: "contacted", label: "Contacted", color: "bg-orange-500/20 text-orange-400" },
  { value: "qualified", label: "Qualified", color: "bg-yellow-500/20 text-yellow-400" },
  { value: "converted", label: "Converted", color: "bg-green-500/20 text-green-400" },
  { value: "lost", label: "Lost", color: "bg-red-500/20 text-red-400" },
]

const sourceOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google Ads" },
  { value: "tiktok", label: "TikTok" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "phone", label: "Phone" },
  { value: "other", label: "Other" },
]

export default function LeadsPage() {
  const supabase = createClient()
  const [leads, setLeads] = useState<Lead[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "new",
    source: "website",
    notes: "",
    vehicle_interest: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedLead) {
      fetchMessages(selectedLead.id)
    }
  }, [selectedLead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
    }

    const [leadsRes, vehiclesRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("vehicles").select("id, name, make, model"),
    ])

    setLeads(leadsRes.data || [])
    setVehicles(vehiclesRes.data || [])
    setLoading(false)
  }

  const fetchMessages = async (leadId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true })

    setMessages(data || [])
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
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      status: "new",
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

  const getStatusColor = (status: string) => {
    return statusOptions.find((s) => s.value === status)?.color || "bg-gray-500/20 text-gray-400"
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search) ||
      lead.email?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    }
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Leads
          </h1>
          <p className="text-white/50 mt-1">Loading your CRM...</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Leads
          </h1>
          <p className="text-white/50 mt-1">
            {leads.length} lead{leads.length !== 1 ? "s" : ""} from ad campaigns
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingLead(null)
            setShowAddModal(true)
          }}
          className="flex items-center gap-2 px-5 py-3 bg-[#375DEE] hover:bg-[#4169E1] text-white font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Lead
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Leads List */}
        <div className={`flex flex-col ${selectedLead ? "w-1/2 lg:w-2/5" : "w-full"} transition-all`}>
          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#375DEE] transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
            >
              <option value="all">All Status</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Leads */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No leads found</h3>
                <p className="text-white/50">
                  {leads.length === 0 ? "Add your first lead to get started" : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedLead?.id === lead.id
                      ? "bg-[#375DEE]/10 border-[#375DEE]/50"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="text-lg font-semibold">
                          {lead.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{lead.name}</h3>
                        <p className="text-sm text-white/50">{lead.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-white/40" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Source: {lead.source}
                    </span>
                    <span>{formatDate(lead.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Conversation Panel */}
        {selectedLead && (
          <div className="flex-1 flex flex-col bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            {/* Lead Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#375DEE]/20 flex items-center justify-center">
                  <span className="text-lg font-semibold text-[#375DEE]">
                    {selectedLead.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{selectedLead.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-white/50">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedLead.phone}
                    </span>
                    {selectedLead.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {selectedLead.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedLead.status}
                  onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#375DEE] transition-colors"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => openEditModal(selectedLead)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(selectedLead.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors lg:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lead Info */}
            <div className="p-4 border-b border-white/10 bg-white/[0.02]">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-white/40 mb-1">Source</p>
                  <p className="font-medium capitalize">{selectedLead.source}</p>
                </div>
                <div>
                  <p className="text-white/40 mb-1">Added</p>
                  <p className="font-medium">{formatDate(selectedLead.created_at)}</p>
                </div>
                <div>
                  <p className="text-white/40 mb-1">Interest</p>
                  <p className="font-medium">
                    {vehicles.find((v) => v.id === selectedLead.vehicle_interest)?.name || "Not specified"}
                  </p>
                </div>
              </div>
              {selectedLead.notes && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-white/40 text-sm mb-1">Notes</p>
                  <p className="text-sm">{selectedLead.notes}</p>
                </div>
              )}
            </div>

            {/* Conversation */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-16 h-16 text-white/10 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No conversation yet</h3>
                  <p className="text-white/40 text-sm max-w-xs">
                    When the AI assistant starts texting this lead, the conversation will appear here.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.direction === "outbound"
                          ? "bg-[#375DEE] text-white rounded-br-md"
                          : "bg-white/10 text-white rounded-bl-md"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.direction === "outbound" ? (
                          <Bot className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        <span className="text-xs opacity-70">
                          {message.direction === "outbound" ? "AI Assistant" : selectedLead.name}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-50 mt-1 text-right">
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input (for manual messages - optional) */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Bot className="w-4 h-4" />
                <span>AI Assistant is handling this conversation</span>
              </div>
            </div>
          </div>
        )}
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
                    {statusOptions.map((status) => (
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
    </div>
  )
}
