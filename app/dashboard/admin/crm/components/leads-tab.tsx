"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Search,
  Upload,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  Loader2,
  Building2,
  Filter,
  Phone,
  Mail,
} from "lucide-react"
import { type CRMLeadStatus } from "../lib/crm-status"
import { useCRMStatuses } from "../hooks/use-crm-statuses"
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

type SortField = "company_name" | "contact_name" | "status" | "estimated_value" | "last_contacted_at" | "next_follow_up"
type SortDirection = "asc" | "desc"

export default function LeadsTab() {
  const supabase = createClient()
  const { statusOptions, getStatusColor, getStatusLabel, lostStatuses, wonStatuses } = useCRMStatuses()
  const [leads, setLeads] = useState<CRMLead[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("last_contacted_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const leadsPerPage = 50

  // Modals
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)

  // Inline status dropdown
  const [inlineStatusId, setInlineStatusId] = useState<string | null>(null)
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkStatusMenu, setShowBulkStatusMenu] = useState(false)
  const bulkMenuRef = useRef<HTMLDivElement>(null)

  // Message state
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchLeads()
    const channel = supabase
      .channel("crm-leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_leads" }, () => fetchLeads())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setInlineStatusId(null)
      }
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) {
        setShowBulkStatusMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Auto-hide message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const fetchLeads = async () => {
    // Supabase has a 1000 row default limit, so we need to fetch in batches
    const batchSize = 1000
    const maxLeads = 20000
    let allLeads: CRMLead[] = []
    let totalCount = 0

    // First, get the total count
    const { count } = await supabase
      .from("crm_leads")
      .select("*", { count: "exact", head: true })

    totalCount = count || 0

    // Fetch in batches using range
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
        setMessage({ type: "error", text: "Failed to load leads" })
        setLoading(false)
        return
      }

      if (data) {
        allLeads = [...allLeads, ...data]
      }
    }

    setLeads(allLeads)
    setTotalCount(totalCount)
    setLoading(false)
  }

  const handleStatusChange = async (leadId: string, newStatus: CRMLeadStatus) => {
    // Optimistic update
    setLeads(leads.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)))
    setInlineStatusId(null)

    const { error } = await supabase.from("crm_leads").update({ status: newStatus }).eq("id", leadId)
    if (error) {
      fetchLeads() // Revert on error
      setMessage({ type: "error", text: "Failed to update status" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lead?")) return
    setLeads(leads.filter((l) => l.id !== id))

    const { error } = await supabase.from("crm_leads").delete().eq("id", id)
    if (error) {
      fetchLeads()
      setMessage({ type: "error", text: "Failed to delete" })
    }
  }

  const handleSelectAll = () => {
    const currentPageIds = paginatedLeads.map((l) => l.id)
    const allSelected = currentPageIds.every(id => selectedIds.has(id))
    if (allSelected) {
      // Deselect all on current page
      const newSelected = new Set(selectedIds)
      currentPageIds.forEach(id => newSelected.delete(id))
      setSelectedIds(newSelected)
    } else {
      // Select all on current page
      const newSelected = new Set(selectedIds)
      currentPageIds.forEach(id => newSelected.add(id))
      setSelectedIds(newSelected)
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
    setLeads(leads.map((l) => (selectedIds.has(l.id) ? { ...l, status: newStatus } : l)))
    const count = selectedIds.size
    setSelectedIds(new Set())
    setShowBulkStatusMenu(false)

    const { error } = await supabase.from("crm_leads").update({ status: newStatus }).in("id", Array.from(selectedIds))
    if (error) {
      fetchLeads()
      setMessage({ type: "error", text: "Failed to update" })
    } else {
      setMessage({ type: "success", text: `${count} leads → ${getStatusLabel(newStatus)}` })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} leads?`)) return

    const idsToDelete = Array.from(selectedIds)
    setLeads(leads.filter((l) => !selectedIds.has(l.id)))
    const count = selectedIds.size
    setSelectedIds(new Set())

    const { error } = await supabase.from("crm_leads").delete().in("id", idsToDelete)
    if (error) {
      fetchLeads()
      setMessage({ type: "error", text: "Failed to delete" })
    } else {
      setMessage({ type: "success", text: `Deleted ${count} leads` })
    }
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
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value)
  }

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

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
      if (sortField === "estimated_value") { aVal = aVal || 0; bVal = bVal || 0 }
      if (sortField === "last_contacted_at" || sortField === "next_follow_up") {
        aVal = aVal ? new Date(aVal).getTime() : 0
        bVal = bVal ? new Date(bVal).getTime() : 0
      }
      if (typeof aVal === "string") { aVal = aVal.toLowerCase(); bVal = (bVal || "").toLowerCase() }
      return sortDirection === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1)
    })

  // Pagination calculations
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage)
  const startIndex = (currentPage - 1) * leadsPerPage
  const endIndex = startIndex + leadsPerPage
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages)
      }
    }
    return pages
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  // Stats - use totalCount for accurate total (in case of row limits)
  const totalLeads = totalCount
  const closedStatuses = [...wonStatuses, ...lostStatuses]
  const activeLeads = leads.filter((l) => !closedStatuses.includes(l.status)).length
  const totalValue = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0)
  const wonDeals = leads.filter((l) => wonStatuses.includes(l.status)).length

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" /></div>
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      {/* Toast Message */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-2 ${
          message.type === "success" ? "bg-[#375DEE] text-white" : "bg-red-500 text-white"
        }`}>
          {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Compact Stats Row */}
      <div className="flex items-center gap-2 text-sm overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg whitespace-nowrap">
          <span className="text-white/50">Total</span>
          <span className="font-bold">{totalLeads}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg whitespace-nowrap">
          <span className="text-white/50">Active</span>
          <span className="font-bold text-[#375DEE]">{activeLeads}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg whitespace-nowrap">
          <span className="text-white/50">Value</span>
          <span className="font-bold">{formatCurrency(totalValue)}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg whitespace-nowrap">
          <span className="text-white/50">Won</span>
          <span className="font-bold text-green-400">{wonDeals}</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded">
              <X className="w-3 h-3 text-white/50" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg border transition-colors ${showFilters ? "bg-[#375DEE] border-[#375DEE]" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
        >
          <Filter className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Import</span>
        </button>
        <button
          onClick={() => { setEditingLead(null); setShowFormModal(true) }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#375DEE] rounded-lg text-sm font-medium hover:bg-[#4169E1] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {/* Filter Chips */}
      {showFilters && (
        <div className="flex flex-wrap gap-1.5 animate-in slide-in-from-top-1">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === "all" ? "bg-[#375DEE] text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            All
          </button>
          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === status.value ? `${status.bgColor} ${status.color}` : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      )}

      {/* Sticky Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-30 flex items-center gap-2 p-3 bg-[#375DEE]/95 backdrop-blur rounded-xl shadow-lg">
          <button
            onClick={handleSelectAll}
            className="w-6 h-6 rounded border-2 border-white/50 flex items-center justify-center hover:bg-white/10"
          >
            {paginatedLeads.length > 0 && paginatedLeads.every(l => selectedIds.has(l.id)) && <Check className="w-4 h-4" />}
          </button>
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <div className="relative" ref={bulkMenuRef}>
            <button
              onClick={() => setShowBulkStatusMenu(!showBulkStatusMenu)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
            >
              Status <ChevronDown className="w-3 h-3" />
            </button>
            {showBulkStatusMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-[#1a1a1a] rounded-lg border border-white/10 shadow-xl overflow-hidden z-40">
                {statusOptions.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleBulkStatusChange(status.value)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2"
                  >
                    <div className={`w-2 h-2 rounded-full ${status.bgColor}`} />
                    {status.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleBulkDelete}
            className="p-2 bg-white/20 rounded-lg hover:bg-red-500/50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
          <Building2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">{leads.length === 0 ? "No leads yet" : "No matches"}</p>
        </div>
      ) : (
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="w-12 px-4 py-3">
                    <button onClick={handleSelectAll} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      paginatedLeads.length > 0 && paginatedLeads.every(l => selectedIds.has(l.id))
                        ? "bg-[#375DEE] border-[#375DEE]"
                        : "border-white/20 hover:border-white/40"
                    }`}>
                      {paginatedLeads.length > 0 && paginatedLeads.every(l => selectedIds.has(l.id)) && <Check className="w-3 h-3" />}
                    </button>
                  </th>
                  <th onClick={() => handleSort("company_name")} className="text-left text-[11px] uppercase tracking-wider text-white/40 font-semibold px-4 py-3 cursor-pointer hover:text-white/70 transition-colors">
                    <div className="flex items-center gap-1.5">Company <SortIcon field="company_name" /></div>
                  </th>
                  <th onClick={() => handleSort("contact_name")} className="text-left text-[11px] uppercase tracking-wider text-white/40 font-semibold px-4 py-3 cursor-pointer hover:text-white/70 transition-colors w-48">
                    <div className="flex items-center gap-1.5">Contact <SortIcon field="contact_name" /></div>
                  </th>
                  <th onClick={() => handleSort("status")} className="text-left text-[11px] uppercase tracking-wider text-white/40 font-semibold px-4 py-3 cursor-pointer hover:text-white/70 transition-colors w-36">
                    <div className="flex items-center gap-1.5">Status <SortIcon field="status" /></div>
                  </th>
                  <th className="w-24 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeads.map((lead, index) => (
                  <tr
                    key={lead.id}
                    className={`group border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors cursor-pointer ${
                      selectedIds.has(lead.id) ? "bg-[#375DEE]/10" : ""
                    }`}
                    onClick={() => { setSelectedLead(lead); setShowDetailModal(true) }}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleSelectOne(lead.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          selectedIds.has(lead.id)
                            ? "bg-[#375DEE] border-[#375DEE]"
                            : "border-white/20 hover:border-white/40"
                        }`}
                      >
                        {selectedIds.has(lead.id) && <Check className="w-3 h-3" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#375DEE]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#375DEE] text-xs font-bold">
                            {lead.company_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate group-hover:text-[#375DEE] transition-colors">{lead.company_name}</p>
                          {lead.location && <p className="text-xs text-white/40 truncate">{lead.location}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white/80 truncate">{lead.contact_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {lead.contact_email && (
                          <a href={`mailto:${lead.contact_email}`} onClick={(e) => e.stopPropagation()} className="text-[#375DEE] hover:text-[#4169E1] transition-colors">
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {lead.contact_phone && (
                          <a href={`tel:${lead.contact_phone}`} onClick={(e) => e.stopPropagation()} className="text-white/30 hover:text-white/70 transition-colors">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="relative" ref={inlineStatusId === lead.id ? statusDropdownRef : null}>
                        <button
                          onClick={() => setInlineStatusId(inlineStatusId === lead.id ? null : lead.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 hover:opacity-90 transition-all ${getStatusColor(lead.status)}`}
                        >
                          {getStatusLabel(lead.status)}
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </button>
                        {inlineStatusId === lead.id && (
                          <div className="absolute left-0 top-full mt-1.5 w-40 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl z-20 overflow-hidden py-1">
                            {statusOptions.map((status) => (
                              <button
                                key={status.value}
                                onClick={() => handleStatusChange(lead.id, status.value)}
                                className={`w-full px-3 py-2 text-left text-xs hover:bg-white/5 flex items-center gap-2.5 transition-colors ${
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
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingLead(lead); setShowFormModal(true) }}
                          className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden divide-y divide-white/[0.04]">
            {paginatedLeads.map((lead) => (
              <div
                key={lead.id}
                className={`flex items-center gap-3 px-4 py-3 ${selectedIds.has(lead.id) ? "bg-[#375DEE]/10" : ""}`}
              >
                <button
                  onClick={() => handleSelectOne(lead.id)}
                  className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    selectedIds.has(lead.id) ? "bg-[#375DEE] border-[#375DEE]" : "border-white/20"
                  }`}
                >
                  {selectedIds.has(lead.id) && <Check className="w-3 h-3" />}
                </button>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => { setSelectedLead(lead); setShowDetailModal(true) }}
                >
                  <p className="font-semibold truncate">{lead.company_name}</p>
                  <p className="text-xs text-white/40 truncate">{lead.contact_name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setSelectedLead(lead); setShowDetailModal(true) }}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all flex items-center justify-center"
                  >
                    <Building2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setEditingLead(lead); setShowFormModal(true) }}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all flex items-center justify-center"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredLeads.length > leadsPerPage && (
        <div className="flex items-center justify-between px-2 py-3">
          <p className="text-sm text-white/40">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredLeads.length)} of {filteredLeads.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                typeof page === "number" ? (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all ${
                      currentPage === page
                        ? "bg-[#375DEE] text-white"
                        : "hover:bg-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={index} className="px-2 text-white/30">...</span>
                )
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      <div className="fixed bottom-6 right-6 md:hidden flex flex-col gap-2 z-40">
        <button
          onClick={() => setShowImportModal(true)}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-lg"
        >
          <Upload className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setEditingLead(null); setShowFormModal(true) }}
          className="w-14 h-14 rounded-full bg-[#375DEE] flex items-center justify-center shadow-lg hover:bg-[#4169E1] transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modals */}
      {showDetailModal && selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => { setShowDetailModal(false); setSelectedLead(null) }}
          onEdit={(lead) => { setShowDetailModal(false); setEditingLead(lead); setShowFormModal(true) }}
          onStatusChange={(leadId, status) => handleStatusChange(leadId, status)}
          onDelete={(id) => { handleDelete(id); setShowDetailModal(false); setSelectedLead(null) }}
          onUpdate={fetchLeads}
        />
      )}

      {showFormModal && (
        <LeadFormModal
          lead={editingLead}
          onClose={() => { setShowFormModal(false); setEditingLead(null) }}
          onSave={() => { fetchLeads(); setShowFormModal(false); setEditingLead(null); setMessage({ type: "success", text: editingLead ? "Updated" : "Created" }) }}
        />
      )}

      {showImportModal && (
        <CSVImportModal
          onClose={() => setShowImportModal(false)}
          onImport={(count) => { fetchLeads(); setMessage({ type: "success", text: `Imported ${count} leads` }) }}
        />
      )}
    </div>
  )
}
