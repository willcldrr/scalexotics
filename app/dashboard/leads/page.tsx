"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Phone,
  Mail,
  X,
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

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
}

const statusOptions = ["new", "contacted", "qualified", "converted", "lost"]
const sourceOptions = ["instagram", "google", "referral", "website", "phone", "other"]

export default function LeadsPage() {
  const supabase = createClient()
  const [leads, setLeads] = useState<Lead[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "new",
    source: "website",
    notes: "",
    vehicle_interest: "",
  })
  const [saving, setSaving] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [leadsRes, vehiclesRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("vehicles").select("id, name, make, model"),
    ])
    setLeads(leadsRes.data || [])
    setVehicles(vehiclesRes.data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const leadData = {
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
    setShowModal(false)
    setEditingLead(null)
    resetForm()
    fetchData()
  }

  const handleEdit = (lead: Lead) => {
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
    setShowModal(true)
    setOpenDropdown(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      await supabase.from("leads").delete().eq("id", id)
      fetchData()
    }
    setOpenDropdown(null)
  }

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from("leads").update({ status }).eq("id", id)
    fetchData()
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

  const openNewModal = () => {
    setEditingLead(null)
    resetForm()
    setShowModal(true)
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search)
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      contacted: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      qualified: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      converted: "bg-green-500/20 text-green-400 border-green-500/30",
      lost: "bg-red-500/20 text-red-400 border-red-500/30",
    }
    return colors[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Leads
          </h1>
          <p className="text-white/50 mt-1">{leads.length} total leads</p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#375DEE] transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#375DEE] transition-colors"
        >
          <option value="all">All Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Leads Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40">Loading...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-white/40">
            {search || statusFilter !== "all" ? "No leads match your filters" : "No leads yet. Add your first lead!"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/50 font-medium">Name</th>
                  <th className="text-left p-4 text-white/50 font-medium hidden md:table-cell">Contact</th>
                  <th className="text-left p-4 text-white/50 font-medium hidden lg:table-cell">Source</th>
                  <th className="text-left p-4 text-white/50 font-medium">Status</th>
                  <th className="text-left p-4 text-white/50 font-medium hidden lg:table-cell">Date</th>
                  <th className="text-right p-4 text-white/50 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#375DEE]/20 flex items-center justify-center">
                          <span className="text-[#375DEE] font-medium">
                            {lead.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-sm text-white/40 md:hidden">{lead.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-white/40" />
                          {lead.phone}
                        </p>
                        {lead.email && (
                          <p className="flex items-center gap-2 text-sm text-white/60">
                            <Mail className="w-4 h-4 text-white/40" />
                            {lead.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-white/60 capitalize">{lead.source || "-"}</span>
                    </td>
                    <td className="p-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border bg-transparent cursor-pointer ${getStatusColor(lead.status)}`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status} className="bg-black">
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-white/60">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === lead.id ? null : lead.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        {openDropdown === lead.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenDropdown(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-36 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                              <button
                                onClick={() => handleEdit(lead)}
                                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/5 text-left transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(lead.id)}
                                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/5 text-left text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                {editingLead ? "Edit Lead" : "Add New Lead"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                  >
                    {sourceOptions.map((source) => (
                      <option key={source} value={source}>
                        {source.charAt(0).toUpperCase() + source.slice(1)}
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                >
                  <option value="">None</option>
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
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 rounded-xl font-medium transition-colors"
                >
                  {saving ? "Saving..." : editingLead ? "Update" : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
