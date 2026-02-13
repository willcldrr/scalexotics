"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Search,
  Upload,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Building2,
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  DollarSign,
  Car,
  Calendar,
  StickyNote,
  ExternalLink,
} from "lucide-react"
import { format } from "date-fns"
import {
  crmStatusOptions,
  getStatusColor,
  getStatusLabel,
  leadSourceOptions,
  type CRMLeadStatus,
} from "../lib/crm-status"
import LeadDetailModal from "./lead-detail-modal"
import LeadFormModal from "./lead-form-modal"
import CSVImportModal from "./csv-import-modal"

export interface CRMLead {
  id: string
  user_id: string | null
  company_name: string
  website: string | null
  fleet_size: number | null
  location: string | null
  contact_name: string
  contact_email: string | null
  contact_phone: string | null
  contact_title: string | null
  source: string | null
  status: CRMLeadStatus
  lead_score: number
  assigned_to: string | null
  last_contacted_at: string | null
  next_follow_up: string | null
  estimated_value: number | null
  tags: string[] | null
  custom_fields: Record<string, any>
  created_at: string
  updated_at: string
  notes_count?: number
}

type SortField = "company_name" | "contact_name" | "status" | "estimated_value" | "created_at" | "next_follow_up"
type SortDirection = "asc" | "desc"

export default function LeadsTab() {
  const supabase = createClient()
  const [leads, setLeads] = useState<CRMLead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  // Modals
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)

  // Dropdown menus
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkStatusMenu, setShowBulkStatusMenu] = useState(false)
  const bulkMenuRef = useRef<HTMLDivElement>(null)

  // Message state
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchLeads()

    // Real-time subscription
    const channel = supabase
      .channel("crm-leads-realtime")
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) {
        setShowBulkStatusMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from("crm_leads")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching CRM leads:", error)
      setMessage({ type: "error", text: "Failed to load leads" })
    } else {
      setLeads(data || [])
    }
    setLoading(false)
  }

  const handleStatusChange = async (leadId: string, newStatus: CRMLeadStatus) => {
    const { error } = await supabase
      .from("crm_leads")
      .update({ status: newStatus })
      .eq("id", leadId)

    if (error) {
      setMessage({ type: "error", text: "Failed to update status" })
    } else {
      setLeads(leads.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)))
      setOpenMenuId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead? This action cannot be undone.")) return

    const { error } = await supabase.from("crm_leads").delete().eq("id", id)

    if (error) {
      setMessage({ type: "error", text: "Failed to delete lead" })
    } else {
      setLeads(leads.filter((l) => l.id !== id))
      setMessage({ type: "success", text: "Lead deleted successfully" })
      setOpenMenuId(null)
    }
  }

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)))
    }
  }

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkStatusChange = async (newStatus: CRMLeadStatus) => {
    if (selectedIds.size === 0) return

    const { error } = await supabase
      .from("crm_leads")
      .update({ status: newStatus })
      .in("id", Array.from(selectedIds))

    if (error) {
      setMessage({ type: "error", text: "Failed to update leads" })
    } else {
      setLeads(leads.map((l) => (selectedIds.has(l.id) ? { ...l, status: newStatus } : l)))
      setMessage({ type: "success", text: `Updated ${selectedIds.size} leads to ${getStatusLabel(newStatus)}` })
      setSelectedIds(new Set())
    }
    setShowBulkStatusMenu(false)
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} leads? This action cannot be undone.`)) return

    const { error } = await supabase
      .from("crm_leads")
      .delete()
      .in("id", Array.from(selectedIds))

    if (error) {
      setMessage({ type: "error", text: "Failed to delete leads" })
    } else {
      setLeads(leads.filter((l) => !selectedIds.has(l.id)))
      setMessage({ type: "success", text: `Deleted ${selectedIds.size} leads` })
      setSelectedIds(new Set())
    }
  }

  const openEditModal = (lead: CRMLead) => {
    setEditingLead(lead)
    setShowFormModal(true)
    setOpenMenuId(null)
  }

  const openDetailModal = (lead: CRMLead) => {
    setSelectedLead(lead)
    setShowDetailModal(true)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "-"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    return format(new Date(dateStr), "MMM d, yyyy")
  }

  // Filter and sort leads
  const filteredLeads = leads
    .filter((lead) => {
      const matchesSearch =
        lead.company_name.toLowerCase().includes(search.toLowerCase()) ||
        lead.contact_name.toLowerCase().includes(search.toLowerCase()) ||
        lead.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
        lead.location?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (sortField === "estimated_value" || sortField === "fleet_size") {
        aVal = aVal || 0
        bVal = bVal || 0
      }

      if (sortField === "created_at" || sortField === "next_follow_up") {
        aVal = aVal ? new Date(aVal).getTime() : 0
        bVal = bVal ? new Date(bVal).getTime() : 0
      }

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase()
        bVal = (bVal || "").toLowerCase()
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1
      }
      return aVal < bVal ? 1 : -1
    })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  // Stats
  const totalLeads = leads.length
  const activeLeads = leads.filter((l) => !["closed_won", "closed_lost", "not_interested"].includes(l.status)).length
  const totalValue = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0)
  const wonDeals = leads.filter((l) => l.status === "closed_won").length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl ${
            message.type === "success"
              ? "bg-[#375DEE]/10 border border-[#375DEE]/30 text-[#375DEE]"
              : "bg-white/5 border border-white/20 text-white/70"
          }`}
        >
          {message.type === "success" ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto p-1 hover:bg-white/10 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white/40 text-xs mb-1">Total Leads</p>
          <p className="text-2xl font-bold">{totalLeads}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white/40 text-xs mb-1">Active Pipeline</p>
          <p className="text-2xl font-bold text-[#375DEE]">{activeLeads}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white/40 text-xs mb-1">Pipeline Value</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white/40 text-xs mb-1">Won Deals</p>
          <p className="text-2xl font-bold text-[#375DEE]">{wonDeals}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE]/50 transition-all"
          >
            <option value="all">All Statuses</option>
            {crmStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingLead(null)
              setShowFormModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#375DEE] hover:bg-[#4169E1] text-white font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-[#375DEE]/10 border border-[#375DEE]/30 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#375DEE] flex items-center justify-center text-sm font-bold">
              {selectedIds.size}
            </div>
            <span className="text-sm text-white/80">
              {selectedIds.size === 1 ? "lead selected" : "leads selected"}
            </span>
          </div>

          <div className="h-6 w-px bg-white/20" />

          {/* Change Status */}
          <div className="relative" ref={bulkMenuRef}>
            <button
              onClick={() => setShowBulkStatusMenu(!showBulkStatusMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-medium transition-colors"
            >
              Change Status
              <ChevronDown className="w-4 h-4" />
            </button>
            {showBulkStatusMenu && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl z-20 overflow-hidden">
                {crmStatusOptions.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleBulkStatusChange(status.value)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <div className={`w-2 h-2 rounded-full ${status.bgColor}`} />
                    {status.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          {/* Clear Selection */}
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-lg text-sm text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            Clear Selection
          </button>
        </div>
      )}

      {/* Table */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
          <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No leads found</h3>
          <p className="text-white/50 mb-6 max-w-md mx-auto">
            {leads.length === 0
              ? "Add your first B2B lead to start building your sales pipeline."
              : "Try adjusting your search or filters."}
          </p>
          {leads.length === 0 && (
            <button
              onClick={() => setShowFormModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#375DEE] hover:bg-[#4169E1] text-white font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Lead
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="w-12 px-4 py-4">
                    <button
                      onClick={handleSelectAll}
                      className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                        filteredLeads.length > 0 && selectedIds.size === filteredLeads.length
                          ? "bg-[#375DEE] border-[#375DEE]"
                          : "border-white/30 hover:border-white/50"
                      }`}
                    >
                      {filteredLeads.length > 0 && selectedIds.size === filteredLeads.length && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
                  </th>
                  <th
                    onClick={() => handleSort("company_name")}
                    className="text-left text-xs text-white/40 font-medium px-6 py-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Company
                      <SortIcon field="company_name" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("contact_name")}
                    className="text-left text-xs text-white/40 font-medium px-6 py-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Contact
                      <SortIcon field="contact_name" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="text-left text-xs text-white/40 font-medium px-6 py-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("estimated_value")}
                    className="text-left text-xs text-white/40 font-medium px-6 py-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Value
                      <SortIcon field="estimated_value" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("next_follow_up")}
                    className="text-left text-xs text-white/40 font-medium px-6 py-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Follow Up
                      <SortIcon field="next_follow_up" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("created_at")}
                    className="text-left text-xs text-white/40 font-medium px-6 py-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Created
                      <SortIcon field="created_at" />
                    </div>
                  </th>
                  <th className="text-left text-xs text-white/40 font-medium px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => openDetailModal(lead)}
                    className={`border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${
                      selectedIds.has(lead.id) ? "bg-[#375DEE]/10" : ""
                    }`}
                  >
                    <td className="w-12 px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleSelectOne(lead.id)}
                        className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                          selectedIds.has(lead.id)
                            ? "bg-[#375DEE] border-[#375DEE]"
                            : "border-white/30 hover:border-white/50"
                        }`}
                      >
                        {selectedIds.has(lead.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#375DEE]/20 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-[#375DEE]" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{lead.company_name}</p>
                          {lead.location && (
                            <p className="text-xs text-white/40 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {lead.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-white">{lead.contact_name}</p>
                        {lead.contact_title && (
                          <p className="text-xs text-white/40">{lead.contact_title}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-white/80">
                        {formatCurrency(lead.estimated_value)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${lead.next_follow_up ? "text-white/80" : "text-white/30"}`}>
                        {formatDate(lead.next_follow_up)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-white/60">{formatDate(lead.created_at)}</span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="relative" ref={openMenuId === lead.id ? menuRef : null}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === lead.id ? null : lead.id)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-white/50" />
                        </button>
                        {openMenuId === lead.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl z-10 overflow-hidden">
                            <button
                              onClick={() => openEditModal(lead)}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit Lead
                            </button>
                            <div className="border-t border-white/10 my-1" />
                            <p className="px-4 py-1.5 text-[10px] text-white/30 uppercase tracking-wider">
                              Change Status
                            </p>
                            {crmStatusOptions.map((status) => (
                              <button
                                key={status.value}
                                onClick={() => handleStatusChange(lead.id, status.value)}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2 ${
                                  lead.status === status.value ? "bg-white/5" : ""
                                }`}
                              >
                                <div className={`w-2 h-2 rounded-full ${status.bgColor}`} />
                                {status.label}
                              </button>
                            ))}
                            <div className="border-t border-white/10 my-1" />
                            <button
                              onClick={() => handleDelete(lead.id)}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 text-white/50 hover:text-white transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Lead
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showDetailModal && selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedLead(null)
          }}
          onEdit={(lead) => {
            setShowDetailModal(false)
            openEditModal(lead)
          }}
          onStatusChange={(leadId, status) => handleStatusChange(leadId, status)}
          onDelete={(id) => {
            handleDelete(id)
            setShowDetailModal(false)
            setSelectedLead(null)
          }}
          onUpdate={fetchLeads}
        />
      )}

      {showFormModal && (
        <LeadFormModal
          lead={editingLead}
          onClose={() => {
            setShowFormModal(false)
            setEditingLead(null)
          }}
          onSave={() => {
            fetchLeads()
            setShowFormModal(false)
            setEditingLead(null)
            setMessage({ type: "success", text: editingLead ? "Lead updated" : "Lead created" })
          }}
        />
      )}

      {showImportModal && (
        <CSVImportModal
          onClose={() => setShowImportModal(false)}
          onImport={(count) => {
            fetchLeads()
            setMessage({ type: "success", text: `Imported ${count} leads successfully` })
          }}
        />
      )}
    </div>
  )
}
