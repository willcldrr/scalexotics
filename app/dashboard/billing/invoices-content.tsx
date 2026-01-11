"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  FileText,
  Search,
  Plus,
  Download,
  Send,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  X,
  Eye,
  Printer,
  Mail,
  Calendar,
  Car,
  User,
  Building,
} from "lucide-react"
import { format } from "date-fns"

interface Invoice {
  id: string
  invoice_number: string
  booking_id: string | null
  customer_name: string
  customer_email: string | null
  customer_phone: string
  customer_address: string | null
  items: InvoiceItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  status: "draft" | "sent" | "paid" | "overdue"
  due_date: string
  paid_at: string | null
  notes: string | null
  created_at: string
}

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Booking {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  start_date: string
  end_date: string
  total_amount: number
  deposit_amount: number
  vehicle_id: string
  vehicles?: { make: string; model: string; year: number }
}

interface BusinessProfile {
  company_name: string
  email: string
  phone: string
  address: string
}

export default function InvoicesContent() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<string>("")
  const [creating, setCreating] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)

  // Form state for new invoice
  const [newInvoice, setNewInvoice] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }] as InvoiceItem[],
    tax_rate: 0,
    due_date: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("company_name, email")
        .eq("id", user.id)
        .single()

      // Fetch AI settings for business info
      const { data: aiSettings } = await supabase
        .from("ai_settings")
        .select("business_name, business_phone")
        .eq("user_id", user.id)
        .single()

      setProfile({
        company_name: aiSettings?.business_name || profileData?.company_name || "Your Company",
        email: profileData?.email || user.email || "",
        phone: aiSettings?.business_phone || "",
        address: "",
      })

      // Fetch invoices
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setInvoices(invoicesData || [])

      // Fetch confirmed bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(`
          id,
          customer_name,
          customer_phone,
          customer_email,
          start_date,
          end_date,
          total_amount,
          deposit_amount,
          vehicle_id,
          vehicles (make, model, year)
        `)
        .eq("user_id", user.id)
        .in("status", ["confirmed", "completed"])
        .order("start_date", { ascending: false })

      setBookings(bookingsData?.map(b => ({
        ...b,
        vehicles: Array.isArray(b.vehicles) ? b.vehicles[0] : b.vehicles
      })) || [])
    }

    setLoading(false)
  }

  const generateInvoiceNumber = () => {
    const prefix = "INV"
    const date = format(new Date(), "yyyyMMdd")
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
    return `${prefix}-${date}-${random}`
  }

  const updateItemTotal = (index: number, field: string, value: any) => {
    const items = [...newInvoice.items]
    items[index] = { ...items[index], [field]: value }
    items[index].total = items[index].quantity * items[index].unit_price
    setNewInvoice({ ...newInvoice, items })
  }

  const addItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: "", quantity: 1, unit_price: 0, total: 0 }],
    })
  }

  const removeItem = (index: number) => {
    const items = newInvoice.items.filter((_, i) => i !== index)
    setNewInvoice({ ...newInvoice, items })
  }

  const calculateTotals = () => {
    const subtotal = newInvoice.items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = subtotal * (newInvoice.tax_rate / 100)
    return { subtotal, taxAmount, total: subtotal + taxAmount }
  }

  const loadFromBooking = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking) return

    const days = Math.ceil(
      (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1

    const vehicleName = booking.vehicles
      ? `${booking.vehicles.year} ${booking.vehicles.make} ${booking.vehicles.model}`
      : "Vehicle Rental"

    const dailyRate = booking.total_amount / days

    setNewInvoice({
      ...newInvoice,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email || "",
      customer_phone: booking.customer_phone,
      items: [
        {
          description: `${vehicleName} - ${format(new Date(booking.start_date), "MMM d")} to ${format(new Date(booking.end_date), "MMM d, yyyy")} (${days} days)`,
          quantity: days,
          unit_price: dailyRate,
          total: booking.total_amount,
        },
        ...(booking.deposit_amount ? [{
          description: "Deposit (paid)",
          quantity: 1,
          unit_price: -booking.deposit_amount,
          total: -booking.deposit_amount,
        }] : []),
      ],
    })
    setSelectedBooking(bookingId)
  }

  const createInvoice = async () => {
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { subtotal, taxAmount, total } = calculateTotals()

    const invoiceData = {
      user_id: user.id,
      invoice_number: generateInvoiceNumber(),
      booking_id: selectedBooking || null,
      customer_name: newInvoice.customer_name,
      customer_email: newInvoice.customer_email || null,
      customer_phone: newInvoice.customer_phone,
      customer_address: newInvoice.customer_address || null,
      items: newInvoice.items,
      subtotal,
      tax_rate: newInvoice.tax_rate,
      tax_amount: taxAmount,
      total,
      status: "draft",
      due_date: newInvoice.due_date,
      notes: newInvoice.notes || null,
    }

    const { data, error } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select()
      .single()

    if (!error && data) {
      setInvoices([data, ...invoices])
      setShowCreateModal(false)
      resetForm()
    }

    setCreating(false)
  }

  const resetForm = () => {
    setNewInvoice({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      customer_address: "",
      items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }],
      tax_rate: 0,
      due_date: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      notes: "",
    })
    setSelectedBooking("")
  }

  const markAsPaid = async (invoice: Invoice) => {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", invoice.id)

    if (!error) {
      setInvoices(invoices.map(i =>
        i.id === invoice.id ? { ...i, status: "paid", paid_at: new Date().toISOString() } : i
      ))
    }
  }

  const printInvoice = () => {
    window.print()
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-500/20 text-gray-400",
      sent: "bg-blue-500/20 text-blue-400",
      paid: "bg-green-500/20 text-green-400",
      overdue: "bg-red-500/20 text-red-400",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#375DEE] hover:bg-[#4169E1] text-white font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
          <p className="text-2xl font-bold">{invoices.length}</p>
          <p className="text-sm text-white/50">Total</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">
            ${invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.total, 0).toLocaleString()}
          </p>
          <p className="text-sm text-white/50">Paid</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">
            ${invoices.filter(i => i.status === "sent").reduce((sum, i) => sum + i.total, 0).toLocaleString()}
          </p>
          <p className="text-sm text-white/50">Pending</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
          <p className="text-2xl font-bold text-red-400">
            {invoices.filter(i => i.status === "overdue").length}
          </p>
          <p className="text-sm text-white/50">Overdue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
          />
        </div>
        <div className="flex gap-2">
          {["all", "draft", "sent", "paid", "overdue"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "bg-[#375DEE] text-white"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/40">
            <FileText className="w-12 h-12 mb-3" />
            <p>No invoices found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-[#375DEE]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{invoice.invoice_number}</span>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-white/50">{invoice.customer_name}</p>
                      <p className="text-sm text-white/40">Due: {format(new Date(invoice.due_date), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">${invoice.total.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice)
                          setShowViewModal(true)
                        }}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {invoice.status !== "paid" && (
                        <button
                          onClick={() => markAsPaid(invoice)}
                          className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm font-medium rounded-lg transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create Invoice</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Load from Booking */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Load from Booking (Optional)</label>
                <select
                  value={selectedBooking}
                  onChange={(e) => e.target.value && loadFromBooking(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                >
                  <option value="">Select a booking...</option>
                  {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.customer_name} - {booking.vehicles?.make} {booking.vehicles?.model} ({format(new Date(booking.start_date), "MMM d")})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={newInvoice.customer_name}
                    onChange={(e) => setNewInvoice({ ...newInvoice, customer_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Email</label>
                  <input
                    type="email"
                    value={newInvoice.customer_email}
                    onChange={(e) => setNewInvoice({ ...newInvoice, customer_email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newInvoice.customer_phone}
                    onChange={(e) => setNewInvoice({ ...newInvoice, customer_phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newInvoice.due_date}
                    onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Line Items</label>
                <div className="space-y-3">
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItemTotal(index, "description", e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItemTotal(index, "quantity", parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={item.unit_price}
                        onChange={(e) => updateItemTotal(index, "unit_price", parseFloat(e.target.value) || 0)}
                        className="w-28 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                      />
                      <span className="w-24 text-right text-sm">${item.total.toLocaleString()}</span>
                      {newInvoice.items.length > 1 && (
                        <button onClick={() => removeItem(index)} className="p-2 hover:bg-white/10 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addItem}
                    className="text-sm text-[#375DEE] hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              {/* Tax */}
              <div className="flex items-center gap-4">
                <label className="text-sm text-white/60">Tax Rate (%)</label>
                <input
                  type="number"
                  value={newInvoice.tax_rate}
                  onChange={(e) => setNewInvoice({ ...newInvoice, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="w-24 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                />
              </div>

              {/* Totals */}
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Subtotal</span>
                  <span>${calculateTotals().subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Tax ({newInvoice.tax_rate}%)</span>
                  <span>${calculateTotals().taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span className="text-[#375DEE]">${calculateTotals().total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={createInvoice}
                disabled={creating || !newInvoice.customer_name}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between print:hidden">
              <h2 className="text-xl font-semibold text-gray-800">Invoice Preview</h2>
              <div className="flex items-center gap-2">
                <button onClick={printInvoice} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Printer className="w-5 h-5 text-gray-600" />
                </button>
                <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div ref={invoiceRef} className="p-8 text-gray-800">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile?.company_name}</h1>
                  {profile?.phone && <p className="text-gray-600">{profile.phone}</p>}
                  {profile?.email && <p className="text-gray-600">{profile.email}</p>}
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-bold text-gray-400">INVOICE</h2>
                  <p className="text-gray-600">{selectedInvoice.invoice_number}</p>
                  <p className="text-gray-600">Date: {format(new Date(selectedInvoice.created_at), "MMM d, yyyy")}</p>
                  <p className="text-gray-600">Due: {format(new Date(selectedInvoice.due_date), "MMM d, yyyy")}</p>
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
                <p className="font-semibold">{selectedInvoice.customer_name}</p>
                {selectedInvoice.customer_email && <p className="text-gray-600">{selectedInvoice.customer_email}</p>}
                {selectedInvoice.customer_phone && <p className="text-gray-600">{selectedInvoice.customer_phone}</p>}
              </div>

              {/* Items */}
              <table className="w-full mb-8">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 text-gray-600">Description</th>
                    <th className="text-right py-2 text-gray-600">Qty</th>
                    <th className="text-right py-2 text-gray-600">Price</th>
                    <th className="text-right py-2 text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3">{item.description}</td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">${item.unit_price.toLocaleString()}</td>
                      <td className="py-3 text-right">${item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${selectedInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  {selectedInvoice.tax_rate > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Tax ({selectedInvoice.tax_rate}%)</span>
                      <span>${selectedInvoice.tax_amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-t-2 border-gray-200 font-bold text-lg">
                    <span>Total</span>
                    <span>${selectedInvoice.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              {selectedInvoice.status === "paid" && (
                <div className="mt-8 text-center">
                  <span className="inline-block px-6 py-2 bg-green-100 text-green-600 font-bold text-lg rounded-lg">
                    PAID
                  </span>
                </div>
              )}

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="mt-8 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h3>
                  <p className="text-gray-600">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed {
            position: absolute !important;
          }
          [class*="print:hidden"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
