"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Car,
  Clock,
  Star,
  ChevronRight,
  X,
  Edit,
  Save,
  Loader2,
  User,
  MessageSquare,
  CreditCard,
  Tag,
  Plus,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { customerStatuses } from "@/lib/lead-status"

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string
  status: string
  source: string | null
  notes: string | null
  created_at: string
  tags?: string[]
  bookings?: Booking[]
  lifetime_value?: number
  total_rentals?: number
}

interface Booking {
  id: string
  vehicle_id: string
  vehicle?: { make: string; model: string; year: number }
  start_date: string
  end_date: string
  total_amount: number
  status: string
  created_at: string
}

export default function CustomersPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", notes: "" })
  const [newTag, setNewTag] = useState("")

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Get all leads that have been converted or are in customer statuses
      const { data: leadsData } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .in("status", customerStatuses)
        .order("created_at", { ascending: false })

      if (leadsData) {
        // Enrich with booking data
        const customersWithData = await Promise.all(
          leadsData.map(async (lead) => {
            const { data: bookings } = await supabase
              .from("bookings")
              .select(`
                id,
                vehicle_id,
                start_date,
                end_date,
                total_amount,
                status,
                created_at,
                vehicles (make, model, year)
              `)
              .eq("user_id", user.id)
              .eq("customer_phone", lead.phone)
              .order("created_at", { ascending: false })

            const completedBookings = bookings?.filter(b => b.status === "completed" || b.status === "confirmed") || []
            const lifetimeValue = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)

            // Parse tags from notes or a dedicated field
            const tags = lead.notes?.match(/#\w+/g)?.map((t: string) => t.slice(1)) || []

            return {
              ...lead,
              bookings: bookings?.map(b => ({
                ...b,
                vehicle: Array.isArray(b.vehicles) ? b.vehicles[0] : b.vehicles
              })) || [],
              lifetime_value: lifetimeValue,
              total_rentals: completedBookings.length,
              tags,
            }
          })
        )

        // Sort by lifetime value
        customersWithData.sort((a, b) => (b.lifetime_value || 0) - (a.lifetime_value || 0))
        setCustomers(customersWithData)
      }
    }

    setLoading(false)
  }

  const openCustomerDetail = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditForm({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone,
      notes: customer.notes || "",
    })
    setEditing(false)
  }

  const saveCustomer = async () => {
    if (!selectedCustomer) return
    setSaving(true)

    const { error } = await supabase
      .from("leads")
      .update({
        name: editForm.name,
        email: editForm.email || null,
        phone: editForm.phone,
        notes: editForm.notes || null,
      })
      .eq("id", selectedCustomer.id)

    if (!error) {
      setCustomers(customers.map(c =>
        c.id === selectedCustomer.id
          ? { ...c, ...editForm }
          : c
      ))
      setSelectedCustomer({ ...selectedCustomer, ...editForm })
      setEditing(false)
    }

    setSaving(false)
  }

  const addTag = async () => {
    if (!newTag.trim() || !selectedCustomer) return

    const currentNotes = selectedCustomer.notes || ""
    const updatedNotes = `${currentNotes} #${newTag.trim()}`.trim()

    const { error } = await supabase
      .from("leads")
      .update({ notes: updatedNotes })
      .eq("id", selectedCustomer.id)

    if (!error) {
      const updatedCustomer = {
        ...selectedCustomer,
        notes: updatedNotes,
        tags: [...(selectedCustomer.tags || []), newTag.trim()],
      }
      setSelectedCustomer(updatedCustomer)
      setCustomers(customers.map(c => c.id === selectedCustomer.id ? updatedCustomer : c))
      setNewTag("")
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTierBadge = (lifetimeValue: number) => {
    if (lifetimeValue >= 10000) return { label: "VIP", color: "bg-yellow-500/20 text-yellow-400" }
    if (lifetimeValue >= 5000) return { label: "Gold", color: "bg-orange-500/20 text-orange-400" }
    if (lifetimeValue >= 1000) return { label: "Silver", color: "bg-gray-400/20 text-gray-300" }
    return { label: "Bronze", color: "bg-amber-700/20 text-amber-600" }
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="hidden sm:block">
          <h1 className="text-3xl font-bold" style={{ color: '#ffffff', background: 'none', WebkitTextFillColor: '#ffffff' }}>
            Customers
          </h1>
          <p className="text-white/50 mt-1">Loading customer profiles...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Hidden on mobile */}
      <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#ffffff', background: 'none', WebkitTextFillColor: '#ffffff' }}>
            Customers
          </h1>
          <p className="text-white/50 mt-1">{customers.length} customers with rental history</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">Total Lifetime Value</p>
              <p className="text-2xl font-bold">
                ${customers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#375DEE]" />
            </div>
            <div>
              <p className="text-sm text-white/50">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">VIP Customers</p>
              <p className="text-2xl font-bold">
                {customers.filter(c => (c.lifetime_value || 0) >= 10000).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
        />
      </div>

      {/* Customer List */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/40">
            <Users className="w-12 h-12 mb-3" />
            <p>No customers found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredCustomers.map((customer) => {
              const tier = getTierBadge(customer.lifetime_value || 0)
              return (
                <button
                  key={customer.id}
                  onClick={() => openCustomerDetail(customer)}
                  className="w-full p-4 hover:bg-white/5 transition-colors text-left flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-[#375DEE]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#375DEE] font-semibold text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{customer.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tier.color}`}>
                        {tier.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </span>
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="font-semibold text-green-400">${(customer.lifetime_value || 0).toLocaleString()}</p>
                    <p className="text-sm text-white/50">{customer.total_rentals || 0} rentals</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/30" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#375DEE]/20 flex items-center justify-center">
                  <span className="text-[#375DEE] font-semibold text-2xl">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="text-xl font-semibold bg-white/5 border border-white/20 rounded-lg px-3 py-1"
                    />
                  ) : (
                    <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                  )}
                  <p className="text-sm text-white/50">
                    Customer since {format(new Date(selectedCustomer.created_at), "MMMM yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={() => setEditing(false)}
                      className="p-2 rounded-lg hover:bg-white/5 text-white/60"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={saveCustomer}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] rounded-lg text-sm font-medium"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="p-2 rounded-lg hover:bg-white/5 text-white/60"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="p-2 rounded-lg hover:bg-white/5 text-white/60"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-400">
                    ${(selectedCustomer.lifetime_value || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-white/50">Lifetime Value</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <Car className="w-5 h-5 text-[#375DEE] mx-auto mb-2" />
                  <p className="text-2xl font-bold">{selectedCustomer.total_rentals || 0}</p>
                  <p className="text-xs text-white/50">Total Rentals</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <Clock className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {selectedCustomer.bookings?.length
                      ? formatDistanceToNow(new Date(selectedCustomer.bookings[0].created_at), { addSuffix: false })
                      : "N/A"}
                  </p>
                  <p className="text-xs text-white/50">Since Last Rental</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h3 className="font-bold text-white/70">Contact Information</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <Phone className="w-4 h-4 text-white/40" />
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="flex-1 bg-transparent border-b border-white/20 focus:outline-none focus:border-[#375DEE]"
                      />
                    ) : (
                      <span>{selectedCustomer.phone}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <Mail className="w-4 h-4 text-white/40" />
                    {editing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="Add email"
                        className="flex-1 bg-transparent border-b border-white/20 focus:outline-none focus:border-[#375DEE]"
                      />
                    ) : (
                      <span>{selectedCustomer.email || "No email"}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <h3 className="font-bold text-white/70">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-[#375DEE]/20 text-[#375DEE] rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTag()}
                      className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm focus:outline-none focus:border-[#375DEE] w-24"
                    />
                    <button onClick={addTag} className="p-1 hover:bg-white/10 rounded-full">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <h3 className="font-bold text-white/70">Notes</h3>
                {editing ? (
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#375DEE] resize-none"
                    placeholder="Add notes about this customer..."
                  />
                ) : (
                  <p className="text-white/60 text-sm">
                    {selectedCustomer.notes?.replace(/#\w+/g, "").trim() || "No notes"}
                  </p>
                )}
              </div>

              {/* Rental History */}
              <div className="space-y-3">
                <h3 className="font-bold text-white/70">Rental History</h3>
                {selectedCustomer.bookings && selectedCustomer.bookings.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCustomer.bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <Car className="w-5 h-5 text-[#375DEE]" />
                          <div>
                            <p className="font-medium">
                              {booking.vehicle
                                ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`
                                : "Vehicle"}
                            </p>
                            <p className="text-sm text-white/50">
                              {format(new Date(booking.start_date), "MMM d")} - {format(new Date(booking.end_date), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${booking.total_amount?.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            booking.status === "completed" ? "bg-green-500/20 text-green-400" :
                            booking.status === "confirmed" ? "bg-blue-500/20 text-blue-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40 text-sm">No rental history</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
