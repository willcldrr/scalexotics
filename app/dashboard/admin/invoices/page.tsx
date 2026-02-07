"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Copy,
  Check,
  Trash2,
  FileText,
  Clock,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
  CheckCircle,
  XCircle,
  Receipt,
} from "lucide-react"

interface Invoice {
  id: string
  invoice_number: string
  type: "retainer" | "booking"
  base_amount: number
  ad_spend_rate: number | null
  ad_spend_days: number | null
  ad_spend_total: number | null
  total_amount: number
  booking_description: string | null
  client_name: string
  client_email: string | null
  client_phone: string | null
  status: "pending" | "paid" | "cancelled"
  due_date: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  booking_credits?: number
  price_per_booking?: number
}

export default function AdminInvoicesPage() {
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showModal, setShowModal] = useState(false)

  // New invoice state - B2B focused
  const [newInvoice, setNewInvoice] = useState({
    // Client info
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCompany: "",
    // Booking credits
    bookingCredits: 10,
    pricePerBooking: 125,
    // Ad spend
    includeAdSpend: false,
    dailyAdSpend: 50,
    adSpendDays: 30,
    // Other
    notes: "",
    dueDate: "",
  })

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      setLoading(false)
      return
    }

    setIsAdmin(true)
    await fetchInvoices()
    setLoading(false)
  }

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from("client_invoices")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching invoices:", error)
      setMessage({ type: "error", text: "Failed to load invoices" })
    } else {
      setInvoices(data || [])
    }
  }

  // Calculate totals
  const bookingTotal = newInvoice.bookingCredits * newInvoice.pricePerBooking
  const adSpendTotal = newInvoice.includeAdSpend ? newInvoice.dailyAdSpend * newInvoice.adSpendDays : 0
  const grandTotal = bookingTotal + adSpendTotal

  const handleCreateInvoice = async () => {
    if (!newInvoice.clientName.trim()) {
      setMessage({ type: "error", text: "Client name is required" })
      return
    }

    setCreating(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("client_invoices")
      .insert({
        type: "booking",
        base_amount: bookingTotal,
        ad_spend_rate: newInvoice.includeAdSpend ? newInvoice.dailyAdSpend : null,
        ad_spend_days: newInvoice.includeAdSpend ? newInvoice.adSpendDays : null,
        ad_spend_total: newInvoice.includeAdSpend ? adSpendTotal : null,
        total_amount: grandTotal,
        booking_description: `${newInvoice.bookingCredits} booking credits @ $${newInvoice.pricePerBooking}/booking`,
        client_name: newInvoice.clientName,
        client_email: newInvoice.clientEmail || null,
        client_phone: newInvoice.clientPhone || null,
        notes: newInvoice.notes || null,
        due_date: newInvoice.dueDate || null,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating invoice:", error)
      setMessage({ type: "error", text: "Failed to create invoice" })
    } else {
      setMessage({ type: "success", text: "Invoice created successfully!" })
      setShowModal(false)
      // Reset form
      setNewInvoice({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        clientCompany: "",
        bookingCredits: 10,
        pricePerBooking: 125,
        includeAdSpend: false,
        dailyAdSpend: 50,
        adSpendDays: 30,
        notes: "",
        dueDate: "",
      })
      fetchInvoices()
    }

    setCreating(false)
  }

  const copyPaymentLink = async (invoiceId: string) => {
    const link = `${window.location.origin}/pay/${invoiceId}`
    await navigator.clipboard.writeText(link)
    setCopiedId(invoiceId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const updateStatus = async (invoiceId: string, status: "pending" | "paid" | "cancelled") => {
    const updates: any = { status }
    if (status === "paid") {
      updates.paid_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("client_invoices")
      .update(updates)
      .eq("id", invoiceId)

    if (error) {
      setMessage({ type: "error", text: "Failed to update invoice" })
    } else {
      fetchInvoices()
    }
  }

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return

    const { error } = await supabase
      .from("client_invoices")
      .delete()
      .eq("id", invoiceId)

    if (error) {
      setMessage({ type: "error", text: "Failed to delete invoice" })
    } else {
      setMessage({ type: "success", text: "Invoice deleted" })
      fetchInvoices()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Stats
  const stats = {
    total: invoices.length,
    pending: invoices.filter((i) => i.status === "pending").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    revenue: invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.total_amount, 0),
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold dashboard-heading">
            Client Invoices
          </h1>
          <p className="text-white/50 mt-1">Loading...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold dashboard-heading">
            Access Denied
          </h1>
          <p className="text-white/50 mt-1">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold dashboard-heading">
            Client Invoices
          </h1>
          <p className="text-white/50 mt-1">Create and manage B2B invoices for fleet partners</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] text-white font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-white/50 text-sm">Total Invoices</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-white/50 text-sm">Pending</div>
          <div className="text-2xl font-bold mt-1 text-yellow-400">{stats.pending}</div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-white/50 text-sm">Paid</div>
          <div className="text-2xl font-bold mt-1 text-green-400">{stats.paid}</div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-white/50 text-sm">Total Revenue</div>
          <div className="text-2xl font-bold mt-1 text-[#375DEE]">{formatCurrency(stats.revenue)}</div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            message.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No invoices yet</p>
            <p className="text-sm mt-1">Create your first invoice to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Invoice</th>
                  <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Client</th>
                  <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Description</th>
                  <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Amount</th>
                  <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Created</th>
                  <th className="text-right text-sm font-medium text-white/50 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm">{invoice.invoice_number}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{invoice.client_name}</div>
                      {invoice.client_email && (
                        <div className="text-sm text-white/50">{invoice.client_email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white/70 max-w-[200px] truncate">
                        {invoice.booking_description || "—"}
                      </div>
                      {invoice.ad_spend_total && (
                        <div className="text-xs text-white/40">
                          + {formatCurrency(invoice.ad_spend_total)} ad spend
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{formatCurrency(invoice.total_amount)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === "paid"
                            ? "bg-green-500/20 text-green-400"
                            : invoice.status === "cancelled"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {invoice.status === "paid" && <CheckCircle className="w-3 h-3" />}
                        {invoice.status === "cancelled" && <XCircle className="w-3 h-3" />}
                        {invoice.status === "pending" && <Clock className="w-3 h-3" />}
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/50">
                      {formatDate(invoice.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyPaymentLink(invoice.id)}
                          className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Copy payment link"
                        >
                          {copiedId === invoice.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={`/pay/${invoice.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="View payment page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        {invoice.status === "pending" && (
                          <button
                            onClick={() => updateStatus(invoice.id, "paid")}
                            className="p-2 text-white/50 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Mark as paid"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteInvoice(invoice.id)}
                          className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete invoice"
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
        )}
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-[#375DEE]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Create Invoice</h3>
                  <p className="text-sm text-white/50">Scale Exotics Partner Invoice</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Client Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white/60">
                  <span className="w-6 h-6 rounded-full bg-[#375DEE]/20 text-[#375DEE] text-xs flex items-center justify-center">1</span>
                  Client Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Client / Business Name *</label>
                    <input
                      type="text"
                      value={newInvoice.clientName}
                      onChange={(e) => setNewInvoice({ ...newInvoice, clientName: e.target.value })}
                      placeholder="Miami Exotic Rentals"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Email</label>
                    <input
                      type="email"
                      value={newInvoice.clientEmail}
                      onChange={(e) => setNewInvoice({ ...newInvoice, clientEmail: e.target.value })}
                      placeholder="owner@miamiexotic.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newInvoice.clientPhone}
                      onChange={(e) => setNewInvoice({ ...newInvoice, clientPhone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Credits */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white/60">
                  <span className="w-6 h-6 rounded-full bg-[#375DEE]/20 text-[#375DEE] text-xs flex items-center justify-center">2</span>
                  Booking Credits
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Number of Credits</label>
                      <input
                        type="number"
                        value={newInvoice.bookingCredits}
                        onChange={(e) => setNewInvoice({ ...newInvoice, bookingCredits: parseInt(e.target.value) || 0 })}
                        min="1"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-medium focus:outline-none focus:border-[#375DEE]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Price per Booking ($)</label>
                      <input
                        type="number"
                        value={newInvoice.pricePerBooking}
                        onChange={(e) => setNewInvoice({ ...newInvoice, pricePerBooking: parseInt(e.target.value) || 0 })}
                        min="0"
                        step="5"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-medium focus:outline-none focus:border-[#375DEE]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-white/60">Booking Credits Subtotal</span>
                    <span className="text-xl font-bold">{formatCurrency(bookingTotal)}</span>
                  </div>
                  <div className="text-sm text-white/40">
                    {newInvoice.bookingCredits} credits × ${newInvoice.pricePerBooking}/booking
                  </div>
                </div>
              </div>

              {/* Ad Spend */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-white/60">
                    <span className="w-6 h-6 rounded-full bg-[#375DEE]/20 text-[#375DEE] text-xs flex items-center justify-center">3</span>
                    Ad Spend (Optional)
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newInvoice.includeAdSpend}
                      onChange={(e) => setNewInvoice({ ...newInvoice, includeAdSpend: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-[#375DEE] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                    <span className="ml-3 text-sm text-white/60">Include Ad Spend</span>
                  </label>
                </div>

                {newInvoice.includeAdSpend && (
                  <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4 animate-fade-in">
                    {/* Daily Ad Spend Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm text-white/60">Daily Ad Spend</label>
                        <span className="text-lg font-bold text-[#375DEE]">${newInvoice.dailyAdSpend}/day</span>
                      </div>
                      <input
                        type="range"
                        value={newInvoice.dailyAdSpend}
                        onChange={(e) => setNewInvoice({ ...newInvoice, dailyAdSpend: parseInt(e.target.value) })}
                        min="5"
                        max="200"
                        step="5"
                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
                      />
                      <div className="flex justify-between text-xs text-white/40 mt-1">
                        <span>$5/day</span>
                        <span>$200/day</span>
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Duration (days)</label>
                      <input
                        type="number"
                        value={newInvoice.adSpendDays}
                        onChange={(e) => setNewInvoice({ ...newInvoice, adSpendDays: parseInt(e.target.value) || 0 })}
                        min="1"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE]"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="text-white/60">Ad Spend Subtotal</span>
                      <span className="text-xl font-bold">{formatCurrency(adSpendTotal)}</span>
                    </div>
                    <div className="text-sm text-white/40">
                      ${newInvoice.dailyAdSpend}/day × {newInvoice.adSpendDays} days
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Notes (optional)</label>
                <textarea
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  placeholder="Any additional notes for this invoice..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] resize-none"
                />
              </div>

              {/* Invoice Summary */}
              <div className="bg-[#375DEE]/10 rounded-xl border border-[#375DEE]/30 p-5">
                <div className="text-sm font-medium text-white/60 mb-4">Invoice Summary</div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Booking Credits ({newInvoice.bookingCredits} × ${newInvoice.pricePerBooking})</span>
                    <span className="font-medium">{formatCurrency(bookingTotal)}</span>
                  </div>
                  {newInvoice.includeAdSpend && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Ad Spend ({newInvoice.adSpendDays} days × ${newInvoice.dailyAdSpend}/day)</span>
                      <span className="font-medium">{formatCurrency(adSpendTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-white/20">
                    <span className="text-lg font-medium">Total Due</span>
                    <span className="text-2xl font-bold text-[#375DEE]">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-white/10 hover:bg-white/5 text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={creating || !newInvoice.clientName.trim()}
                className="flex-1 px-4 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom slider styles */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #375DEE;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(55, 93, 238, 0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #375DEE;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(55, 93, 238, 0.5);
        }
      `}</style>
    </div>
  )
}
